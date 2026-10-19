import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ConfirmContext, type ConfirmOptions } from '../../context/feedbackContext';
import Icon from './Icon';
import Modal from './Modal';

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    resolver.current?.(false);
    setOptions(nextOptions);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpen(false);
  };

  const tone = options?.tone ?? 'default';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={open}
        onClose={() => close(false)}
        size="sm"
        labelledById="confirm-dialog-title"
        title={
          <span className="confirm-dialog__title">
            <span className={`confirm-dialog__icon confirm-dialog__icon--${tone}`}>
              <Icon name={tone === 'danger' ? 'alert' : 'info'} size={18} />
            </span>
            {options?.title}
          </span>
        }
        description={options?.description}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => close(false)}>
              {options?.cancelLabel ?? 'Cancel'}
            </button>
            <button
              type="button"
              className={`btn ${tone === 'danger' ? 'btn--danger-solid' : 'btn--primary'}`}
              onClick={() => close(true)}
            >
              {options?.confirmLabel ?? 'Confirm'}
            </button>
          </>
        }
      />
    </ConfirmContext.Provider>
  );
}
