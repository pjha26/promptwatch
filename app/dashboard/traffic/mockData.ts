import { BotDetail, MetricStats, TrafficDataPoint } from './types';

export const mockMetrics: MetricStats[] = [
  { id: 'm1', label: 'TOTAL REQUESTS', value: '428,102', trend: 'up', colorAccent: 'primary' },
  { id: 'm2', label: 'BOTS THROTTLED', value: '1,204', colorAccent: 'primary' },
  { id: 'm3', label: 'BOTS BLOCKED', value: '842', colorAccent: 'secondary' },
  { id: 'm4', label: 'BANDWIDTH SAVED', value: '1.2TB', colorAccent: 'primary' }
];

export const mockChartData: TrafficDataPoint[] = [
  { time: '00:00', legitimate: 70, bot: 30 },
  { time: '04:00', legitimate: 80, bot: 20 },
  { time: '08:00', legitimate: 55, bot: 45 },
  { time: '12:00', legitimate: 85, bot: 15 },
  { time: '16:00', legitimate: 75, bot: 25 },
  { time: '20:00', legitimate: 40, bot: 60 },
  { time: '24:00', legitimate: 90, bot: 10 },
];

export const mockBots: BotDetail[] = [
  { id: 'b1', name: 'GPTBot', requests: 124592, status: 'ALLOWED', lastSeen: '2 MINS AGO' },
  { id: 'b2', name: 'ClaudeBot', requests: 89102, status: 'BLOCKED', lastSeen: 'JUST NOW' },
  { id: 'b3', name: 'Anthropic-ai', requests: 45991, status: 'THROTTLED', lastSeen: '15 MINS AGO' },
  { id: 'b4', name: 'Bytespider', requests: 22041, status: 'ALLOWED', lastSeen: '1 HOUR AGO' },
  { id: 'b5', name: 'Amazonbot', requests: 19842, status: 'BLOCKED', lastSeen: '5 HOURS AGO' },
];
