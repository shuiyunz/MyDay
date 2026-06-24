<script setup lang="ts">
import { ref } from 'vue'

const SWIPE_THRESHOLD = 80
const SNAP_DURATION = 200

const translateX = ref(0)
const movedX = ref(0)
const isDragging = ref(false)
const isOpen = ref(false)
const transitioning = ref(false)

function startDrag(clientX: number) {
  movedX.value = 0
  isDragging.value = true
  transitioning.value = false
}

function moveDrag(clientX: number, startX: number) {
  if (!isDragging.value) return
  const diff = startX - clientX
  movedX.value = Math.abs(diff)
  translateX.value = Math.max(-SWIPE_THRESHOLD - 10, Math.min(0, -diff + (isOpen.value ? -SWIPE_THRESHOLD : 0)))
}

function endDrag() {
  if (!isDragging.value) return
  isDragging.value = false
  transitioning.value = true

  // Tapping to close an already-open swipe
  if (isOpen.value && movedX.value < 10) {
    translateX.value = 0
    isOpen.value = false
    setTimeout(() => { transitioning.value = false }, SNAP_DURATION)
    return
  }

  if (translateX.value < -SWIPE_THRESHOLD / 2) {
    translateX.value = -SWIPE_THRESHOLD
    isOpen.value = true
  } else {
    translateX.value = 0
    isOpen.value = false
    if (movedX.value < 10) {
      emit('tap')
    }
  }
  setTimeout(() => { transitioning.value = false }, SNAP_DURATION)
}

function closeSwipe() {
  transitioning.value = true
  translateX.value = 0
  isOpen.value = false
  setTimeout(() => { transitioning.value = false }, SNAP_DURATION)
}

// Touch events — save startX in closure variable for moveDrag
let touchStartX = 0

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  touchStartX = touch.clientX
  startDrag(touchStartX)
}

function onTouchMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  moveDrag(touch.clientX, touchStartX)
}

function onTouchEnd() { endDrag() }

let mouseStartX = 0

function onMouseDown(e: MouseEvent) {
  mouseStartX = e.clientX
  startDrag(mouseStartX)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) { moveDrag(e.clientX, mouseStartX) }

function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  endDrag()
}

const emit = defineEmits<{
  'swipe-delete': []
  tap: []
}>()

defineExpose({ closeSwipe })
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl shrink-0">
    <!-- Delete button behind -->
    <div
      class="absolute right-0 top-0 h-full flex items-center justify-center bg-red-500 text-white text-sm font-bold cursor-pointer select-none rounded-r-2xl"
      style="width: 80px"
      @click="emit('swipe-delete')"
    >
      删除
    </div>
    <!-- Swipeable content -->
    <div
      :style="{
        transform: `translateX(${translateX}px)`,
        transition: transitioning ? `transform ${SNAP_DURATION}ms ease` : 'none',
      }"
      class="relative z-10"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <slot />
    </div>
  </div>
</template>
