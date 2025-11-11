import React, { useState, useEffect, useRef } from 'react';
import { WorkflowStepType } from '../types';

interface ExecutionExperimentProps {
  steps: WorkflowStepType[];
  workflowId?: string;
  autoExecute?: boolean;
  onExecutionComplete?: () => void;
}

interface ExecutionStep {
  instanceId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  duration?: string;
}

interface ExecutionResult {
  workflowId: string;
  status: string;
  executionMode: string;
  duration: string;
  parallelism: {
    maxParallelism: number;
    levels: string[][];
    independentPaths: number;
  };
  results: { [key: string]: any };
  stats: {
    total: number;
    completed: number;
    running: number;
    pending: number;
  };
}

const ExecutionExperiment: React.FC<ExecutionExperimentProps> = ({
  steps,
  workflowId,
  autoExecute = false,
  onExecutionComplete
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const executionRef = useRef(false);

  const executeWorkflow = async () => {
    if (!workflowId || steps.length === 0) {
      setError('No workflow to execute. Please save your workflow first.');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setExecutionResult(null);

    // Initialize execution steps
    const initialSteps: ExecutionStep[] = steps.map(step => ({
      instanceId: step.instanceId,
      name: step.name,
      status: 'pending'
    }));
    setExecutionSteps(initialSteps);

    try {
      // Call parallel execution API
      const response = await fetch(`http://localhost:5273/api/workflows/${workflowId}/execute-parallel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result: ExecutionResult = await response.json();
      setExecutionResult(result);

      // Update execution steps with results
      const updatedSteps: ExecutionStep[] = steps.map(step => {
        const stepResult = result.results[step.instanceId];
        return {
          instanceId: step.instanceId,
          name: step.name,
          status: stepResult ? 'completed' : 'failed',
          result: stepResult,
          duration: stepResult?.duration
        };
      });
      setExecutionSteps(updatedSteps);

    } catch (err: any) {
      setError(err.message || 'Execution failed');
      console.error('Execution error:', err);
    } finally {
      setIsExecuting(false);
      if (onExecutionComplete) {
        onExecutionComplete();
      }
    }
  };

  // Auto-execute when autoExecute prop is true
  useEffect(() => {
    if (autoExecute && workflowId && !executionRef.current && !isExecuting) {
      executionRef.current = true;
      // Wait a bit for workflow to be saved
      setTimeout(() => {
        executeWorkflow();
      }, 1500);
    }
  }, [autoExecute, workflowId]);

  // Reset execution ref when workflowId changes
  useEffect(() => {
    executionRef.current = false;
  }, [workflowId]);

  const analyzeWorkflow = async () => {
    if (!workflowId || steps.length === 0) {
      setError('No workflow to analyze.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5273/api/workflows/${workflowId}/analyze`);
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const analysis = await response.json();
      console.log('Workflow analysis:', analysis);
      alert(`Parallelism Analysis:\n\nMax Parallel Steps: ${analysis.analysis.maxParallelism}\nCan Parallelize: ${analysis.analysis.canParallelize ? 'Yes' : 'No'}\nEstimated Speedup: ${analysis.analysis.estimatedSpeedup}`);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      console.error('Analysis error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'running': return 'bg-sky-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '⟳';
      case 'failed': return '✗';
      default: return '○';
    }
  };

  const renderFlowVisualization = () => {
    if (!executionResult || executionSteps.length === 0) return null;

    const { parallelism } = executionResult;

    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Execution Flow</h3>

        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-slate-400">
              Parallelism: <span className="text-sky-400 font-semibold">{parallelism.maxParallelism}x</span>
            </span>
            <span className="text-slate-400">
              Duration: <span className="text-emerald-400 font-semibold">{executionResult.duration}</span>
            </span>
            <span className="text-slate-400">
              Mode: <span className="text-sky-400 font-semibold">{executionResult.executionMode}</span>
            </span>
          </div>

          {/* Execution levels visualization */}
          <div className="space-y-6">
            {parallelism.levels.map((level, levelIndex) => (
              <div key={levelIndex} className="relative">
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  L{levelIndex}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {level.map((stepId) => {
                    const step = executionSteps.find(s => s.instanceId === stepId);
                    if (!step) return null;

                    return (
                      <div
                        key={stepId}
                        className="flex-1 min-w-[120px] max-w-[200px]"
                      >
                        <div className={`${getStatusColor(step.status)} rounded-lg p-3 text-white shadow-lg`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">{step.name}</span>
                            <span className="text-lg">{getStatusIcon(step.status)}</span>
                          </div>
                          <div className="text-xs opacity-80">
                            {step.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {levelIndex < parallelism.levels.length - 1 && (
                  <div className="flex justify-center my-2">
                    <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data flow summary */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-200 mb-3">Data Flow Summary</h4>
          <div className="space-y-2 text-xs">
            {executionSteps.map((step, index) => {
              const stepWorkflow = steps.find(s => s.instanceId === step.instanceId);
              const hasInputs = stepWorkflow?.dependsOn && stepWorkflow.dependsOn.length > 0;
              const inputSources = hasInputs ? stepWorkflow.dependsOn : [];

              return (
                <div key={step.instanceId} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                  <span className={`w-3 h-3 rounded-full ${getStatusColor(step.status)}`}></span>
                  <span className="text-slate-300 flex-1">
                    {step.name}
                    {inputSources.length > 0 && (
                      <span className="text-slate-500 ml-2">
                        ← {inputSources.map(id => steps.find(s => s.instanceId === id)?.name || id).join(', ')}
                      </span>
                    )}
                  </span>
                  {step.result && (
                    <button
                      onClick={() => {
                        console.log('Step result:', step.result);
                        alert(JSON.stringify(step.result, null, 2));
                      }}
                      className="text-sky-400 hover:text-sky-300 text-xs"
                    >
                      View Output
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 shadow-2xl border ${autoExecute ? 'border-emerald-500 animate-pulse' : 'border-slate-700'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-sky-300">Implement Experiment</h2>
          {autoExecute && (
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full animate-pulse">
              DEMO MODE
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={analyzeWorkflow}
            disabled={steps.length === 0 || isExecuting}
            className="px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300"
          >
            Analyze Parallelism
          </button>
          <button
            onClick={executeWorkflow}
            disabled={steps.length === 0 || isExecuting}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {isExecuting ? 'Executing...' : 'Execute Workflow'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {steps.length === 0 ? (
        <div className="bg-slate-900/50 rounded-lg p-8 border border-slate-700 text-center">
          <p className="text-slate-400">Add modules to your workflow to begin execution experiments.</p>
          <p className="text-slate-500 text-sm mt-2">
            This panel will show how your workflow processes business intelligence, customer requests, final orders, and integrations with other business operations.
          </p>
        </div>
      ) : (
        <>
          {!executionResult && !isExecuting && (
            <div className="bg-slate-900/50 rounded-lg p-8 border border-slate-700 text-center">
              <p className="text-slate-300 mb-2">Ready to execute workflow with {steps.length} steps</p>
              <p className="text-slate-500 text-sm">
                Click "Execute Workflow" to see how each module processes data from business intelligence through customer interactions to final order fulfillment and division integration.
              </p>
            </div>
          )}

          {isExecuting && (
            <div className="bg-slate-900/50 rounded-lg p-8 border border-slate-700 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sky-400 font-semibold">Executing workflow...</p>
              </div>
              <div className="space-y-2">
                {executionSteps.map(step => (
                  <div key={step.instanceId} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-sm">
                    <span className="text-slate-300">{step.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(step.status)} text-white`}>
                      {step.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderFlowVisualization()}
        </>
      )}
    </div>
  );
};

export default ExecutionExperiment;
