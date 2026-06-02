import { useState } from 'react'
import { X, User, Building2, BedDouble, CreditCard, LogOut, Plus, Loader2, ArrowLeftRight, Sparkles, Download, ExternalLink, CalendarClock, ShoppingCart } from 'lucide-react'
import type { Stay, MinibarItem, MinibarConsumptionType } from '@/types'
import { useStay, useExtraServices } from '@/hooks/useStays'
import { useRooms } from '@/hooks/useRooms'
import { useMinibarProducts } from '@/hooks/useInventory'
import { downloadStayReceiptApi } from '@/services/stays.service'
import toast from 'react-hot-toast'

interface Props {
  stayId: string
  initialStay: Stay
  onClose: () => void
  canCheckOut: boolean
  onCheckOut: (id: string) => void
  onAddPayment: (payload: {
    stayId: string
    amount: number
    payment_method: string
    payment_type: string
    paid_by: string
    notes?: string
  }) => void
  onAddService: (payload: { stayId: string; extra_service_id: string; quantity: number }) => void
  onAddMinibar: (payload: { stayId: string; items: MinibarItem[] }) => Promise<unknown>
  onTransfer: (payload: { stayId: string; from_room_id: string; to_room_id: string; reason?: string }) => void
  onExtend: (payload: { id: string; check_out_datetime: string }) => Promise<unknown>
}

