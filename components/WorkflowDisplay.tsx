import React, { useState } from 'react';
import { WorkflowStepType } from '../types';
import ConfigurationModal from './ConfigurationModal';
import { LLM_OPTIONS } from '../constants';

interface WorkflowDisplayProps {
  steps: WorkflowStepType[];
  onReset: () => void;
  onToggleInspection: () => void;
  animatedStepIndex: number | null;
  onScrub: (index: number) => void;
  onUpdateStepConfig: (instanceId: string, newConfig: { [key: string]: string | number }) => void;
  onUpdateStepLLM: (instanceId: string, llm: string) => void;
}

const ArrowConnector: React.FC = () => (
    <div className="flex-shrink-0 w-12 h-full flex items-center justify-center mx-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
    </div>
);

const WorkflowStep: React.FC<{ 
    step: WorkflowStepType, 
    isHighlighted: boolean, 
    onConfigure: () => void,
    onUpdateLLM: (llm: string) => void
}> = ({ step, isHighlighted, onConfigure, onUpdateLLM }) => {
    const isConfigurable = step.configFields && step.configFields.length > 0;
    const isConfigured = isConfigurable && Object.values(step.config).some(val => val !== '' && val !== 0);

    return (
        <div className={`relative flex-shrink-0 flex flex-col justify-between p-3 rounded-lg w-44 h-32 bg-slate-700/80 border-2 transition-all duration-500 ease-in-out ${isHighlighted ? 'border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20' : 'border-slate-600'}`}>
            <div className="flex items-start">
                <div className="text-sky-400 mr-3 mt-1">{step.icon}</div>
                <p className="text-xs font-medium text-slate-200 flex-1">{step.name}</p>
            </div>

            {step.isLLMPowered && (
                <div className="mt-2">
                     <select
                        value={step.llm}
                        onChange={(e) => onUpdateLLM(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent card click logic if any
                        className="w-full text-xs bg-slate-600/70 border border-slate-500 rounded p-1 text-slate-200 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                        aria-label="Select Large Language Model"
                    >
                        {LLM_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            
            {isConfigurable && (
                <button 
                    onClick={onConfigure} 
                    className={`absolute top-1 right-1 p-1 rounded-full text-slate-400 hover:bg-slate-600 hover:text-sky-300 transition-colors ${isConfigured ? 'text-emerald-400' : ''}`}
                    aria-label={`Configure ${step.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            )}
        </div>
    );
};

const WorkflowDisplay: React.FC<WorkflowDisplayProps> = ({ steps, onReset, onToggleInspection, animatedStepIndex, onScrub, onUpdateStepConfig, onUpdateStepLLM }) => {
  const [configuringStep, setConfiguringStep] = useState<WorkflowStepType | null>(null);

  const isInspecting = animatedStepIndex !== null;

  const generateArchitectureDoc = () => {
    if (steps.length === 0) return;

    // Generate architecture documentation
    const doc = `# Workflow Architecture Documentation

## Overview
This document outlines the architecture, file structure, and technology stack for the AI Sales Workflow implementation.

## Workflow Architecture

### Modules Configuration
${steps.map((step, index) => `
**${index + 1}. ${step.name}** ${step.icon}
- **ID**: \`${step.id}\`
- **Category**: ${step.category || 'processing'}
- **Description**: ${step.description}
- **LLM Powered**: ${step.isLLMPowered ? `Yes (${step.llm || 'gemini'})` : 'No'}
- **Configuration**: ${Object.keys(step.config).length > 0 ? `\n${Object.entries(step.config).map(([key, value]) => `  - ${key}: ${value}`).join('\n')}` : 'Default configuration'}
`).join('\n')}

## Technology Stack

### Frontend Architecture
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS (implied from component structure)
- **State Management**: React Hooks (useState, useCallback, useEffect)

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.19.2
- **Process Manager**: tsx (for development)
- **Data Storage**: File-based JSON storage
- **CORS**: Enabled for cross-origin requests

### Development Tools
- **TypeScript**: 5.8.2 for type safety
- **Hot Reload**: Vite HMR + tsx watch mode
- **Module System**: ES6 modules

## File Structure

\`\`\`
SalesWorkflow/
├── server/                     # Backend API
│   ├── index.ts               # Main server entry point
│   ├── types.ts               # TypeScript interfaces
│   ├── routes/                # API endpoints
│   │   ├── workflows.ts       # Workflow CRUD operations
│   │   ├── modules.ts         # Module management
│   │   ├── executions.ts      # Workflow execution
│   │   └── inspector.ts       # AI Operation Manager
│   └── utils/                 # Utilities
│       ├── storage.ts         # Data persistence
│       ├── enhanced-modules.ts # Module definitions
│       └── workflow-inspector.ts # Analysis logic
├── components/                # React components
│   ├── ModulePanel.tsx        # Module selection
│   ├── WorkflowDisplay.tsx    # Workflow visualization
│   ├── WorkflowInspector.tsx  # AI Operation Manager
│   └── ConfigurationModal.tsx # Module configuration
├── data/                      # Runtime data storage
│   ├── modules.json          # Available modules
│   ├── workflows.json        # Saved workflows
│   └── executions.json       # Execution history
├── App.tsx                   # Main application
├── types.ts                  # Shared TypeScript types
├── constants.tsx             # Application constants
└── package.json              # Dependencies
\`\`\`

## API Endpoints

### Workflow Management
- \`GET /api/workflows\` - List all workflows
- \`POST /api/workflows\` - Create new workflow
- \`PUT /api/workflows/:id\` - Update workflow
- \`DELETE /api/workflows/:id\` - Delete workflow
- \`POST /api/workflows/:id/execute\` - Execute workflow

### AI Operation Manager
- \`POST /api/inspector/validate\` - Validate workflow
- \`POST /api/inspector/auto-connect\` - Auto-connect modules
- \`POST /api/inspector/suggest-order\` - Optimize module order
- \`POST /api/inspector/auto-fix\` - Fix workflow issues
- \`POST /api/inspector/data-flow\` - Analyze data flow

### Execution Engine
- \`GET /api/executions\` - List executions
- \`POST /api/executions/:id/step\` - Execute next step

## Data Flow Architecture

### Module Categories & Flow
1. **Data Collection** → Gather raw information
2. **Processing** → Transform and standardize data
3. **Communication** → Interact with customers
4. **Decision** → Human approval/input points
5. **Analysis** → Generate insights and reports
6. **Integration** → Sync with external systems

### Workflow Execution
1. Workflow created via frontend
2. Validated by AI Operation Manager
3. Steps executed sequentially via API
4. Human intervention points pause execution
5. Results stored in execution history

## Deployment Considerations

### Development Environment
- Frontend: \`npm run dev\` (Vite dev server on port 5274)
- Backend: \`npm run server:dev\` (Express server on port 5273)

### Production Architecture
- Build frontend: \`npm run build\`
- Serve static files through Express
- Use process manager (PM2) for backend
- Implement proper database (PostgreSQL/MongoDB)
- Add authentication and authorization
- Set up monitoring and logging

## Generated on: ${new Date().toLocaleString()}
`;

    // Create and download the file
    const blob = new Blob([doc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-architecture.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-slate-800/50 rounded-xl p-6 shadow-2xl border border-slate-700 min-h-[30rem] flex flex-col">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-sky-300">Your Workflow</h2>
              <div className="flex items-center space-x-3">
                  <button
                      onClick={generateArchitectureDoc}
                      disabled={steps.length === 0}
                      className="px-4 py-2 text-sm font-semibold bg-sky-600 text-white rounded-md hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300"
                      title="Generate and download architecture documentation"
                  >
                      Construct Architecture & Tech Stack
                  </button>
                   <button
                      onClick={onReset}
                      disabled={isInspecting}
                      className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-md hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                      Reset
                  </button>
              </div>
          </div>
        
          <div className="flex-grow bg-slate-900/50 rounded-lg p-4 border border-slate-700 overflow-x-auto">
            {steps.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Add modules from the left panel to build your workflow.</p>
              </div>
            ) : (
              <div className="flex items-center min-h-full py-4">
                {steps.map((step, index) => (
                  <React.Fragment key={step.instanceId}>
                    <WorkflowStep 
                        step={step} 
                        isHighlighted={animatedStepIndex === index}
                        onConfigure={() => setConfiguringStep(step)}
                        onUpdateLLM={(llm) => onUpdateStepLLM(step.instanceId, llm)}
                    />
                    {index < steps.length - 1 && <ArrowConnector />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {isInspecting && steps.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-700">
                <label htmlFor="workflow-scrubber" className="block text-sm font-medium text-slate-300 mb-2">
                    Step {animatedStepIndex + 1} of {steps.length}: <span className="font-bold text-sky-400">{steps[animatedStepIndex].name}</span>
                </label>
                <input
                    id="workflow-scrubber"
                    type="range"
                    min="0"
                    max={steps.length - 1}
                    value={animatedStepIndex}
                    onChange={(e) => onScrub(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
                    aria-label="Workflow step scrubber"
                />
            </div>
           )}
      </div>
      
      {configuringStep && (
        <ConfigurationModal 
            step={configuringStep}
            onClose={() => setConfiguringStep(null)}
            onSave={onUpdateStepConfig}
        />
      )}
    </>
  );
};

// Fix: Corrected typo in export statement from 'export full default' to 'export default'.
export default WorkflowDisplay;