import type { CompanionForm } from '@/pages/checkin/types'

export const DOCUMENT_TYPES = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ce', label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
] as const

export const RELATIONSHIPS = [
  'Hijo', 'Hijastro', 'Nieto', 'Sobrino', 'Hermano', 'Primo', 'Ahijado', 'Tutor legal',
] as const

export const OCCUPANCY_KEYS = ['adults', 'children'] as const

export const inputCls = 'px-3 py-2 rounded-lg text-sm border outline-none'

export const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
}

let companionFormKeySeq = 0

export function makeCompanionForm(): CompanionForm {
  companionFormKeySeq += 1
  return { formKey: `companion-${companionFormKeySeq}`, name: '', document_type: 'cc', relationship: '' }
}
