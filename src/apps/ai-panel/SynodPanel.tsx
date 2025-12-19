import { useState, useEffect } from 'react';
import { Users, MessageSquare, Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { MODELS_TO_USE, ROLES, INVESTMENT_COMMITTEE_ROLES } from './constants';
import { SimulationSetup } from './components/SimulationSetup';
import { ProcessLog } from './components/ProcessLog';
import { RoleCard } from './components/RoleCard';
import { VerdictCard } from './components/VerdictCard';
import { HistoryDropdown } from './components/HistoryDropdown';
import { useSynodSimulation } from './hooks/useSynodSimulation';

export default function SynodAI() {
  const [gcloudAccessToken, setGcloudAccessToken] = useState(() => localStorage.getItem('synod_gcloud_token') || '');
  const [projectId, setProjectId] = useState(() => localStorage.getItem('synod_project_id') || 'hirico-test-project-454404');
  const [topic, setTopic] = useState('');
  const [enabledModels, setEnabledModels] = useState<string[]>(MODELS_TO_USE.map(m => m.id));
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('synod_dark_mode') === 'true');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('synod_sidebar_collapsed') === 'true');


  useEffect(() => {
    localStorage.setItem('synod_gcloud_token', gcloudAccessToken);
  }, [gcloudAccessToken]);

  useEffect(() => {
    localStorage.setItem('synod_project_id', projectId);
  }, [projectId]);

  useEffect(() => {
    console.log('[SynodAI] Dark mode effect triggered:', isDarkMode);
    localStorage.setItem('synod_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('synod_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const {
    isProcessing,
    currentStep,
    error,
    panelData,
    verdictData,
    logs,
    history,
    mode,
    setMode,
    attachments,
    setAttachments,
    handleSimulate,
    loadFromHistory,
    clearHistory
  } = useSynodSimulation({
    gcloudAccessToken,
    projectId,
    topic,
    setTopic,
    enabledModels
  });

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50 transition-colors duration-300">

        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
          <div className="w-full px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarCollapsed(prev => !prev)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-2"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Users className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Synod AI
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  console.log('[SynodAI] Toggle clicked, current:', isDarkMode);
                  setIsDarkMode(prev => !prev);
                }}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="text-xs font-medium text-slate-400 hidden sm:block">
                Powered by Google Model Garden (Gemini)
              </div>
              <HistoryDropdown
                history={history}
                onSelect={loadFromHistory}
                onClear={clearHistory}
              />
            </div>
          </div>
        </header>

        <main className="w-full px-6 py-8 flex gap-8">
          {/* Left Sidebar: Controls & Status */}
          <aside
            className={`
              shrink-0 space-y-6 transition-all duration-300 ease-in-out overflow-hidden
              ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none -ml-8' : 'w-full lg:w-80 opacity-100'}
            `}
          >
            <SimulationSetup
              topic={topic}
              setTopic={setTopic}
              gcloudAccessToken={gcloudAccessToken}
              setGcloudAccessToken={setGcloudAccessToken}
              projectId={projectId}
              setProjectId={setProjectId}
              enabledModels={enabledModels}
              setEnabledModels={setEnabledModels}
              isProcessing={isProcessing}
              handleSimulate={handleSimulate}
              error={error}
              mode={mode}
              setMode={setMode}
              attachments={attachments}
              setAttachments={setAttachments}
            />

            <ProcessLog
              currentStep={currentStep}
              logs={logs}
            />
          </aside>

          {/* Right Content: Results */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* Welcome State */}
            {currentStep === 0 && !isProcessing && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed transition-colors duration-300">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                  <Users className="text-indigo-400 dark:text-indigo-500" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Virtual Policy Panel</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
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
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <MessageSquare size={18} className="text-slate-400 dark:text-slate-500" />
                    Panel Perspectives
                  </h3>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                    {Object.values(panelData).flat().length} Opinions Generated
                  </span>
                </div>

                <div className="space-y-4">
                  {(mode === 'investment_committee' ? INVESTMENT_COMMITTEE_ROLES : ROLES).map(role => {
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
    </div>
  );
}