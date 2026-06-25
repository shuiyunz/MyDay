<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const currentHour = ref(0)
const currentMinute = ref(0)

const pickerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const hourListRef = ref<HTMLElement | null>(null)
const minuteListRef = ref<HTMLElement | null>(null)

const positionUp = ref(false)
const dropdownPos = ref({ top: 0, left: 0, width: 280, maxHeight: 400 })

/* ===================== 常量 ===================== */
const ITEM_HEIGHT = 36
const VISIBLE_ITEMS = 5
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS // 180
const PADDING_COUNT = 2
const PADDING_HEIGHT = PADDING_COUNT * ITEM_HEIGHT // 72

const REPEAT = 51 // 大量副本，用户几乎滚不到边界

// 中段副本的起始索引 = 中间的那个副本
const HALF = Math.floor(REPEAT / 2)
const MIDDLE_COPY_H = HALF * 24
const MIDDLE_COPY_M = HALF * 60

const extHours = Array.from({ length: REPEAT * 24 }, (_, i) => i % 24)
const extMinutes = Array.from({ length: REPEAT * 60 }, (_, i) => i % 60)

/* ================= 滚轮数学引擎 ================= */

function detectRealValue(scrollTop: number, type: 'hour' | 'minute'): number {
  const visibleCenter = scrollTop + CONTAINER_HEIGHT / 2
  const fullIndex = Math.round((visibleCenter - ITEM_HEIGHT / 2) / ITEM_HEIGHT)
  const extIndex = fullIndex - PADDING_COUNT
  const total = type === 'hour' ? 24 : 60
  return ((extIndex % total) + total) % total
}

function scrollTopFor(value: number, type: 'hour' | 'minute'): number {
  const middleBase = type === 'hour' ? MIDDLE_COPY_H : MIDDLE_COPY_M
  const fullIndex = middleBase + value + PADDING_COUNT
  const itemCenter = fullIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2
  return itemCenter - CONTAINER_HEIGHT / 2
}

function setScrollTop(el: HTMLElement | null, value: number, type: 'hour' | 'minute') {
  if (!el) return
  el.scrollTop = scrollTopFor(value, type)
}

/* ================= 滚动事件（纯 JS 驱动，无 CSS snap） ================= */

const debounceMap: Record<string, number | null> = {
  hour: null,
  minute: null,
}

function onScroll(type: 'hour' | 'minute') {
  const el = type === 'hour' ? hourListRef.value : minuteListRef.value
  if (!el) return

  // 实时更新选中值
  const value = detectRealValue(el.scrollTop, type)
  if (type === 'hour') currentHour.value = value
  else currentMinute.value = value

  // 防抖：滚动停止后吸附到最近项（即时赋值，不做 smooth）
  if (debounceMap[type]) clearTimeout(debounceMap[type]!)
  debounceMap[type] = window.setTimeout(() => {
    const targetTop = scrollTopFor(value, type)
    if (Math.abs(el.scrollTop - targetTop) > 1) {
      el.scrollTop = targetTop
    }
  }, 120)
}

/* ================= 定位计算（基于视口） ================= */

function calcDropdownPosition() {
  if (!triggerRef.value || !pickerRef.value) return

  const pickerRect = pickerRef.value.getBoundingClientRect()
  const rect = triggerRef.value.getBoundingClientRect()
  const pw = Math.max(280, Math.min(320, window.innerWidth - 32))
  const estHeight = 320

  const below = window.innerHeight - rect.bottom - 12
  const above = rect.top - 12

  let top: number, maxH: number, up: boolean

  if (below >= estHeight || below >= above) {
    top = rect.bottom + 8
    maxH = below
    up = false
  } else {
    top = rect.top - estHeight - 8
    maxH = above
    up = true
  }

  if (top < 10) {
    top = 10
    maxH = window.innerHeight - 20
  }
  if (top + (maxH || estHeight) > window.innerHeight - 10) {
    maxH = window.innerHeight - top - 10
  }
  // 最小高度 = 顶栏(~50px) + 滚轮(228px) + 间距 ≈ 290px
  maxH = Math.max(290, Math.min(maxH, window.innerHeight - 20))

  const left = Math.max(
    10,
    Math.min(rect.left + rect.width / 2 - pw / 2, window.innerWidth - pw - 10),
  )

  // 转换为相对于 pickerRef 的坐标
  positionUp.value = up
  dropdownPos.value = {
    top: top - pickerRect.top,
    left: left - pickerRect.left,
    width: pw,
    maxHeight: maxH,
  }
}

