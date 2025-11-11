import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowStorage, ExecutionStorage } from '../utils/storage.js';
import { Workflow, WorkflowStep } from '../types.js';
import { ParallelWorkflowExecutor } from '../utils/parallel-executor.js';

export const workflowRoutes = express.Router();

workflowRoutes.get('/', async (req, res) => {
  try {
    const workflows = await WorkflowStorage.getAll();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

workflowRoutes.get('/:id', async (req, res) => {
  try {
    const workflow = await WorkflowStorage.getById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

workflowRoutes.post('/', async (req, res) => {
  try {
    const { name, description, steps } = req.body;

    if (!name || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'Name and steps are required' });
    }

    const processedSteps: WorkflowStep[] = steps.map(step => ({
      instanceId: step.instanceId || uuidv4(),
      moduleId: step.moduleId,
      config: step.config || {},
      llm: step.llm
    }));

    const workflow = await WorkflowStorage.create({
      name,
      description,
      steps: processedSteps
    });

    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

workflowRoutes.put('/:id', async (req, res) => {
  try {
    const { name, description, steps } = req.body;

    const processedSteps: WorkflowStep[] = steps?.map(step => ({
      instanceId: step.instanceId || uuidv4(),
      moduleId: step.moduleId,
      config: step.config || {},
      llm: step.llm
    }));

    const workflow = await WorkflowStorage.update(req.params.id, {
      name,
      description,
      steps: processedSteps
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

workflowRoutes.delete('/:id', async (req, res) => {
  try {
    const deleted = await WorkflowStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

workflowRoutes.post('/:id/execute', async (req, res) => {
  try {
    const workflow = await WorkflowStorage.getById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const execution = await ExecutionStorage.create({
      workflowId: workflow.id,
      status: 'pending',
      currentStepIndex: 0,
      results: {},
      startedAt: new Date().toISOString()
    });

    res.status(201).json(execution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start workflow execution' });
  }
});

workflowRoutes.post('/:id/execute-parallel', async (req, res) => {
  try {
    const workflow = await WorkflowStorage.getById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    console.log(`Starting parallel execution for workflow: ${workflow.id}`);

    // Analyze parallelism
    const analysis = ParallelWorkflowExecutor.analyzeParallelism(workflow.steps);
    console.log('Parallelism analysis:', analysis);

    // Execute workflow in parallel
    const executor = new ParallelWorkflowExecutor(workflow.steps);
    const startTime = Date.now();

    const results = await executor.execute();

    const duration = Date.now() - startTime;

    // Convert Map to object for response
    const resultsObj: any = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });

    res.status(200).json({
      workflowId: workflow.id,
      status: 'completed',
      executionMode: 'parallel',
      duration: `${duration}ms`,
      parallelism: analysis,
      results: resultsObj,
      stats: executor.getStats(),
      completedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Parallel execution error:', error);
    res.status(500).json({
      error: 'Failed to execute workflow in parallel',
      message: error.message
    });
  }
});

workflowRoutes.get('/:id/analyze', async (req, res) => {
  try {
    const workflow = await WorkflowStorage.getById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const analysis = ParallelWorkflowExecutor.analyzeParallelism(workflow.steps);

    res.json({
      workflowId: workflow.id,
      analysis: {
        ...analysis,
        canParallelize: analysis.maxParallelism > 1,
        estimatedSpeedup: `${analysis.maxParallelism}x (theoretical maximum)`
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze workflow' });
  }
});

workflowRoutes.get('/:id/executions', async (req, res) => {
  try {
    const executions = await ExecutionStorage.getByWorkflowId(req.params.id);
    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow executions' });
  }
});