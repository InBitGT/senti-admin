import { API_BASE_URL, ENDPOINT } from "@/lib";
import { storage } from "@/lib/storage/storage";
import { useAuthStore } from "@/src/store/useAuthStore";
import { ApiResponse, LoginResponse } from "@/src/types";
import axios from "axios";

let refreshPromise: Promise<string> | null = null;

export const clearSession = async (): Promise<void> => {
  await storage.removeItem("access_token");
  await storage.removeItem("refresh_token");
  await storage.removeItem("expires_in");
  useAuthStore.getState().clearClaims();
};

export const saveSession = async (session: LoginResponse): Promise<void> => {
  await storage.setItem("access_token", session.access_token);
  if (session.refresh_token) {
    await storage.setItem("refresh_token", session.refresh_token);
  }
  if (session.expires_in) {
    await storage.setItem("expires_in", String(session.expires_in));
  }
  useAuthStore.getState().setClaims(session.access_token);
};

const requestNewToken = async (): Promise<string> => {
  try {
    const refreshToken = await storage.getItem("refresh_token");
    const claims = useAuthStore.getState().claims;

    const { data } = await axios.post<ApiResponse<LoginResponse>>(
      `${API_BASE_URL}${ENDPOINT.auth.refreshToken}`,
      { user_id: claims?.sub, refresh_token: refreshToken },
    );

    const session = data?.data;
    if (!session?.access_token) throw new Error("Refresh sin access_token");

    await saveSession(session);
    return session.access_token;
  } catch (error: unknown) {
    await clearSession();
    throw error;
  }
};

// Single-flight: todas las llamadas concurrentes comparten la misma promesa
export const refreshAccessToken = (): Promise<string> => {
  refreshPromise ??= requestNewToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};