/* ================= 状态管理 ================= */

function parseModelValue(val: string) {
  if (!val) return { hour: 0, minute: 0 }
  const parts = val.split(':')
  return {
    hour: Math.min(23, Math.max(0, parseInt(parts[0] ?? '0') || 0)),
    minute: Math.min(59, Math.max(0, parseInt(parts[1] ?? '0') || 0)),
  }
}

const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder || '-- : --'
  return props.modelValue
})

function openPicker() {
  const { hour, minute } = parseModelValue(props.modelValue)
  currentHour.value = hour
  currentMinute.value = minute
  isOpen.value = true
  nextTick(() => {
    calcDropdownPosition()
    setScrollTop(hourListRef.value, currentHour.value, 'hour')
    setScrollTop(minuteListRef.value, currentMinute.value, 'minute')
  })
}

function closePicker() {
  isOpen.value = false
}
function toggleOpen() {
  isOpen.value ? closePicker() : openPicker()
}

function selectHour(h: number) {
  currentHour.value = h
  setScrollTop(hourListRef.value, h, 'hour')
}

function selectMinute(m: number) {
  currentMinute.value = m
  setScrollTop(minuteListRef.value, m, 'minute')
}

function confirm() {
  const h = String(currentHour.value).padStart(2, '0')
  const m = String(currentMinute.value).padStart(2, '0')
  emit('update:modelValue', `${h}:${m}`)
  isOpen.value = false
}

function handleOutsideClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  // 点击在触发按钮内 → 不处理（toggle 自己处理）
  if (pickerRef.value?.contains(target)) return
  // 点击在下拉面板内 → 不处理（@click.stop 已阻止冒泡）
  if (dropdownRef.value?.contains(target)) return
  // 其他点击 → 关闭
  closePicker()
}

