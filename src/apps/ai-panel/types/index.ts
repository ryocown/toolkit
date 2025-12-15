export interface Step {
  id: number;
  title: string;
  status: string;
  desc: string;
}

export interface Role {
  id: string;
  title: string;
  icon: any;
  color: string;
  bg: string;
}

export interface Opinion {
  personaName: string;
  bio: string;
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
