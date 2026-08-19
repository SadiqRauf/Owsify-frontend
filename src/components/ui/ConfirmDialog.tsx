import { useState } from 'react'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/api-client'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<unknown>
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
}

/** Shared "are you sure" prompt. Keeps the dialog open if the action fails. */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
}: ConfirmDialogProps) {
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsWorking(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setIsWorking(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isWorking}>
            Cancel
          </Button>
          <Button variant={tone} onClick={handleConfirm} isLoading={isWorking}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">{description}</p>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  )
}
