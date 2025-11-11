export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number';
  placeholder?: string;
}

export interface Module {
  id: string;
  name:string;
  description: string;
  icon: React.ReactNode;
  configFields?: ConfigField[];
  isLLMPowered?: boolean;
}

export interface WorkflowStepType extends Module {
  instanceId: string;
  config: { [key: string]: string | number };
  llm?: string;
}