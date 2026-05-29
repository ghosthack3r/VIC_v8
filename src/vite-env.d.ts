/// <reference types="vite/client" />

import type { VicBridge, VicWindowControls } from './pcBridge';

declare global {
  interface Window {
    vicWindow?: VicWindowControls;
    vic?: VicBridge;
  }

  interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
