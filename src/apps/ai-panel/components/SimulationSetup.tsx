import { Brain, Play, Loader2, AlertCircle } from 'lucide-react';
import { MODELS_TO_USE } from '../constants';

interface SimulationSetupProps {
  topic: string;
  setTopic: (val: string) => void;
  apiKey: string;
  setApiKey: (val: string) => void;
  gcloudAccessToken: string;
  setGcloudAccessToken: (val: string) => void;
  projectId: string;
  setProjectId: (val: string) => void;
  enabledModels: string[];
  setEnabledModels: (val: string[]) => void;
  isProcessing: boolean;
  handleSimulate: () => void;
  error: string | null;
}

export const SimulationSetup = ({
  topic,
  setTopic,
  apiKey,
  setApiKey,
  gcloudAccessToken,
  setGcloudAccessToken,
  projectId,
  setProjectId,
  enabledModels,
  setEnabledModels,
  isProcessing,
  handleSimulate,
  error
}: SimulationSetupProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Brain size={18} className="text-indigo-500" />
        Simulation Setup
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Topic or Question
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Should we implement a 4-day work week?"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-24 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter AI Studio Key"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            GCloud Access Token
          </label>
          <input
            type="password"
            value={gcloudAccessToken}
            onChange={(e) => setGcloudAccessToken(e.target.value)}
            placeholder="gcloud auth print-access-token"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="GCP Project ID"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
            Enabled Models
          </label>
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {MODELS_TO_USE.map(model => (
              <label key={model.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enabledModels.includes(model.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEnabledModels([...enabledModels, model.id]);
                    } else {
                      setEnabledModels(enabledModels.filter(id => id !== model.id));
                    }
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {model.icon} {model.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isProcessing}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all
            ${isProcessing
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300'}
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Simulating...
            </>
          ) : (
            <>
              <Play size={18} />
              Start Simulation
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
