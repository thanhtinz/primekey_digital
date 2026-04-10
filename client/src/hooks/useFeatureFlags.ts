import { trpc } from "@/lib/trpc";

/**
 * Hook to check if a feature is enabled.
 * Returns true by default while loading (to avoid flash of hidden content).
 */
export function useFeatureFlags() {
  const { data: flags, isLoading } = trpc.featureFlags.getAll.useQuery(undefined, {
    staleTime: 60_000, // Cache 60s
  });

  const isEnabled = (key: string): boolean => {
    if (isLoading || !flags) return false; // Default to disabled while loading to avoid flash
    const flag = flags.find((f) => f.key === key);
    return flag ? flag.enabled : true; // Default to enabled if not found in DB
  };

  return { isEnabled, isLoading, flags };
}
