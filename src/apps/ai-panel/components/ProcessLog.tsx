import { StepIndicator } from './StepIndicator';
import { INITIAL_STEPS } from '../constants';

interface ProcessLogProps {
  currentStep: number;
  logs: string[];
}

export const ProcessLog = ({ currentStep, logs }: ProcessLogProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">
        Process Log
      </h3>
      <div className="space-y-3 mb-6">
        {INITIAL_STEPS.map((step) => (
          <StepIndicator key={step.id} step={step} currentStep={currentStep} />
        ))}
      </div>

      <div className="bg-slate-900 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs text-green-400 resize-y overflow-auto">
        {logs.length === 0 ? (
          <span className="text-slate-600 opacity-50">Waiting for start...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1 border-l-2 border-slate-700 pl-2 whitespace-pre-wrap break-words">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
