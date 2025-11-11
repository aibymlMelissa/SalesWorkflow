import React, { useState, useCallback, useEffect } from 'react';
import { Module, WorkflowStepType, WorkflowStep } from './types';
import { MODULES, LLM_OPTIONS } from './constants';
import ModulePanel from './components/ModulePanel';
import WorkflowDisplay from './components/WorkflowDisplay';
import ExecutionExperiment from './components/ExecutionExperiment';
import { AIOperationManager } from './components/WorkflowInspector';
import './components/WorkflowInspector.css';

const App: React.FC = () => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepType[]>([]);
  const [animatedStepIndex, setAnimatedStepIndex] = useState<number | null>(null);
  const [enhancedModules, setEnhancedModules] = useState<Module[]>([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [autoExecuteDemo, setAutoExecuteDemo] = useState(false);

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

  const loadDemoWorkflow = useCallback(() => {
    // Clear existing workflow
    setWorkflowSteps([]);
    setCurrentWorkflowId(null);
    setAnimatedStepIndex(null);

    // Create a complete demo workflow showing the full sales process
    const demoModules = [
      // 1. Data Collection - Gather product data
      enhancedModules.find(m => m.id === 'ecommerce-scraper'),
      // 2. Processing - Enhance product information
      enhancedModules.find(m => m.id === 'product-info'),
      // 3. Communication - Engage customers on multiple channels (parallel)
      enhancedModules.find(m => m.id === 'web-chatbot'),
      enhancedModules.find(m => m.id === 'whatsapp-assistant'),
      // 4. Processing - Generate pricing and quotations (parallel)
      enhancedModules.find(m => m.id === 'discount-pricing'),
      enhancedModules.find(m => m.id === 'quotation'),
      // 5. Analysis - Analyze business intelligence
      enhancedModules.find(m => m.id === 'business-intelligence'),
      // 6. Human Decision - Approval gate
      enhancedModules.find(m => m.id === 'human-decision'),
      // 7. Communication - Send to customers
      enhancedModules.find(m => m.id === 'email-interact'),
      // 8. Integration - Sync with divisions
      enhancedModules.find(m => m.id === 'connector-divisions'),
      // 9. Analysis - Final sales analysis
      enhancedModules.find(m => m.id === 'sales-analysis')
    ].filter(Boolean) as Module[];

    const demoSteps: WorkflowStepType[] = demoModules.map((module, index) => {
      const config: { [key: string]: string | number } = {};

      // Add demo configurations
      if (module.id === 'ecommerce-scraper') {
        config.url = 'https://example-store.com';
        config.selectors = '.product, .price, .description';
      } else if (module.id === 'web-chatbot') {
        config.website = 'https://example-store.com';
        config.personality = 'Friendly and knowledgeable sales assistant';
      } else if (module.id === 'whatsapp-assistant') {
        config.phone = '+1234567890';
        config.greeting = 'Hello! Welcome to our store. How can I help you today?';
      } else if (module.id === 'discount-pricing') {
        config.strategy = 'Volume-based';
        config.maxDiscount = 25;
      } else if (module.id === 'quotation') {
        config.template = 'Professional quotation template';
        config.validityDays = 30;
      } else if (module.id === 'business-intelligence') {
        config.competitors = 'https://competitor1.com\nhttps://competitor2.com';
        config.reportType = 'Market Analysis';
      } else if (module.id === 'human-decision') {
        config.approver = 'manager@company.com';
        config.instruction = 'Please review pricing and quotations';
        config.decisionType = 'Approval';
      } else if (module.id === 'email-interact') {
        config.subject = 'Your Quotation Request';
        config.signature = 'Best regards,\nSales Team';
      } else if (module.id === 'connector-divisions') {
        config.divisions = 'Logistics, Finance, Marketing';
        config.syncFrequency = 'Real-time';
      } else if (module.id === 'sales-analysis') {
        config.metrics = 'Conversion rate, Revenue, Lead quality';
        config.period = 'Monthly';
      }

      return {
        ...module,
        instanceId: `demo_${module.id}_${Date.now()}_${index}`,
        config,
        ...(module.isLLMPowered && { llm: 'gpt-3.5-turbo' })
      };
    });

    setWorkflowSteps(demoSteps);

    // Trigger auto-execution after workflow is loaded
    setTimeout(() => {
      setAutoExecuteDemo(true);
    }, 500);
  }, [enhancedModules]);

  const saveWorkflow = useCallback(async () => {
    if (workflowSteps.length === 0) return;

    try {
      const workflowData = {
        name: `Workflow ${new Date().toLocaleString()}`,
        description: 'Auto-saved workflow',
        steps: workflowSteps.map(step => ({
          instanceId: step.instanceId,
          moduleId: step.id,
          config: step.config,
          llm: step.llm,
          dependsOn: step.dependsOn || []
        }))
      };

      let response;
      if (currentWorkflowId) {
        // Update existing workflow
        response = await fetch(`http://localhost:5273/api/workflows/${currentWorkflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflowData)
        });
      } else {
        // Create new workflow
        response = await fetch('http://localhost:5273/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflowData)
        });
      }

      if (response.ok) {
        const savedWorkflow = await response.json();
        setCurrentWorkflowId(savedWorkflow.id);
        console.log('Workflow saved:', savedWorkflow.id);
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  }, [workflowSteps, currentWorkflowId]);

  // Auto-save workflow when steps change
  useEffect(() => {
    if (workflowSteps.length > 0) {
      const timeoutId = setTimeout(saveWorkflow, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [workflowSteps, saveWorkflow]);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-sky-400 tracking-tight">
            AI Sales Workflow Builder
          </h1>
          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
            Click modules to build your process, configure steps, and use the AI Operation Manager to review your workflow.
          </p>
          <div className="mt-6">
            <button
              onClick={loadDemoWorkflow}
              className="px-6 py-3 text-base font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-lg hover:from-emerald-500 hover:to-sky-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              🚀 Load Demo Workflow
            </button>
            <p className="mt-2 text-sm text-slate-500">
              See how workflows process: Business Intelligence → Customer Requests → Final Orders → Division Integrations
            </p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <ModulePanel modules={enhancedModules.length > 0 ? enhancedModules : MODULES} onAddModule={addStepToWorkflow} />
          </aside>
          <section className="lg:col-span-3">
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
            <div className="mt-6">
              <ExecutionExperiment
                steps={workflowSteps}
                workflowId={currentWorkflowId || undefined}
                autoExecute={autoExecuteDemo}
                onExecutionComplete={() => setAutoExecuteDemo(false)}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;