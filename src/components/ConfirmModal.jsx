import { useEffect } from 'react'
import { Spinner } from './Button'
import './button.css'
import './confirm-modal.css'

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, loading])

  return (
    <div className="modalOverlay" onClick={loading ? undefined : onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title">{title}</h3>
        {message ? <p className="modalMessage">{message}</p> : null}
        <div className="modalActions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="modalConfirm"
            onClick={onConfirm}
            disabled={loading}
          >
            <span className="btnContent">
              {loading ? <Spinner size={14} /> : null}
              {loading ? 'Deleting…' : confirmLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
