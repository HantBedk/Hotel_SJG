import { Building2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'

interface HotelActiveModalProps {
  readonly open: boolean
  readonly hotelName: string
  readonly onClose: () => void
}

export default function HotelActiveModal({ open, hotelName, onClose }: HotelActiveModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" ariaLabel="Hotel activo">
      <div className="px-5 pt-5 pb-2 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <Building2 size={24} aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Hotel activo
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Estás operando en
        </p>
        <p className="text-base font-semibold mt-1" style={{ color: 'var(--color-primary)' }}>
          {hotelName}
        </p>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Los datos mostrados corresponden a este establecimiento.
        </p>
      </div>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          Entendido
        </button>
      </ModalFooter>
    </Modal>
  )
}
