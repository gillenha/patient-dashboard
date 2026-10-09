import { request } from "@/lib/api"

import type { Patient, PatientInput, PatientListParams, PatientPage } from "./types"

export const patientsApi = {
  list: (params: PatientListParams, signal?: AbortSignal) =>
    request<PatientPage>("/patients", { params, signal }),
  get: (id: number, signal?: AbortSignal) => request<Patient>(`/patients/${id}`, { signal }),
  create: (body: PatientInput) => request<Patient>("/patients", { method: "POST", body }),
  update: (id: number, body: PatientInput) =>
    request<Patient>(`/patients/${id}`, { method: "PUT", body }),
  remove: (id: number) => request<void>(`/patients/${id}`, { method: "DELETE" }),
}
