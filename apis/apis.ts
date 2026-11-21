import { API_BASE_URL, API_TIMEOUT } from "@/lib";
import { refreshAccessToken } from "@/lib/auth/refreshToken";
import { storage } from "@/lib/storage/storage";
import { ApiResponse } from "@/src/types";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError: unknown) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);


const handleRequest = async <T>(
  request: Promise<AxiosResponse<ApiResponse<T>>>,
): Promise<ApiResponse<T>> => {
  try {
    const response = await request;
    return {
      code: String(response.data.code),
      message: response.data.message || "Success",
      data: response.data.data,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError<ApiResponse<T>>(error)) {
      return {
        code: String(error.response?.status ?? 500),
        message:
          error.response?.data?.message ||
          error.message ||
          "An error occurred",
        data: null as T,
      };
    }
    return {
      code: "500",
      message: error instanceof Error ? error.message : "An error occurred",
      data: null as T,
    };
  }
};

export const get = async <T>(url: string): Promise<ApiResponse<T>> =>
  handleRequest<T>(api.get<ApiResponse<T>>(url));

export const post = async <TResponse, TBody = unknown>(
  url: string,
  data: TBody,
): Promise<ApiResponse<TResponse>> =>
  handleRequest<TResponse>(api.post<ApiResponse<TResponse>>(url, data));

export const put = async <TResponse, TBody = unknown>(
  url: string,
  data: TBody,
): Promise<ApiResponse<TResponse>> =>
  handleRequest<TResponse>(api.put<ApiResponse<TResponse>>(url, data));

export const patch = async <TResponse, TBody = unknown>(
  url: string,
  data: TBody,
): Promise<ApiResponse<TResponse>> =>
  handleRequest<TResponse>(api.patch<ApiResponse<TResponse>>(url, data));

export const remove = async <T>(url: string): Promise<ApiResponse<T>> =>
  handleRequest<T>(api.delete<ApiResponse<T>>(url));
