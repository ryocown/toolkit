import { CheckCircle2, Loader2 } from 'lucide-react';
import { Step } from '../types';

interface StepIndicatorProps {
  step: Step;
  currentStep: number;
}

export const StepIndicator = ({ step, currentStep }: StepIndicatorProps) => {
  const isComplete = step.id < currentStep;
  const isCurrent = step.id === currentStep;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isCurrent ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent'}`}>
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
        ${isComplete ? 'bg-green-500 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}
      `}>
        {isComplete ? <CheckCircle2 size={16} /> : step.id}
      </div>
      <div className="flex-1">
        <h4 className={`text-sm font-semibold ${isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>{step.title}</h4>
        <p className="text-xs text-slate-500">{step.desc}</p>
      </div>
      {isCurrent && <Loader2 className="animate-spin text-indigo-500" size={18} />}
    </div>
  );
};
