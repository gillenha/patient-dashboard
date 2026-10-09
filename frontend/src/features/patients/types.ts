export const PATIENT_STATUSES = ["active", "inactive", "discharged"] as const
export type PatientStatus = (typeof PATIENT_STATUSES)[number]

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const
export type BloodType = (typeof BLOOD_TYPES)[number]

export const SORT_FIELDS = [
  "last_name",
  "first_name",
  "age",
  "last_visit",
  "status",
  "created_at",
] as const
export type SortField = (typeof SORT_FIELDS)[number]
export type SortOrder = "asc" | "desc"

export type PatientListItem = {
  id: number
  first_name: string
  last_name: string
  email: string
  date_of_birth: string
  age: number
  status: PatientStatus
  last_visit: string | null
}

export type Patient = {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
  age: number
  email: string
  phone: string
  address_line1: string
  city: string
  state: string
  postal_code: string
  blood_type: BloodType
  allergies: string[]
  conditions: string[]
  status: PatientStatus
  last_visit: string | null
  created_at: string
  updated_at: string
}

/** Body for POST and PUT. */
export type PatientInput = Omit<Patient, "id" | "age" | "created_at" | "updated_at">

export type PatientPage = {
  items: PatientListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type PatientListParams = {
  q?: string
  status?: PatientStatus
  sort_by?: SortField
  order?: SortOrder
  page?: number
  page_size?: number
}
