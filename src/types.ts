export type ModeId = 'driving' | 'nav' | 'parked' | 'diagnostics' | 'system' | 'ambient';

export type CoreState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type PaletteId = 'cyan' | 'amber' | 'phosphor' | 'mono' | 'redwar';

export type Priority = 'high' | 'med' | 'low';

export type NoteKind = 'ISSUE' | 'MAINTENANCE' | 'TRIP' | 'NOTE';

export type PartStatus = 'ON-ORDER' | 'PLANNED' | 'IN-STOCK';

export interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  shortName: string;
  vin: string;
  plate: string;
  mileage: number;
  nextService: number;
  engine: string;
  trans: string;
}

export interface Telemetry {
  battery: number;
  coolant: number;
  oilPressure: number;
  fuel: number;
  rpm: number;
  speed: number;
  intake: number;
  ambient: number;
  tirePsi: [number, number, number, number];
  engine: 'off' | 'idle' | 'running';
  obd: 'connected' | 'disconnected';
  lastObd: string;
}

export interface CountSummary {
  openIssues: number;
  pendingTasks: number;
  trackedParts: number;
  trips: number;
  logsThisWeek: number;
}

export interface VehicleNote {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  when: string;
  priority: Priority;
}

export interface VehicleTask {
  id: string;
  title: string;
  detail: string;
  due: string;
  priority: Priority;
  tag: string;
}

export interface VehiclePart {
  id: string;
  name: string;
  status: PartStatus;
  vendor: string;
  eta: string;
  cost: number;
}

export interface TranscriptMessage {
  who: 'vic' | 'driver';
  text: string;
  t: string;
}

export interface EventLogItem {
  t: string;
  tag: 'SYS' | 'NET' | 'DATA' | 'TOOL' | 'VOICE' | 'OBD';
  text: string;
}

export interface ModeOption {
  id: ModeId;
  label: string;
  glyph: string;
}

export type IconName =
  | 'alert'
  | 'bell'
  | 'file'
  | 'box'
  | 'gauge'
  | 'nav'
  | 'mic'
  | 'power'
  | 'car'
  | 'close'
  | 'min'
  | 'max'
  | 'sparkles'
  | 'wrench'
  | 'plus'
  | 'route'
  | 'signal'
  | 'cpu'
  | 'hdd'
  | 'map'
  | 'search'
  | 'plug'
  | 'reload';

export interface QuickAction {
  id: string;
  label: string;
  icon: IconName;
  hotkey: string;
}

export interface VicData {
  vehicle: VehicleInfo;
  telemetry: Telemetry;
  counts: CountSummary;
  notes: VehicleNote[];
  tasks: VehicleTask[];
  parts: VehiclePart[];
  transcript: TranscriptMessage[];
  eventLog: EventLogItem[];
  modes: ModeOption[];
  quickActions: QuickAction[];
}

export interface TweakSettings {
  palette: PaletteId;
  grid: boolean;
  scanlines: boolean;
  chrome: boolean;
  tabletMode: boolean;
}
