
import React from 'react';
import { Module } from '../types';
import ModuleCard from './ModuleCard';

interface ModulePanelProps {
  modules: Module[];
  onAddModule: (module: Module) => void;
}

const ModulePanel: React.FC<ModulePanelProps> = ({ modules, onAddModule }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-semibold mb-4 text-sky-300">Possible Modules in Sales Process</h2>
      <div className="grid grid-cols-3 gap-3 auto-rows-fr">
        {modules.map(module => (
          <ModuleCard key={module.id} module={module} onAdd={onAddModule} />
        ))}
      </div>
    </div>
  );
};

export default ModulePanel;
