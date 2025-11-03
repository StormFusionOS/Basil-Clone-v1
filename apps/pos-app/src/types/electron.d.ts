declare global {
  interface Window {
    electronAPI?: {
      printEscPos: (commands: string[]) => Promise<void>;
      printZpl: (commands: string[]) => Promise<void>;
      appendOffline: (record: { id: string; payload: unknown }) => Promise<void>;
      listOffline: () => Promise<Array<{ id: string; payload: string; created_at: string }>>;
      clearOffline: (id: string) => Promise<void>;
      saveCartSnapshot: (payload: unknown) => Promise<void>;
      loadCartSnapshot: () => Promise<unknown>;
    };
  }
}

export {};
