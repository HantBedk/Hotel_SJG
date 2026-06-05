import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Download, ExternalLink, Loader2, CheckCircle2, Minus } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { MinibarItem, StayAccount, Stay, MinibarConsumptionType, StayRoom } from '@/types'
import { addMinibarChargesApi, checkoutStayApi, addPaymentApi, getStayAccountApi, downloadStayReceiptApi } from '@/services/stays.service'
import { useRoomMinibars } from '@/hooks/useInventory'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  stay: Stay
  onClose: () => void
  onSuccess: () => void
}

type Step = 'minibar' | 'cuenta' | 'pago' | 'done'

const MINIBAR_TYPES: { value: MinibarConsumptionType; label: string }[] = [
  { value: 'consumed', label: 'Consumido' },
  { value: 'damaged',  label: 'Dañado' },
  { value: 'missing',  label: 'Faltante' },
]

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-CO')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

// Key compuesto para identificar un consumo desde el minibar (por habitación + producto).
// Se mantiene fuera de MinibarItem para no contaminar el contrato hacia el backend.
type PickedItemKey = string // `${roomId}::${productId}`
type PickedItems = Record<PickedItemKey, MinibarItem>

const pickedKey = (roomId: string, productId: string): PickedItemKey =>
  `${roomId}::${productId}`

interface RoomMinibarPickerProps {
  stayRoom: StayRoom
  showRoomHeader: boolean
  pickedItems: PickedItems
  onChangePicked: React.Dispatch<React.SetStateAction<PickedItems>>
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
          room_id:      stayRoom.room_id,
          type,
          quantity:     qty,
          unit_price:   salePrice,
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
          const productId   = rm.minibar_product_id
          const productName = rm.product?.name ?? '—'
          const salePrice   = Number(rm.product?.sale_price ?? 0)
          const available   = rm.quantity
          const key         = pickedKey(stayRoom.room_id, productId)
          const current     = pickedItems[key]
          const consumedQty = current?.quantity ?? 0
          const type        = current?.type ?? 'consumed'
          const exceeded    = consumedQty > available

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
                onChange={(e) => setType(productId, productName, salePrice, e.target.value as MinibarConsumptionType)}
                disabled={consumedQty === 0}
                className="px-2 py-1.5 rounded-lg text-xs border outline-none disabled:opacity-50"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
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
                  type="number"
                  min={0}
                  value={consumedQty}
                  onChange={(e) => setQty(productId, productName, salePrice, parseInt(e.target.value) || 0, type)}
                  className="w-12 text-center px-1 py-1 rounded-md text-sm border outline-none"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid ' + (exceeded ? '#EF4444' : 'var(--border-default)'),
                    color: 'var(--text-primary)',
                  }}
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

