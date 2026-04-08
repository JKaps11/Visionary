import { useMutation, useQuery } from "convex/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { api } from "@visionary/backend/convex/_generated/api";

import { AccentPalette, DefaultAccent, type Accent } from "@/constants/theme";

interface AccentContextValue {
  accent: Accent;
  setAccent: (accent: Accent) => void;
  palette: typeof AccentPalette;
}

const AccentContext = createContext<AccentContextValue | undefined>(undefined);

function isAccent(value: string): value is Accent {
  return (AccentPalette as readonly string[]).includes(value);
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const config = useQuery(api.config.get);
  const setAccentColor = useMutation(api.config.setAccentColor);

  const value = useMemo<AccentContextValue>(() => {
    const stored = config?.accentColor;
    const accent: Accent = stored && isAccent(stored) ? stored : DefaultAccent;
    return {
      accent,
      setAccent: (next) => {
        void setAccentColor({ accentColor: next });
      },
      palette: AccentPalette,
    };
  }, [config?.accentColor, setAccentColor]);

  return (
    <AccentContext.Provider value={value}>{children}</AccentContext.Provider>
  );
}

export function useAccent(): Accent {
  const ctx = useContext(AccentContext);
  return ctx?.accent ?? DefaultAccent;
}

export function useAccentControls(): AccentContextValue {
  const ctx = useContext(AccentContext);
  if (!ctx) {
    return {
      accent: DefaultAccent,
      setAccent: () => {},
      palette: AccentPalette,
    };
  }
  return ctx;
}
