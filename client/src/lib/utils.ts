import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
type EnvKey =
  | "VITE_PORT"
  | "VITE_CLIENT_ID"
  | "VITE_REDIRECT_URI"
  | "VITE_OIDC_ISSUER"
  | "VITE_API_URL";

function requireEnv(key: EnvKey): string {
  const value = import.meta.env[key];

  if (!value || value.trim() === "") {
    throw new Error(`Missing Vite environment variable: ${key}`);
  }

  return value;
}

function toNumber(value: string, key: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${key} must be a number`);
  }
  return num;
}

export const ENV = {
  PORT: toNumber(requireEnv("VITE_PORT"), "VITE_PORT"),

  CLIENT_ID: requireEnv("VITE_CLIENT_ID"),
  REDIRECT_URI: requireEnv("VITE_REDIRECT_URI"),
  OIDC_ISSUER: requireEnv("VITE_OIDC_ISSUER"),
  API_URL: requireEnv("VITE_API_URL"),
} as const;

export const Apps = [
  {
    name: " One Million Checkboxes",
    description: "  Explore a massive grid of checkboxes in real-time.",
    route: "/app/checkboxes",
  },
  {
    name: "  Live Location Tracker",
    description: "Share and view real-time user locations.",
    route: "/app/location",
  },
  {
    name: "Free API apps",
    description: "A collection of apps created using freeAPI project",
    route: "/app/freeAPI",
  },
];

import { useEffect, useState } from "react";

interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  page?: number;
}

interface UsePaginatedDataOptions<T> {
  fetchFn: (params: {
    page: number;
    limit: number;
  }) => Promise<PaginatedResponse<T>>;
  initialLimit?: number;
}

export function usePaginatedData<T>({
  fetchFn,
  initialLimit = 10,
}: UsePaginatedDataOptions<T>) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchFn({ page, limit });
        if (!mounted) return;
        setItems(Array.isArray(res.data) ? res.data : []);
        setTotal(res.totalItems);
        if (typeof res.page === "number") setPage(res.page);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [page, limit]);

  return {
    items,
    loading,
    error,
    page,
    limit,
    total,
    onPageChange: (p: number) => setPage(p),
    onPageSizeChange: (s: number) => {
      setLimit(s);
      setPage(1);
    },
  };
}
