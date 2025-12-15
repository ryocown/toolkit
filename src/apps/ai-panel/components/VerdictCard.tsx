import { Gavel, TrendingUp, AlertCircle } from 'lucide-react';
import { Verdict } from '../types';

interface VerdictCardProps {
  verdict: Verdict;
}

export const VerdictCard = ({ verdict }: VerdictCardProps) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700 dark:border-slate-800 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 dark:border-slate-800 pb-4">
        <Gavel className="text-yellow-400 dark:text-yellow-500" size={24} />
        <h2 className="text-xl font-bold text-yellow-50 dark:text-yellow-100">Final Adjudication</h2>
        <span className="ml-auto text-xs font-mono text-slate-400 dark:text-slate-500">Consensus Engine v1.0</span>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-semibold">Executive Summary</h3>
          <p className="text-lg leading-relaxed font-light text-slate-100 dark:text-slate-200">{verdict.summary}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 dark:bg-white/10 rounded-lg p-4 border border-white/10 dark:border-white/20">
            <h4 className="text-green-400 dark:text-green-500 font-bold mb-2 flex items-center gap-2">
              <TrendingUp size={16} /> Key Opportunities
            </h4>
            <ul className="space-y-2">
              {verdict.opportunities?.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-600 mt-1">•</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/5 dark:bg-white/10 rounded-lg p-4 border border-white/10 dark:border-white/20">
            <h4 className="text-red-400 dark:text-red-500 font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} /> Critical Risks
            </h4>
            <ul className="space-y-2">
              {verdict.risks?.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-red-500 dark:text-red-600 mt-1">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-semibold">Consensus Action Plan</h3>
          <p className="text-slate-300 dark:text-slate-400 text-sm leading-relaxed">{verdict.actionPlan}</p>
        </div>
      </div>
    </div>
  );
};
