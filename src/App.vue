<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { weekDays, useScheduleStore } from '@/stores/schedule'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import SwipeableItem from '@/components/SwipeableItem.vue'
import ScheduleDialog from '@/components/ScheduleDialog.vue'

const store = useScheduleStore()
const { activeDay, currentSchedules } = storeToRefs(store)
const { setActiveDay } = store

function handleDelete(day: number, id: number) {
  const items = store.$state.schedules[day]
  if (!items) return
  const idx = items.findIndex((i) => i.id === id)
  if (idx !== -1) items.splice(idx, 1)
}

const scheduleDialog = ref<InstanceType<typeof ScheduleDialog> | null>(null)
</script>

<template>
  <div
    class="w-screen h-screen flex flex-col items-center mx-auto bg-[#f2f2f7] overflow-y-auto"
    style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom)"
  >
    <Accordion type="single" collapsible class="w-90">
      <AccordionItem value="week-picker" class="border-none">
        <AccordionTrigger class="mx-auto w-50 flex-none pt-0 pb-2.5 [&>svg]:hidden">
          <div
            class="w-50 h-12.5 bg-white text-center leading-12.5 text-2xl rounded-[20px] font-bold shadow-sm cursor-pointer select-none"
          >
            星期{{ weekDays[activeDay] }}
          </div>
        </AccordionTrigger>
        <AccordionContent class="text-base pb-0">
          <div class="flex justify-evenly items-center w-90 h-20 bg-white rounded-[20px] shadow-sm">
            <div
              v-for="(day, i) in weekDays"
              :key="i"
              class="w-10 h-10 rounded-full text-center leading-10 cursor-pointer select-none transition"
              :class="activeDay === i ? 'bg-[#0088FF] text-white' : 'bg-[#E0F0FF] text-[#0088FF]'"
              @click="setActiveDay(i)"
            >
              {{ day }}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <div
      v-if="currentSchedules.length === 0"
      class="flex flex-col items-center justify-center w-90 mt-50 text-center"
    >
      <div class="text-5xl mb-4">📋</div>
      <p class="text-gray-500 text-lg font-medium">暂无日程</p>
      <p class="text-gray-400 text-sm mt-1">点击下方 + 按钮增添你的日程</p>
    </div>

    <SwipeableItem
      v-for="item in currentSchedules"
      :key="item.id"
      class="w-90 mt-7.5 shadow-sm"
      @tap="scheduleDialog?.openEdit(item)"
      @swipe-delete="handleDelete(activeDay, item.id)"
    >
      <div
        class="flex shrink-0 w-90 h-25 bg-white text-center leading-25 text-2xl rounded-2xl font-bold overflow-hidden"
      >
        <div class="w-1/2 h-full text-start pl-2.5 leading-25 text-xl text-[#0088ff] font-normal">
          {{ item.time }}
        </div>
        <div class="w-1/2 h-full text-start leading-25 text-xl font-normal">
          {{ item.activity }}
        </div>
      </div>
    </SwipeableItem>

    <button
      class="fixed bottom-12.5 w-12.5 h-12.5 bg-white text-[#0088ff] text-center leading-12.5 text-2xl rounded-full font-bold cursor-pointer select-none shadow-sm active:scale-95 transition-transform z-10"
      @click="scheduleDialog?.openAdd()"
    >
      +
    </button>

    <ScheduleDialog ref="scheduleDialog" />
  </div>
</template>

<style scoped></style>
