import React from 'react';
import { Module } from '../types';

interface ModuleCardProps {
  module: Module;
  onAdd: (module: Module) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onAdd }) => {
  return (
    <button
      onClick={() => onAdd(module)}
      className="group flex flex-col items-center text-center p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-sky-500 hover:bg-slate-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 min-h-36"
    >
      <div className="text-sky-400 group-hover:text-sky-300 transition-colors duration-300">
        {module.icon}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-200 leading-tight">{module.name}</h3>
      <p className="mt-1 text-xs text-slate-400">{module.description}</p>
    </button>
  );
};

export default ModuleCard;
