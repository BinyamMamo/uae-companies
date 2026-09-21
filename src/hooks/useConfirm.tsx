import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ConfirmDialog, type ConfirmOptions } from '../components/ui/ConfirmDialog';

/**
 * `const confirm = useConfirm()` then `if (await confirm({...})) { ... }`.
 *
 * One dialog instance lives at the app root, so any component can ask for a
 * confirmation without each one wiring up its own open/close state — which is
 * what let several destructive actions ship with no confirmation at all.
 */
type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    opts =>
      new Promise<boolean>(resolve => {
        resolveRef.current = resolve;
        setOptions(opts);
      }),
    []
  );

  const settle = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <ConfirmDialog
          open
          {...options}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
};
