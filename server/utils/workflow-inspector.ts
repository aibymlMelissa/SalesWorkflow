import { Module, WorkflowStep, DataType } from '../types.js';

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedConnections: ModuleConnection[];
  dependencyGraph: DependencyNode[];
}

export interface ModuleConnection {
  fromModule: string;
  toModule: string;
  dataType: string;
  confidence: number;
}

export interface DependencyNode {
  moduleId: string;
  level: number;
  dependencies: string[];
  outputs: DataType[];
}

export class WorkflowInspector {

  static validateWorkflow(steps: WorkflowStep[], modules: Module[]): WorkflowValidationResult {
    const result: WorkflowValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestedConnections: [],
      dependencyGraph: []
    };

    const moduleMap = new Map<string, Module>();
    modules.forEach(module => moduleMap.set(module.id, module));

    // Build dependency graph
    result.dependencyGraph = this.buildDependencyGraph(steps, moduleMap);

    // Validate data flow
    const dataFlowValidation = this.validateDataFlow(steps, moduleMap);
    result.errors.push(...dataFlowValidation.errors);
    result.warnings.push(...dataFlowValidation.warnings);

    // Generate suggested connections
    result.suggestedConnections = this.generateSuggestedConnections(steps, moduleMap);

    // Check for missing dependencies
    const missingDeps = this.checkMissingDependencies(steps, moduleMap);
    result.errors.push(...missingDeps);

    // Suggest human intervention modules for workflow gaps
    const humanInterventionSuggestions = this.suggestHumanInterventionModules(steps, moduleMap, result.errors);
    result.warnings.push(...humanInterventionSuggestions);

    result.isValid = result.errors.length === 0;

