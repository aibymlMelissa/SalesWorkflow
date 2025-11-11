import React, { useState, useEffect } from 'react';
import { WorkflowStepType } from '../types';

interface ConfigurationModalProps {
  step: WorkflowStepType;
  onClose: () => void;
  onSave: (instanceId: string, newConfig: { [key: string]: string | number }) => void;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ step, onClose, onSave }) => {
  const [config, setConfig] = useState(step.config);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(step.instanceId, config);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-modal-title"
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="config-modal-title" className="text-xl font-semibold text-sky-300">Configure: {step.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step.configFields?.map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-slate-300 mb-1">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={config[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={config[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-600/50 rounded-md hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationModal;