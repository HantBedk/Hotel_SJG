import { useState } from 'react'
import { BedDouble, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useLoginForm } from '@/hooks/useLoginForm'
import { cn } from '@/lib/cn'

export default function LoginPage() {
  const { register, handleSubmit, errors, isSubmitting } = useLoginForm()
  const [showPass, setShowPass] = useState(false)

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          background: 'var(--bg-surface)',
          boxShadow:  'var(--shadow-lg)',
          border:     '1px solid var(--border-default)',
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
        <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label="Inicio de sesión">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
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
              <p id="email-error" role="alert" className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
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
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="icon-sm absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white mt-2',
              'transition-colors flex items-center justify-center gap-2',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
            style={{ background: 'var(--color-primary)' }}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center mt-6" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          Desarrollado por HantBedk
        </p>
      </div>
    </div>
  )
}
