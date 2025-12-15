import {
  Briefcase,
  Landmark,
  HardHat,
  LineChart,
  ShieldAlert,
  Zap,
  Globe,
  Activity,
  Binary,
  Search
} from 'lucide-react';
import { ModelConfig, Role, Step } from '../types';

export const MODELS_TO_USE: ModelConfig[] = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', icon: '⚡', provider: 'google' },
  { id: 'claude-opus-4-5', name: 'Claude 4.5 Opus', icon: '🎭', provider: 'anthropic' },
  { id: 'moonshotai/kimi-k2-thinking-maas', name: 'Kimi K2 Thinking', icon: '🌙', provider: 'kimi' },
  // llama is kinda useless
  // { id: 'meta/llama-4-maverick-17b-128e-instruct-maas', name: 'Llama 4 Maverick', icon: '🇫', provider: 'llama' },
];

export const ROLES: Role[] = [
  { id: 'central_banker', title: 'Central Banker', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'business_leader', title: 'Business Leader', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'labor_rep', title: 'Labor Representative', icon: HardHat, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'economist', title: 'Academic Economist', icon: LineChart, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'risk_manager', title: 'Risk Manager', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'growth_strategist', title: 'Growth Strategist', icon: Zap, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'macro_strategist', title: 'Macro Strategist', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'bond_specialist', title: 'Bond Specialist', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'quant_analyst', title: 'Quant Analyst', icon: Binary, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'forensic_accountant', title: 'Forensic Accountant', icon: Search, color: 'text-red-600', bg: 'bg-red-50' },
];

export const INITIAL_STEPS: Step[] = [
  { id: 1, title: 'Panel Formation', status: 'pending', desc: 'AI models generating personas & opinions' },
  { id: 2, title: 'Role Aggregation', status: 'pending', desc: 'Grouping perspectives by domain' },
  { id: 3, title: 'Final Adjudication', status: 'pending', desc: 'Synthesizing verdict from all angles' },
];
