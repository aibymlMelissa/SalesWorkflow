import fs from 'fs/promises';
import path from 'path';
import { Workflow, WorkflowExecution, Module } from '../types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const EXECUTIONS_FILE = path.join(DATA_DIR, 'executions.json');
const MODULES_FILE = path.join(DATA_DIR, 'modules.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export class WorkflowStorage {
  static async getAll(): Promise<Workflow[]> {
    return await readJsonFile(WORKFLOWS_FILE, []);
  }

  static async getById(id: string): Promise<Workflow | null> {
    const workflows = await this.getAll();
    return workflows.find(w => w.id === id) || null;
  }

  static async create(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const workflows = await this.getAll();
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      ...workflow,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workflows.push(newWorkflow);
    await writeJsonFile(WORKFLOWS_FILE, workflows);
    return newWorkflow;
  }

  static async update(id: string, updates: Partial<Omit<Workflow, 'id' | 'createdAt'>>): Promise<Workflow | null> {
    const workflows = await this.getAll();
    const index = workflows.findIndex(w => w.id === id);
    if (index === -1) return null;

    workflows[index] = {
      ...workflows[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonFile(WORKFLOWS_FILE, workflows);
    return workflows[index];
  }

  static async delete(id: string): Promise<boolean> {
    const workflows = await this.getAll();
    const index = workflows.findIndex(w => w.id === id);
    if (index === -1) return false;

    workflows.splice(index, 1);
    await writeJsonFile(WORKFLOWS_FILE, workflows);
    return true;
  }
}

export class ExecutionStorage {
  static async getAll(): Promise<WorkflowExecution[]> {
    return await readJsonFile(EXECUTIONS_FILE, []);
  }

  static async getById(id: string): Promise<WorkflowExecution | null> {
    const executions = await this.getAll();
    return executions.find(e => e.id === id) || null;
  }

  static async getByWorkflowId(workflowId: string): Promise<WorkflowExecution[]> {
    const executions = await this.getAll();
    return executions.filter(e => e.workflowId === workflowId);
  }

  static async create(execution: Omit<WorkflowExecution, 'id'>): Promise<WorkflowExecution> {
    const executions = await this.getAll();
    const newExecution: WorkflowExecution = {
      id: Date.now().toString(),
      ...execution,
    };
    executions.push(newExecution);
    await writeJsonFile(EXECUTIONS_FILE, executions);
    return newExecution;
  }

  static async update(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | null> {
    const executions = await this.getAll();
    const index = executions.findIndex(e => e.id === id);
    if (index === -1) return null;

    executions[index] = { ...executions[index], ...updates };
    await writeJsonFile(EXECUTIONS_FILE, executions);
    return executions[index];
  }
}

export class ModuleStorage {
  static async getAll(): Promise<Module[]> {
    return await readJsonFile(MODULES_FILE, []);
  }

  static async getById(id: string): Promise<Module | null> {
    const modules = await this.getAll();
    return modules.find(m => m.id === id) || null;
  }
}