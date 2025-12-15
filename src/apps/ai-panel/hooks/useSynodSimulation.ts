import { useState, useEffect } from 'react';
import { Opinion, Verdict, SimulationHistoryItem } from '../types';
import { MODELS_TO_USE, ROLES } from '../constants';
import { getPanelFormationPrompt, getAdjudicationPrompt } from '../prompts';
import { extractJson, callVertexAI } from '../services/aiService';

interface UseSynodSimulationProps {
  gcloudAccessToken: string;
  projectId: string;
  topic: string;
  setTopic: (topic: string) => void;
  enabledModels: string[];
}

export const useSynodSimulation = ({
  gcloudAccessToken,
  projectId,
  topic,
  setTopic,
  enabledModels
}: UseSynodSimulationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<Record<string, Opinion[]>>({});
  const [verdictData, setVerdictData] = useState<Verdict | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<SimulationHistoryItem[]>(() => {
    const saved = localStorage.getItem('synod_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('synod_history', JSON.stringify(history));
  }, [history]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const saveToHistory = (finalTopic: string, finalPanelData: Record<string, Opinion[]>, finalVerdict: Verdict | null, finalLogs: string[], finalStep: number) => {
    const newItem: SimulationHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      topic: finalTopic,
      panelData: finalPanelData,
      verdictData: finalVerdict,
      logs: finalLogs,
      currentStep: finalStep
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
  };

  const loadFromHistory = (item: SimulationHistoryItem) => {
    setTopic(item.topic);
    setPanelData(item.panelData);
    setVerdictData(item.verdictData);
    setLogs(item.logs);
    setCurrentStep(item.currentStep);
    setError(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('synod_history');
  };

  const handleSimulate = async () => {
    const selectedModels = MODELS_TO_USE.filter(m => enabledModels.includes(m.id));

    if (!gcloudAccessToken) {
      return setError("Please enter a GCloud Access Token.");
    }
    if (!topic) return setError("Please enter a topic for the panel.");
    if (selectedModels.length === 0) return setError("Please enable at least one model.");

    setIsProcessing(true);
    setCurrentStep(1);
    setError(null);
    setLogs([]);
    setPanelData({});
    setVerdictData(null);

    try {

      // --- PHASE 1: PANEL FORMATION ---
      addLog("Initializing models: " + selectedModels.map(m => m.name).join(", "));

      const rolePrompt = getPanelFormationPrompt(topic);

      addLog(`Prompt size: ${rolePrompt.length} chars`);

      const phase1Promises = selectedModels.map(async (modelConfig) => {
        addLog(`Requesting opinions from ${modelConfig.name}...`);
        try {
          const response = await callVertexAI(modelConfig, rolePrompt, projectId, gcloudAccessToken);

          console.log(`Raw response from ${modelConfig.name}:`, response.text);
          addLog(`${modelConfig.name}: Done (${response.latencyMs}ms, ${response.usage.totalTokens} tokens)`);

          return { modelConfig, data: extractJson(response.text) };
        } catch (err: any) {
          addLog(`Error with ${modelConfig.name}: ${err.message}`);
          return null;
        }
      });

      const results = await Promise.all(phase1Promises);
      const validResults = results.filter(r => r !== null);

      if (validResults.length === 0) throw new Error("All models failed to respond. Check API Key or Quota.");

      // --- PHASE 2: AGGREGATION ---
      setCurrentStep(2);
      addLog("Aggregating responses by role...");

      const aggregated: Record<string, Opinion[]> = {};
      ROLES.forEach(role => {
        aggregated[role.id] = [];
        validResults.forEach(res => {
          if (res && res.data[role.id]) {
            aggregated[role.id].push({
              ...res.data[role.id],
              modelName: res.modelConfig.name,
              modelIcon: res.modelConfig.icon
            });
          }
        });
      });

      setPanelData(aggregated);
      await new Promise(r => setTimeout(r, 1000)); // UX pause

      // --- PHASE 3: ADJUDICATION ---
      setCurrentStep(3);
      addLog("Sending aggregated data to Adjudicator...");

      const adjudicationPrompt = getAdjudicationPrompt(topic, aggregated);
      addLog(`Adjudication prompt size: ${adjudicationPrompt.length} chars`);

      const verdictModelConfig = selectedModels.find(m => m.id === 'gemini-3-pro-preview') || selectedModels[0];
      addLog(`Adjudicating with ${verdictModelConfig.name}...`);

      const verdictResponse = await callVertexAI(verdictModelConfig, adjudicationPrompt, projectId, gcloudAccessToken);

      console.log(`Raw verdict response from ${verdictModelConfig.name}:`, verdictResponse.text);
      const verdictJson = extractJson(verdictResponse.text);

      setVerdictData(verdictJson);
      addLog(`Verdict reached (${verdictResponse.latencyMs}ms, ${verdictResponse.usage.totalTokens} tokens).`);
      setCurrentStep(4); // Complete

      // Save to history
      saveToHistory(topic, aggregated, verdictJson, [...logs, `[${new Date().toLocaleTimeString()}] Verdict reached (${verdictResponse.latencyMs}ms, ${verdictResponse.usage.totalTokens} tokens).`], 4);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      addLog("Critical Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    currentStep,
    error,
    panelData,
    verdictData,
    logs,
    history,
    handleSimulate,
    loadFromHistory,
    clearHistory,
    setLogs,
    setPanelData,
    setVerdictData,
    setCurrentStep
  };
};
