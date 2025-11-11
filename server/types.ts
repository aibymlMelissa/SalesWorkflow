export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number';
  placeholder?: string;
}

export interface DataType {
  type: 'products' | 'customers' | 'quotes' | 'emails' | 'analytics' | 'reports' | 'approval' | 'pricing' | 'sync_data';
  schema?: { [key: string]: string };
  required?: boolean;
}

export interface ModuleIO {
  inputs: DataType[];
  outputs: DataType[];
  dependencies?: string[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  configFields?: ConfigField[];
  isLLMPowered?: boolean;
  io: ModuleIO;
  category: 'data_collection' | 'processing' | 'communication' | 'analysis' | 'decision' | 'integration';
}

export interface WorkflowStep {
  instanceId: string;
  moduleId: string;
  config: { [key: string]: string | number };
  llm?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStepIndex: number;
  results: { [stepIndex: number]: any };
  startedAt: string;
  completedAt?: string;
}