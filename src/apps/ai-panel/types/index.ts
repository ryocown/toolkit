export interface Step {
  id: number;
  title: string;
  status: string;
  desc: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
}

export type SimulationMode = 'macro' | 'investment_committee';

import { LucideIcon } from 'lucide-react';

export interface Role {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export interface Opinion {
  personaName: string;
  bio: string;
  positionSummary: string;
  opinion: string;
  modelName: string;
  modelIcon: string;
}

export interface Verdict {
  summary: string;
  opportunities: string[];
  risks: string[];
  actionPlan: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  icon: string;
  provider: 'google' | 'anthropic' | 'kimi' | 'llama';
}

export interface SimulationHistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  mode: SimulationMode;
  attachments: Attachment[];
  panelData: Record<string, Opinion[]>;
  verdictData: Verdict | null;
  logs: string[];
  currentStep: number;
}
