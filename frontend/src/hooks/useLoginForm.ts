import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type LoginFormData = z.infer<typeof schema>

export function useLoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await login(data)
      if (res.success) navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Credenciales incorrectas'
      toast.error(msg)
    }
  }

  return {
    register:    form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors:       form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
  }
}
