import { Minus, Plus, X } from 'lucide-react'
import type { Room, Guest, Company } from '@/types'
import { cn } from '@/lib/cn'
import { inputCls, inputStyle } from '@/pages/checkin/constants'

interface OccupancyCounterProps {
  readonly label: string
  readonly hint: string
  readonly value: number
  readonly min: number
  readonly onDecrement: () => void
  readonly onIncrement: () => void
}

export function OccupancyCounter({ label, hint, value, min, onDecrement, onIncrement }: OccupancyCounterProps) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl"
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-opacity disabled:opacity-30"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-opacity"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

interface GuestResultListProps {
  readonly guests: Guest[]
  readonly onSelect: (guest: Guest) => void
}

export function GuestResultList({ guests, onSelect }: GuestResultListProps) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
      {guests.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onSelect(g)}
          className="w-full text-left px-3 py-2 text-sm hover:opacity-80 border-b last:border-b-0"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <span className="font-medium">{g.full_name}</span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {g.document_type.toUpperCase()} {g.document_number}
          </span>
        </button>
      ))}
    </div>
  )
}

interface CompanyResultListProps {
  readonly companies: Company[]
  readonly onSelect: (company: Company) => void
}

export function CompanyResultList({ companies, onSelect }: CompanyResultListProps) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
      {companies.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c)}
          className="w-full text-left px-3 py-2 text-sm hover:opacity-80 border-b last:border-b-0"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <span className="font-medium">{c.name}</span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>NIT {c.nit}</span>
        </button>
      ))}
    </div>
  )
}

interface CompanionRowProps {
  readonly formKey: string
  readonly name: string
  readonly relationship: string
  readonly onNameChange: (value: string) => void
  readonly onRelationshipChange: (value: string) => void
  readonly onRemove: () => void
}

export function CompanionRow({ formKey, name, relationship, onNameChange, onRelationshipChange, onRemove }: CompanionRowProps) {
  return (
    <div key={formKey} className="flex gap-2 mb-2">
      <input
        placeholder="Nombre"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className={cn('flex-1', inputCls)}
        style={{ ...inputStyle, padding: '6px 12px' }}
      />
      <input
        placeholder="Parentesco"
        value={relationship}
        onChange={(e) => onRelationshipChange(e.target.value)}
        className={cn('w-28', inputCls)}
        style={{ ...inputStyle, padding: '6px 12px' }}
      />
      <button type="button" onClick={onRemove} style={{ color: 'var(--text-muted)' }}>
        <X size={14} />
      </button>
    </div>
  )
}

interface RoomPriceFieldProps {
  readonly room: Room
  readonly price: string
  readonly onPriceChange: (value: string) => void
}

export function RoomPriceField({ room, price, onPriceChange }: RoomPriceFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
        Hab. {room.number} — {room.room_type.name}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>$/noche</span>
        <input
          type="number"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          className="w-28 px-2 py-1.5 rounded-lg text-sm border text-right outline-none"
          style={inputStyle}
        />
      </div>
    </div>
  )
}
