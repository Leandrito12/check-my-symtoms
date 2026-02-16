import React, { createContext, useContext } from 'react';
import { useBreakpoint, type BreakpointInfo } from '@/src/hooks/useBreakpoint';

const BreakpointContext = createContext<BreakpointInfo | null>(null);

export function BreakpointProvider({ children }: { children: React.ReactNode }) {
  const value = useBreakpoint();
  return (
    <BreakpointContext.Provider value={value}>
      {children}
    </BreakpointContext.Provider>
  );
}

export function useBreakpointContext(): BreakpointInfo {
  const ctx = useContext(BreakpointContext);
  if (!ctx) throw new Error('useBreakpointContext must be used within BreakpointProvider');
  return ctx;
}
