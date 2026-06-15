import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Download, ExternalLink, Loader2, CheckCircle2, Minus } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { MinibarItem, StayAccount, Stay, MinibarConsumptionType, StayRoom } from '@/types'
import { addMinibarChargesApi, checkoutStayApi, addPaymentApi, getStayAccountApi, downloadStayReceiptApi } from '@/services/stays.service'
import { useRoomMinibars } from '@/hooks/useInventory'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/cn'

interface CheckoutWizardProps {
  readonly stay: Stay
  readonly onClose: () => void
  readonly onSuccess: () => void
}

type Step = 'minibar' | 'cuenta' | 'pago' | 'done'
type PickedItems = Record<string, MinibarItem>
type ManualMinibarRow = MinibarItem & { rowKey: string }

type PdfIncludeKey = 'rooms' | 'services' | 'minibar' | 'late_fee'
type PdfIncludeState = Record<PdfIncludeKey, boolean>

const MINIBAR_TYPES: ReadonlyArray<{ readonly value: MinibarConsumptionType; readonly label: string }> = [
  { value: 'consumed', label: 'Consumido' },
  { value: 'damaged', label: 'Dañado' },
  { value: 'missing', label: 'Faltante' },
]

const WIZARD_STEPS: ReadonlyArray<{ readonly id: Step; readonly label: string }> = [
  { id: 'minibar', label: 'Minibar' },
  { id: 'cuenta', label: 'Cuenta' },
  { id: 'pago', label: 'Pago' },
]

const PDF_INCLUDE_OPTIONS: ReadonlyArray<{ readonly key: PdfIncludeKey; readonly label: string }> = [
  { key: 'rooms', label: 'Habitaciones' },
  { key: 'services', label: 'Servicios' },
  { key: 'minibar', label: 'Minibar' },
  { key: 'late_fee', label: 'Cargo late checkout' },
]

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

function pickedKey(roomId: string, productId: string): string {
  return `${roomId}::${productId}`
}

function parseMinibarConsumptionType(value: string): MinibarConsumptionType {
  if (value === 'consumed' || value === 'damaged' || value === 'missing') return value
  return 'consumed'
}

function parseQuantityInput(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return fallback
  return parsed
}

function parseAmountInput(value: string): number {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) return 0
  return parsed
}

function balanceTextColor(balance: number): string {
  if (balance > 0) return 'var(--status-occupied)'
  return 'var(--status-available)'
}

function minibarContinueLabel(pending: boolean): string {
  if (pending) return ''
  return 'Continuar'
}

function confirmCheckoutLabel(busy: boolean): string {
  if (busy) return ''
  return 'Confirmar checkout'
}

function accountRoomKey(room: StayAccount['rooms'][number], index: number): string {
  return `account-room-${room.room_number}-${room.room_type}-${index}`
}

function accountServiceKey(service: StayAccount['services'][number], index: number): string {
  return `account-service-${service.name}-${service.quantity}-${index}`
}

function accountMinibarKey(item: StayAccount['minibar'][number], index: number): string {
  return `account-minibar-${item.product_name}-${item.type}-${item.quantity}-${index}`
}

function createManualRow(defaultRoomId: string): ManualMinibarRow {
  return {
    rowKey: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    product_name: '',
    room_id: defaultRoomId,
    type: 'consumed',
    quantity: 1,
    unit_price: 0,
  }
}

