<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

const props = defineProps<{
  /** implemented | in-progress | planned */
  value: "implemented" | "in-progress" | "planned";
  /** ใช้ต่อท้ายหัวข้อ ## แทนที่จะเป็นแถวของตัวเอง */
  inline?: boolean;
  /** ข้อความเสริม เช่น "ยังไม่ได้ตั้ง genReqId" */
  note?: string;
}>();

const { lang } = useData();

const LABELS = {
  implemented: { icon: "✅", th: "ทำแล้ว", en: "Implemented" },
  "in-progress": { icon: "🚧", th: "ทำบางส่วน", en: "In progress" },
  planned: { icon: "📋", th: "ยังเป็นสเปก", en: "Planned" },
} as const;

const entry = computed(() => LABELS[props.value] ?? LABELS.planned);
const text = computed(() => (lang.value.startsWith("th") ? entry.value.th : entry.value.en));
</script>

<template>
  <span class="ap-status" :class="[`ap-status--${value}`, { 'ap-status--inline': inline }]">
    <span class="ap-status__icon" aria-hidden="true">{{ entry.icon }}</span>
    <span>{{ text }}</span>
    <span v-if="note" class="ap-status__note">— {{ note }}</span>
  </span>
</template>

<style scoped>
.ap-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.6;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  vertical-align: middle;
}

.ap-status--inline {
  font-size: 0.75rem;
  margin-inline-start: 0.5rem;
}

.ap-status--implemented {
  border-color: var(--vp-c-success-soft);
  background: var(--vp-c-success-soft);
  color: var(--vp-c-success-1);
}

.ap-status--in-progress {
  border-color: var(--vp-c-warning-soft);
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

.ap-status--planned {
  border-color: var(--vp-c-default-soft);
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.ap-status__note {
  font-weight: 400;
  opacity: 0.85;
}
</style>
