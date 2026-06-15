export interface HotelInfo {
  id: string
  name: string
  nit: string
  address: string | null
  phone: string | null
  email: string | null
  city: string | null
  country: string | null
  logo_url: string | null
  check_in_time?: string | null
  check_out_time?: string | null
  late_checkout_fee?: string | null
  currency?: string | null
  tax_rate?: string | null
}

export type HotelInfoPayload = Pick<
  HotelInfo,
  'name' | 'nit' | 'address' | 'phone' | 'email' | 'city' | 'country'
>

export interface HotelLogoUploadResult {
  logo_path: string
  logo_url: string
}
