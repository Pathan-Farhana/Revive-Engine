
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  Zap, 
  Database, 
  Terminal, 
  Layers, 
  Cpu,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react';
import { StepStatus, StepRecord, LogEntry } from './types';
import { DurableContext } from './engine/DurableEngine';

const WORKFLOW_ID = "onboarding-wf-001";

const App: React.FC = () => {
  const [db, setDb] = useState<StepRecord[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const isCrashedRef = useRef(false);

  // Helper to add logs
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ message, type, timestamp: Date.now() }, ...prev].slice(0, 50));
  };

  // Sync ref for the engine to check interrupt state
  useEffect(() => {
    isCrashedRef.current = isCrashed;
  }, [isCrashed]);

  // Persistent storage simulation
  const handleStepUpdate = (record: StepRecord) => {
    setDb(prev => {
      const idx = prev.findIndex(r => r.stepKey === record.stepKey);
      if (idx >= 0) {
        const newDb = [...prev];
        newDb[idx] = record;
        return newDb;
      }
      return [...prev, record];
    });
  };

  const clearStorage = () => {
    setDb([]);
    setLogs([]);
    setIsCrashed(false);
    setIsRunning(false);
    addLog("Persistent storage cleared.", "system");
  };

  const simulateCrash = () => {
    setIsCrashed(true);
    setIsRunning(false);
    addLog("CRITICAL SYSTEM FAILURE! Process terminated.", "error");
  };

  const runWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsCrashed(false);
    addLog(db.length > 0 ? "Resuming workflow..." : "Starting new durable workflow session...", "system");

    const ctx = new DurableContext(
      WORKFLOW_ID,
      db,
      handleStepUpdate,
      addLog,
      () => isCrashedRef.current
    );

    try {
      // Step 1: Sequential
      await ctx.step("Create Employee Record", async () => {
        return { empId: "E101", name: "Alice Smith" };
      });

      // Step 2 & 3: Parallel
      addLog("Starting parallel provisioning...", "info");
      await ctx.parallel([
        ctx.step("Provision Laptop", async () => "MacBook Pro M3 Pro"),
        ctx.step("Configure Access", async () => ["Slack", "GitHub", "Jira"])
      ]);

      // Step 4: Sequential
      await ctx.step("Send Welcome Email", async () => "sent");

      addLog("Workflow completed successfully!", "success");
      setIsRunning(false);
    } catch (err: any) {
      if (err.message === "WORKFLOW_INTERRUPTED") {
        setIsRunning(false);
      } else {
        addLog(`Workflow failed: ${err.message}`, "error");
        setIsRunning(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 selection:bg-blue-500/30">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="text-blue-400" />
            Durable Execution Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Fault-tolerant workflows with RDBMS-backed memoization</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={clearStorage}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
          >
            <Trash2 size={16} />
            Reset State
          </button>
          <button 
            onClick={simulateCrash}
            disabled={!isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium border
              ${isRunning 
                ? 'bg-red-500/10 text-red-400 border-red-500/50 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}`}
          >
            <Zap size={16} />
            Simulate Crash
          </button>
          <button 
            onClick={runWorkflow}
            disabled={isRunning}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-bold
              ${isRunning 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'}`}
          >
            {db.length > 0 ? <RotateCcw size={16} /> : <Play size={16} />}
            {db.length > 0 ? "Resume Workflow" : "Run Workflow"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visualizer & Engine Info */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-blue-400" />
                Workflow Visualizer
              </h2>
              {isRunning && (
                <div className="flex items-center gap-2 text-xs text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500 pulse"></div>
                  Execution in progress...
                </div>
              )}
            </div>
            <div className="p-8 flex flex-col items-center">
               <WorkflowCanvas db={db} />
            </div>
          </section>

          <section className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Database size={16} className="text-amber-400" />
                RDBMS State Table (Steps)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs mono">
                <thead className="bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Sequence</th>
                    <th className="px-4 py-3">Step ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Result (JSON)</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {db.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                        No records in persistent storage. Start a workflow to begin.
                      </td>
                    </tr>
                  ) : (
                    db.sort((a,b) => a.sequence - b.sequence).map((record) => (
                      <tr key={record.stepKey} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-400">#{record.sequence}</td>
                        <td className="px-4 py-3 font-medium text-slate-200">{record.id}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-4 py-3 truncate max-w-xs">
                          <span className="text-amber-200/80">
                            {record.result ? JSON.stringify(record.result) : (record.error || 'null')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Log Terminal */}
        <div className="lg:col-span-4 flex flex-col h-full space-y-6">
          <section className="bg-slate-950 border border-slate-700 rounded-xl overflow-hidden flex flex-col flex-1 shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Terminal size={16} className="text-green-400" />
                Runtime Logs
              </h2>
              <Activity size={14} className="text-slate-600" />
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2 max-h-[600px] mono text-[13px]">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-3 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'system' ? 'text-blue-300 italic' : 'text-slate-400'}`}>
                  <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className="break-words">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-slate-700 italic">Waiting for execution...</div>
              )}
            </div>
          </section>

          <section className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 space-y-3">
             <h3 className="font-semibold text-slate-200 uppercase tracking-tighter flex items-center gap-2">
               <AlertCircle size={14} />
               Durable Logic Explained
             </h3>
             <p>
               This engine uses <strong>memoization</strong>. Every step is keyed by a <strong>Sequence ID</strong>. 
               When you "crash" and "resume", the engine finds previous entries in the state table and skips them, 
               preventing duplicate side effects (like sending emails twice).
             </p>
             <div className="flex gap-2">
               <div className="px-2 py-1 rounded bg-slate-700/50 border border-slate-600">Deterministic ID</div>
               <div className="px-2 py-1 rounded bg-slate-700/50 border border-slate-600">State Locking</div>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
};

// --- Subcomponents ---

const StatusBadge: React.FC<{ status: StepStatus }> = ({ status }) => {
  const configs = {
    [StepStatus.PENDING]: { bg: 'bg-slate-700/50', text: 'text-slate-400', icon: Clock },
    [StepStatus.RUNNING]: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Activity },
    [StepStatus.COMPLETED]: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle2 },
    [StepStatus.FAILED]: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertCircle },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${config.bg} ${config.text}`}>
      <Icon size={10} />
      {status}
    </span>
  );
};

const WorkflowCanvas: React.FC<{ db: StepRecord[] }> = ({ db }) => {
  const getStep = (id: string) => db.find(r => r.id === id);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-12 relative">
      {/* Step 1 */}
      <StepNode 
        id="Create Employee Record" 
        status={getStep("Create Employee Record")?.status || StepStatus.PENDING} 
      />
      
      {/* Connection line */}
      <div className="h-12 w-0.5 bg-slate-700 relative">
         <div className="absolute top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-700 -translate-x-1/2 -translate-y-full"></div>
      </div>

      {/* Parallel Row */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 relative">
         {/* Splitter Line Horizontal */}
         <div className="hidden md:block absolute top-[-24px] left-1/2 -translate-x-1/2 w-[calc(100%-60px)] h-0.5 bg-slate-700"></div>
         
         <StepNode 
          id="Provision Laptop" 
          status={getStep("Provision Laptop")?.status || StepStatus.PENDING} 
         />
         <StepNode 
          id="Configure Access" 
          status={getStep("Configure Access")?.status || StepStatus.PENDING} 
         />
      </div>

      {/* Merge Line */}
      <div className="h-12 w-0.5 bg-slate-700 relative">
        <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 w-[calc(100%+80px)] h-0.5 bg-slate-700"></div>
      </div>

      {/* Step 4 */}
      <StepNode 
        id="Send Welcome Email" 
        status={getStep("Send Welcome Email")?.status || StepStatus.PENDING} 
      />
    </div>
  );
};

const StepNode: React.FC<{ id: string, status: StepStatus }> = ({ id, status }) => {
  const isDone = status === StepStatus.COMPLETED;
  const isRunning = status === StepStatus.RUNNING;
  const isFailed = status === StepStatus.FAILED;

  return (
    <div className={`relative z-10 w-48 p-4 rounded-lg border-2 flex flex-col items-center justify-center text-center transition-all duration-500
      ${isDone ? 'bg-green-500/10 border-green-500/50 scale-105 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 
        isRunning ? 'bg-blue-500/10 border-blue-500/80 scale-110 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 
        isFailed ? 'bg-red-500/10 border-red-500/80' : 'bg-slate-800 border-slate-700 opacity-60'}`}
    >
      {isDone && <CheckCircle2 className="text-green-500 mb-2" size={20} />}
      {isRunning && <Activity className="text-blue-400 mb-2 pulse" size={20} />}
      {isFailed && <AlertCircle className="text-red-500 mb-2" size={20} />}
      {!isDone && !isRunning && !isFailed && <Clock className="text-slate-500 mb-2" size={20} />}
      
      <span className={`text-xs font-bold uppercase tracking-wide ${isRunning ? 'text-blue-100' : 'text-slate-300'}`}>{id}</span>
      <div className="mt-1">
        <StatusBadge status={status} />
      </div>
    </div>
  );
};

export default App;