    return result;
  }

  static buildDependencyGraph(steps: WorkflowStep[], moduleMap: Map<string, Module>): DependencyNode[] {
    const graph: DependencyNode[] = [];
    const availableData = new Map<string, number>(); // data type -> step index where it becomes available

    steps.forEach((step, index) => {
      const module = moduleMap.get(step.moduleId);
      if (!module) return;

      const dependencies: string[] = [];

      // Check what data this module needs and where it comes from
      module.io.inputs.forEach(input => {
        if (input.required && !availableData.has(input.type)) {
          dependencies.push(`Missing required input: ${input.type}`);
        } else if (availableData.has(input.type)) {
          dependencies.push(`${input.type} from step ${availableData.get(input.type)}`);
        }
      });

      // Mark what data becomes available after this step
      module.io.outputs.forEach(output => {
        availableData.set(output.type, index);
      });

      graph.push({
        moduleId: step.moduleId,
        level: index,
        dependencies,
        outputs: module.io.outputs
      });
    });

    return graph;
  }

  static validateDataFlow(steps: WorkflowStep[], moduleMap: Map<string, Module>): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const availableData = new Set<string>();

    steps.forEach((step, index) => {
      const module = moduleMap.get(step.moduleId);
      if (!module) {
        errors.push(`Step ${index + 1}: Module '${step.moduleId}' not found`);
        return;
      }

      // Check required inputs
      module.io.inputs.forEach(input => {
        if (input.required && !availableData.has(input.type)) {
          errors.push(`Step ${index + 1}: Missing required input '${input.type}' for module '${module.name}'`);
        } else if (!input.required && !availableData.has(input.type)) {
          warnings.push(`Step ${index + 1}: Optional input '${input.type}' not available for module '${module.name}'`);
        }
      });

      // Add outputs to available data
      module.io.outputs.forEach(output => {
        availableData.add(output.type);
      });
    });

    return { errors, warnings };
  }

  static generateSuggestedConnections(steps: WorkflowStep[], moduleMap: Map<string, Module>): ModuleConnection[] {
    const suggestions: ModuleConnection[] = [];
    const availableOutputs = new Map<string, string>(); // data type -> module id

    steps.forEach((step, index) => {
      const module = moduleMap.get(step.moduleId);
      if (!module) return;

      // Check if this module's inputs can be satisfied by previous outputs
      module.io.inputs.forEach(input => {
        if (availableOutputs.has(input.type)) {
          const sourceModule = availableOutputs.get(input.type)!;
          suggestions.push({
            fromModule: sourceModule,
            toModule: module.id,
            dataType: input.type,
            confidence: input.required ? 0.9 : 0.6
          });
        }
      });

      // Add this module's outputs
      module.io.outputs.forEach(output => {
        availableOutputs.set(output.type, module.id);
      });
    });

    return suggestions;
  }

  static checkMissingDependencies(steps: WorkflowStep[], moduleMap: Map<string, Module>): string[] {
    const errors: string[] = [];
    const providedData = new Set<string>();

    // First pass: collect all data that will be provided
    steps.forEach(step => {
      const module = moduleMap.get(step.moduleId);
      if (module) {
        module.io.outputs.forEach(output => providedData.add(output.type));
      }
    });

    // Second pass: check if required inputs are available
    steps.forEach((step, index) => {
      const module = moduleMap.get(step.moduleId);
      if (!module) return;

      module.io.inputs.forEach(input => {
        if (input.required) {
          // Check if this data type will be available from previous steps
          let dataAvailable = false;
          for (let i = 0; i < index; i++) {
            const prevModule = moduleMap.get(steps[i].moduleId);
            if (prevModule?.io.outputs.some(output => output.type === input.type)) {
              dataAvailable = true;
              break;
            }
          }

          if (!dataAvailable) {
            errors.push(`Step ${index + 1}: No previous step provides required '${input.type}' for '${module.name}'`);
          }
        }
      });
    });

    return errors;
  }

  static suggestOptimalOrder(moduleIds: string[], modules: Module[]): { order: string[], reasoning: string[] } {
    const moduleMap = new Map<string, Module>();
    modules.forEach(module => moduleMap.set(module.id, module));

    // Group modules by category
    const categories = {
      data_collection: [] as string[],
      processing: [] as string[],
      communication: [] as string[],
      analysis: [] as string[],
      decision: [] as string[],
      integration: [] as string[]
    };

    moduleIds.forEach(id => {
      const module = moduleMap.get(id);
      if (module) {
        categories[module.category].push(id);
      }
    });

    // Optimal order: data_collection → processing → communication → decision → analysis → integration
    const optimalOrder = [
      ...categories.data_collection,
      ...categories.processing,
      ...categories.communication,
      ...categories.decision,
      ...categories.analysis,
      ...categories.integration
    ];

    const reasoning = [
      'Data collection modules should run first to gather raw data',
      'Processing modules standardize and prepare the data',
      'Communication modules interact with customers using processed data',
      'Decision modules handle approvals and manual interventions',
      'Analysis modules generate insights from the completed interactions',
      'Integration modules sync data with other systems'
    ];

    return { order: optimalOrder, reasoning };
  }

  static getModuleCompatibility(moduleA: Module, moduleB: Module): { compatible: boolean, score: number, reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check if moduleA's outputs can feed into moduleB's inputs
    const outputTypes = moduleA.io.outputs.map(o => o.type);
    const inputTypes = moduleB.io.inputs.map(i => i.type);

    const commonTypes = outputTypes.filter(type => inputTypes.includes(type));

    if (commonTypes.length > 0) {
      score += commonTypes.length * 0.3;
      reasons.push(`Shares ${commonTypes.length} compatible data types: ${commonTypes.join(', ')}`);
    }

    // Category compatibility bonus
    const categoryCompatibility: { [key: string]: string[] } = {
      'data_collection': ['processing'],
      'processing': ['communication', 'analysis'],
      'communication': ['decision', 'analysis'],
      'decision': ['analysis', 'integration'],
      'analysis': ['integration'],
      'integration': []
    };

    if (categoryCompatibility[moduleA.category]?.includes(moduleB.category)) {
      score += 0.4;
      reasons.push(`Category flow: ${moduleA.category} → ${moduleB.category} is optimal`);
    }

    const compatible = score > 0.2;

    return { compatible, score, reasons };
  }

  static suggestHumanInterventionModules(steps: WorkflowStep[], moduleMap: Map<string, Module>, errors: string[]): string[] {
    const suggestions: string[] = [];

    // Check if workflow has human intervention modules
    const hasHumanDecision = steps.some(step => step.moduleId === 'human-decision');
    const hasManualInput = steps.some(step => step.moduleId === 'human-manual-input');

    // Analyze errors to suggest appropriate human intervention
    const missingDataErrors = errors.filter(error => error.includes('Missing required input'));
    const noDataSourceErrors = errors.filter(error => error.includes('No previous step provides'));

    // DATA INPUT SUGGESTIONS (Human Manual Input)
    if (missingDataErrors.length > 0 && !hasManualInput) {
      suggestions.push('💡 Missing data detected. Add "Human Manual Input" for data entry by team members');
    }

    if (noDataSourceErrors.length > 0 && !hasManualInput) {
      suggestions.push('💡 Add "Human Manual Input" to manually enter missing information');
    }

    // APPROVAL/DECISION SUGGESTIONS (Human Decision)
    // Check for high-risk modules that need approval (not data input)
    const highRiskModules = ['quotation', 'discount-pricing', 'email-interact'];
    const hasHighRiskModules = steps.some(step => highRiskModules.includes(step.moduleId));

    if (hasHighRiskModules && !hasHumanDecision) {
      suggestions.push('💡 Financial/communication modules detected. Add "Human Decision" for approval checkpoints');
    }

    // Check for workflow complexity that might need approval
    if (steps.length > 5 && !hasHumanDecision) {
      suggestions.push('💡 Complex workflow detected. Add "Human Decision" for review and approval gates');
    }

    // Check for data gaps between categories (need data input, not approval)
    const categories = steps.map(step => {
      const module = moduleMap.get(step.moduleId);
      return module?.category || 'unknown';
    });

    // If there's a jump from data collection directly to communication without processing
    for (let i = 0; i < categories.length - 1; i++) {
      if (categories[i] === 'data_collection' && categories[i + 1] === 'communication') {
        if (!hasManualInput) {
          suggestions.push('💡 Data gap detected: Add "Human Manual Input" to enrich data between collection and communication');
        }
      }
    }

    // If workflow ends with analysis, suggest decision point (not data input)
    const lastCategory = categories[categories.length - 1];
    if (lastCategory === 'analysis' && !hasHumanDecision) {
      suggestions.push('💡 Analysis endpoint detected. Add "Human Decision" to review insights and approve next actions');
    }

    return suggestions;
  }

  static autoFixWorkflowWithHumanModules(steps: WorkflowStep[], modules: Module[]): {
    fixedSteps: WorkflowStep[],
    changes: string[]
  } {
    const changes: string[] = [];
    let fixedSteps = [...steps];
    const moduleMap = new Map<string, Module>();
    modules.forEach(module => moduleMap.set(module.id, module));

    // Validate current workflow
    const validation = this.validateWorkflow(steps, modules);

    if (!validation.isValid) {
      // 1. Add Human Manual Input for DATA ENTRY needs
      const missingDataErrors = validation.errors.filter(error =>
        error.includes('Missing required input') || error.includes('No previous step provides')
      );

      if (missingDataErrors.length > 0) {
        const manualInputStep: WorkflowStep = {
          instanceId: `human-manual-input-${Date.now()}`,
          moduleId: 'human-manual-input',
          config: {
            inputType: 'Workflow data entry',
            instruction: 'Please enter the required data for subsequent workflow steps',
            requiredFields: 'Data as needed by workflow modules',
            assignee: 'data-entry@company.com'
          }
        };

        fixedSteps.unshift(manualInputStep);
        changes.push('Added "Human Manual Input" for data entry by team members');
      }

      // 2. Add Human Decision for APPROVAL/REVIEW needs before high-risk operations
      const riskModules = ['quotation', 'discount-pricing', 'email-interact'];

      for (let i = 0; i < fixedSteps.length; i++) {
        if (riskModules.includes(fixedSteps[i].moduleId)) {
          // Check if there's already a human decision before this step
          const hasDecisionBefore = i > 0 && fixedSteps[i - 1].moduleId === 'human-decision';

          if (!hasDecisionBefore) {
            const moduleName = moduleMap.get(fixedSteps[i].moduleId)?.name || 'this operation';
            const decisionStep: WorkflowStep = {
              instanceId: `human-decision-${Date.now()}-${i}`,
              moduleId: 'human-decision',
              config: {
                approver: 'manager@company.com',
                instruction: `Please review and approve ${moduleName} before execution`,
                decisionType: 'Approval'
              }
            };

            fixedSteps.splice(i, 0, decisionStep);
            changes.push(`Added "Human Decision" approval checkpoint before ${moduleName}`);
            i++; // Skip the inserted step
          }
        }
      }

      // 3. Add final Human Decision for REVIEW/ACTION decisions after analysis
      const lastStep = fixedSteps[fixedSteps.length - 1];
      const lastModule = moduleMap.get(lastStep.moduleId);

      if (lastModule?.category === 'analysis' && lastStep.moduleId !== 'human-decision') {
        const finalDecisionStep: WorkflowStep = {
          instanceId: `human-decision-final-${Date.now()}`,
          moduleId: 'human-decision',
          config: {
            approver: 'manager@company.com',
            instruction: 'Please review analysis results and decide on next actions',
            decisionType: 'Strategic Decision'
          }
        };

        fixedSteps.push(finalDecisionStep);
        changes.push('Added final "Human Decision" to review analysis and approve next actions');
      }
    }

    return { fixedSteps, changes };
  }
}