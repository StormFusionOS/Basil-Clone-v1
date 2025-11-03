/// <reference types="vite/client" />

declare global {
  interface Window {
    bookforge?: {
      version: string;
    };
  }
}

export {};
