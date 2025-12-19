import { Brain, Play, Loader2, AlertCircle, Paperclip, X, Image as ImageIcon, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { MODELS_TO_USE, SUPPORTED_FILE_TYPES } from '../constants';
import { Attachment, SimulationMode } from '../types';

interface SimulationSetupProps {
  topic: string;
  setTopic: (val: string) => void;
  gcloudAccessToken: string;
  setGcloudAccessToken: (val: string) => void;
  projectId: string;
  setProjectId: (val: string) => void;
  enabledModels: string[];
  setEnabledModels: (val: string[]) => void;
  isProcessing: boolean;
  handleSimulate: () => void;
  error: string | null;
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
}

export const SimulationSetup = ({
  topic,
  setTopic,
  gcloudAccessToken,
  setGcloudAccessToken,
  projectId,
  setProjectId,
  enabledModels,
  setEnabledModels,
  isProcessing,
  handleSimulate,
  error,
  mode,
  setMode,
  attachments,
  setAttachments
}: SimulationSetupProps) => {

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        alert(`File type ${file.type} is not supported.`);
        continue;
      }

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      });
    }

    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const selectedModels = MODELS_TO_USE.filter(m => enabledModels.includes(m.id));
  const hasUnsupportedModelForAttachments = attachments.length > 0 && selectedModels.some(m => m.provider === 'kimi');

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Brain size={18} className="text-indigo-500 dark:text-indigo-400" />
          Simulation Setup
        </h2>

        <button
          onClick={() => setMode(mode === 'macro' ? 'investment_committee' : 'macro')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group"
        >
          {mode === 'macro' ? (
            <>
              <ToggleLeft size={18} className="text-slate-400 group-hover:text-indigo-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Macro Mode</span>
            </>
          ) : (
            <>
              <ToggleRight size={18} className="text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Investment Committee</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
            Topic or Question
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Should we implement a 4-day work week?"
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none resize-none h-24 text-sm text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
            Attachments
          </label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-md group">
                  {att.type.startsWith('image/') ? <ImageIcon size={14} className="text-indigo-500" /> : <FileText size={14} className="text-indigo-500" />}
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 truncate max-w-[120px]">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-indigo-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-md cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <Paperclip size={14} className="text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Add File</span>
                <input type="file" multiple onChange={handleFileChange} className="hidden" accept={SUPPORTED_FILE_TYPES.join(',')} />
              </label>
            </div>
            {hasUnsupportedModelForAttachments && (
              <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-900/30">
                <AlertCircle size={12} />
                Some selected models (Kimi) do not support attachments and will ignore them.
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
            GCloud Access Token
          </label>
          <input
            type="password"
            value={gcloudAccessToken}
            onChange={(e) => setGcloudAccessToken(e.target.value)}
            placeholder="gcloud auth print-access-token"
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none text-sm font-mono text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
            Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="GCP Project ID"
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none text-sm font-mono text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
            Enabled Models
          </label>
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
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
                  className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-slate-700"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300'}
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
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
