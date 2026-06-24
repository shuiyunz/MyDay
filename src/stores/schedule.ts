import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export interface ScheduleItem {
  id: number
  linkId?: number
  time: string
  activity: string
}

export const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const STORAGE_KEY = 'myday-schedules-data'

function emptySchedules(): Record<number, ScheduleItem[]> {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
}

function loadFromStorage(): Record<number, ScheduleItem[]> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(data: Record<number, ScheduleItem[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // silent
  }
}

function globalMaxId(schedules: Record<number, ScheduleItem[]>): number {
  let max = 0
  for (let d = 0; d < 7; d++) {
    const items = schedules[d]
    if (items) {
      items.forEach(i => { if (i.id > max) max = i.id })
    }
  }
  return max
}

export const useScheduleStore = defineStore('schedule', () => {
  const today = (new Date().getDay() + 6) % 7
  const activeDay = ref(today)

  const saved = loadFromStorage()
  const schedules = ref<Record<number, ScheduleItem[]>>(saved || emptySchedules())

  watch(schedules, saveToStorage, { deep: true })

  const currentSchedules = computed(() =>
    [...(schedules.value[activeDay.value] || [])].sort((a, b) => a.time.localeCompare(b.time))
  )

  function setActiveDay(i: number) {
    activeDay.value = i
  }

  function addItem(day: number, time: string, activity: string, linkId?: number) {
    const items = schedules.value[day]
    if (!items) return
    items.push({ id: globalMaxId(schedules.value) + 1, linkId, time, activity })
  }

  function updateItem(day: number, id: number, time: string, activity: string) {
    const item = schedules.value[day]?.find(i => i.id === id)
    if (item) {
      item.time = time
      item.activity = activity
    }
  }

  function removeItem(day: number, id: number) {
    const items = schedules.value[day]
    if (!items) return
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) items.splice(idx, 1)
  }

  return { activeDay, schedules, currentSchedules, setActiveDay, addItem, updateItem, removeItem }
})
