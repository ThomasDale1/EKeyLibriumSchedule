import { useCallback, useEffect, useRef, useState } from 'react'
import { useScheduleStore, useActiveSchedule, type Schedule } from './store'
import {
  usePlanList,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  planToSchedule,
  scheduleToPlanBody,
} from './useScheduleApi'

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'offline'

const AUTO_SAVE_DELAY_MS = 3000

// Helper to detect if a schedule ID is from remote (server) or local
function isRemoteId(id: string): boolean {
  return !id.startsWith('local_')
}

export function useScheduleSync() {
  const schedules = useScheduleStore((s) => s.schedules)
  const activeSchedule = useActiveSchedule()
  const setActiveSchedule = useScheduleStore((s) => s.setActiveSchedule)

  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const planList = usePlanList(true)
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const deletePlanMut = useDeletePlan()

  // Track if any remote plan was loaded (to avoid overwriting backend with mock data)
  const hasRemotePlans = (planList.data?.length ?? 0) > 0

  // ── Hydrate from backend on first successful fetch ──
  useEffect(() => {
    if (hydrated || !planList.isSuccess || !planList.data) return
    const plans = planList.data
    if (plans.length === 0) {
      setHydrated(true)
      return
    }
    const converted = plans.map(planToSchedule)
    useScheduleStore.setState({
      schedules: converted,
      activeScheduleId: converted[0].id,
      selectedBlockId: null,
    })
    setHydrated(true)
    setStatus('idle')
  }, [hydrated, planList.isSuccess, planList.data])

  useEffect(() => {
    if (planList.isError) setStatus('offline')
  }, [planList.isError])

  // ── Auto-save with debounce ──
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSnapshotRef = useRef<string>('')
  const savingRef = useRef(false)
  const pendingSaveRef = useRef(false)

  // ── Define saveAll first so it can be used in useEffect ──
  const saveAll = useCallback(async () => {
    if (savingRef.current) {
      // Mark that a save is pending to be retried after current save completes
      pendingSaveRef.current = true
      return
    }
    savingRef.current = true
    setStatus('saving')
    try {
      const currentSchedules = useScheduleStore.getState().schedules
      for (const schedule of currentSchedules) {
        const body = scheduleToPlanBody(schedule)
        if (isRemoteId(schedule.id)) {
          await updatePlan.mutateAsync({ id: schedule.id, data: body })
        } else {
          const created = await createPlan.mutateAsync({
            nombre: body.nombre,
            bloques: body.bloques,
            notas: body.notas ?? undefined,
          })
          // Replace local ID with server-assigned ID
          useScheduleStore.setState((s) => ({
            schedules: s.schedules.map((sch) =>
              sch.id === schedule.id ? { ...sch, id: created.id } : sch
            ),
            activeScheduleId:
              s.activeScheduleId === schedule.id ? created.id : s.activeScheduleId,
          }))
        }
      }
      setStatus('saved')
      setLastSaved(Date.now())
    } catch {
      setStatus('error')
    } finally {
      savingRef.current = false
      // If changes arrived while saving, retry now
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        await saveAll()
      }
    }
  }, [createPlan, updatePlan])

  useEffect(() => {
    if (!hydrated || !hasRemotePlans) return

    const snapshot = JSON.stringify(schedules.map((s) => ({ id: s.id, name: s.name, blocks: s.blocks, notes: s.notes })))
    if (snapshot === prevSnapshotRef.current) return
    prevSnapshotRef.current = snapshot

    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('idle')

    timerRef.current = setTimeout(() => {
      saveAll()
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [hydrated, hasRemotePlans, schedules, saveAll])

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    saveAll()
  }, [saveAll])

  const deletePlan = useCallback(
    async (id: string) => {
      if (isRemoteId(id)) {
        try {
          await deletePlanMut.mutateAsync(id)
        } catch {
          // If delete fails on server (e.g. already deleted), continue locally
        }
      }
      useScheduleStore.getState().deleteSchedule(id)
    },
    [deletePlanMut]
  )

  return {
    status,
    lastSaved,
    hydrated,
    hasRemotePlans,
    saveNow,
    deletePlan,
    isLoading: planList.isLoading,
  }
}
