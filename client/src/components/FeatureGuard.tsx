import { useEffect } from "react";
import { useLocation } from "wouter";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Loader2 } from "lucide-react";

interface FeatureGuardProps {
  featureKey: string;
  children: React.ReactNode;
  /** Redirect to this path when feature is disabled. Defaults to "/" */
  redirectTo?: string;
}

/**
 * Blocks access to a route when the feature flag is disabled.
 * Redirects to `redirectTo` (default: "/") instead of showing a 404.
 * While loading flags, shows a spinner to avoid flash of content.
 */
export function FeatureGuard({ featureKey, children, redirectTo = "/" }: FeatureGuardProps) {
  const { isEnabled, isLoading } = useFeatureFlags();
  const [, setLocation] = useLocation();

  const enabled = isEnabled(featureKey);

  useEffect(() => {
    if (!isLoading && !enabled) {
      setLocation(redirectTo);
    }
  }, [isLoading, enabled, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!enabled) {
    return null;
  }

  return <>{children}</>;
}
