import { z } from 'zod'

export { emptyPersonName, isPersonNameValid } from '@/types/person'

const phoneRx = /^[+\d][\d\s\-()]{5,}$/

const personNameSchema = z.object({
  primer_nombre:    z.string().trim().min(1, 'Primer nombre requerido').max(80),
  segundo_nombre:   z.string().trim().max(80).optional().or(z.literal('')),
  primer_apellido:  z.string().trim().min(1, 'Primer apellido requerido').max(80),
  segundo_apellido: z.string().trim().max(80).optional().or(z.literal('')),
})

export const guestSchema = personNameSchema.extend({
  document_type:   z.enum(['cc', 'ce', 'passport', 'ti', 'rc']),
  document_number: z.string().trim().min(4, 'Documento inválido').max(40, 'Documento demasiado largo'),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  phone:           z.string().regex(phoneRx, 'Teléfono inválido').optional().or(z.literal('')),
  nationality_id:  z.string().uuid().optional().or(z.literal('')),
  birth_date:      z.string().optional().or(z.literal('')),
  notes:           z.string().max(2000).optional().or(z.literal('')),
})
export type GuestInput = z.infer<typeof guestSchema>

export const personaSchema = guestSchema.extend({
  roles: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
})
export type PersonaInput = z.infer<typeof personaSchema>

export const companySchema = z.object({
  name:         z.string().trim().min(2, 'Nombre demasiado corto').max(150),
  nit:          z.string().trim().min(4, 'NIT inválido').max(40),
  address:      z.string().max(200).optional().or(z.literal('')),
  phone:        z.string().regex(phoneRx, 'Teléfono inválido').optional().or(z.literal('')),
  email:        z.string().email('Email inválido').optional().or(z.literal('')),
  contact_name: z.string().max(120).optional().or(z.literal('')),
})
export type CompanyInput = z.infer<typeof companySchema>

export const paymentSchema = z.object({
  amount:         z.coerce.number().positive('Monto > 0'),
  payment_method: z.enum(['cash', 'transfer', 'card']),
  paid_by:        z.enum(['guest', 'company', 'mixed']).default('guest'),
  notes:          z.string().max(500).optional().or(z.literal('')),
})
export type PaymentInput = z.infer<typeof paymentSchema>

export const reservationSchema = z.object({
  guest_id:   z.string().uuid('Huésped requerido'),
  start_date: z.string().min(8, 'Fecha inicio requerida'),
  end_date:   z.string().min(8, 'Fecha fin requerida'),
  room_ids:   z.array(z.string().uuid()).min(1, 'Selecciona al menos 1 habitación'),
}).refine((v) => v.end_date > v.start_date, {
  message: 'Fecha fin debe ser posterior',
  path:    ['end_date'],
})
export type ReservationInput = z.infer<typeof reservationSchema>

export const inventoryItemSchema = z.object({
  category_id:         z.string().uuid('Categoría requerida'),
  name:                z.string().trim().min(2).max(150),
  brand:               z.string().max(80).optional().or(z.literal('')),
  presentation:        z.string().max(80).optional().or(z.literal('')),
  unit:                z.string().trim().min(1, 'Unidad requerida').max(20),
  cost_price:          z.coerce.number().nonnegative(),
  sale_price:          z.coerce.number().nonnegative().optional(),
  current_stock:       z.coerce.number().int().nonnegative(),
  min_stock_threshold: z.coerce.number().int().nonnegative(),
  expiry_date:         z.string().optional().or(z.literal('')),
})
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>

export function validate<T>(schema: z.ZodTypeAny, value: unknown): { ok: true; data: T } | { ok: false; errors: Record<string, string> } {
  const parsed = schema.safeParse(value)
  if (parsed.success) return { ok: true, data: parsed.data as T }
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.')
    if (!errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}
