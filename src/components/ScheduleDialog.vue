<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { weekDays, useScheduleStore, type ScheduleItem } from '@/stores/schedule'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const store = useScheduleStore()
const { activeDay } = storeToRefs(store)
const { addItem } = store

const newTimeStart = ref('')
const newTimeEnd = ref('')
const newActivity = ref('')
const dialogDays = ref<number[]>([0])
const editingId = ref<number | null>(null)
const editingLinkId = ref<number | undefined>(undefined)
const isDialogOpen = ref(false)

const isEditing = computed(() => editingId.value !== null)
const showAuthorDialog = ref(false)

function getSchedules() {
  return store.$state.schedules
}

function findDaysByLinkId(linkId: number): number[] {
  const s = getSchedules()
  const days: number[] = []
  for (let d = 0; d < 7; d++) {
    if (s[d] && s[d]!.some((i) => i.linkId === linkId)) {
      days.push(d)
    }
  }
  return days
}

function toggleDay(i: number) {
  const idx = dialogDays.value.indexOf(i)
  if (idx === -1) {
    dialogDays.value.push(i)
  } else if (dialogDays.value.length > 1) {
    dialogDays.value.splice(idx, 1)
  }
}

function handleSubmit() {
  if (!newTimeStart.value || !newTimeEnd.value || !newActivity.value) return
  const timeStr = `${newTimeStart.value}-${newTimeEnd.value}`
  const s = getSchedules()
  if (isEditing.value) {
    if (editingLinkId.value) {
      const existingDays = findDaysByLinkId(editingLinkId.value)
      for (const d of existingDays) {
        const items = s[d]!
        const item = items.find((i) => i.linkId === editingLinkId.value)
        if (!item) continue
        if (dialogDays.value.includes(d)) {
          item.time = timeStr
          item.activity = newActivity.value
        } else {
          items.splice(items.indexOf(item), 1)
        }
      }
      for (const d of dialogDays.value) {
        if (!existingDays.includes(d)) {
          addItem(d, timeStr, newActivity.value, editingLinkId.value)
        }
      }
    } else {
      const linkId = Date.now()
      const dayItems = s[activeDay.value]
      const original = dayItems && dayItems.find((i) => i.id === editingId.value)
      if (original) {
        original.linkId = linkId
        original.time = timeStr
        original.activity = newActivity.value
      }
      for (const d of dialogDays.value) {
        if (d !== activeDay.value) {
          addItem(d, timeStr, newActivity.value, linkId)
        }
      }
    }
  } else {
    if (newActivity.value === '作者信息') {
      showAuthorDialog.value = true
      return
    }
    const linkId = Date.now()
    for (const day of dialogDays.value) {
      addItem(day, timeStr, newActivity.value, linkId)
    }
  }
  reset()
}

function reset() {
  newTimeStart.value = ''
  newTimeEnd.value = ''
  newActivity.value = ''
  dialogDays.value = [activeDay.value]
  editingId.value = null
  editingLinkId.value = undefined
  isDialogOpen.value = false
}

function openAdd() {
  dialogDays.value = [activeDay.value]
  newTimeStart.value = ''
  newTimeEnd.value = ''
  newActivity.value = ''
  editingId.value = null
  editingLinkId.value = undefined
  isDialogOpen.value = true
}

function openEdit(item: ScheduleItem) {
  const parts = item.time.split('-')
  newTimeStart.value = parts[0] || ''
  newTimeEnd.value = parts[1] || ''
  newActivity.value = item.activity
  editingId.value = item.id
  editingLinkId.value = item.linkId

  const s = getSchedules()
  const days: number[] = []
  if (item.linkId) {
    for (let d = 0; d < 7; d++) {
      if (s[d] && s[d]!.some((i) => i.linkId === item.linkId)) {
        days.push(d)
      }
    }
  } else {
    for (let d = 0; d < 7; d++) {
      if (s[d] && s[d]!.some((i) => i.time === item.time && i.activity === item.activity)) {
        days.push(d)
      }
    }
  }
  dialogDays.value = days.length > 0 ? days : [activeDay.value]
  isDialogOpen.value = true
}

defineExpose({ openAdd, openEdit })
</script>

<template>
  <!-- 作者信息弹窗 -->
  <Dialog v-model:open="showAuthorDialog">
    <DialogContent class="w-80 rounded-2xl">
      <DialogHeader>
        <DialogTitle>作者信息</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col items-center gap-4 py-4">
        <div class="text-4xl">👨‍💻</div>
        <p class="text-lg text-gray-700 font-medium">作者为赵文浩</p>
      </div>
      <div class="flex justify-end">
        <DialogClose as-child>
          <Button>确定</Button>
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>

  <template>
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="w-90 rounded-2xl" @open-auto-focus.prevent>
        <DialogHeader>
          <DialogTitle>{{ isEditing ? '修改日程' : '添加日程' }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <!-- 星期选择 -->
          <div>
            <label class="text-sm text-gray-500 mb-2 block">选择日期（可多选）</label>
            <div class="flex justify-evenly items-center h-10 bg-gray-100 rounded-lg">
              <div
                v-for="(day, i) in weekDays"
                :key="i"
                class="w-8 h-8 rounded-full text-center leading-8 text-sm cursor-pointer select-none transition"
                :class="dialogDays.includes(i) ? 'bg-[#0088FF] text-white' : 'text-gray-600'"
                @click="toggleDay(i)"
              >
                {{ day }}
              </div>
            </div>
          </div>
          <!-- 时间选择 -->
          <div>
            <label class="text-sm text-gray-500 mb-2 block">选择时间</label>
            <div class="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
              <input
                type="time"
                v-model="newTimeStart"
                class="flex-1 h-10 rounded-xl border-0 bg-white px-3 text-base outline-none text-center cursor-pointer"
              />
              <span class="text-gray-400 text-lg font-light">—</span>
              <input
                type="time"
                v-model="newTimeEnd"
                class="flex-1 h-10 rounded-xl border-0 bg-white px-3 text-base outline-none text-center cursor-pointer"
              />
            </div>
          </div>
          <!-- 活动填写 -->
          <div>
            <label class="text-sm text-gray-500 mb-2 block">活动内容</label>
            <input
              v-model="newActivity"
              placeholder="输入活动内容"
              class="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#0088ff]"
            />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-4">
          <DialogClose as-child>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button :disabled="!newTimeStart || !newTimeEnd || !newActivity" @click="handleSubmit">{{
            isEditing ? '保存' : '添加'
          }}</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 作者信息弹窗 -->
    <Dialog v-model:open="showAuthorDialog">
      <DialogContent class="w-80 rounded-2xl">
        <DialogHeader>
          <DialogTitle>作者信息</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col items-center gap-4 py-4">
          <div class="text-4xl">👨‍💻</div>
          <p class="text-lg text-gray-700 font-medium">作者为赵文浩</p>
        </div>
        <div class="flex justify-end">
          <DialogClose as-child>
            <Button>确定</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  </template>
</template>
