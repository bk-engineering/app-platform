"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AbilityProvider as CaslAbilityProvider, Can, useAbility as useCaslAbility } from "@casl/react";
import { getMe } from "./auth";
import { useSession } from "@/hooks/use-session";
import { buildAbility, type AppAbility } from "./ability";

export { Can };

// createMongoAbility([]) denies everything — the safe default while rules are still loading
const EMPTY_ABILITY = buildAbility([]);

export const useAbility = () => useCaslAbility<AppAbility>();

export function AbilityProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: session !== null,
    staleTime: 5 * 60_000,
  });

  const ability = useMemo(
    () => (me.data ? buildAbility(me.data.rules) : EMPTY_ABILITY),
    [me.data],
  );

  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>;
}
