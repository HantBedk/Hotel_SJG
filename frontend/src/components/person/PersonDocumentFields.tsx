import type { DocumentType } from '@/types'
import { FormField } from './FormField'
import { NationalitySelect } from './NationalitySelect'
import { DOCUMENT_TYPE_OPTIONS } from './documentTypes'
import { personInputClass, personInputStyle } from './personFormStyles'

interface PersonDocumentFieldsProps {
  readonly idPrefix?: string
  readonly documentType: DocumentType
  readonly documentNumber: string
  readonly nationalityId: string
  readonly documentNumberError?: string
  readonly onDocumentTypeChange: (type: DocumentType) => void
  readonly onDocumentNumberChange: (value: string) => void
  readonly onNationalityChange: (nationalityId: string) => void
}

export function PersonDocumentFields({
  idPrefix = 'person-doc',
  documentType,
  documentNumber,
  nationalityId,
  documentNumberError,
  onDocumentTypeChange,
  onDocumentNumberChange,
  onNationalityChange,
}: PersonDocumentFieldsProps) {
  const typeId = `${idPrefix}-type`
  const numberId = `${idPrefix}-number`
  const nationalityIdField = `${idPrefix}-nationality`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField id={typeId} label="Tipo de documento" required>
        <select
          id={typeId}
          value={documentType}
          onChange={(e) => {
            const next = DOCUMENT_TYPE_OPTIONS.find((d) => d.value === e.target.value)?.value ?? 'cc'
            onDocumentTypeChange(next)
          }}
          className={personInputClass}
          style={personInputStyle}
        >
          {DOCUMENT_TYPE_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </FormField>

      <FormField
        id={numberId}
        label="Número de documento"
        required
        error={documentNumberError}
      >
        <input
          id={numberId}
          type="text"
          autoComplete="off"
          value={documentNumber}
          onChange={(e) => onDocumentNumberChange(e.target.value)}
          className={personInputClass}
          style={personInputStyle}
        />
      </FormField>

      <FormField id={nationalityIdField} label="Nacionalidad" className="sm:col-span-2">
        <NationalitySelect
          id={nationalityIdField}
          value={nationalityId}
          onChange={onNationalityChange}
          withLabel={false}
        />
      </FormField>
    </div>
  )
}