function toMinibarItem(row: ManualMinibarRow): MinibarItem {
  return {
    product_name: row.product_name,
    room_id: row.room_id,
    type: row.type,
    quantity: row.quantity,
    unit_price: row.unit_price,
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  globalThis.URL.revokeObjectURL(url)
}

function openBlobInNewTab(blob: Blob): void {
  const url = globalThis.URL.createObjectURL(blob)
  globalThis.open(url, '_blank')
}

interface RoomMinibarPickerProps {
  readonly stayRoom: StayRoom
  readonly showRoomHeader: boolean
  readonly pickedItems: PickedItems
  readonly onChangePicked: React.Dispatch<React.SetStateAction<PickedItems>>
}

function RoomMinibarPicker({ stayRoom, showRoomHeader, pickedItems, onChangePicked }: RoomMinibarPickerProps) {
  const { data: rows = [], isLoading } = useRoomMinibars(stayRoom.room_id)

  const setQty = (productId: string, productName: string, salePrice: number, qty: number, type: MinibarConsumptionType) => {
    const key = pickedKey(stayRoom.room_id, productId)
    onChangePicked((prev) => {
      if (qty <= 0) {
        const { [key]: _removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [key]: {
          product_name: productName,
          room_id: stayRoom.room_id,
          type,
          quantity: qty,
          unit_price: salePrice,
        },
      }
    })
  }

  const setType = (productId: string, productName: string, salePrice: number, type: MinibarConsumptionType) => {
    const key = pickedKey(stayRoom.room_id, productId)
    const current = pickedItems[key]
    if (!current) return
    onChangePicked((prev) => ({
      ...prev,
      [key]: { ...prev[key], type, product_name: productName, unit_price: salePrice },
    }))
  }

  if (isLoading) {
    return (
      <div className="rounded-xl p-4 text-xs"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
        Cargando minibar de Hab. {stayRoom.room?.number}…
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl p-4 text-xs"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
        {showRoomHeader && <span className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Hab. {stayRoom.room?.number}</span>}
        La habitación no tiene productos asignados en su minibar.
      </div>
    )
  }

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
      {showRoomHeader && (
        <div className="px-3 py-2 border-b text-xs font-semibold uppercase tracking-wider"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
          Minibar Hab. {stayRoom.room?.number}
        </div>
      )}
      <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
        {rows.map((rm) => {
          const productId = rm.minibar_product_id
          const productName = rm.product?.name ?? '—'
          const salePrice = Number(rm.product?.sale_price ?? 0)
          const available = rm.quantity
          const key = pickedKey(stayRoom.room_id, productId)
          const current = pickedItems[key]
          const consumedQty = current?.quantity ?? 0
          const type = current?.type ?? 'consumed'
          const exceeded = consumedQty > available
          const qtyInputId = `minibar-qty-${stayRoom.room_id}-${productId}`

          return (
            <div key={rm.id} className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{productName}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  En minibar: <span className="tabular-nums">{available}</span>
                  {' · '}Precio: <span className="tabular-nums">{formatCurrency(salePrice)}</span>
                </p>
                {exceeded && (
                  <p className="text-[11px]" style={{ color: '#EF4444' }}>
                    El consumo ({consumedQty}) supera lo asignado al minibar ({available}).
                  </p>
                )}
              </div>

              <select
                value={type}
                onChange={(e) => setType(productId, productName, salePrice, parseMinibarConsumptionType(e.target.value))}
                disabled={consumedQty === 0}
                className="px-2 py-1.5 rounded-lg text-xs border outline-none disabled:opacity-50"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                aria-label={`Tipo de consumo para ${productName}`}
              >
                {MINIBAR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQty(productId, productName, salePrice, Math.max(0, consumedQty - 1), type)}
                  disabled={consumedQty <= 0}
                  className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-40"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  aria-label="Restar"
                >
                  <Minus size={12} />
                </button>
                <input
                  id={qtyInputId}
                  type="number"
                  min={0}
                  value={consumedQty}
                  onChange={(e) => setQty(productId, productName, salePrice, parseQuantityInput(e.target.value), type)}
                  className="w-12 text-center px-1 py-1 rounded-md text-sm border outline-none"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid ' + (exceeded ? '#EF4444' : 'var(--border-default)'),
                    color: 'var(--text-primary)',
                  }}
                  aria-label={`Cantidad consumida de ${productName}`}
                />
                <button
                  type="button"
                  onClick={() => setQty(productId, productName, salePrice, consumedQty + 1, type)}
                  className="w-7 h-7 rounded-md border flex items-center justify-center"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                  aria-label="Sumar"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ManualMinibarSectionProps {
  readonly manualItems: ManualMinibarRow[]
  readonly activeRooms: StayRoom[]
  readonly onAdd: () => void
  readonly onRemove: (rowKey: string) => void
  readonly onUpdate: (rowKey: string, field: keyof MinibarItem, value: string | number) => void
}

function ManualMinibarSection({ manualItems, activeRooms, onAdd, onRemove, onUpdate }: ManualMinibarSectionProps) {
  return (
    <>
      {manualItems.length > 0 && (
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Otros consumos manuales
        </p>
      )}

      {manualItems.map((item) => (
        <div key={item.rowKey} className="grid gap-2 rounded-xl p-3 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', gridTemplateColumns: '1fr auto auto auto auto auto' }}>
          <input
            placeholder="Producto"
            value={item.product_name}
            onChange={(e) => onUpdate(item.rowKey, 'product_name', e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            aria-label="Nombre del producto manual"
          />
          {activeRooms.length > 1 && (
            <select
              value={item.room_id}
              onChange={(e) => onUpdate(item.rowKey, 'room_id', e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              aria-label="Habitación del consumo manual"
            >
              {activeRooms.map((sr) => (
                <option key={sr.room_id} value={sr.room_id}>Hab. {sr.room?.number}</option>
              ))}
            </select>
          )}
          <select
            value={item.type}
            onChange={(e) => onUpdate(item.rowKey, 'type', parseMinibarConsumptionType(e.target.value))}
            className="px-2 py-1.5 rounded-lg text-xs border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            aria-label="Tipo de consumo manual"
          >
            {MINIBAR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            type="number"
            min={1}
            placeholder="Cant."
            value={item.quantity}
            onChange={(e) => onUpdate(item.rowKey, 'quantity', parseQuantityInput(e.target.value, 1))}
            className="w-14 px-2 py-1.5 rounded-lg text-xs border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            aria-label="Cantidad del consumo manual"
          />
          <input
            type="number"
            placeholder="Precio unit."
            value={item.unit_price || ''}
            readOnly
            tabIndex={-1}
            title="El precio se toma del producto del catálogo y no puede modificarse aquí."
            className="w-24 px-2 py-1.5 rounded-lg text-xs border outline-none cursor-not-allowed"
            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
            aria-label="Precio unitario del consumo manual"
          />
          <button
            type="button"
            onClick={() => onRemove(item.rowKey)}
            className="p-1.5 rounded-lg hover:opacity-70"
            style={{ color: 'var(--status-occupied)' }}
            aria-label="Eliminar consumo manual"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border hover:opacity-80"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
      >
        <Plus size={13} /> Agregar consumo manual
      </button>
    </>
  )
}

interface MinibarStepProps {
  readonly minibarSubmitted: boolean
  readonly activeRooms: StayRoom[]
  readonly pickedItems: PickedItems
  readonly manualItems: ManualMinibarRow[]
  readonly onChangePicked: React.Dispatch<React.SetStateAction<PickedItems>>
  readonly onAddManual: () => void
  readonly onRemoveManual: (rowKey: string) => void
  readonly onUpdateManual: (rowKey: string, field: keyof MinibarItem, value: string | number) => void
}

function MinibarStep({
  minibarSubmitted, activeRooms, pickedItems, manualItems,
  onChangePicked, onAddManual, onRemoveManual, onUpdateManual,
}: MinibarStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Marca lo que el huésped consumió de cada minibar antes del checkout. Puedes omitir si no aplica.
      </p>

      {minibarSubmitted && (
        <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
          Consumos ya enviados al servidor.
        </div>
      )}

      {!minibarSubmitted && (
        <>
          {activeRooms.map((sr) => (
            <RoomMinibarPicker
              key={sr.room_id}
              stayRoom={sr}
              showRoomHeader={activeRooms.length > 1}
              pickedItems={pickedItems}
              onChangePicked={onChangePicked}
            />
          ))}
          <ManualMinibarSection
            manualItems={manualItems}
            activeRooms={activeRooms}
            onAdd={onAddManual}
            onRemove={onRemoveManual}
            onUpdate={onUpdateManual}
          />
        </>
      )}
    </div>
  )
}

interface AccountDetailsProps {
  readonly account: StayAccount
  readonly lateFee: string
  readonly baseTotal: number
  readonly ivaAmount: number
  readonly computedTotal: number
  readonly balance: number
  readonly onLateFeeChange: (value: string) => void
}

function AccountDetails({
  account, lateFee, baseTotal, ivaAmount, computedTotal, balance, onLateFeeChange,
}: AccountDetailsProps) {
  return (
    <>
      {account.rooms.some((room) => room.is_active) && (
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Habitaciones</p>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-default)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-input)' }}>
                  <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Hab.</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>$/noche</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Noches</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {account.rooms.filter((room) => room.is_active).map((room, index) => (
                  <tr key={accountRoomKey(room, index)} style={{ borderTop: '1px solid var(--border-default)' }}>
                    <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{room.room_number} — {room.room_type}</td>
                    <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(room.price_per_night)}</td>
                    <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{room.nights}</td>
                    <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(room.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {account.services.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Servicios extra</p>
          <div className="space-y-1">
            {account.services.map((service, index) => (
              <div key={accountServiceKey(service, index)} className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>{service.name} × {service.quantity}</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(service.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {account.minibar.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Minibar</p>
          <div className="space-y-1">
            {account.minibar.map((item, index) => (
              <div key={accountMinibarKey(item, index)} className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>{item.product_name} × {item.quantity} ({item.type})</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="checkout-late-fee" className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
          Cargo late checkout (opcional)
        </label>
        <input
          id="checkout-late-fee"
          type="number"
          min={0}
          placeholder="0"
          value={lateFee}
          onChange={(e) => onLateFeeChange(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg text-sm border outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="rounded-xl p-4 space-y-1.5" style={{ background: 'var(--bg-input)' }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
          <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(baseTotal)}</span>
        </div>
        {account.iva_pct > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>IVA ({account.iva_pct}%)</span>
            <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(ivaAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <span style={{ color: 'var(--text-primary)' }}>TOTAL</span>
          <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(computedTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Pagado</span>
          <span style={{ color: 'var(--status-available)' }}>{formatCurrency(account.paid_amount)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span style={{ color: 'var(--text-secondary)' }}>Saldo pendiente</span>
          <span style={{ color: balanceTextColor(balance) }}>
            {formatCurrency(balance)}
          </span>
        </div>
      </div>
    </>
  )
}

interface AccountStepProps {
  readonly accountLoading: boolean
  readonly account: StayAccount | undefined
  readonly lateFee: string
  readonly baseTotal: number
  readonly ivaAmount: number
  readonly computedTotal: number
  readonly balance: number
  readonly onLateFeeChange: (value: string) => void
}

function AccountStep(props: AccountStepProps) {
  if (props.accountLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }
  if (!props.account) return null
  return <AccountDetails {...props} account={props.account} />
}

interface PaymentStepProps {
  readonly computedTotal: number
  readonly paidAmount: number
  readonly balance: number
  readonly payAmount: string
  readonly payMethod: string
  readonly payBy: string
  readonly hasCompany: boolean
  readonly onPayAmountChange: (value: string) => void
  readonly onPayMethodChange: (value: string) => void
  readonly onPayByChange: (value: string) => void
}

function PaymentStep({
  computedTotal, paidAmount, balance, payAmount, payMethod, payBy, hasCompany,
  onPayAmountChange, onPayMethodChange, onPayByChange,
}: PaymentStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 space-y-1.5 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
        <div className="flex justify-between text-sm font-bold">
          <span style={{ color: 'var(--text-secondary)' }}>Total a pagar</span>
          <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(computedTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Pagado</span>
          <span style={{ color: 'var(--status-available)' }}>{formatCurrency(paidAmount)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t pt-1" style={{ borderColor: 'var(--border-default)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Saldo</span>
          <span style={{ color: balanceTextColor(balance) }}>
            {formatCurrency(balance)}
          </span>
        </div>
      </div>

      {balance > 0 ? (
        <div className="space-y-2 rounded-xl p-4 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Registrar pago del saldo
          </p>
          <input
            id="checkout-pay-amount"
            type="number"
            min={0}
            placeholder="Monto"
            value={payAmount}
            onChange={(e) => onPayAmountChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            aria-label="Monto del pago"
          />
          <div className={hasCompany ? 'grid grid-cols-2 gap-2' : ''}>
            <select
              id="checkout-pay-method"
              value={payMethod}
              onChange={(e) => onPayMethodChange(e.target.value)}
              className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              aria-label="Método de pago"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
              <option value="credito">Crédito</option>
            </select>
            {hasCompany && (
              <select
                id="checkout-pay-by"
                value={payBy}
                onChange={(e) => onPayByChange(e.target.value)}
                className="px-2 py-2 rounded-lg text-xs border outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                aria-label="Pagado por"
              >
                <option value="guest">Huésped</option>
                <option value="company">Empresa</option>
                <option value="mixed">Mixto</option>
              </select>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm rounded-xl p-3 text-center"
          style={{ background: 'var(--bg-input)', color: 'var(--status-available)' }}>
          Sin saldo pendiente — estadía saldada.
        </p>
      )}

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        El checkout se registrará con la hora actual: {formatDate(new Date().toISOString())}
      </p>
    </div>
  )
}

interface DoneStepProps {
  readonly guestName: string
  readonly pdfInclude: PdfIncludeState
  readonly onPdfIncludeChange: (key: PdfIncludeKey, checked: boolean) => void
  readonly onViewReceipt: () => void
  readonly onDownloadReceipt: () => void
  readonly onClose: () => void
}

function DoneStep({
  guestName, pdfInclude, onPdfIncludeChange, onViewReceipt, onDownloadReceipt, onClose,
}: DoneStepProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-8">
      <CheckCircle2 size={48} style={{ color: 'var(--status-available)' }} />
      <div className="text-center">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Checkout completado</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {guestName} ha sido registrado como salida.
        </p>
      </div>

      <fieldset className="w-full max-w-md rounded-xl border px-4 py-3 m-0 min-w-0" style={{ borderColor: 'var(--border-default)' }}>
        <legend className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Conceptos en el comprobante
        </legend>
        <div className="grid grid-cols-2 gap-1.5 text-sm">
          {PDF_INCLUDE_OPTIONS.map(({ key, label }) => (
            <label key={key} htmlFor={`pdf-include-${key}`} className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-primary)' }}>
              <input
                id={`pdf-include-${key}`}
                type="checkbox"
                checked={pdfInclude[key]}
                onChange={(e) => onPdfIncludeChange(key, e.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onViewReceipt}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border hover:opacity-80"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <ExternalLink size={15} /> Ver PDF
        </button>
        <button
          type="button"
          onClick={onDownloadReceipt}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Download size={15} /> Descargar PDF
        </button>
      </div>

      <button type="button" onClick={onClose} className="text-sm hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
        Cerrar
      </button>
    </div>
  )
}

interface CheckoutStepIndicatorProps {
  readonly currentStep: Step
}

function CheckoutStepIndicator({ currentStep }: CheckoutStepIndicatorProps) {
  const stepIdx = WIZARD_STEPS.findIndex((wizardStep) => wizardStep.id === currentStep)

  return (
    <div className="flex items-center gap-0 px-6 pt-4 pb-1 flex-shrink-0">
      {WIZARD_STEPS.map((wizardStep, index) => (
        <div key={wizardStep.id} className="flex items-center gap-0">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: stepIdx >= index ? 'var(--color-primary)' : 'var(--bg-input)',
                color: stepIdx >= index ? '#fff' : 'var(--text-muted)',
              }}
            >
              {index + 1}
            </div>
            <span className="text-xs" style={{ color: stepIdx === index ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {wizardStep.label}
            </span>
          </div>
          {index < WIZARD_STEPS.length - 1 && (
            <div className="w-8 h-px mx-2" style={{ background: 'var(--border-default)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

interface CheckoutWizardFooterProps {
  readonly step: Step
  readonly isBusy: boolean
  readonly accountLoading: boolean
  readonly minibarPending: boolean
  readonly onBack: () => void
  readonly onMinibarNext: () => void
  readonly onAccountNext: () => void
  readonly onConfirm: () => void
}

function CheckoutWizardFooter({
  step, isBusy, accountLoading, minibarPending, onBack, onMinibarNext, onAccountNext, onConfirm,
}: CheckoutWizardFooterProps) {
  return (
    <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
      {step !== 'minibar' && (
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className="px-4 py-2 rounded-xl text-sm border disabled:opacity-40 hover:opacity-80"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Anterior
        </button>
      )}

      <div className="flex-1" />

      {step === 'minibar' && (
        <button
          type="button"
          onClick={onMinibarNext}
          disabled={isBusy}
          className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-80"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          {minibarPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : minibarContinueLabel(minibarPending)}
        </button>
      )}

      {step === 'cuenta' && (
        <button
          type="button"
          onClick={onAccountNext}
          disabled={accountLoading}
          className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-80"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Siguiente
        </button>
      )}

      {step === 'pago' && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={isBusy}
          className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-80"
          style={{ background: 'var(--status-occupied)', color: '#fff' }}
        >
          {isBusy ? <Loader2 size={14} className="animate-spin mx-auto" /> : confirmCheckoutLabel(isBusy)}
        </button>
      )}
    </div>
  )
}

export function CheckoutWizard({ stay, onClose, onSuccess }: CheckoutWizardProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('minibar')
  const [pickedItems, setPickedItems] = useState<PickedItems>({})
  const [manualItems, setManualItems] = useState<ManualMinibarRow[]>([])
  const [minibarSubmitted, setMinibarSubmitted] = useState(false)
  const [lateFee, setLateFee] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payBy, setPayBy] = useState('guest')
  const [payAmount, setPayAmount] = useState('')
  const [receiptStayId, setReceiptStayId] = useState<string | null>(null)
  const [pdfInclude, setPdfInclude] = useState<PdfIncludeState>({
    rooms: true,
    services: true,
    minibar: true,
    late_fee: true,
  })

  const activeRooms = stay.stay_rooms?.filter((sr) => sr.is_active) ?? []
  const defaultRoomId = activeRooms[0]?.room_id ?? ''
  const minibarItems: MinibarItem[] = [
    ...Object.values(pickedItems),
    ...manualItems.map(toMinibarItem),
  ]

  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = useQuery<StayAccount>({
    queryKey: ['stay-account', stay.id],
    queryFn: () => getStayAccountApi(stay.id),
    enabled: step === 'cuenta' || step === 'pago',
    staleTime: 0,
  })

  const lateFeeNum = parseAmountInput(lateFee)
  const baseTotal = account ? account.subtotal - account.late_checkout_fee + lateFeeNum : 0
  const ivaAmount = account ? Math.round(baseTotal * (account.iva_pct / 100) * 100) / 100 : 0
  const computedTotal = account ? baseTotal + ivaAmount : 0
  const balance = account ? Math.max(0, computedTotal - account.paid_amount) : 0

  const minibarMutation = useMutation({
    mutationFn: () => addMinibarChargesApi(stay.id, { items: minibarItems }),
    onSuccess: () => {
      setMinibarSubmitted(true)
      setStep('cuenta')
      refetchAccount()
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al registrar minibar.'),
  })

  const paymentMutation = useMutation({
    mutationFn: (payload: { amount: number; payment_method: string; payment_type: string; paid_by: string }) =>
      addPaymentApi(stay.id, { ...payload }),
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al registrar pago.'),
  })

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutStayApi(stay.id, {
      late_checkout_fee: lateFeeNum || undefined,
      actual_check_out_datetime: new Date().toISOString(),
    }),
    onSuccess: (data) => {
      setReceiptStayId(data.id)
      setStep('done')
      queryClient.invalidateQueries({ queryKey: ['stays'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onSuccess()
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Error al realizar checkout.'),
  })

  useEffect(() => {
    if (step === 'pago' && balance > 0 && !payAmount) {
      setPayAmount(String(Math.round(balance)))
    }
  }, [step, balance, payAmount])

  const dialogRef = useFocusTrap<HTMLDialogElement>(true, step === 'minibar' ? onClose : undefined)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const includeParams = () => ({
    include_rooms: pdfInclude.rooms,
    include_services: pdfInclude.services,
    include_minibar: pdfInclude.minibar,
    include_late_fee: pdfInclude.late_fee,
  })

  const handleMinibarNext = () => {
    if (minibarItems.length > 0 && !minibarSubmitted) {
      minibarMutation.mutate()
      return
    }
    setStep('cuenta')
    refetchAccount()
  }

  const handleConfirm = async () => {
    const amount = parseAmountInput(payAmount)
    if (amount > 0) {
      await paymentMutation.mutateAsync({
        amount,
        payment_method: payMethod,
        payment_type: 'final',
        paid_by: stay.company ? payBy : 'guest',
      })
    }
    checkoutMutation.mutate()
  }

  const handleDownloadReceipt = async () => {
    const id = receiptStayId ?? stay.id
    try {
      const blob = await downloadStayReceiptApi(id, includeParams())
      downloadBlob(blob, 'comprobante.pdf')
    } catch {
      toast.error('Error al descargar PDF.')
    }
  }

  const handleViewReceipt = async () => {
    const id = receiptStayId ?? stay.id
    try {
      const blob = await downloadStayReceiptApi(id, includeParams())
      openBlobInNewTab(blob)
    } catch {
      toast.error('Error al abrir PDF.')
    }
  }

  const addManualRow = () => {
    setManualItems((prev) => [...prev, createManualRow(defaultRoomId)])
  }

  const removeManualRow = (rowKey: string) => {
    setManualItems((prev) => prev.filter((row) => row.rowKey !== rowKey))
  }

  const updateManualRow = (rowKey: string, field: keyof MinibarItem, value: string | number) => {
    setManualItems((prev) => prev.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row)))
  }

  const handleBack = () => {
    if (step === 'pago') {
      setStep('cuenta')
      return
    }
    setStep('minibar')
  }

  const isBusy = minibarMutation.isPending || paymentMutation.isPending || checkoutMutation.isPending
  const guestName = stay.guest?.full_name ?? '—'

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Checkout ${guestName}`}
      className={cn(
        'app-modal fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-0',
        'flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4',
      )}
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="relative z-10 pointer-events-auto w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Checkout — {guestName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Habitaciones: {activeRooms.map((sr) => sr.room?.number).join(', ')}
            </p>
          </div>
          {step !== 'done' && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
              style={{ background: 'var(--bg-input)' }}
              aria-label="Cerrar checkout"
            >
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {step !== 'done' && <CheckoutStepIndicator currentStep={step} />}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'minibar' && (
            <MinibarStep
              minibarSubmitted={minibarSubmitted}
              activeRooms={activeRooms}
              pickedItems={pickedItems}
              manualItems={manualItems}
              onChangePicked={setPickedItems}
              onAddManual={addManualRow}
              onRemoveManual={removeManualRow}
              onUpdateManual={updateManualRow}
            />
          )}

          {step === 'cuenta' && (
            <AccountStep
              accountLoading={accountLoading}
              account={account}
              lateFee={lateFee}
              baseTotal={baseTotal}
              ivaAmount={ivaAmount}
              computedTotal={computedTotal}
              balance={balance}
              onLateFeeChange={setLateFee}
            />
          )}

          {step === 'pago' && (
            <PaymentStep
              computedTotal={computedTotal}
              paidAmount={account?.paid_amount ?? 0}
              balance={balance}
              payAmount={payAmount}
              payMethod={payMethod}
              payBy={payBy}
              hasCompany={Boolean(stay.company)}
              onPayAmountChange={setPayAmount}
              onPayMethodChange={setPayMethod}
              onPayByChange={setPayBy}
            />
          )}

          {step === 'done' && (
            <DoneStep
              guestName={guestName}
              pdfInclude={pdfInclude}
              onPdfIncludeChange={(key, checked) => setPdfInclude((prev) => ({ ...prev, [key]: checked }))}
              onViewReceipt={handleViewReceipt}
              onDownloadReceipt={handleDownloadReceipt}
              onClose={onClose}
            />
          )}
        </div>

        {step !== 'done' && (
          <CheckoutWizardFooter
            step={step}
            isBusy={isBusy}
            accountLoading={accountLoading}
            minibarPending={minibarMutation.isPending}
            onBack={handleBack}
            onMinibarNext={handleMinibarNext}
            onAccountNext={() => setStep('pago')}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </dialog>
  )
}