function onResize() {
  if (isOpen.value) calcDropdownPosition()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="pickerRef" class="relative flex-1 time-picker-wrapper">
    <!-- 触发按钮 -->
    <div
      ref="triggerRef"
      class="flex items-center justify-center h-10 rounded-xl border-0 bg-white px-3 text-base outline-none text-center cursor-pointer select-none transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
      :class="isOpen ? 'ring-2 ring-[#0088FF] shadow-sm' : 'ring-0'"
      @click="toggleOpen"
    >
      <span
        class="font-medium tracking-wider"
        :class="props.modelValue ? 'text-gray-800' : 'text-gray-400'"
        >{{ displayText }}</span
      >
      <svg
        class="w-4 h-4 ml-1.5 text-gray-400 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- 下拉面板：直接渲染在组件内 → 在 DialogContent 的 DOM 树中，不会被拦截事件 -->
    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="absolute z-[99999] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      :style="{
        top: dropdownPos.top + 'px',
        left: dropdownPos.left + 'px',
        width: dropdownPos.width + 'px',
        maxHeight: dropdownPos.maxHeight + 'px',
      }"
    >
      <!-- 顶栏 -->
      <div
        class="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-100 shrink-0"
      >
        <button
          class="text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
          @click="closePicker"
        >
          取消
        </button>
        <span class="text-sm font-semibold text-gray-700">选择时间</span>
        <button
          class="text-sm font-semibold text-[#0088FF] hover:text-[#0066CC] transition-colors"
          @click="confirm"
        >
          确定
        </button>
      </div>

      <!-- 双列滚轮 -->
      <div class="flex items-start justify-center gap-4 py-6 px-5 shrink-0">
        <!-- ===== 小时 ===== -->
        <div class="flex-1 max-w-[110px]">
          <div class="flex flex-col items-center">
            <span class="text-xs text-gray-400 mb-2 font-medium">时</span>
            <div class="relative w-full select-none">
              <div
                class="absolute top-0 left-0 right-0 h-9 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"
              />
              <div
                class="absolute bottom-0 left-0 right-0 h-9 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"
              />
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-9 bg-blue-50/60 rounded-xl z-0 pointer-events-none"
              />
              <div
                ref="hourListRef"
                class="overflow-y-auto relative z-0 hide-scrollbar"
                :style="{ height: CONTAINER_HEIGHT + 'px' }"
                @scroll="onScroll('hour')"
              >
                <div class="flex flex-col items-center shrink-0">
                  <div
                    v-for="i in PADDING_COUNT"
                    :key="'hp' + i"
                    :style="{ height: ITEM_HEIGHT + 'px' }"
                    class="shrink-0"
                  />
                  <div
                    v-for="(h, idx) in extHours"
                    :key="'h' + idx"
                    :style="{ height: ITEM_HEIGHT + 'px' }"
                    class="shrink-0 flex items-center justify-center w-full cursor-pointer select-none transition-all duration-100"
                    :class="
                      currentHour === h
                        ? 'text-[#0088FF] text-lg font-bold scale-110'
                        : 'text-gray-400 text-base'
                    "
                    @click="selectHour(h)"
                  >
                    {{ String(h).padStart(2, '0') }}
                  </div>
                  <div
                    v-for="i in PADDING_COUNT"
                    :key="'hp-b' + i"
                    :style="{ height: ITEM_HEIGHT + 'px' }"
                    class="shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 冒号 -->
        <div
          class="text-2xl font-light text-gray-300 select-none shrink-0"
          :style="{ marginTop: '52px' }"
        >
          :
        </div>

        <!-- ===== 分钟 ===== -->
        <div class="flex-1 max-w-[110px]">
          <div class="flex flex-col items-center">
            <span class="text-xs text-gray-400 mb-2 font-medium">分</span>
            <div class="relative w-full select-none">
              <div
                class="absolute top-0 left-0 right-0 h-9 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"
              />
              <div
                class="absolute bottom-0 left-0 right-0 h-9 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"
              />
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-9 bg-blue-50/60 rounded-xl z-0 pointer-events-none"
              />
              <div
                ref="minuteListRef"
                class="overflow-y-auto relative z-0 hide-scrollbar"
                :style="{ height: CONTAINER_HEIGHT + 'px' }"
                @scroll="onScroll('minute')"
              >
                <div class="flex flex-col items-center shrink-0">
                  <div
                    v-for="i in PADDING_COUNT"
                    :key="'mp' + i"
                    :style="{ height: ITEM_HEIGHT + 'px' }"
                    class="shrink-0"
                  />
                  <div
                    v-for="(m, idx) in extMinutes"
                    :key="'m' + idx"
                    :style="{ height: ITEM_HEIGHT + 'px' }"
                    class="shrink-0 flex items-center justify-center w-full cursor-pointer select-none transition-all duration-100"
                    :class="
                      currentMinute === m
                        ? 'text-[#0088FF] text-lg font-bold scale-110'
                        : 'text-gray-400 text-base'
                    "
                    @click="selectMinute(m)"
                  >
                    {{ String(m).padStart(2, '0') }}
                  </div>
                  <div
                    v-for="i in PADDING_COUNT"
                    :key="'mp-b' + i"
                    :style="{ height: ITEM_HEIGHT + 'px' }"
                    class="shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>
