import { StepIndicator } from './StepIndicator';
import { INITIAL_STEPS } from '../constants';

interface ProcessLogProps {
  currentStep: number;
  logs: string[];
}

export const ProcessLog = ({ currentStep, logs }: ProcessLogProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wide">
        Process Log
      </h3>
      <div className="space-y-3 mb-6">
        {INITIAL_STEPS.map((step) => (
          <StepIndicator key={step.id} step={step} currentStep={currentStep} />
        ))}
      </div>

      <div className="bg-slate-900 dark:bg-black rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs text-green-400 dark:text-green-500 border border-slate-800 dark:border-slate-700 resize-y overflow-auto">
        {logs.length === 0 ? (
          <span className="text-slate-600 dark:text-slate-500 opacity-50">Waiting for start...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1 border-l-2 border-slate-700 dark:border-slate-800 pl-2 whitespace-pre-wrap break-words">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
