export interface Setting {
  key: string
  value: string
  type: 'string' | 'boolean' | 'integer' | 'json'
  group: string
}
