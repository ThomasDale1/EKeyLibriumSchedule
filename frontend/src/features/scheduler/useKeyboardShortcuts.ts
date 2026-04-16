import { useEffect } from 'react'
import { useScheduleStore, selectActiveSchedule } from './store'
import { TOTAL_SLOTS } from './constants'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function useKeyboardShortcuts() {
  const selectedBlockId = useScheduleStore((s) => s.selectedBlockId)
  const selectBlock = useScheduleStore((s) => s.selectBlock)
  const removeBlock = useScheduleStore((s) => s.removeBlock)
  const toggleLock = useScheduleStore((s) => s.toggleLock)
  const duplicateBlock = useScheduleStore((s) => s.duplicateBlock)
  const moveBlock = useScheduleStore((s) => s.moveBlock)
  const resizeBlock = useScheduleStore((s) => s.resizeBlock)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isEditable(e.target)) return

      if (e.key === 'Escape') {
        selectBlock(null)
        return
      }

      if (!selectedBlockId) return
      const state = useScheduleStore.getState()
      const schedule = selectActiveSchedule(state)
      const block = schedule.blocks.find((b) => b.id === selectedBlockId)
      if (!block) return

      const key = e.key.toLowerCase()

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeBlock(block.id)
        return
      }
      if (key === 'l') {
        e.preventDefault()
        toggleLock(block.id)
        return
      }
      if (key === 'd' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const newStart = Math.min(block.startSlot + block.duration, TOTAL_SLOTS - block.duration)
        duplicateBlock(block.id, block.day, newStart)
        return
      }

      if (block.locked) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (e.shiftKey) resizeBlock(block.id, block.duration - 1)
        else moveBlock(block.id, block.day, block.startSlot - 1)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (e.shiftKey) resizeBlock(block.id, block.duration + 1)
        else moveBlock(block.id, block.day, block.startSlot + 1)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        moveBlock(block.id, block.day - 1, block.startSlot)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        moveBlock(block.id, block.day + 1, block.startSlot)
        return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedBlockId, selectBlock, removeBlock, toggleLock, duplicateBlock, moveBlock, resizeBlock])
}
