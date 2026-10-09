import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { patientsApi } from "./api"
import type { PatientListParams } from "./types"

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: number) => [...patientKeys.details(), id] as const,
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
