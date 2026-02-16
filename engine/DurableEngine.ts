
import { StepStatus, StepRecord } from '../types';

/**
 * A simulation of a Durable Context.
 * In a real Go/Java implementation, this would interact with a database.
 * Here, we use callbacks to update the React UI and a 'database' object.
 */
export class DurableContext {
  private workflowId: string;
  private sequenceCounter: number = 0;
  private db: StepRecord[];
  private onStepUpdate: (record: StepRecord) => void;
  private onLog: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  private isInterrupted: () => boolean;

  constructor(
    workflowId: string,
    db: StepRecord[],
    onStepUpdate: (record: StepRecord) => void,
    onLog: (msg: string, type: any) => void,
    isInterrupted: () => boolean
  ) {
    this.workflowId = workflowId;
    this.db = db;
    this.onStepUpdate = onStepUpdate;
    this.onLog = onLog;
    this.isInterrupted = isInterrupted;
  }

  /**
   * The core Step Primitive.
   * Checks for memoized results before executing.
   */
  async step<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const sequence = ++this.sequenceCounter;
    const stepKey = `${id}_seq_${sequence}`;

    // 1. Check if we already have a completed result in our "Database"
    const existing = this.db.find(r => r.workflowId === this.workflowId && r.stepKey === stepKey);

    if (existing && existing.status === StepStatus.COMPLETED) {
      this.onLog(`Skipping Step [${id}] (Seq: ${sequence}) - Loaded from cache.`, 'success');
      return existing.result as T;
    }

    // 2. Crash check (Simulation only)
    if (this.isInterrupted()) {
      throw new Error("WORKFLOW_INTERRUPTED");
    }

    // 3. Update status to Running
    this.onLog(`Executing Step [${id}] (Seq: ${sequence})...`, 'info');
    const runningRecord: StepRecord = {
      workflowId: this.workflowId,
      stepKey,
      id,
      sequence,
      status: StepStatus.RUNNING,
      result: null,
      timestamp: Date.now()
    };
    this.onStepUpdate(runningRecord);

    try {
      // Artificial delay for visualization
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (this.isInterrupted()) {
         throw new Error("WORKFLOW_INTERRUPTED");
      }

      // 4. Run the actual logic
      const result = await fn();

      // 5. Commit result to DB
      const completedRecord: StepRecord = {
        ...runningRecord,
        status: StepStatus.COMPLETED,
        result,
        timestamp: Date.now()
      };
      
      this.onStepUpdate(completedRecord);
      this.onLog(`Step [${id}] finished successfully.`, 'success');
      
      return result;
    } catch (error: any) {
      if (error.message === "WORKFLOW_INTERRUPTED") {
        this.onLog(`Step [${id}] interrupted by system crash.`, 'warning');
        throw error;
      }

      const failedRecord: StepRecord = {
        ...runningRecord,
        status: StepStatus.FAILED,
        error: error.message || 'Unknown error',
        timestamp: Date.now()
      };
      this.onStepUpdate(failedRecord);
      this.onLog(`Step [${id}] failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Concurrent steps helper.
   * Fixed: Use Promise<any>[] to allow mixing steps with different result types (e.g., string and string[]).
   */
  async parallel(steps: Promise<any>[]): Promise<any[]> {
    return Promise.all(steps);
  }
}
