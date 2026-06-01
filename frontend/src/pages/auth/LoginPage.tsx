import { useState, useEffect } from 'react'
import { BedDouble, Mail, Lock, Eye, EyeOff, ShieldCheck, Key, Bell, UserCircle, ArrowRight, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLoginForm } from '@/hooks/useLoginForm'
import { cn } from '@/lib/cn'

const features = [
  { icon: Key,        title: 'Control de Accesos',  desc: 'Gestión de llaves y cerraduras' },
  { icon: Shield,     title: 'Alta Seguridad',       desc: 'Auditoría de acciones 24/7' },
  { icon: Bell,       title: 'Tiempo Real',          desc: 'Notificaciones y alertas live' },
  { icon: UserCircle, title: 'Gestión Operativa',    desc: 'Staff, housekeeping y reservas' },
]

const phrases = [
  'Control total de reservas, habitaciones y huéspedes en una sola plataforma unificada.',
  'Cada acción queda registrada. Seguridad y trazabilidad en tiempo real para tu hotel.',
  'Optimiza la operación diaria de tu hotel desde recepción hasta administración.',
]

export default function LoginPage() {
  const { register, handleSubmit, errors, isSubmitting } = useLoginForm()
  const [showPass, setShowPass] = useState(false)
  const [currentPhrase, setCurrentPhrase] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrentPhrase(p => (p + 1) % phrases.length), 7000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans">

      {/* Left — Branding */}
      <div className="hidden md:flex w-3/4 bg-[#0a192f] relative flex-col overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a192f] to-[#020c1b]" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[90px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 p-12 lg:p-20 flex flex-col h-full justify-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/30">
              <BedDouble className="text-white w-8 h-8" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Hotel San José<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">del Guaviare</span>
            </h1>

            <div className="h-28 lg:h-20 mb-10">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPhrase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-slate-300 text-lg lg:text-xl max-w-xl leading-relaxed font-light"
                >
                  {phrases[currentPhrase]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-2xl">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.05] transition-colors"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg shrink-0 border border-blue-500/20">
                    <f.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{f.title}</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full md:w-1/4 relative flex flex-col justify-center px-6 sm:px-8 z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Decorative orbs */}
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/60 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-100/40 blur-[80px] pointer-events-none" />
        <div className="absolute top-[50%] left-[30%] w-[20%] h-[20%] rounded-full bg-cyan-100/30 blur-[60px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full mx-auto"
        >
          {/* Mobile logo */}
          <div className="md:hidden w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20">
            <BedDouble className="text-white w-6 h-6" />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Accede a tu panel de control hotelero.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-label="Inicio de sesión">

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                  placeholder="correo@hotelsjg.com"
                  className={cn(
                    'w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border rounded-xl text-slate-900',
                    'focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none shadow-sm',
                    errors.email ? 'border-red-400' : 'border-slate-200',
                  )}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                  placeholder="••••••••"
                  className={cn(
                    'w-full pl-12 pr-12 py-3.5 bg-white/80 backdrop-blur-sm border rounded-xl text-slate-900',
                    'focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none shadow-sm',
                    errors.password ? 'border-red-400' : 'border-slate-200',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
              className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden shadow-lg shadow-blue-600/30"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10 tracking-wide">INGRESAR AL SISTEMA</span>
                  <ArrowRight className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Conexión segura cifrada</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