const DOC_LABELS: Record<string, string> = {
  cc: 'CC', ce: 'CE', passport: 'Pasaporte',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatCurrency(amount: string | number | null | undefined) {
  if (amount == null) return '—'
  return `$${Number(amount).toLocaleString('es-CO')}`
}

function nightsElapsed(checkIn: string): number {
  return Math.floor((Date.now() - new Date(checkIn).getTime()) / 86400000)
}

interface PaymentForm {
  amount: string
  payment_method: string
  payment_type: string
  paid_by: string
  notes: string
}

interface TransferForm {
  from_room_id: string
  to_room_id: string
  reason: string
}

export function StayDrawer({ stayId, initialStay, onClose, canCheckOut, onCheckOut, onAddPayment, onAddService, onAddMinibar, onTransfer, onExtend }: Props) {
  const { data: freshStay, isLoading } = useStay(stayId)
  const stay = freshStay ?? initialStay

  const nights = nightsElapsed(stay.check_in_datetime)
  const pendingBalance = Number(stay.total_amount ?? 0) - Number(stay.paid_amount ?? 0)

  const [showPayForm, setShowPayForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [showExtendForm, setShowExtendForm] = useState(false)
  const [extendDate, setExtendDate] = useState('')
  const [isExtending, setIsExtending] = useState(false)

  const activeRooms = stay.stay_rooms?.filter((sr) => sr.is_active) ?? []
  const [transferForm, setTransferForm] = useState<TransferForm>({
    from_room_id: activeRooms[0]?.room_id ?? '',
    to_room_id: '',
    reason: '',
  })

  const { rooms: availableRooms } = useRooms('available')
  const { data: extraServices = [] } = useExtraServices()
  const { data: minibarProducts = [] } = useMinibarProducts()

  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceForm, setServiceForm] = useState({ extra_service_id: '', quantity: '1' })

  const [showMinibarForm, setShowMinibarForm] = useState(false)
  const [minibarForm, setMinibarForm] = useState({
    minibar_product_id: '',
    room_id:            activeRooms[0]?.room_id ?? '',
    type:               'consumed' as MinibarConsumptionType,
    quantity:           '1',
    unit_price:         '',
  })
  const [isSavingMinibar, setIsSavingMinibar] = useState(false)

  const [payForm, setPayForm] = useState<PaymentForm>({
    amount: '',
    payment_method: 'cash',
    payment_type: 'partial',
    paid_by: 'guest',
    notes: '',
  })

  const handleTransfer = () => {
    if (!transferForm.from_room_id || !transferForm.to_room_id) return
    onTransfer({
      stayId,
      from_room_id: transferForm.from_room_id,
      to_room_id: transferForm.to_room_id,
      reason: transferForm.reason || undefined,
    })
    setShowTransferForm(false)
  }

  const handleAddService = () => {
    const qty = parseInt(serviceForm.quantity, 10)
    if (!serviceForm.extra_service_id || !qty || qty < 1) return
    onAddService({ stayId, extra_service_id: serviceForm.extra_service_id, quantity: qty })
    setShowServiceForm(false)
    setServiceForm({ extra_service_id: '', quantity: '1' })
  }

  const handleAddMinibar = async () => {
    const product = minibarProducts.find(p => p.id === minibarForm.minibar_product_id)
    const qty     = parseInt(minibarForm.quantity, 10)
    const unit    = parseFloat(minibarForm.unit_price)
    if (!product || !minibarForm.room_id || !qty || qty < 1 || !(unit >= 0)) return
    setIsSavingMinibar(true)
    try {
      await onAddMinibar({
        stayId,
        items: [{
          product_name: product.name,
          room_id:      minibarForm.room_id,
          type:         minibarForm.type,
          quantity:     qty,
          unit_price:   unit,
        }],
      })
      setShowMinibarForm(false)
      setMinibarForm({
        minibar_product_id: '',
        room_id:            activeRooms[0]?.room_id ?? '',
        type:               'consumed',
        quantity:           '1',
        unit_price:         '',
      })
    } finally {
      setIsSavingMinibar(false)
    }
  }

  // Auto-fill unit_price when product or type changes
  const onMinibarProductChange = (productId: string) => {
    const product = minibarProducts.find(p => p.id === productId)
    const priceByType = product
      ? minibarForm.type === 'damaged'
        ? (product.damage_price ?? product.sale_price)
        : product.sale_price
      : ''
    setMinibarForm(s => ({ ...s, minibar_product_id: productId, unit_price: String(priceByType ?? '') }))
  }

  const onMinibarTypeChange = (type: MinibarConsumptionType) => {
    const product = minibarProducts.find(p => p.id === minibarForm.minibar_product_id)
    const priceByType = product
      ? type === 'damaged'
        ? (product.damage_price ?? product.sale_price)
        : product.sale_price
      : minibarForm.unit_price
    setMinibarForm(s => ({ ...s, type, unit_price: String(priceByType ?? '') }))
  }

  const handleAddPayment = () => {
    const amount = parseFloat(payForm.amount)
    if (!amount || amount <= 0) return
    onAddPayment({
      stayId,
      amount,
      payment_method: payForm.payment_method,
      payment_type: payForm.payment_type,
      paid_by: payForm.paid_by,
      notes: payForm.notes || undefined,
    })
    setShowPayForm(false)
    setPayForm({ amount: '', payment_method: 'cash', payment_type: 'partial', paid_by: 'guest', notes: '' })
  }

  const handleExtend = async () => {
    if (!extendDate) return
    setIsExtending(true)
    try {
      await onExtend({ id: stayId, check_out_datetime: extendDate })
      setShowExtendForm(false)
      setExtendDate('')
    } finally {
      setIsExtending(false)
    }
  }

  const handleReceipt = async (mode: 'view' | 'download') => {
    try {
      const blob = await downloadStayReceiptApi(stay.id)
      const url  = window.URL.createObjectURL(blob)
      if (mode === 'view') {
        window.open(url, '_blank')
      } else {
        const link    = document.createElement('a')
        link.href     = url
        link.download = `comprobante-${stay.receipt_number ?? stay.id}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      toast.error('Error al obtener comprobante.')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de estadía"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Detalle de estadía
            </h2>
            {isLoading && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80"
            style={{ background: 'var(--bg-input)' }}
            aria-label="Cerrar"
          >
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Guest */}
          {stay.guest && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <User size={15} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Huésped</p>
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stay.guest.full_name}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {DOC_LABELS[stay.guest.document_type] ?? stay.guest.document_type} {stay.guest.document_number}
              </p>
              {stay.guest.phone && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stay.guest.phone}</p>}
              {stay.guest.companions && stay.guest.companions.length > 0 && (
                <div className="mt-2 pl-3 border-l-2" style={{ borderColor: 'var(--border-default)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stay.guest.companions.length} acompañante(s)
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Company */}
          {stay.company && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={15} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Empresa</p>
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stay.company.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>NIT {stay.company.nit}</p>
            </section>
          )}

          {/* Rooms */}
          {stay.stay_rooms && stay.stay_rooms.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <BedDouble size={15} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Habitaciones</p>
              </div>
              <div className="space-y-2">
                {stay.stay_rooms.filter((sr) => sr.is_active).map((sr) => (
                  <div key={sr.id} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Hab. {sr.room?.number} — {sr.room?.room_type?.name}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(sr.price_per_night)}/noche
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dates */}
          <section className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Entrada</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(stay.check_in_datetime)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Salida prevista</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(stay.check_out_datetime)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Noches transcurridas</span>
              <span style={{ color: 'var(--text-primary)' }}>{nights}</span>
            </div>
          </section>

          {/* Financial */}
          <section className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-input)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Total</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(stay.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Pagado</span>
              <span style={{ color: 'var(--status-available)' }}>{formatCurrency(stay.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Saldo pendiente</span>
              <span style={{ color: pendingBalance > 0 ? 'var(--status-occupied)' : 'var(--status-available)' }}>
                {formatCurrency(pendingBalance)}
              </span>
            </div>
          </section>

          {/* Extend stay */}
          {(stay.status === 'active' || stay.status === 'extended') && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarClock size={15} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Extender estadía</p>
                </div>
                {!showExtendForm && (
                  <button
                    onClick={() => setShowExtendForm(true)}
                    className="text-xs px-2 py-1 rounded-lg border hover:opacity-80"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    Extender
                  </button>
                )}
              </div>
              {showExtendForm && (
                <div className="rounded-xl p-4 space-y-3 border"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Nueva fecha de salida</p>
                    <input
                      type="datetime-local"
                      value={extendDate}
                      onChange={(e) => setExtendDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExtend}
                      disabled={!extendDate || isExtending}
                      className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      {isExtending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirmar'}
                    </button>
                    <button onClick={() => setShowExtendForm(false)}
                      className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Transfer room */}
          {stay.status === 'active' && activeRooms.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight size={15} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Transferencia</p>
                </div>
                {!showTransferForm && (
                  <button
                    onClick={() => setShowTransferForm(true)}
                    className="text-xs px-2 py-1 rounded-lg border hover:opacity-80"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    Transferir hab.
                  </button>
                )}
              </div>

              {showTransferForm && (
                <div className="rounded-xl p-4 space-y-3 border"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Desde</p>
                      <select value={transferForm.from_room_id}
                        onChange={(e) => setTransferForm((s) => ({ ...s, from_room_id: e.target.value }))}
                        className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                        {activeRooms.map((sr) => (
                          <option key={sr.room_id} value={sr.room_id}>Hab. {sr.room?.number}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Hacia</p>
                      <select value={transferForm.to_room_id}
                        onChange={(e) => setTransferForm((s) => ({ ...s, to_room_id: e.target.value }))}
                        className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                        <option value="">Seleccionar...</option>
                        {availableRooms.map((r) => (
                          <option key={r.id} value={r.id}>Hab. {r.number}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input type="text" placeholder="Motivo (opcional)" value={transferForm.reason}
                    onChange={(e) => setTransferForm((s) => ({ ...s, reason: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleTransfer} disabled={!transferForm.to_room_id}
                      className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}>
                      Confirmar
                    </button>
                    <button onClick={() => setShowTransferForm(false)}
                      className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Extra services */}
          {stay.status === 'active' && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Servicios extra</p>
                </div>
                {!showServiceForm && (
                  <button onClick={() => setShowServiceForm(true)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    <Plus size={12} /> Agregar
                  </button>
                )}
              </div>

              {stay.services && stay.services.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {stay.services.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {s.extra_service?.name ?? 'Servicio'} × {s.quantity}
                      </span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(s.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {showServiceForm && (
                <div className="rounded-xl p-4 space-y-3 border"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={serviceForm.extra_service_id}
                      onChange={(e) => setServiceForm((s) => ({ ...s, extra_service_id: e.target.value }))}
                      className="col-span-2 px-2 py-2 rounded-lg text-xs border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                      <option value="">Seleccionar servicio...</option>
                      {extraServices.map((es) => (
                        <option key={es.id} value={es.id}>
                          {es.name} — {formatCurrency(es.price)}
                        </option>
                      ))}
                    </select>
                    <input type="number" min={1} placeholder="Cant." value={serviceForm.quantity}
                      onChange={(e) => setServiceForm((s) => ({ ...s, quantity: e.target.value }))}
                      className="px-2 py-2 rounded-lg text-xs border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddService} disabled={!serviceForm.extra_service_id}
                      className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}>
                      Confirmar
                    </button>
                    <button onClick={() => setShowServiceForm(false)}
                      className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Minibar */}
          {stay.status === 'active' && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={15} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Minibar</p>
                </div>
                {!showMinibarForm && (
                  <button onClick={() => setShowMinibarForm(true)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    <Plus size={12} /> Registrar
                  </button>
                )}
              </div>

              {stay.minibar_consumptions && stay.minibar_consumptions.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {stay.minibar_consumptions.map((m) => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {m.product_name} × {m.quantity}
                        {m.type !== 'consumed' && (
                          <span className="ml-1 text-xs" style={{ color: m.type === 'damaged' ? '#DC2626' : '#D97706' }}>
                            ({m.type === 'damaged' ? 'dañado' : 'faltante'})
                          </span>
                        )}
                      </span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(m.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {showMinibarForm && (
                <div className="rounded-xl p-4 space-y-3 border"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
                  <select
                    value={minibarForm.minibar_product_id}
                    onChange={(e) => onMinibarProductChange(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-xs border outline-none"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                    <option value="">Seleccionar producto…</option>
                    {minibarProducts.filter(p => p.active).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.sale_price)}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    {activeRooms.length > 1 ? (
                      <select
                        value={minibarForm.room_id}
                        onChange={(e) => setMinibarForm(s => ({ ...s, room_id: e.target.value }))}
                        className="px-2 py-2 rounded-lg text-xs border outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                        {activeRooms.map((sr) => (
                          <option key={sr.room_id} value={sr.room_id}>Hab. {sr.room?.number}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-2 py-2 rounded-lg text-xs border"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                        Hab. {activeRooms[0]?.room?.number ?? '—'}
                      </div>
                    )}
                    <select
                      value={minibarForm.type}
                      onChange={(e) => onMinibarTypeChange(e.target.value as MinibarConsumptionType)}
                      className="px-2 py-2 rounded-lg text-xs border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                      <option value="consumed">Consumido</option>
                      <option value="damaged">Dañado</option>
                      <option value="missing">Faltante</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min={1} placeholder="Cant."
                      value={minibarForm.quantity}
                      onChange={(e) => setMinibarForm(s => ({ ...s, quantity: e.target.value }))}
                      className="px-2 py-2 rounded-lg text-xs border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    />
                    <input type="number" min={0} step="any" placeholder="Precio unit."
                      value={minibarForm.unit_price}
                      onChange={(e) => setMinibarForm(s => ({ ...s, unit_price: e.target.value }))}
                      className="px-2 py-2 rounded-lg text-xs border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleAddMinibar}
                      disabled={!minibarForm.minibar_product_id || !minibarForm.room_id || isSavingMinibar}
                      className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}>
                      {isSavingMinibar ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirmar'}
                    </button>
                    <button onClick={() => setShowMinibarForm(false)}
                      className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Payments */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard size={15} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Pagos</p>
              </div>
              {stay.status === 'active' && !showPayForm && (
                <button onClick={() => setShowPayForm(true)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-80"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  <Plus size={12} /> Registrar
                </button>
              )}
            </div>

            {stay.payments && stay.payments.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {stay.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showPayForm && (
              <div className="rounded-xl p-4 space-y-3 border"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}>
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Nuevo pago</p>
                <input type="number" placeholder="Monto" value={payForm.amount}
                  onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
                <div className="grid grid-cols-3 gap-2">
                  {['payment_method', 'payment_type', 'paid_by'].map((field) => (
                    <select key={field} value={payForm[field as keyof PaymentForm]}
                      onChange={(e) => setPayForm((s) => ({ ...s, [field]: e.target.value }))}
                      className="px-2 py-2 rounded-lg text-xs border outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                      {field === 'payment_method' && <>
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                        <option value="card">Tarjeta</option>
                      </>}
                      {field === 'payment_type' && <>
                        <option value="deposit">Depósito</option>
                        <option value="partial">Parcial</option>
                        <option value="final">Final</option>
                      </>}
                      {field === 'paid_by' && <>
                        <option value="guest">Huésped</option>
                        <option value="company">Empresa</option>
                        <option value="mixed">Mixto</option>
                      </>}
                    </select>
                  ))}
                </div>
                <input type="text" placeholder="Observaciones (opcional)" value={payForm.notes}
                  onChange={(e) => setPayForm((s) => ({ ...s, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
                <div className="flex gap-2">
                  <button onClick={handleAddPayment} disabled={!payForm.amount}
                    className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-80"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    Guardar
                  </button>
                  <button onClick={() => setShowPayForm(false)}
                    className="px-4 py-2 rounded-lg text-xs border hover:opacity-80"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* PDF Receipt — for checked_out stays */}
          {stay.status === 'checked_out' && (
            <section>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Comprobante</p>
              {stay.receipt_number && (
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{stay.receipt_number}</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleReceipt('view')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border hover:opacity-80"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                  <ExternalLink size={13} /> Ver PDF
                </button>
                <button onClick={() => handleReceipt('download')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium hover:opacity-80"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  <Download size={13} /> Descargar
                </button>
              </div>
            </section>
          )}

          {/* Notes */}
          {stay.notes && (
            <section>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Observaciones</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stay.notes}</p>
            </section>
          )}
        </div>

        {/* Footer — Checkout button (direct, from drawer, for active stays) */}
        {stay.status === 'active' && canCheckOut && (
          <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={() => onCheckOut(stay.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'var(--status-occupied)', color: '#fff' }}
            >
              <LogOut size={16} />
              Iniciar Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
