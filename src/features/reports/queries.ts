import { useQuery } from '@tanstack/react-query'

import { reportApi, type ReportParams } from './api'

/**
 * Reports are read-only and derived from the same rows every other page reads, so
 * there is nothing to invalidate here — a mutation elsewhere already invalidates
 * the keys these depend on via the shared prefix.
 */
const reportKeys = {
  all: ['reports'] as const,
  summary: (params: object) => ['reports', 'summary', JSON.stringify(params)] as const,
  khata: (params: object) => ['reports', 'khata', JSON.stringify(params)] as const,
  loans: (params: object) => ['reports', 'loans', JSON.stringify(params)] as const,
  activity: (params: object) => ['reports', 'activity', JSON.stringify(params)] as const,
}

export function useSummaryReport(params: ReportParams) {
  return useQuery({
    queryKey: reportKeys.summary(params),
    queryFn: () => reportApi.summary(params),
    placeholderData: (previous) => previous,
  })
}

export function useKhataReport(params: ReportParams) {
  return useQuery({
    queryKey: reportKeys.khata(params),
    queryFn: () => reportApi.khata(params),
    placeholderData: (previous) => previous,
  })
}

export function useLoanReport(params: ReportParams) {
  return useQuery({
    queryKey: reportKeys.loans(params),
    queryFn: () => reportApi.loans(params),
    placeholderData: (previous) => previous,
  })
}

export function useActivityReport(params: ReportParams & { granularity?: 'daily' | 'monthly' }) {
  return useQuery({
    queryKey: reportKeys.activity(params),
    queryFn: () => reportApi.activity(params),
    placeholderData: (previous) => previous,
  })
}
