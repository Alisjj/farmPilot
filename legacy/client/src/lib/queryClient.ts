import { QueryClient, QueryFunction } from "@tanstack/react-query";

// --- Token refresh logic ---
let refreshInFlight: Promise<boolean> | null = null;
async function attemptRefresh(): Promise<boolean> {
    try {
        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) return false;
        return true;
    } catch {
        return false;
    }
}

async function fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit) {
    const exec = async () => fetch(input, { ...init, credentials: "include" });

    let res = await exec();
    if (res.status !== 401) return res;

    // Avoid refreshing for the refresh endpoint itself
    const urlStr = typeof input === "string" ? input : input.toString();
    if (urlStr.includes("/api/auth/refresh")) {
        return res; // propagate 401
    }

    if (!refreshInFlight) {
        refreshInFlight = attemptRefresh().finally(() => {
            // slight delay to allow cookie write ordering in some browsers
            setTimeout(() => (refreshInFlight = null), 0);
        });
    }
    const refreshed = await refreshInFlight;
    if (!refreshed) return res; // still 401

    // Retry original
    res = await exec();
    return res;
}

async function throwIfResNotOk(res: Response) {
    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}

export async function apiRequest(
    method: string,
    url: string,
    data?: unknown | undefined
): Promise<Response>;
export async function apiRequest(url: string): Promise<any>;
export async function apiRequest(
    methodOrUrl: string,
    url?: string,
    data?: unknown | undefined
): Promise<Response | any> {
    // GET overload
    if (!url) {
        const res = await fetchWithRefresh(methodOrUrl, { method: "GET" });
        await throwIfResNotOk(res);
        const ct = res.headers.get("content-type") || "";
        return ct.includes("application/json")
            ? await res.json()
            : await res.text();
    }

    // Mutations / custom method
    const res = await fetchWithRefresh(url, {
        method: methodOrUrl,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
    });

    await throwIfResNotOk(res);
    return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
    on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
    ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
        const key = queryKey.join("/");
        const res = await fetchWithRefresh(key);

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
            return null as any;
        }

        await throwIfResNotOk(res);
        return await res.json();
    };

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
