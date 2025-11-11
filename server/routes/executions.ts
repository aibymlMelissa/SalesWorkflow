import express from 'express';
import { ExecutionStorage, WorkflowStorage, ModuleStorage } from '../utils/storage.js';
import { executeModule, hasRealImplementation } from '../executors/index.js';

export const executionRoutes = express.Router();

executionRoutes.get('/', async (req, res) => {
  try {
    const executions = await ExecutionStorage.getAll();
    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

executionRoutes.get('/:id', async (req, res) => {
  try {
    const execution = await ExecutionStorage.getById(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch execution' });
  }
});

executionRoutes.post('/:id/step', async (req, res) => {
  try {
    const execution = await ExecutionStorage.getById(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    const workflow = await WorkflowStorage.getById(execution.workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const currentStep = workflow.steps[execution.currentStepIndex];
    if (!currentStep) {
      return res.status(400).json({ error: 'No more steps to execute' });
    }

    const module = await ModuleStorage.getById(currentStep.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Get previous step results for modules that need input
    const previousStepResult = execution.currentStepIndex > 0
      ? execution.results[execution.currentStepIndex - 1]
      : null;

    // Execute module (real or simulated)
    let result;
    try {
      if (hasRealImplementation(module.id)) {
        console.log(`Executing real implementation for module: ${module.id}`);
        result = await executeModule(module.id, currentStep.config, previousStepResult, currentStep.llm);
      } else {
        console.log(`Using simulated execution for module: ${module.id}`);
        result = await simulateModuleExecution(module, currentStep.config);
      }
    } catch (error: any) {
      console.error(`Module execution error:`, error);
      result = {
        status: 'error',
        error: error.message,
        message: `Failed to execute ${module.name}`
      };
    }

    const updatedExecution = await ExecutionStorage.update(execution.id, {
      status: execution.currentStepIndex + 1 >= workflow.steps.length ? 'completed' : 'running',
      currentStepIndex: execution.currentStepIndex + 1,
      results: {
        ...execution.results,
        [execution.currentStepIndex]: result
      },
      completedAt: execution.currentStepIndex + 1 >= workflow.steps.length ? new Date().toISOString() : execution.completedAt
    });

    res.json(updatedExecution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute step' });
  }
});

async function simulateModuleExecution(module: any, config: any) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    moduleId: module.id,
    moduleName: module.name,
    status: 'completed',
    config,
    output: generateMockOutput(module),
    executedAt: new Date().toISOString()
  };
}

function generateMockOutput(module: any) {
  const outputs: { [key: string]: any } = {
    'ecommerce-scraper': { productsFound: 25, categories: ['Electronics', 'Clothing'], avgPrice: '$45.99' },
    'product-info': { processedProducts: 25, standardizedFields: 8, qualityScore: 0.92 },
    'whatsapp-assistant': { messagesProcessed: 15, leadsGenerated: 3, avgResponseTime: '2.3s' },
    'web-chatbot': { visitorChats: 42, conversions: 7, satisfaction: 4.6 },
    'quotation': { quotesGenerated: 8, avgQuoteValue: '$1,250', pendingApprovals: 2 },
    'email-interact': { emailsSent: 12, opened: 9, clicked: 4, responses: 3 },
    'sales-analysis': { conversionRate: '18.5%', revenue: '$15,400', topProduct: 'Wireless Headphones' },
    'business-intelligence': { competitorAnalysis: 'completed', marketShare: '12%', recommendations: 5 },
    'connector-divisions': { divisionsSync: 3, recordsUpdated: 156, syncStatus: 'success' },
    'human-decision': { status: 'pending_approval', decision: null, approver: 'manager@company.com', decisionType: 'Review & Approval', requestedAt: new Date().toISOString() },
    'discount-pricing': { discountsApplied: 6, avgDiscount: '15%', revenueImpact: '+$2,100' },
    'human-manual-input': { status: 'awaiting_data_entry', dataEntered: false, assignee: 'data-entry@company.com', fieldsRequired: ['customer_info', 'product_details'], requestedAt: new Date().toISOString() }
  };

  return outputs[module.id] || { status: 'completed', message: `${module.name} executed successfully` };
}