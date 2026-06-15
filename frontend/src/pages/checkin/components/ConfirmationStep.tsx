import { CheckCircle, User } from 'lucide-react'
import type { Room } from '@/types'
import { cn } from '@/lib/cn'
import { inputCls, inputStyle } from '@/pages/checkin/constants'
import type { WizardState } from '@/pages/checkin/types'
import {
  additionalGuestSummaryName,
  extraStepId,
  formatTotalGuestsLine,
  pendingRegistrationMessage,
  roomLabel,
} from '@/pages/checkin/wizardLogic'
import { RoomPriceField } from '@/pages/checkin/components/WizardFieldComponents'

interface ConfirmationStepProps {
  readonly rooms: Room[]
  readonly state: Pick<
    WizardState,
    'adults' | 'children' | 'isNewGuest' | 'newGuest' | 'guest' | 'additionalGuests' | 'company' | 'checkInDate' | 'checkOutDate' | 'prices' | 'notes'
  >
  readonly nights: number
  readonly totalEstimated: number
  readonly onCheckInDateChange: (value: string) => void
  readonly onCheckOutDateChange: (value: string) => void
  readonly onRoomPriceChange: (roomId: string, value: string) => void
  readonly onNotesChange: (value: string) => void
}

export function ConfirmationStep({
  rooms,
  state,
  nights,
  totalEstimated,
  onCheckInDateChange,
  onCheckOutDateChange,
  onRoomPriceChange,
  onNotesChange,
}: ConfirmationStepProps) {
  const mainName = state.isNewGuest
    ? [state.newGuest.primer_nombre, state.newGuest.segundo_nombre, state.newGuest.primer_apellido, state.newGuest.segundo_apellido].filter(Boolean).join(' ').trim() || '—'
    : (state.guest?.full_name ?? '—')
  const registeredAdditional = state.additionalGuests.filter((ag) => ag.registered)
  const allRegistered = registeredAdditional.length === state.additionalGuests.length
  const pendingCount = state.additionalGuests.length - registeredAdditional.length

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        CONFIRMACIÓN
      </p>

      <div className="p-3 rounded-lg text-sm space-y-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>{roomLabel(rooms.length)}</span>
          <span style={{ color: 'var(--text-primary)' }}>{rooms.map((r) => `Hab. ${r.number}`).join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Total huéspedes</span>
          <span style={{ color: 'var(--text-primary)' }}>{formatTotalGuestsLine(state.adults, state.children)}</span>
        </div>
        <div className="border-t pt-2 space-y-1" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <User size={12} />
            <span className="flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>{mainName}</span>
            <span>titular</span>
          </div>
          {state.additionalGuests.map((ag, i) => {
            const name = additionalGuestSummaryName(ag)
            const rowKey = ag.found?.id ?? extraStepId(i)
            return (
              <div key={rowKey} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <User size={12} />
                <span className="flex-1" style={{ color: name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {name || `Huésped ${i + 2}`}
                </span>
                {ag.registered ? (
                  <CheckCircle size={11} style={{ color: 'var(--status-available)' }} />
                ) : (
                  <span style={{ color: 'var(--color-warning, #F59E0B)' }}>pendiente</span>
                )}
              </div>
            )
          })}
        </div>
        {!allRegistered && state.additionalGuests.length > 0 && (
          <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-warning, #F59E0B)' }}>
            {pendingRegistrationMessage(pendingCount)}
          </p>
        )}
        {state.company && (
          <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--border-default)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Empresa</span>
            <span style={{ color: 'var(--text-primary)' }}>{state.company.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="checkin-datetime" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Entrada</label>
          <input
            id="checkin-datetime"
            type="datetime-local"
            value={state.checkInDate}
            onChange={(e) => onCheckInDateChange(e.target.value)}
            className={cn('w-full', inputCls)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="checkout-date" className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Salida prevista</label>
          <input
            id="checkout-date"
            type="date"
            value={state.checkOutDate}
            onChange={(e) => onCheckOutDateChange(e.target.value)}
            className={cn('w-full', inputCls)}
            style={inputStyle}
          />
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {nights} {nights === 1 ? 'noche' : 'noches'}
      </p>

      {rooms.map((room) => (
        <RoomPriceField
          key={room.id}
          room={room}
          price={state.prices[room.id] ?? ''}
          onPriceChange={(value) => onRoomPriceChange(room.id, value)}
        />
      ))}

      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total estimado</span>
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          ${totalEstimated.toLocaleString('es-CO')}
        </span>
      </div>

      <textarea
        placeholder="Observaciones (opcional)"
        value={state.notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
        style={inputStyle}
      />
    </div>
  )
}
