
export enum StepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface StepRecord {
  workflowId: string;
  stepKey: string; // Unique combination of ID + Sequence
  id: string;      // User-provided name
  sequence: number;
  status: StepStatus;
  result: any;
  error?: string;
  timestamp: number;
}

export interface WorkflowState {
  id: string;
  isRunning: boolean;
  isCrashed: boolean;
  currentSequence: number;
  logs: string[];
}

export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'system';
  timestamp: number;
}
