import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getSettingsApi, updateSettingsApi, type SettingsMap } from '@/services/settings.service'

export function useSettings(group: string) {
  const queryClient = useQueryClient()
  const [unsaved, setUnsaved] = useState<SettingsMap>({})

  const { data, isLoading } = useQuery({
    queryKey: ['settings', group],
    queryFn:  () => getSettingsApi(group),
  })

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: updateSettingsApi,
    onSuccess: () => {
      toast.success('Configuración guardada.')
      setUnsaved({})
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: () => toast.error('Error al guardar.'),
  })

  const handleChange = (key: string, value: string) =>
    setUnsaved((prev) => ({ ...prev, [key]: value }))

  const handleDiscard = () => setUnsaved({})

  const handleSave = () => save(unsaved)

  return {
    data:        { ...data, ...unsaved },
    isLoading,
    unsaved,
    hasUnsaved:  Object.keys(unsaved).length > 0,
    isSaving,
    handleChange,
    handleDiscard,
    handleSave,
  }
}
