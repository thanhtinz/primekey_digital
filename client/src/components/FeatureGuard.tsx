import { useEffect } from "react";
import { useLocation } from "wouter";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Loader2 } from "@/components/Icon";

interface FeatureGuardProps {
  featureKey: string;
  children: React.ReactNode;
  /** Redirect to this path when feature is disabled. Defaults to "/" */
  redirectTo?: string;
}

/**
 * Blocks access to a route when the feature flag is disabled.
 * - While loading: shows spinner (prevents flash of disabled content)
 * - When disabled: redirects to `redirectTo` (default: "/")
 * - When enabled: renders children
 */
export function FeatureGuard({ featureKey, children, redirectTo = "/" }: FeatureGuardProps) {
  const { flags, isLoading } = useFeatureFlags();
  const [, setLocation] = useLocation();

  // Compute enabled only when flags are loaded (not default-true during loading)
  const enabled = isLoading || !flags
    ? null  // null = still loading
    : (() => {
        const flag = flags.find((f) => f.key === featureKey);
        return flag ? flag.enabled : true; // default enabled if not in DB
      })();

  useEffect(() => {
    if (enabled === false) {
      setLocation(redirectTo);
    }
  }, [enabled, redirectTo, setLocation]);

  // Show spinner while loading or while redirect is pending
  if (enabled === null || enabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return <>{children}</>;
}
