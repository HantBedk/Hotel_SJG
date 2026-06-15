import { FormField } from '@/components/person/FormField'
import type { HotelSummary } from '@/types'

export function toggleHotelAssignment(
  hotelIds: string[],
  hotelId: string,
  checked: boolean,
): string[] {
  if (checked) {
    return hotelIds.includes(hotelId) ? hotelIds : [...hotelIds, hotelId]
  }
  const next = hotelIds.filter((id) => id !== hotelId)
  return next.length === 0 ? hotelIds : next
}

interface HotelAssignmentFieldProps {
  readonly idPrefix?: string
  readonly hotelIds: string[]
  readonly assignableHotels: HotelSummary[]
  readonly onHotelIdsChange: (hotelIds: string[]) => void
  readonly hint?: string
}

export function HotelAssignmentField({
  idPrefix = 'hotel',
  hotelIds,
  assignableHotels,
  onHotelIdsChange,
  hint = 'El personal solo verá datos de los hoteles seleccionados.',
}: HotelAssignmentFieldProps) {
  if (assignableHotels.length === 0) return null

  return (
    <FormField id={`${idPrefix}-hotels`} label="Hoteles asignados" required hint={hint}>
      <div
        className="space-y-1 max-h-36 overflow-y-auto rounded-lg border px-3 py-2"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-base)' }}
      >
        {assignableHotels.map((hotel) => {
          const checkboxId = `${idPrefix}-hotel-${hotel.id}`
          const checked = hotelIds.includes(hotel.id)
          const isLastSelected = checked && hotelIds.length === 1
          return (
            <label
              key={hotel.id}
              htmlFor={checkboxId}
              className="flex items-center gap-2.5 py-1.5 text-sm cursor-pointer"
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={checked}
                disabled={isLastSelected}
                onChange={(e) => onHotelIdsChange(
                  toggleHotelAssignment(hotelIds, hotel.id, e.target.checked),
                )}
              />
              <span style={{ color: 'var(--text-primary)' }}>{hotel.name}</span>
            </label>
          )
        })}
      </div>
    </FormField>
  )
}
