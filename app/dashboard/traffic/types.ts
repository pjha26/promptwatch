export type BotStatus = 'ALLOWED' | 'THROTTLED' | 'BLOCKED';

export interface MetricStats {
  id: string;
  label: string;
  value: string;
  trend?: string; // 'up', 'down', or undefined
  colorAccent?: 'primary' | 'secondary';
}

export interface BotDetail {
  id: string;
  name: string;
  requests: number;
  status: BotStatus;
  lastSeen: string; // e.g. "2 MINS AGO"
}

export interface TrafficDataPoint {
  time: string; // e.g. "00:00"
  legitimate: number; // percentage (0-100) or raw count mapped to height
  bot: number; // percentage (0-100)
}
