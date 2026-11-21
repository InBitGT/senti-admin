const isBrowser = typeof window !== "undefined";

// Misma API async que senti-app, respaldada por localStorage (no-op en el servidor).
export const storage = {
  async getItem(name: string): Promise<string | null> {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  async setItem(name: string, value: string): Promise<void> {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // storage bloqueado (modo privado, etc.)
    }
  },
  async removeItem(name: string): Promise<void> {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // storage bloqueado (modo privado, etc.)
    }
  },
};
