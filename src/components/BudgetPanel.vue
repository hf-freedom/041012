<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BudgetStatus, ExpenseCategory } from '../types'
import { CATEGORY_ICONS } from '../types'
import { formatMoney } from '../utils/storage'

const props = defineProps<{
  budgetStatus: BudgetStatus[]
  currentMonth: string
}>()

const emit = defineEmits<{
  (e: 'updateBudget', category: ExpenseCategory, amount: number): void
}>()

const editingCategory = ref<ExpenseCategory | null>(null)
const editAmount = ref<number>(0)



const warningBudgets = computed(() => {
  return props.budgetStatus.filter(b => b.budget > 0 && b.warningLevel !== 'none')
})

function startEdit(category: ExpenseCategory, currentBudget: number) {
  editingCategory.value = category
  editAmount.value = currentBudget
}

function saveEdit(category: ExpenseCategory) {
  emit('updateBudget', category, editAmount.value)
  editingCategory.value = null
}

function cancelEdit() {
  editingCategory.value = null
}

function getProgressColor(level: string): string {
  switch (level) {
    case 'danger': return '#ff4d4f'
    case 'warning': return '#faad14'
    default: return '#52c41a'
  }
}

function getMonthDisplay(month: string): string {
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}
</script>

<template>
  <div class="budget-panel">
    <div class="budget-header">
      <h3 class="budget-title">
        <span class="title-icon">🎯</span>
        预算管理
      </h3>
      <span class="month-tag">{{ getMonthDisplay(currentMonth) }}</span>
    </div>

    <div v-if="warningBudgets.length > 0" class="warning-section">
      <div class="warning-title">⚠️ 预算预警</div>
      <div class="warning-list">
        <div 
          v-for="budget in warningBudgets" 
          :key="budget.category"
          :class="['warning-item', budget.warningLevel]"
        >
          <span class="warning-category">
            {{ CATEGORY_ICONS[budget.category] }} {{ budget.categoryLabel }}
          </span>
          <span class="warning-text">
            {{ budget.warningLevel === 'danger' ? '已超支！' : '即将超支' }}
            ({{ budget.percentage.toFixed(0) }}%)
          </span>
        </div>
      </div>
    </div>

    <div class="budget-list">
      <div 
        v-for="status in budgetStatus" 
        :key="status.category"
        class="budget-item"
      >
        <div class="budget-info">
          <span class="category-icon">{{ CATEGORY_ICONS[status.category] }}</span>
          <span class="category-name">{{ status.categoryLabel }}</span>
        </div>

        <div v-if="editingCategory === status.category" class="budget-edit">
          <input 
            v-model.number="editAmount"
            type="number"
            class="budget-input"
            placeholder="预算金额"
            min="0"
            step="100"
          />
          <button class="save-btn" @click="saveEdit(status.category)">✓</button>
          <button class="cancel-btn" @click="cancelEdit">✕</button>
        </div>

        <div v-else class="budget-display">
          <div class="budget-numbers">
            <span v-if="status.budget > 0" class="budget-amount">
              ¥{{ formatMoney(status.budget) }}
            </span>
            <span v-else class="no-budget">未设置</span>
          </div>
          <button 
            class="edit-btn"
            @click="startEdit(status.category, status.budget)"
          >
            ✏️
          </button>
        </div>

        <div v-if="status.budget > 0" class="progress-section">
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill"
              :style="{ 
                width: `${Math.min(status.percentage, 100)}%`,
                backgroundColor: getProgressColor(status.warningLevel)
              }"
            />
          </div>
          <div class="progress-info">
            <span class="spent">已用 ¥{{ formatMoney(status.spent) }}</span>
            <span 
              class="remaining"
              :class="{ negative: status.remaining < 0 }"
            >
              {{ status.remaining >= 0 ? '剩余' : '超支' }} ¥{{ formatMoney(Math.abs(status.remaining)) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.budget-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.budget-title {
  margin: 0;
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
}

.month-tag {
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 12px;
}

.warning-section {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: #d46b08;
  margin-bottom: 8px;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.warning-item.warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.warning-item.danger {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.warning-category {
  font-weight: 500;
}

.warning-text {
  font-weight: 600;
}

.warning-item.warning .warning-text {
  color: #d48806;
}

.warning-item.danger .warning-text {
  color: #cf1322;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.budget-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.category-icon {
  font-size: 18px;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.budget-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-amount {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.no-budget {
  font-size: 13px;
  color: #999;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.edit-btn:hover {
  opacity: 1;
}

.budget-edit {
  display: flex;
  gap: 6px;
  align-items: center;
}

.budget-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.budget-input:focus {
  border-color: #1890ff;
}

.save-btn, .cancel-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-btn {
  background: #52c41a;
  color: white;
}

.cancel-btn {
  background: #ff4d4f;
  color: white;
}

.progress-section {
  margin-top: 10px;
}

.progress-bar-bg {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
}

.spent {
  color: #666;
}

.remaining {
  color: #52c41a;
  font-weight: 500;
}

.remaining.negative {
  color: #ff4d4f;
}
</style>
