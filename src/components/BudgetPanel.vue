<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Transaction, BudgetStatus, ExpenseCategory } from '../types'
import { EXPENSE_CATEGORIES } from '../types'
import { setBudget, getBudgetStatuses, formatMoney } from '../utils/storage'

const props = defineProps<{
  transactions: Transaction[]
  currentMonth: string
}>()

const editingCategory = ref<ExpenseCategory | null>(null)
const budgetInput = ref('')
const refreshKey = ref(0)

const budgetStatuses = computed(() => {
  refreshKey.value
  return getBudgetStatuses(props.transactions, props.currentMonth)
})

function getWarningColor(level: string): string {
  switch (level) {
    case 'danger': return '#f44336'
    case 'warning': return '#ff9800'
    default: return '#4CAF50'
  }
}

function getProgressColor(level: string): string {
  switch (level) {
    case 'danger': return 'linear-gradient(90deg, #f44336, #e53935)'
    case 'warning': return 'linear-gradient(90deg, #ff9800, #f57c00)'
    default: return 'linear-gradient(90deg, #4CAF50, #43A047)'
  }
}

function startEdit(category: ExpenseCategory, currentBudget: number) {
  editingCategory.value = category
  budgetInput.value = currentBudget > 0 ? String(currentBudget) : ''
}

function saveBudget(category: ExpenseCategory) {
  const amount = parseFloat(budgetInput.value) || 0
  setBudget(category, props.currentMonth, amount)
  editingCategory.value = null
  budgetInput.value = ''
  refreshKey.value++
}

function cancelEdit() {
  editingCategory.value = null
  budgetInput.value = ''
}

function getCategoryInfo(category: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find(c => c.value === category)!
}
</script>

<template>
  <div class="budget-panel">
    <div class="panel-header">
      <h3 class="panel-title">📊 预算管理</h3>
    </div>

    <div class="budget-list">
      <div 
        v-for="status in budgetStatuses" 
        :key="status.category"
        class="budget-item"
        :class="status.warningLevel"
      >
        <div class="budget-header">
          <div class="category-info">
            <span class="category-icon">{{ getCategoryInfo(status.category).icon }}</span>
            <span class="category-name">{{ getCategoryInfo(status.category).label }}</span>
          </div>
          <button 
            v-if="editingCategory !== status.category"
            class="edit-btn"
            @click="startEdit(status.category, status.budget)"
          >
            ✏️
          </button>
        </div>

        <div v-if="editingCategory === status.category" class="budget-edit">
          <input
            v-model="budgetInput"
            type="number"
            placeholder="设置预算金额"
            class="budget-input"
            min="0"
            step="0.01"
            @keyup.enter="saveBudget(status.category)"
          />
          <div class="edit-actions">
            <button class="action-btn save" @click="saveBudget(status.category)">保存</button>
            <button class="action-btn cancel" @click="cancelEdit">取消</button>
          </div>
        </div>

        <div v-else class="budget-details">
          <div v-if="status.budget > 0" class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ 
                  width: `${Math.min(status.percentage, 100)}%`,
                  background: getProgressColor(status.warningLevel)
                }"
              ></div>
            </div>
            <div class="progress-labels">
              <span class="progress-spent">已花: ¥{{ formatMoney(status.spent) }}</span>
              <span class="progress-percent" :style="{ color: getWarningColor(status.warningLevel) }">
                {{ status.percentage.toFixed(1) }}%
              </span>
            </div>
          </div>

          <div class="budget-stats">
            <div v-if="status.budget > 0" class="stat-item">
              <span class="stat-label">预算</span>
              <span class="stat-value">¥{{ formatMoney(status.budget) }}</span>
            </div>
            <div v-if="status.budget > 0" class="stat-item">
              <span class="stat-label">剩余</span>
              <span class="stat-value remaining" :class="status.warningLevel">
                ¥{{ formatMoney(status.remaining) }}
              </span>
            </div>
            <div v-if="status.budget === 0" class="no-budget">
              点击 ✏️ 设置本月预算
            </div>
          </div>

          <div v-if="status.budget > 0 && status.warningLevel !== 'normal'" class="warning-badge">
            <span v-if="status.warningLevel === 'warning'" class="warning-text warning">
              ⚠️ 已超预算80%，注意控制支出
            </span>
            <span v-if="status.warningLevel === 'danger'" class="warning-text danger">
              🚨 已超预算！请减少该类别消费
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

.panel-header {
  margin-bottom: 16px;
}

.panel-title {
  margin: 0;
  font-size: 17px;
  color: #333;
  font-weight: 600;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-item {
  padding: 16px;
  border-radius: 10px;
  border: 2px solid #f0f0f0;
  transition: all 0.2s;
}

.budget-item.warning {
  border-color: #ffe0b2;
  background: #fff8e1;
}

.budget-item.danger {
  border-color: #ffcdd2;
  background: #ffebee;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  font-size: 22px;
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.edit-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #e0e0e0;
}

.budget-edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.budget-input {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.budget-input:focus {
  border-color: #4CAF50;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn.save {
  background: #4CAF50;
  color: white;
}

.action-btn.save:hover {
  background: #43A047;
}

.action-btn.cancel {
  background: #e0e0e0;
  color: #666;
}

.action-btn.cancel:hover {
  background: #bdbdbd;
}

.budget-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.progress-spent {
  color: #666;
}

.progress-percent {
  font-weight: 600;
}

.budget-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.stat-value.remaining.normal {
  color: #4CAF50;
}

.stat-value.remaining.warning {
  color: #ff9800;
}

.stat-value.remaining.danger {
  color: #f44336;
}

.no-budget {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 8px;
}

.warning-badge {
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.warning-text {
  font-size: 13px;
  font-weight: 500;
}

.warning-text.warning {
  color: #f57c00;
}

.warning-text.danger {
  color: #d32f2f;
}
</style>
