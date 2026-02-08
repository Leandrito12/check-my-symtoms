import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type PrescriptionViewerContextValue = {
  url: string | null;
  urlRef: React.RefObject<string | null>;
  setPrescriptionUrl: (url: string | null) => void;
};

const PrescriptionViewerContext = createContext<PrescriptionViewerContextValue | null>(null);

export function PrescriptionViewerProvider({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const setPrescriptionUrl = useCallback((u: string | null) => {
    urlRef.current = u;
    setUrl(u);
  }, []);
  return (
    <PrescriptionViewerContext.Provider value={{ url, urlRef, setPrescriptionUrl }}>
      {children}
    </PrescriptionViewerContext.Provider>
  );
}

export function usePrescriptionViewer() {
  const ctx = useContext(PrescriptionViewerContext);
  if (!ctx) throw new Error('usePrescriptionViewer must be used within PrescriptionViewerProvider');
  return ctx;
}
