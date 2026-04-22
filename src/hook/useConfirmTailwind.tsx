import { useState, useCallback, useMemo } from "react";
import ConfirmModalTailwind from "../component/ConfirmModalTailwind";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const useConfirmTailwind = () => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState({
      isOpen: false,
      options: null,
      resolve: null,
    });
  }, [modalState]);

  const handleCancel = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState({
      isOpen: false,
      options: null,
      resolve: null,
    });
  }, [modalState]);

  const ConfirmModal = useMemo(() => {
    if (!modalState.isOpen || !modalState.options) return null;

    return (
      <ConfirmModalTailwind
        isOpen={modalState.isOpen}
        title={modalState.options.title || "ยืนยันการดำเนินการ"}
        message={modalState.options.message}
        confirmText={modalState.options.confirmText}
        cancelText={modalState.options.cancelText}
        danger={modalState.options.danger}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [modalState.isOpen, modalState.options, handleConfirm, handleCancel]);

  return {
    confirm,
    ConfirmModal,
    isOpen: modalState.isOpen,
  };
};
