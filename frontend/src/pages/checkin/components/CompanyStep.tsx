import { type RefObject } from 'react'
import { Search, Plus, Building2 } from 'lucide-react'
import type { Company } from '@/types'
import { cn } from '@/lib/cn'
import { inputCls, inputStyle } from '@/pages/checkin/constants'
import { CompanyResultList } from '@/pages/checkin/components/WizardFieldComponents'

interface CompanyStepProps {
  readonly guestInputRef: RefObject<HTMLInputElement | null>
  readonly isNewCompany: boolean
  readonly newCompany: { name: string; nit: string; phone: string; email: string; contact_name: string }
  readonly company: Company | null
  readonly companySearch: string
  readonly companyResults: Company[]
  readonly onNewCompanyChange: (patch: Partial<CompanyStepProps['newCompany']>) => void
  readonly onCompanySearchChange: (value: string) => void
  readonly onSelectCompany: (company: Company) => void
  readonly onClearCompany: () => void
  readonly onStartNewCompany: () => void
  readonly onBackToSearch: () => void
}

export function CompanyStep({
  guestInputRef,
  isNewCompany,
  newCompany,
  company,
  companySearch,
  companyResults,
  onNewCompanyChange,
  onCompanySearchChange,
  onSelectCompany,
  onClearCompany,
  onStartNewCompany,
  onBackToSearch,
}: CompanyStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        EMPRESA
      </p>

      {isNewCompany ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                ref={guestInputRef}
                placeholder="Nombre de la empresa *"
                value={newCompany.name}
                onChange={(e) => onNewCompanyChange({ name: e.target.value })}
                className={cn('w-full', inputCls)}
                style={inputStyle}
              />
            </div>
            <input
              placeholder="NIT *"
              value={newCompany.nit}
              onChange={(e) => onNewCompanyChange({ nit: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
            <input
              placeholder="Teléfono"
              value={newCompany.phone}
              onChange={(e) => onNewCompanyChange({ phone: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              value={newCompany.email}
              onChange={(e) => onNewCompanyChange({ email: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
            <input
              placeholder="Persona de contacto"
              value={newCompany.contact_name}
              onChange={(e) => onNewCompanyChange({ contact_name: e.target.value })}
              className={cn('col-span-2', inputCls)}
              style={inputStyle}
            />
          </div>
          <button
            type="button"
            onClick={onBackToSearch}
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Buscar empresa existente
          </button>
        </>
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={guestInputRef}
              type="text"
              placeholder="Buscar empresa por nombre o NIT..."
              value={companySearch}
              onChange={(e) => onCompanySearchChange(e.target.value)}
              className={cn('w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none')}
              style={inputStyle}
            />
          </div>

          {companyResults.length > 0 && !company && (
            <CompanyResultList companies={companyResults} onSelect={onSelectCompany} />
          )}

          {company && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #93C5FD' }}>
              <Building2 size={20} style={{ color: '#3B82F6' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{company.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>NIT {company.nit}</p>
              </div>
              <button
                type="button"
                className="ml-auto text-xs"
                style={{ color: 'var(--text-muted)' }}
                onClick={onClearCompany}
              >
                Cambiar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onStartNewCompany}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Nueva empresa
          </button>
        </>
      )}
    </div>
  )
}
