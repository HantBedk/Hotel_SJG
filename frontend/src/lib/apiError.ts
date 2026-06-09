type LaravelErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

type AxiosLikeError = {
  response?: {
    status?: number
    data?: LaravelErrorResponse
  }
}

const FIELD_LABELS: Record<string, string> = {
  full_name:       'Nombre',
  document_type:   'Tipo de documento',
  document_number: 'Número de documento',
  email:           'Email',
  phone:           'Teléfono',
  nationality:     'Nacionalidad',
  birth_date:      'Fecha de nacimiento',
  notes:           'Notas',
  name:            'Nombre',
  nit:             'NIT',
  address:         'Dirección',
  contact_name:    'Contacto',
  password:        'Contraseña',
  role:            'Rol',
  status:          'Estado',
  amount:          'Monto',
  payment_method:  'Método de pago',
  payment_type:    'Tipo de pago',
  paid_by:         'Pagado por',
}

const MESSAGE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/has already been taken/i,            'ya está registrado.'],
  [/is required/i,                       'es obligatorio.'],
  [/must be a valid email/i,             'no es un email válido.'],
  [/must be a string/i,                  'debe ser texto.'],
  [/must be a number/i,                  'debe ser un número.'],
  [/must be a date/i,                    'debe ser una fecha válida.'],
  [/must be one of/i,                    'tiene un valor no permitido.'],
  [/selected .* is invalid/i,            'tiene un valor no permitido.'],
  [/may not be greater than/i,           'es demasiado largo.'],
]

function translate(msg: string): string {
  for (const [re, replacement] of MESSAGE_TRANSLATIONS) {
    if (re.test(msg)) return replacement
  }
  return msg
}

/**
 * Extracts a user-friendly error message from an Axios error.
 * For 422 responses, prefers the first field-specific error
 * (e.g. "Número de documento ya está registrado.")
 * Falls back to the top-level `message`, then to `fallback`.
 */
export function extractApiError(err: unknown, fallback = 'Error inesperado.'): string {
  const axErr = err as AxiosLikeError
  const data  = axErr?.response?.data

  if (axErr?.response?.status === 422 && data?.errors) {
    // Diagnostic log so devs can inspect the full validation breakdown
    // eslint-disable-next-line no-console
    console.warn('[422 Validation Error]', data.errors)

    const firstField   = Object.keys(data.errors)[0]
    const firstMessage = data.errors[firstField]?.[0]
    if (firstField && firstMessage) {
      const label     = FIELD_LABELS[firstField] ?? firstField
      const translated = translate(firstMessage)
      return `${label}: ${translated}`
    }
  }

  if (data?.message) return data.message
  return fallback
}