export function CheckoutWizard({ stay, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('minibar')
  const [pickedItems, setPickedItems] = useState<PickedItems>({})
  const [manualItems, setManualItems] = useState<MinibarItem[]>([])
  // Lista consolidada que se envía al backend. Se recalcula bajo demanda.
  const minibarItems: MinibarItem[] = [...Object.values(pickedItems), ...manualItems]
  const [minibarSubmitted, setMinibarSubmitted] = useState(false)
  const [lateFee, setLateFee] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payBy, setPayBy] = useState('guest')
  const [payAmount, setPayAmount] = useState('')
  const [receiptStayId, setReceiptStayId] = useState<string | null>(null)

  const activeRooms = stay.stay_rooms?.filter((sr) => sr.is_active) ?? []
  const defaultRoomId = activeRooms[0]?.room_id ?? ''

  // Account query — only after moving to cuenta step
  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = useQuery<StayAccount>({
    queryKey: ['stay-account', stay.id],
    queryFn:  () => getStayAccountApi(stay.id),
    enabled:  step === 'cuenta' || step === 'pago',
    staleTime: 0,
  })

  // Derived total with late fee override
  const lateFeeNum    = parseFloat(lateFee) || 0
  const baseTotal     = account ? account.subtotal - account.late_checkout_fee + lateFeeNum : 0
  const ivaAmount     = account ? Math.round(baseTotal * (account.iva_pct / 100) * 100) / 100 : 0
  const computedTotal = account ? baseTotal + ivaAmount : 0
  const balance       = account ? Math.max(0, computedTotal - account.paid_amount) : 0

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

  // Pre-llenar el monto con el saldo pendiente al llegar al paso de pago
  useEffect(() => {
    if (step === 'pago' && balance > 0 && !payAmount) {
      setPayAmount(String(Math.round(balance)))
    }
  }, [step, balance, payAmount])

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

  const handleMinibarNext = async () => {
    if (minibarItems.length > 0 && !minibarSubmitted) {
      minibarMutation.mutate()
    } else {
      setStep('cuenta')
      refetchAccount()
    }
  }

  const handleConfirm = async () => {
    if (parseFloat(payAmount) > 0) {
      await paymentMutation.mutateAsync({
        amount:         parseFloat(payAmount),
        payment_method: payMethod,
        payment_type:   'final',
        paid_by:        stay.company ? payBy : 'guest',
      })
    }
    checkoutMutation.mutate()
  }

  const [pdfInclude, setPdfInclude] = useState({
    rooms:    true,
    services: true,
    minibar:  true,
    late_fee: true,
  })

  const includeParams = () => ({
    include_rooms:    pdfInclude.rooms,
    include_services: pdfInclude.services,
    include_minibar:  pdfInclude.minibar,
    include_late_fee: pdfInclude.late_fee,
  })

  const handleDownloadReceipt = async () => {
    const id = receiptStayId ?? stay.id
    try {
      const blob = await downloadStayReceiptApi(id, includeParams())
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `comprobante.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al descargar PDF.')
    }
  }

  const handleViewReceipt = async () => {
    const id = receiptStayId ?? stay.id
    try {
      const blob = await downloadStayReceiptApi(id, includeParams())
      const url  = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      toast.error('Error al abrir PDF.')
    }
  }

  const addManualRow = () => {
    setManualItems((prev) => [...prev, { product_name: '', room_id: defaultRoomId, type: 'consumed', quantity: 1, unit_price: 0 }])
  }

  const removeManualRow = (i: number) => {
    setManualItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateManualRow = (i: number, field: keyof MinibarItem, value: string | number) => {
    setManualItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const isBusy = minibarMutation.isPending || paymentMutation.isPending || checkoutMutation.isPending

  const STEPS: Step[] = ['minibar', 'cuenta', 'pago', 'done']
  const stepIdx = STEPS.indexOf(step)

  const dialogRef = useFocusTrap<HTMLDivElement>(true, step === 'minibar' ? onClose : undefined)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Checkout ${stay.guest?.full_name ?? ''}`}
        className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-surface)', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Checkout — {stay.guest?.full_name ?? '—'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Habitaciones: {activeRooms.map((sr) => sr.room?.number).join(', ')}
            </p>
          </div>
          {step !== 'done' && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
              style={{ background: 'var(--bg-input)' }}>
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex items-center gap-0 px-6 pt-4 pb-1 flex-shrink-0">
            {['Minibar', 'Cuenta', 'Pago'].map((label, i) => (
              <div key={label} className="flex items-center gap-0">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: stepIdx >= i ? 'var(--color-primary)' : 'var(--bg-input)',
                      color: stepIdx >= i ? '#fff' : 'var(--text-muted)',
                    }}
                  >{i + 1}</div>
                  <span className="text-xs" style={{ color: stepIdx === i ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className="w-8 h-px mx-2" style={{ background: 'var(--border-default)' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── STEP 1: MINIBAR ── */}
          {step === 'minibar' && (
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
                  {/* Por cada habitación activa, muestra los productos asignados a su minibar */}
                  {activeRooms.map((sr) => (
                    <RoomMinibarPicker
                      key={sr.room_id}
                      stayRoom={sr}
                      showRoomHeader={activeRooms.length > 1}
                      pickedItems={pickedItems}
                      onChangePicked={setPickedItems}
                    />
                  ))}

                  {/* Ítems manuales (productos que no estaban en el minibar) */}
                  {manualItems.length > 0 && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Otros consumos manuales
                    </p>
                  )}

                  {manualItems.map((item, i) => (
                    <div key={i} className="grid gap-2 rounded-xl p-3 border"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', gridTemplateColumns: '1fr auto auto auto auto auto' }}>
                      <input
                        placeholder="Producto"
                        value={item.product_name}
                        onChange={(e) => updateManualRow(i, 'product_name', e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      />
                      {activeRooms.length > 1 && (
                        <select
                          value={item.room_id}
                          onChange={(e) => updateManualRow(i, 'room_id', e.target.value)}
                          className="px-2 py-1.5 rounded-lg text-xs border outline-none"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                        >
                          {activeRooms.map((sr) => (
                            <option key={sr.room_id} value={sr.room_id}>Hab. {sr.room?.number}</option>
                          ))}
                        </select>
                      )}
                      <select
                        value={item.type}
                        onChange={(e) => updateManualRow(i, 'type', e.target.value as MinibarConsumptionType)}
                        className="px-2 py-1.5 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      >
                        {MINIBAR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input
                        type="number" min={1} placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => updateManualRow(i, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-1.5 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      />
                      <input
                        type="number" min={0} placeholder="Precio unit."
                        value={item.unit_price || ''}
                        onChange={(e) => updateManualRow(i, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      />
                      <button onClick={() => removeManualRow(i)} className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: 'var(--status-occupied)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addManualRow}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border hover:opacity-80"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    <Plus size={13} /> Agregar consumo manual
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── STEP 2: CUENTA ── */}
          {step === 'cuenta' && (
            <div className="space-y-4">
              {accountLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
              ) : account ? (
                <>
                  {/* Rooms */}
                  {account.rooms.filter((r) => r.is_active).length > 0 && (
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
                            {account.rooms.filter((r) => r.is_active).map((r, i) => (
                              <tr key={i} style={{ borderTop: '1px solid var(--border-default)' }}>
                                <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{r.room_number} — {r.room_type}</td>
                                <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.price_per_night)}</td>
                                <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{r.nights}</td>
                                <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(r.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {account.services.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Servicios extra</p>
                      <div className="space-y-1">
                        {account.services.map((s, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span style={{ color: 'var(--text-secondary)' }}>{s.name} × {s.quantity}</span>
                            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(s.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Minibar */}
                  {account.minibar.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Minibar</p>
                      <div className="space-y-1">
                        {account.minibar.map((m, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span style={{ color: 'var(--text-secondary)' }}>{m.product_name} × {m.quantity} ({m.type})</span>
                            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(m.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Late checkout */}
                  <div>
                    <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                      Cargo late checkout (opcional)
                    </label>
                    <input
                      type="number" min={0} placeholder="0"
                      value={lateFee}
                      onChange={(e) => setLateFee(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Totals */}
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
                      <span style={{ color: balance > 0 ? 'var(--status-occupied)' : 'var(--status-available)' }}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ── STEP 3: PAGO ── */}
          {step === 'pago' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 space-y-1.5 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
                <div className="flex justify-between text-sm font-bold">
                  <span style={{ color: 'var(--text-secondary)' }}>Total a pagar</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(computedTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Pagado</span>
                  <span style={{ color: 'var(--status-available)' }}>{formatCurrency(account?.paid_amount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-1" style={{ borderColor: 'var(--border-default)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Saldo</span>
                  <span style={{ color: balance > 0 ? 'var(--status-occupied)' : 'var(--status-available)' }}>
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
                    type="number" min={0} placeholder="Monto"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                  <div className={stay.company ? 'grid grid-cols-2 gap-2' : ''}>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="card">Tarjeta</option>
                    </select>
                    {stay.company && (
                      <select value={payBy} onChange={(e) => setPayBy(e.target.value)}
                        className="px-2 py-2 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
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

              {/* Check-out time */}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                El checkout se registrará con la hora actual: {formatDate(new Date().toISOString())}
              </p>
            </div>
          )}

          {/* ── STEP 4: DONE ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <CheckCircle2 size={48} style={{ color: 'var(--status-available)' }} />
              <div className="text-center">
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Checkout completado</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {stay.guest?.full_name ?? '—'} ha sido registrado como salida.
                </p>
              </div>

              <div className="w-full max-w-md rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border-default)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Conceptos en el comprobante
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-sm">
                  {([
                    ['rooms', 'Habitaciones'],
                    ['services', 'Servicios'],
                    ['minibar', 'Minibar'],
                    ['late_fee', 'Cargo late checkout'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={pdfInclude[key]}
                        onChange={(e) => setPdfInclude((p) => ({ ...p, [key]: e.target.checked }))}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleViewReceipt}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border hover:opacity-80"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <ExternalLink size={15} /> Ver PDF
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  <Download size={15} /> Descargar PDF
                </button>
              </div>

              <button onClick={onClose} className="text-sm hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'done' && (
          <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border-default)' }}>

            {step !== 'minibar' && (
              <button
                onClick={() => setStep(step === 'pago' ? 'cuenta' : 'minibar')}
                disabled={isBusy}
                className="px-4 py-2 rounded-xl text-sm border disabled:opacity-40 hover:opacity-80"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                Anterior
              </button>
            )}

            <div className="flex-1" />

            {step === 'minibar' && (
              <>
                <button
                  onClick={() => { setStep('cuenta'); refetchAccount() }}
                  disabled={isBusy}
                  className="px-4 py-2 rounded-xl text-sm border disabled:opacity-40 hover:opacity-80"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  Omitir
                </button>
                <button
                  onClick={handleMinibarNext}
                  disabled={isBusy || (minibarItems.length === 0 && !minibarSubmitted)}
                  className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-80"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  {minibarMutation.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Registrar y continuar'}
                </button>
              </>
            )}

            {step === 'cuenta' && (
              <button
                onClick={() => setStep('pago')}
                disabled={accountLoading}
                className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-80"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Siguiente
              </button>
            )}

            {step === 'pago' && (
              <button
                onClick={handleConfirm}
                disabled={isBusy}
                className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-80"
                style={{ background: 'var(--status-occupied)', color: '#fff' }}
              >
                {isBusy ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirmar checkout'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
