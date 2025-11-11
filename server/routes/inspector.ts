import express from 'express';
import { WorkflowInspector } from '../utils/workflow-inspector.js';
import { ModuleStorage } from '../utils/storage.js';
import { WorkflowStep } from '../types.js';

export const inspectorRoutes = express.Router();

// Validate a workflow configuration
inspectorRoutes.post('/validate', async (req, res) => {
  try {
    const { steps }: { steps: WorkflowStep[] } = req.body;

    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps array is required' });
    }

    const modules = await ModuleStorage.getAll();
    const validation = WorkflowInspector.validateWorkflow(steps, modules);

    res.json(validation);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Failed to validate workflow' });
  }
});

// Get suggested optimal order for selected modules
inspectorRoutes.post('/suggest-order', async (req, res) => {
  try {
    const { moduleIds }: { moduleIds: string[] } = req.body;

    if (!Array.isArray(moduleIds)) {
      return res.status(400).json({ error: 'Module IDs array is required' });
    }

    const modules = await ModuleStorage.getAll();
    const suggestion = WorkflowInspector.suggestOptimalOrder(moduleIds, modules);

    res.json(suggestion);
  } catch (error) {
    console.error('Order suggestion error:', error);
    res.status(500).json({ error: 'Failed to suggest module order' });
  }
});

// Check compatibility between two modules
inspectorRoutes.get('/compatibility/:moduleA/:moduleB', async (req, res) => {
  try {
    const { moduleA, moduleB } = req.params;

    const modules = await ModuleStorage.getAll();
    const moduleAObj = modules.find(m => m.id === moduleA);
    const moduleBObj = modules.find(m => m.id === moduleB);

    if (!moduleAObj || !moduleBObj) {
      return res.status(404).json({ error: 'One or both modules not found' });
    }

    const compatibility = WorkflowInspector.getModuleCompatibility(moduleAObj, moduleBObj);
    res.json(compatibility);
  } catch (error) {
    console.error('Compatibility check error:', error);
    res.status(500).json({ error: 'Failed to check module compatibility' });
  }
});

// Get dependency graph for a workflow
inspectorRoutes.post('/dependency-graph', async (req, res) => {
  try {
    const { steps }: { steps: WorkflowStep[] } = req.body;

    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps array is required' });
    }

    const modules = await ModuleStorage.getAll();
    const moduleMap = new Map();
    modules.forEach(module => moduleMap.set(module.id, module));

    const dependencyGraph = WorkflowInspector.buildDependencyGraph(steps, moduleMap);

    res.json({ dependencyGraph });
  } catch (error) {
    console.error('Dependency graph error:', error);
    res.status(500).json({ error: 'Failed to build dependency graph' });
  }
});

// Auto-connect modules based on data flow
inspectorRoutes.post('/auto-connect', async (req, res) => {
  try {
    const { moduleIds }: { moduleIds: string[] } = req.body;

    if (!Array.isArray(moduleIds)) {
      return res.status(400).json({ error: 'Module IDs array is required' });
    }

    const modules = await ModuleStorage.getAll();

    // Get optimal order first
    const { order } = WorkflowInspector.suggestOptimalOrder(moduleIds, modules);

    // Create workflow steps in optimal order
    const steps: WorkflowStep[] = order.map(moduleId => ({
      instanceId: `${moduleId}-${Date.now()}`,
      moduleId,
      config: {},
      llm: modules.find(m => m.id === moduleId)?.isLLMPowered ? 'gemini' : undefined
    }));

    // Validate the auto-connected workflow
    const validation = WorkflowInspector.validateWorkflow(steps, modules);

    res.json({
      steps,
      validation,
      autoConnected: true
    });
  } catch (error) {
    console.error('Auto-connect error:', error);
    res.status(500).json({ error: 'Failed to auto-connect modules' });
  }
});

// Get data flow analysis for existing workflow
inspectorRoutes.post('/data-flow', async (req, res) => {
  try {
    const { steps }: { steps: WorkflowStep[] } = req.body;

    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps array is required' });
    }

    const modules = await ModuleStorage.getAll();
    const moduleMap = new Map();
    modules.forEach(module => moduleMap.set(module.id, module));

    const dataFlowAnalysis = {
      flow: [] as any[],
      bottlenecks: [] as string[],
      suggestions: [] as string[]
    };

    let availableData = new Set<string>();

    steps.forEach((step, index) => {
      const module = moduleMap.get(step.moduleId);
      if (!module) return;

      const stepFlow = {
        stepIndex: index,
        moduleName: module.name,
        inputs: module.io.inputs.map(input => ({
          type: input.type,
          required: input.required,
          available: availableData.has(input.type)
        })),
        outputs: module.io.outputs.map(output => output.type)
      };

      // Check for bottlenecks (missing required data)
      const missingRequired = module.io.inputs
        .filter(input => input.required && !availableData.has(input.type))
        .map(input => input.type);

      if (missingRequired.length > 0) {
        dataFlowAnalysis.bottlenecks.push(
          `Step ${index + 1} (${module.name}): Missing required data - ${missingRequired.join(', ')}`
        );
      }

      // Add suggestions for optimization
      if (index > 0 && module.io.inputs.length === 0) {
        dataFlowAnalysis.suggestions.push(
          `Step ${index + 1} (${module.name}): Consider moving earlier in workflow as it doesn't depend on other modules`
        );
      }

      dataFlowAnalysis.flow.push(stepFlow);

      // Update available data
      module.io.outputs.forEach(output => availableData.add(output.type));
    });

    res.json(dataFlowAnalysis);
  } catch (error) {
    console.error('Data flow analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze data flow' });
  }
});

// Auto-fix workflow by adding human intervention modules
inspectorRoutes.post('/auto-fix', async (req, res) => {
  try {
    const { steps }: { steps: WorkflowStep[] } = req.body;

    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps array is required' });
    }

    const modules = await ModuleStorage.getAll();
    const { fixedSteps, changes } = WorkflowInspector.autoFixWorkflowWithHumanModules(steps, modules);

    // Validate the fixed workflow
    const validation = WorkflowInspector.validateWorkflow(fixedSteps, modules);

    res.json({
      originalSteps: steps,
      fixedSteps,
      changes,
      validation,
      autoFixed: true
    });
  } catch (error) {
    console.error('Auto-fix error:', error);
    res.status(500).json({ error: 'Failed to auto-fix workflow' });
  }
});