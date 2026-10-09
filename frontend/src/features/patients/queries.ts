import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { patientsApi } from "./api"
import type { NoteInput, PatientListParams } from "./types"

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: number) => [...patientKeys.details(), id] as const,
  // Nested under detail(id): invalidating a patient's detail also refreshes its
  // notes and summary, which depend on the profile.
  notes: (id: number) => [...patientKeys.detail(id), "notes"] as const,
  summary: (id: number) => [...patientKeys.detail(id), "summary"] as const,
  stats: () => [...patientKeys.all, "stats"] as const,
}

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: ({ signal }) => patientsApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: ({ signal }) => patientsApi.get(id, signal),
  })
}

export function usePatientStats() {
  return useQuery({
    queryKey: patientKeys.stats(),
    queryFn: ({ signal }) => patientsApi.stats(signal),
  })
}

export function usePatientNotes(patientId: number) {
  return useQuery({
    queryKey: patientKeys.notes(patientId),
    queryFn: ({ signal }) => patientsApi.notes(patientId, signal),
  })
}

export function usePatientSummary(patientId: number) {
  return useQuery({
    queryKey: patientKeys.summary(patientId),
    queryFn: ({ signal }) => patientsApi.summary(patientId, signal),
  })
}

function useInvalidateNotes(patientId: number) {
  const queryClient = useQueryClient()
  // Notes feed the summary, so both go stale together.
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: patientKeys.notes(patientId) }),
      queryClient.invalidateQueries({ queryKey: patientKeys.summary(patientId) }),
    ])
}

export function useAddNote(patientId: number) {
  const invalidate = useInvalidateNotes(patientId)
  return useMutation({
    mutationFn: (input: NoteInput) => patientsApi.addNote(patientId, input),
    onSuccess: invalidate,
  })
}

export function useDeleteNote(patientId: number) {
  const invalidate = useInvalidateNotes(patientId)
  return useMutation({
    mutationFn: (noteId: number) => patientsApi.removeNote(patientId, noteId),
    // onSettled, not onSuccess: if the note was already deleted elsewhere (404),
    // the list should still reconcile.
    onSettled: invalidate,
  })
}
