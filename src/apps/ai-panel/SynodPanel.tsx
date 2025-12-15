import { useState, useEffect } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { MODELS_TO_USE, ROLES } from './constants';
import { SimulationSetup } from './components/SimulationSetup';
import { ProcessLog } from './components/ProcessLog';
import { RoleCard } from './components/RoleCard';
import { VerdictCard } from './components/VerdictCard';
import { useSynodSimulation } from './hooks/useSynodSimulation';

export default function SynodAI() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('synod_gemini_api_key') || '');
  const [gcloudAccessToken, setGcloudAccessToken] = useState(() => localStorage.getItem('synod_gcloud_token') || '');
  const [projectId, setProjectId] = useState(() => localStorage.getItem('synod_project_id') || 'hirico-test-project-454404');
  const [topic, setTopic] = useState('');
  const [enabledModels, setEnabledModels] = useState<string[]>(MODELS_TO_USE.map(m => m.id));

  // Persist keys to localStorage
  useEffect(() => {
    localStorage.setItem('synod_gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('synod_gcloud_token', gcloudAccessToken);
  }, [gcloudAccessToken]);

  useEffect(() => {
    localStorage.setItem('synod_project_id', projectId);
  }, [projectId]);

  const {
    isProcessing,
    currentStep,
    error,
    panelData,
    verdictData,
    logs,
    handleSimulate
  } = useSynodSimulation({
    apiKey,
    gcloudAccessToken,
    projectId,
    topic,
    enabledModels
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Users className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Synod AI
            </h1>
          </div>
          <div className="text-xs font-medium text-slate-400 hidden sm:block">
            Powered by Google Model Garden (Gemini)
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-8 grid lg:grid-cols-7 gap-8">

        {/* Left Sidebar: Controls & Status */}
        <div className="lg:col-span-2 space-y-6">
          <SimulationSetup
            topic={topic}
            setTopic={setTopic}
            apiKey={apiKey}
            setApiKey={setApiKey}
            gcloudAccessToken={gcloudAccessToken}
            setGcloudAccessToken={setGcloudAccessToken}
            projectId={projectId}
            setProjectId={setProjectId}
            enabledModels={enabledModels}
            setEnabledModels={setEnabledModels}
            isProcessing={isProcessing}
            handleSimulate={handleSimulate}
            error={error}
          />

          <ProcessLog
            currentStep={currentStep}
            logs={logs}
          />
        </div>

        {/* Right Content: Results */}
        <div className="lg:col-span-5 space-y-6">

          {/* Welcome State */}
          {currentStep === 0 && !isProcessing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Users className="text-indigo-400" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Virtual Policy Panel</h2>
              <p className="text-slate-500 max-w-md">
                Enter a complex topic. Multiple AI models will assume expert roles, debate the implications, and deliver a consensus verdict.
              </p>
            </div>
          )}

          {/* Verdict Section */}
          {verdictData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <VerdictCard verdict={verdictData} />
            </div>
          )}

          {/* Panel Opinions */}
          {Object.keys(panelData).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare size={18} className="text-slate-400" />
                  Panel Perspectives
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                  {Object.values(panelData).flat().length} Opinions Generated
                </span>
              </div>

              <div className="space-y-4">
                {ROLES.map(role => {
                  const opinions = panelData[role.id];
                  if (!opinions || opinions.length === 0) return null;
                  return (
                    <div key={role.id} className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                      <RoleCard role={role} opinions={opinions} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}