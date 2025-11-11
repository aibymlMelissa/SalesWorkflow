import React, { useState, useEffect } from 'react';
import { WorkflowStep, Module } from '../types';

interface InspectorProps {
  steps: WorkflowStep[];
  modules: Module[];
  onAutoConnect: (steps: WorkflowStep[]) => void;
  onOptimizeOrder: (steps: WorkflowStep[]) => void;
  onAutoFix?: (steps: WorkflowStep[]) => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedConnections: any[];
  dependencyGraph: any[];
}

interface DataFlowAnalysis {
  flow: any[];
  bottlenecks: string[];
  suggestions: string[];
}

export const AIOperationManager: React.FC<InspectorProps> = ({
  steps,
  modules,
  onAutoConnect,
  onOptimizeOrder,
  onAutoFix
}) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [dataFlow, setDataFlow] = useState<DataFlowAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (steps.length > 0) {
      validateWorkflow();
      analyzeDataFlow();
    }
  }, [steps]);

  const validateWorkflow = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5273/api/inspector/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      const result = await response.json();
      setValidation(result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
    setLoading(false);
  };

  const analyzeDataFlow = async () => {
    try {
      const response = await fetch('http://localhost:5273/api/inspector/data-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      const result = await response.json();
      setDataFlow(result);
    } catch (error) {
      console.error('Data flow analysis failed:', error);
    }
  };

  const handleAutoConnect = async () => {
    if (steps.length === 0) return;

    setLoading(true);
    try {
      const moduleIds = steps.map(step => step.moduleId);
      const response = await fetch('http://localhost:5273/api/inspector/auto-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds })
      });
      const result = await response.json();
      onAutoConnect(result.steps);
    } catch (error) {
      console.error('Auto-connect failed:', error);
    }
    setLoading(false);
  };

  const handleOptimizeOrder = async () => {
    if (steps.length === 0) return;

    setLoading(true);
    try {
      const moduleIds = steps.map(step => step.moduleId);
      const response = await fetch('http://localhost:5273/api/inspector/suggest-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds })
      });
      const result = await response.json();

      // Reorder steps based on suggestion
      const reorderedSteps = result.order.map((moduleId: string) =>
        steps.find(step => step.moduleId === moduleId)
      ).filter(Boolean);

      onOptimizeOrder(reorderedSteps);
    } catch (error) {
      console.error('Order optimization failed:', error);
    }
    setLoading(false);
  };

  const handleAutoFix = async () => {
    if (steps.length === 0 || !onAutoFix) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5273/api/inspector/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      const result = await response.json();

      if (result.changes && result.changes.length > 0) {
        // Show the changes made
        console.log('Auto-fix changes:', result.changes);
        onAutoFix(result.fixedSteps);
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
    }
    setLoading(false);
  };

  const getModuleName = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.name || moduleId;
  };

  const getModuleCategory = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.category || 'unknown';
  };

  if (steps.length === 0) {
    return (
      <div className="workflow-inspector empty">
        <div className="inspector-header">
          <h3>🤖 AI Operation Manager</h3>
          <p>Add modules to your workflow to get some feedbacks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-inspector">
      <div className="inspector-header">
        <h3>🤖 AI Operation Manager</h3>
        <div className="inspector-actions">
          <button
            onClick={handleAutoConnect}
            disabled={loading}
            className="btn-auto-connect"
            title="Automatically connect modules based on data flow"
          >
            {loading ? '⚙️' : '🔗'} Auto-Connect
          </button>
          <button
            onClick={handleOptimizeOrder}
            disabled={loading}
            className="btn-optimize"
            title="Optimize module order for better data flow"
          >
            {loading ? '⚙️' : '📈'} Optimize Order
          </button>
          {onAutoFix && validation && !validation.isValid && (
            <button
              onClick={handleAutoFix}
              disabled={loading}
              className="btn-auto-fix"
              title="Automatically fix workflow issues by adding human intervention modules"
            >
              {loading ? '⚙️' : '🔧'} Auto-Fix
            </button>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-details"
            title="Toggle detailed analysis"
          >
            {showDetails ? '👁️‍🗨️' : '👁️'} Details
          </button>
        </div>
      </div>

      {/* Validation Status */}
      {validation && (
        <div className={`validation-status ${validation.isValid ? 'valid' : 'invalid'}`}>
          <div className="status-indicator">
            {validation.isValid ? '✅' : '❌'}
            {validation.isValid ? 'Workflow Valid' : 'Issues Found'}
          </div>

          {validation.errors.length > 0 && (
            <div className="errors">
              <strong>Errors:</strong>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index} className="error">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="warnings">
              <strong>Warnings:</strong>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="warning">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Data Flow Visualization */}
      <div className="data-flow-viz">
        <h4>📊 Data Flow</h4>
        <div className="flow-chain">
          {steps.map((step, index) => {
            const module = modules.find(m => m.id === step.moduleId);
            const category = getModuleCategory(step.moduleId);

            return (
              <div key={step.instanceId} className="flow-step">
                <div className={`module-card ${category}`}>
                  <div className="module-header">
                    <span className="module-icon">{module?.icon || '📦'}</span>
                    <span className="module-name">{getModuleName(step.moduleId)}</span>
                  </div>

                  {showDetails && module && (
                    <div className="module-io">
                      <div className="inputs">
                        <small>Inputs:</small>
                        {module.io?.inputs?.map((input, i) => (
                          <span key={i} className={`data-type ${input.required ? 'required' : 'optional'}`}>
                            {input.type}
                          </span>
                        )) || <span className="no-data">None</span>}
                      </div>
                      <div className="outputs">
                        <small>Outputs:</small>
                        {module.io?.outputs?.map((output, i) => (
                          <span key={i} className="data-type">
                            {output.type}
                          </span>
                        )) || <span className="no-data">None</span>}
                      </div>
                    </div>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div className="flow-arrow">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Flow Analysis */}
      {showDetails && dataFlow && (
        <div className="data-flow-analysis">
          {dataFlow.bottlenecks.length > 0 && (
            <div className="bottlenecks">
              <h4>🚨 Bottlenecks</h4>
              <ul>
                {dataFlow.bottlenecks.map((bottleneck, index) => (
                  <li key={index} className="bottleneck">{bottleneck}</li>
                ))}
              </ul>
            </div>
          )}

          {dataFlow.suggestions.length > 0 && (
            <div className="suggestions">
              <h4>💡 Suggestions</h4>
              <ul>
                {dataFlow.suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dependency Graph */}
      {showDetails && validation?.dependencyGraph && (
        <div className="dependency-graph">
          <h4>🌐 Dependency Graph</h4>
          <div className="graph-nodes">
            {validation.dependencyGraph.map((node, index) => (
              <div key={index} className="graph-node">
                <strong>Step {index + 1}: {getModuleName(node.moduleId)}</strong>
                <div className="dependencies">
                  {node.dependencies.length > 0 ? (
                    <ul>
                      {node.dependencies.map((dep, i) => (
                        <li key={i}>{dep}</li>
                      ))}
                    </ul>
                  ) : (
                    <em>No dependencies</em>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};