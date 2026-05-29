// Typed wrapper around `window.vic` (the Electron preload bridge). Falls back
// to a `unavailable` shape when running in a plain browser via `npm run dev:web`.

export interface VicWindowControls {
  minimize(): void;
  maximize(): void;
  toggleFullscreen(): void;
  close(): void;
}

export type PermissionRule = 'allow' | 'deny' | 'confirm';

export interface SystemTelemetry {
  available: boolean;
  ts?: number;
  cpu?: { manufacturer: string; brand: string; cores: number; physicalCores: number; speedGhz: number } | null;
  load?: { total: number; user: number; system: number; perCore: number[] } | null;
  memory?: { totalGb: number; usedGb: number; freeGb: number; usedPct: number } | null;
  disks?: { mount: string; type: string; sizeGb: number; usedGb: number; usedPct: number }[];
  net?: { rxPerSec: number; txPerSec: number } | null;
  battery?: { percent: number; charging: boolean; acConnected: boolean; timeRemainingMin: number } | null;
  os?: { platform: string; distro: string; release: string; arch: string; hostname: string } | null;
  gpu?: { vendor: string; model: string; vramMb: number } | null;
  uptimeSec?: number;
}

export type ObdPidName =
  | 'RPM' | 'SPEED' | 'COOLANT' | 'INTAKE' | 'FUEL_LEVEL'
  | 'BATTERY' | 'THROTTLE' | 'MAF' | 'TIMING' | 'LOAD';

export interface ObdReading { value: number; unit: string; ts: number; error?: string }
export type ObdValues = Partial<Record<ObdPidName, ObdReading>>;

export interface ObdTelemetry { ts: number; values: ObdValues }
export interface ObdStatus {
  connected: boolean;
  state?: 'connected' | 'disconnected' | 'error';
  portPath?: string | null;
  baudRate?: number | null;
  message?: string;
  lastTelemetry?: ObdValues;
}

export interface SerialPortInfo { path: string; manufacturer?: string; serialNumber?: string; pnpId?: string; vendorId?: string; productId?: string }

export interface OsWindow { handle: number; title: string; bounds: { x: number; y: number; width: number; height: number }; path: string; isVisible: boolean }
export interface OsProcess { pid: number; name: string; cmd: string; bin: string; cpu?: number }

export type IpcResult<T> = T | { error: string };

