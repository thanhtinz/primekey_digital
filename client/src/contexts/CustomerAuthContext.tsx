import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface CustomerInfo {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  walletBalance?: string | null;
}

interface CustomerAuthContextType {
  customer: CustomerInfo | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
  refreshCustomer: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({
  customer: null,
  token: null,
  isLoading: true,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  refreshCustomer: () => {},
});

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("customerToken"));
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const meQuery = trpc.customer.me.useQuery(
    { token: token! },
    {
      enabled: !!token,
      retry: false,
      staleTime: 60_000, // Cache for 60s - invalidate manually after avatar upload
      refetchOnWindowFocus: true,
    }
  );

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setCustomer(null);
      return;
    }
    if (meQuery.isLoading) {
      setIsLoading(true);
      return;
    }
    if (meQuery.data) {
      setCustomer({
        email: meQuery.data.email,
        name: meQuery.data.name,
        avatarUrl: (meQuery.data as any).avatarUrl || null,
        walletBalance: (meQuery.data as any).walletBalance || "0",
      });
    } else if (meQuery.error) {
      // Token invalid or expired
      localStorage.removeItem("customerToken");
      setToken(null);
      setCustomer(null);
    }
    setIsLoading(false);
  }, [token, meQuery.data, meQuery.error, meQuery.isLoading]);

  const login = useCallback((newToken: string, email: string) => {
    localStorage.setItem("customerToken", newToken);
    setToken(newToken);
    setCustomer({ email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("customerToken");
    setToken(null);
    setCustomer(null);
  }, []);

  const refreshCustomer = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        isLoggedIn: !!customer,
        login,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
