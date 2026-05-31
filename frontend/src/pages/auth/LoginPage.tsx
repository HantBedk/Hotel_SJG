import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { BedDouble, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

const schema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPass, setShowPass] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await login(data)
      if (res.success) {
        navigate('/', { replace: true })
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Error al iniciar sesión'
      toast.error(msg)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          background:   'var(--bg-surface)',
          boxShadow:    'var(--shadow-lg)',
          border:       '1px solid var(--border-default)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            <BedDouble size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Hotel Manager
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              San José del Guaviare
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
          aria-label="Formulario de inicio de sesión"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              {...register('email')}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-sm border transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.email ? 'border-red-400' : 'border-[var(--border-default)]',
              )}
              style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
              placeholder="admin@hotelsjg.com"
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-500 mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
                aria-invalid={!!errors.password}
                {...register('password')}
                className={cn(
                  'w-full px-3 py-2.5 pr-10 rounded-lg text-sm border transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.password ? 'border-red-400' : 'border-[var(--border-default)]',
                )}
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="icon-sm absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
                style={{ color: 'var(--text-muted)' }}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-red-500 mt-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white mt-2',
              'transition-colors flex items-center justify-center gap-2',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
            style={{ background: 'var(--color-primary)' }}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Creator */}
        <p
          className="text-center mt-6"
          style={{ color: 'var(--text-muted)', fontSize: '11px' }}
        >
          Desarrollado por HantBedk
        </p>
      </div>
    </div>
  )
}
