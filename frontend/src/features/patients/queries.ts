import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router"

import { patientsApi } from "./api"
import { readListSearch } from "./listState"
import type { NoteInput, PatientInput, PatientListParams } from "./types"

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

/** Totals and list pages change on every write, whichever patient it touched. */
function useInvalidateCollections() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: patientKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: patientKeys.stats() })
  }
}

/** The list query string the user arrived with, so links back land on the same filtered list. */
function useListSearch() {
  const location = useLocation()
  return readListSearch(location.state)
}

export function useCreatePatient() {
  const navigate = useNavigate()
  const invalidateCollections = useInvalidateCollections()
  const listSearch = useListSearch()
  return useMutation({
    mutationFn: (input: PatientInput) => patientsApi.create(input),
    onSuccess: (patient) => {
      invalidateCollections()
      // replace: Back from the new patient's page returns to the list, not the form.
      void navigate(`/patients/${patient.id}`, { replace: true, state: { listSearch } })
    },
  })
}

export function useUpdatePatient(patientId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const invalidateCollections = useInvalidateCollections()
  const listSearch = useListSearch()
  return useMutation({
    mutationFn: (input: PatientInput) => patientsApi.update(patientId, input),
    onSuccess: (patient) => {
      // Seed the response so the detail page renders the saved record straight away.
      queryClient.setQueryData(patientKeys.detail(patientId), patient)
      // Prefix match: also refreshes this patient's notes and summary.
      void queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) })
      invalidateCollections()
      void navigate(`/patients/${patientId}`, { replace: true, state: { listSearch } })
    },
  })
}

export function useDeletePatient(patientId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const invalidateCollections = useInvalidateCollections()
  const listSearch = useListSearch()
  return useMutation({
    mutationFn: () => patientsApi.remove(patientId),
    onSuccess: () => {
      void navigate({ pathname: "/patients", search: listSearch }, { replace: true })
      // Removed rather than invalidated: an invalidated detail query would refetch a 404.
      queryClient.removeQueries({ queryKey: patientKeys.detail(patientId) })
      invalidateCollections()
    },
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
