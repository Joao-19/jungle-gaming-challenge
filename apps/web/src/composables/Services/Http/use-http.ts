import { useCallback, useState } from "react";
import { type AxiosResponse } from "axios";

// --- Axios Configuration (Moved from lib/api.ts) ---

// --- Axios Configuration (Moved from lib/api.ts) ---

import http from "./index";

export const axiosInstance = http;

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Fix: Authorization header
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("Sem refresh token");

        const { data } = await http.post("/auth/refresh", {
          refreshToken,
        });

        localStorage.setItem("auth_token", data.accessToken);
        localStorage.setItem("refresh_token", data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// --- Hook Implementation ---

export interface ApiError {
  message: string;
  response?: {
    status: number;
    data: any;
  };
}

export interface ListResult<T> {
  page: number;
  total: number;
  rows: T[];
  totalPages: number;
  pageSize: number;
}

/**
 * Hook base para requisições HTTP
 * Gerencia estado de loading, erro e dados.
 *
 * @param apiFunction Função que realiza a chamada à API
 * @param defaultValue Valor inicial para os dados
 */
export function useBaseHttp<Response, Form, DefaultValue>(
  apiFunction: (form: Form) => Promise<AxiosResponse<Response> | Response>,
  defaultValue: DefaultValue
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<Response | DefaultValue>(defaultValue);

  const request = useCallback(
    async (form: Form): Promise<Response> => {
      setLoading(true);
      setError(null);
      try {
        // A autenticação agora é tratada automaticamente pelo interceptor acima.

        const res = await apiFunction(form);

        // Verifica se é uma resposta do Axios (tem 'data' e 'headers') ou direto o dado
        if (
          res &&
          typeof res === "object" &&
          "data" in res &&
          "headers" in res
        ) {
          const axiosRes = res as AxiosResponse<Response>;
          setData(axiosRes.data);
          return axiosRes.data;
        }

        // Caso a função api retorne o dado direto
        const responseData = res as Response;
        setData(responseData);
        return responseData;
      } catch (e: any) {
        const apiError: ApiError = {
          message: e.message || "Erro desconhecido",
          response: e.response,
        };
        setError(apiError);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return {
    request,
    loading,
    error,
    data,
  };
}

/**
 * Hook para requisições que retornam um único objeto (ou nulo/vazio)
 */
export function useHttp<Response, Form>(
  apiFunction: (form: Form) => Promise<AxiosResponse<Response> | Response>
) {
  return useBaseHttp<Response, Form, Response | null>(apiFunction, null);
}

/**
 * Hook para requisições que retornam uma lista simples (array)
 */
export function useHttpList<Response, Form>(
  apiFunction: (form: Form) => Promise<AxiosResponse<Response> | Response>
) {
  return useBaseHttp<Response, Form, Response[]>(apiFunction, []);
}

/**
 * Hook para requisições paginadas
 */
export function useHttpPaginate<Response, Form>(
  apiFunction: (
    form: Form
  ) => Promise<AxiosResponse<ListResult<Response>> | ListResult<Response>>
) {
  return useBaseHttp<ListResult<Response>, Form, ListResult<Response>>(
    apiFunction,
    {
      page: 0,
      total: 0,
      rows: [],
      totalPages: 0,
      pageSize: 0,
    }
  );
}