export interface VicBridge {
  permissions: {
    list(): Promise<Record<string, PermissionRule>>;
    request(id: string): Promise<boolean>;
  };
  fs: {
    readFile(path: string): Promise<IpcResult<{ contents: string; size: number; mtime: number }>>;
    writeFile(path: string, contents: string): Promise<IpcResult<{ ok: true }>>;
    deleteFile(path: string): Promise<IpcResult<{ ok: true }>>;
    list(path: string): Promise<IpcResult<{ entries: { name: string; isDirectory: boolean; isFile: boolean; isSymlink: boolean }[] }>>;
    pickFile(options?: { multiple?: boolean; filters?: { name: string; extensions: string[] }[]; defaultPath?: string }): Promise<{ canceled: true } | { paths: string[] }>;
    pickDirectory(): Promise<{ canceled: true } | { path: string }>;
    stat(path: string): Promise<IpcResult<{ size: number; mtime: number; isDirectory: boolean; isFile: boolean }>>;
  };
  apps: {
    launch(target: string, args?: string[]): Promise<IpcResult<{ ok: true; pid: number }>>;
    openPath(target: string): Promise<IpcResult<{ ok: true }>>;
    openUrl(url: string): Promise<IpcResult<{ ok: true }>>;
  };
  processes: {
    list(filter?: string): Promise<IpcResult<{ processes: OsProcess[] }>>;
    kill(pid: number, force?: boolean): Promise<IpcResult<{ ok: true }>>;
    killByName(name: string, force?: boolean): Promise<IpcResult<{ killed: { pid: number; ok: boolean; error?: string }[] }>>;
  };
  system: {
    snapshot(): Promise<SystemTelemetry | { error: string }>;
    startStream(intervalMs?: number): Promise<IpcResult<{ ok: true; intervalMs: number }>>;
    stopStream(): Promise<IpcResult<{ ok: true }>>;
    onTelemetry(listener: (data: SystemTelemetry) => void): () => void;
  };
  windows: {
    list(): Promise<IpcResult<{ windows: OsWindow[] }>>;
    focus(handle: number): Promise<IpcResult<{ ok: true }>>;
    close(handle: number): Promise<IpcResult<{ ok: true; fallback?: string }>>;
  };
  notifications: {
    send(title: string, body: string, options?: { silent?: boolean; urgency?: 'low' | 'normal' | 'critical' }): Promise<IpcResult<{ ok: true }>>;
  };
  logs: {
    rendererLog(payload: {
      level: 'debug' | 'info' | 'warn' | 'error';
      source: string;
      message: string;
      data?: unknown;
      ts?: number;
      url?: string;
      userAgent?: string;
    }): Promise<IpcResult<{ ok: true }>>;
    getPath(): Promise<IpcResult<{ path: string | null }>>;
  };
  obd: {
    listPorts(): Promise<SerialPortInfo[] | { error: string }>;
    connect(portPath?: string, baudRate?: number): Promise<IpcResult<{ ok: true; portPath: string; baudRate: number }>>;
    disconnect(): Promise<IpcResult<{ ok: true }>>;
    status(): Promise<ObdStatus>;
    readDtcs(): Promise<IpcResult<{ codes: string[] }>>;
    clearDtcs(): Promise<IpcResult<{ ok: true }>>;
    sendCommand(command: string): Promise<IpcResult<{ reply: string }>>;
    onTelemetry(listener: (data: ObdTelemetry) => void): () => void;
    onStatus(listener: (data: ObdStatus) => void): () => void;
  };
  gemini: {
    connect(): Promise<IpcResult<{ ok: true }>>;
    disconnect(): Promise<IpcResult<{ ok: true }>>;
    sendAudio(base64Audio: string): void;
    onAudio(listener: (base64Audio: string) => void): () => void;
    onStatus(listener: (status: { connected: boolean; error?: string }) => void): () => void;
    onTurnComplete(listener: () => void): () => void;
    onInterrupted(listener: () => void): () => void;
    onTranscription(listener: (text: string) => void): () => void;
    onFunctionCall(listener: (call: { name: string; args: any }) => void): () => void;
    sendFunctionResponse(payload: { name: string; response: any }): void;
  };
  command: {
    parseAndExecute(payload: { transcript: string; source?: string }): Promise<any>;
    getHistory(): Promise<{ commands: any[]; safety: any[] }>;
    clearHistory(): Promise<{ ok: true }>;
    getTypes(): Promise<string[]>;
    onResponse(listener: (entry: any) => void): () => void;
    onModeChange(listener: (data: { mode: string }) => void): () => void;
  };
  vehicleData: {
    load(): Promise<any>;
    save(data: any): Promise<{ ok: true } | { error: string }>;
    updateMileage(miles: number): Promise<{ ok: true } | { error: string }>;
  };
  carplay: {
    start(): Promise<{ ok: true; port?: number } | { error: string }>;
    stop(): Promise<{ ok: true } | { error: string }>;
    status(): Promise<{ connected: boolean; clients: number; lastCommand: any }>;
    sendToPhone(payload: any): Promise<{ ok: true } | { error: string }>;
    onCommand(listener: (cmd: any) => void): () => void;
    onStatus(listener: (status: any) => void): () => void;
  };
  agent: {
    status(): Promise<{ state: string; risk: string; lastEvent: string | null }>;
    setState(state: string): Promise<boolean>;
    triggerEvent(event: string): Promise<any>;
    evaluateRisk(risk: 'low' | 'medium' | 'high'): Promise<void>;
    generateResponse(text: string, opts?: any): Promise<string>;
    onStatus(listener: (status: any) => void): () => void;
  };
}

export function getBridge(): VicBridge | null {
  return typeof window !== 'undefined' && window.vic ? window.vic : null;
}

export function isBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.vic);
}
