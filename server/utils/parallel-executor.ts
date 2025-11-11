import { WorkflowStep } from '../types.js';
import { ModuleStorage } from './storage.js';
import { executeModule, hasRealImplementation } from '../executors/index.js';

interface ExecutionNode {
  step: WorkflowStep;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface ExecutionGraph {
  nodes: Map<string, ExecutionNode>;
  completed: Set<string>;
  running: Set<string>;
}

/**
 * Parallel Workflow Executor
 * Executes workflow steps in parallel when possible based on dependencies
 */
export class ParallelWorkflowExecutor {
  private graph: ExecutionGraph;
  private steps: WorkflowStep[];

  constructor(steps: WorkflowStep[]) {
    this.steps = steps;
    this.graph = {
      nodes: new Map(),
      completed: new Set(),
      running: new Set()
    };

    // Initialize execution graph
    steps.forEach(step => {
      this.graph.nodes.set(step.instanceId, {
        step,
        status: 'pending'
      });
    });
  }

  /**
   * Execute all steps with parallel processing
   */
  async execute(): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    while (this.graph.completed.size < this.steps.length) {
      // Find steps ready to execute (dependencies satisfied)
      const readySteps = this.getReadySteps();

      if (readySteps.length === 0) {
        // Check if we're stuck
        if (this.graph.running.size === 0) {
          throw new Error('Workflow deadlock detected - no steps can execute');
        }
        // Wait for running steps to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Execute ready steps in parallel
      console.log(`Executing ${readySteps.length} steps in parallel:`, readySteps.map(s => s.step.instanceId));

      const executions = readySteps.map(node => this.executeStep(node));

      // Wait for all parallel steps to complete
      await Promise.all(executions);
    }

    // Collect all results
    this.graph.nodes.forEach((node, instanceId) => {
      if (node.result) {
        results.set(instanceId, node.result);
      }
    });

    return results;
  }

  /**
   * Get steps that are ready to execute (all dependencies satisfied)
   */
  private getReadySteps(): ExecutionNode[] {
    const ready: ExecutionNode[] = [];

    this.graph.nodes.forEach((node, instanceId) => {
      // Skip if already completed or running
      if (node.status !== 'pending') {
        return;
      }

      // Check if all dependencies are satisfied
      const dependencies = node.step.dependsOn || [];
      const allDependenciesSatisfied = dependencies.every(depId =>
        this.graph.completed.has(depId)
      );

      if (allDependenciesSatisfied) {
        ready.push(node);
      }
    });

    return ready;
  }

  /**
   * Execute a single step and update graph
   */
  private async executeStep(node: ExecutionNode): Promise<void> {
    const { step } = node;

    try {
      // Mark as running
      node.status = 'running';
      this.graph.running.add(step.instanceId);

      console.log(`Executing step: ${step.instanceId} (${step.moduleId})`);

      // Get module
      const module = await ModuleStorage.getById(step.moduleId);
      if (!module) {
        throw new Error(`Module not found: ${step.moduleId}`);
      }

      // Gather inputs from dependencies
      const inputData = this.gatherInputs(step);

      // Execute module
      let result;
      if (hasRealImplementation(module.id)) {
        result = await executeModule(module.id, step.config, inputData, step.llm);
      } else {
        // Simulated execution
        result = await this.simulateExecution(module, step.config);
      }

      // Store result
      node.result = result;
      node.status = 'completed';

      // Update graph
      this.graph.running.delete(step.instanceId);
      this.graph.completed.add(step.instanceId);

      console.log(`✓ Completed: ${step.instanceId}`);

    } catch (error: any) {
      console.error(`✗ Failed: ${step.instanceId}`, error.message);

      node.status = 'failed';
      node.error = error.message;
      node.result = {
        status: 'error',
        error: error.message
      };

      // Still mark as completed so workflow can continue
      this.graph.running.delete(step.instanceId);
      this.graph.completed.add(step.instanceId);
    }
  }

  /**
   * Gather inputs from all dependencies
   * Merges results from multiple upstream steps
   */
  private gatherInputs(step: WorkflowStep): any {
    const dependencies = step.dependsOn || [];

    if (dependencies.length === 0) {
      return null;
    }

    if (dependencies.length === 1) {
      // Single input - return directly
      const depNode = this.graph.nodes.get(dependencies[0]);
      return depNode?.result || null;
    }

    // Multiple inputs - merge them
    const mergedInput: any = {};
    const allResults: any[] = [];

    dependencies.forEach(depId => {
      const depNode = this.graph.nodes.get(depId);
      if (depNode?.result) {
        allResults.push(depNode.result);

        // Merge data fields
        Object.keys(depNode.result).forEach(key => {
          if (Array.isArray(depNode.result[key])) {
            // Merge arrays
            if (!mergedInput[key]) {
              mergedInput[key] = [];
            }
            mergedInput[key].push(...depNode.result[key]);
          } else if (typeof depNode.result[key] === 'object' && depNode.result[key] !== null) {
            // Merge objects
            if (!mergedInput[key]) {
              mergedInput[key] = {};
            }
            Object.assign(mergedInput[key], depNode.result[key]);
          } else {
            // Take first non-null value
            if (mergedInput[key] === undefined) {
              mergedInput[key] = depNode.result[key];
            }
          }
        });
      }
    });

    // Add metadata about sources
    mergedInput._sources = dependencies;
    mergedInput._allResults = allResults;

    return mergedInput;
  }

  /**
   * Simulate module execution (fallback)
   */
  private async simulateExecution(module: any, config: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      moduleId: module.id,
      moduleName: module.name,
      status: 'completed',
      config,
      output: `Simulated output from ${module.name}`,
      executedAt: new Date().toISOString()
    };
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      total: this.steps.length,
      completed: this.graph.completed.size,
      running: this.graph.running.size,
      pending: this.steps.length - this.graph.completed.size - this.graph.running.size
    };
  }

  /**
   * Analyze workflow for parallelism opportunities
   */
  static analyzeParallelism(steps: WorkflowStep[]): {
    maxParallelism: number;
    levels: string[][];
    independentPaths: number;
  } {
    const graph: Map<string, string[]> = new Map();
    const inDegree: Map<string, number> = new Map();

    // Build graph
    steps.forEach(step => {
      graph.set(step.instanceId, step.dependsOn || []);
      inDegree.set(step.instanceId, (step.dependsOn || []).length);
    });

    // Topological levels (steps that can run in parallel)
    const levels: string[][] = [];
    const remaining = new Set(steps.map(s => s.instanceId));

    while (remaining.size > 0) {
      const level: string[] = [];

      // Find steps with no remaining dependencies
      remaining.forEach(stepId => {
        if (inDegree.get(stepId) === 0) {
          level.push(stepId);
        }
      });

      if (level.length === 0) {
        break; // Circular dependency
      }

      levels.push(level);

      // Remove this level and update in-degrees
      level.forEach(stepId => {
        remaining.delete(stepId);

        // Decrease in-degree for dependent steps
        steps.forEach(step => {
          if (step.dependsOn?.includes(stepId) && remaining.has(step.instanceId)) {
            inDegree.set(step.instanceId, (inDegree.get(step.instanceId) || 1) - 1);
          }
        });
      });
    }

    const maxParallelism = Math.max(...levels.map(l => l.length));

    return {
      maxParallelism,
      levels,
      independentPaths: levels[0]?.length || 1
    };
  }
}
