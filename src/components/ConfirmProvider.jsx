import { createContext, useCallback, useContext, useState } from 'react'
import ConfirmModal from './ConfirmModal'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title ?? 'Are you sure?',
        message: options.message ?? '',
        confirmLabel: options.confirmLabel ?? 'Delete',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        onConfirm: options.onConfirm,
        onError: options.onError,
        resolve,
      })
    })
  }, [])

  function close(result) {
    dialog?.resolve(result)
    setDialog(null)
    setConfirming(false)
  }

  async function handleConfirm() {
    if (!dialog) return

    if (dialog.onConfirm) {
      setConfirming(true)
      try {
        await dialog.onConfirm()
        close(true)
      } catch (err) {
        setConfirming(false)
        dialog.onError?.(err)
      }
      return
    }

    close(true)
  }

  function handleCancel() {
    if (confirming) return
    close(false)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog ? (
        <ConfirmModal
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          loading={confirming}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return confirm
}
