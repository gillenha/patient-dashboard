import { request } from "@/lib/api"

import type {
  Patient,
  PatientInput,
  PatientListParams,
  PatientPage,
  PatientStats,
  Note,
  NoteInput,
  PatientSummary,
} from "./types"

export const patientsApi = {
  list: (params: PatientListParams, signal?: AbortSignal) =>
    request<PatientPage>("/patients", { params, signal }),
  get: (id: number, signal?: AbortSignal) => request<Patient>(`/patients/${id}`, { signal }),
  create: (body: PatientInput) => request<Patient>("/patients", { method: "POST", body }),
  update: (id: number, body: PatientInput) =>
    request<Patient>(`/patients/${id}`, { method: "PUT", body }),
  remove: (id: number) => request<void>(`/patients/${id}`, { method: "DELETE" }),
  stats: (signal?: AbortSignal) => request<PatientStats>("/patients/stats", { signal }),
  notes: (id: number, signal?: AbortSignal) => request<Note[]>(`/patients/${id}/notes`, { signal }),
  addNote: (id: number, body: NoteInput) =>
    request<Note>(`/patients/${id}/notes`, { method: "POST", body }),
  removeNote: (id: number, noteId: number) =>
    request<void>(`/patients/${id}/notes/${noteId}`, { method: "DELETE" }),
  summary: (id: number, signal?: AbortSignal) =>
    request<PatientSummary>(`/patients/${id}/summary`, { signal }),
}
