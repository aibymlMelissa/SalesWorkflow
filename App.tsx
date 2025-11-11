import React, { useState, useCallback, useEffect } from 'react';
import { Module, WorkflowStepType, WorkflowStep } from './types';
import { MODULES, LLM_OPTIONS } from './constants';
import ModulePanel from './components/ModulePanel';
import WorkflowDisplay from './components/WorkflowDisplay';
import { AIOperationManager } from './components/WorkflowInspector';
import './components/WorkflowInspector.css';

const App: React.FC = () => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepType[]>([]);
  const [animatedStepIndex, setAnimatedStepIndex] = useState<number | null>(null);
  const [enhancedModules, setEnhancedModules] = useState<Module[]>([]);

  // Fetch enhanced modules from backend
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('http://localhost:5273/api/modules');
        const modules = await response.json();
        setEnhancedModules(modules);
      } catch (error) {
        console.error('Failed to fetch modules:', error);
        // Fallback to static modules if backend fails
        setEnhancedModules(MODULES);
      }
    };

    fetchModules();
  }, []);

  // Convert WorkflowStepType to WorkflowStep for inspector
  const convertToInspectorSteps = (steps: WorkflowStepType[]): WorkflowStep[] => {
    return steps.map(step => ({
      instanceId: step.instanceId,
      moduleId: step.id,
      config: step.config,
      llm: step.llm
    }));
  };

  // Handle auto-connect from inspector
  const handleAutoConnect = useCallback((newSteps: WorkflowStep[]) => {
    const convertedSteps: WorkflowStepType[] = newSteps.map(step => {
      const module = enhancedModules.find(m => m.id === step.moduleId);
      if (!module) return null;

      return {
        ...module,
        instanceId: step.instanceId,
        config: step.config,
        llm: step.llm
      };
    }).filter(Boolean) as WorkflowStepType[];

    setWorkflowSteps(convertedSteps);
  }, [enhancedModules]);

  // Handle optimize order from inspector
  const handleOptimizeOrder = useCallback((newSteps: WorkflowStep[]) => {
    handleAutoConnect(newSteps);
  }, [handleAutoConnect]);

  // Handle auto-fix from inspector (adds human intervention modules)
  const handleAutoFix = useCallback((newSteps: WorkflowStep[]) => {
    handleAutoConnect(newSteps);
  }, [handleAutoConnect]);

  const addStepToWorkflow = useCallback((module: Module) => {
    // Prevent changes while inspecting
    if (animatedStepIndex !== null) return;
    
    const initialConfig: { [key: string]: string | number } = {};
    if (module.configFields) {
      module.configFields.forEach(field => {
        initialConfig[field.name] = field.type === 'number' ? 0 : '';
      });
    }

    const newStep: WorkflowStepType = {
      ...module,
      instanceId: `${module.id}_${Date.now()}`,
      config: initialConfig,
      ...(module.isLLMPowered && { llm: LLM_OPTIONS[0].value })
    };
    setWorkflowSteps(prev => [...prev, newStep]);
  }, [animatedStepIndex]);

  const updateStepConfig = useCallback((instanceId: string, newConfig: { [key: string]: string | number }) => {
    setWorkflowSteps(prevSteps => 
      prevSteps.map(step => 
        step.instanceId === instanceId ? { ...step, config: newConfig } : step
      )
    );
  }, []);

  const updateStepLLM = useCallback((instanceId: string, llm: string) => {
    setWorkflowSteps(prevSteps => 
      prevSteps.map(step =>
        step.instanceId === instanceId ? { ...step, llm } : step
      )
    );
  }, []);

  const resetWorkflow = useCallback(() => {
    setWorkflowSteps([]);
    setAnimatedStepIndex(null);
  }, []);

  const toggleInspection = useCallback(() => {
    if (workflowSteps.length === 0) return;
    setAnimatedStepIndex(prev => (prev === null ? 0 : null));
  }, [workflowSteps.length]);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-sky-400 tracking-tight">
            AI Sales Workflow Builder
          </h1>
          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
            Click modules to build your process, configure steps, and use the AI Operation Manager to review your workflow.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1">
            <ModulePanel modules={enhancedModules.length > 0 ? enhancedModules : MODULES} onAddModule={addStepToWorkflow} />
          </aside>
          <section className="lg:col-span-2">
            <AIOperationManager
              steps={convertToInspectorSteps(workflowSteps)}
              modules={enhancedModules.length > 0 ? enhancedModules : MODULES}
              onAutoConnect={handleAutoConnect}
              onOptimizeOrder={handleOptimizeOrder}
              onAutoFix={handleAutoFix}
            />
            <WorkflowDisplay
              steps={workflowSteps}
              onReset={resetWorkflow}
              onToggleInspection={toggleInspection}
              animatedStepIndex={animatedStepIndex}
              onScrub={setAnimatedStepIndex}
              onUpdateStepConfig={updateStepConfig}
              onUpdateStepLLM={updateStepLLM}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;