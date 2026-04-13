<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Budget, BudgetStatus, ExpenseCategory } from '../types'
import { EXPENSE_CATEGORIES } from '../types'
import { formatMoney } from '../utils/storage'

const props = defineProps<{
  budgetStatuses: BudgetStatus[]
  currentMonth: string
}>()

const emit = defineEmits<{
  (e: 'updateBudget', budget: Budget): void
}>()

const showBudgetForm = ref(false)
const selectedCategory = ref<ExpenseCategory>('catering')
const budgetAmount = ref<number>(0)

const categoriesWithBudget = computed(() => {
  return EXPENSE_CATEGORIES.map(cat => {
    const status = props.budgetStatuses.find(s => s.category === cat.value)
    return {
      ...cat,
      status: status || null,
    }
  })
})

function openBudgetForm(category?: ExpenseCategory) {
  if (category) {
    selectedCategory.value = category
    const existing = props.budgetStatuses.find(s => s.category === category)
    budgetAmount.value = existing?.budget || 0
  } else {
    selectedCategory.value = 'catering'
    budgetAmount.value = 0
  }
  showBudgetForm.value = true
}

function saveBudget() {
  if (budgetAmount.value <= 0) {
    alert('请输入有效的预算金额')
    return
  }

  const budget: Budget = {
    category: selectedCategory.value,
    limit: budgetAmount.value,
    month: props.currentMonth,
  }

  emit('updateBudget', budget)
  showBudgetForm.value = false
}

function getProgressColor(status: BudgetStatus): string {
  if (status.warningLevel === 'danger') return '#f44336'
  if (status.warningLevel === 'warning') return '#ff9800'
  return '#4CAF50'
}

function getProgressBgColor(status: BudgetStatus): string {
  if (status.warningLevel === 'danger') return '#ffebee'
  if (status.warningLevel === 'warning') return '#fff3e0'
  return '#e8f5e9'
}
</script>

<template>
  <div class="budget-panel">
    <div class="panel-header">
      <h3>📊 预算管理</h3>
      <button class="add-budget-btn" @click="openBudgetForm()">+ 设置预算</button>
    </div>

    <div class="budget-list">
      <div 
        v-for="cat in categoriesWithBudget" 
        :key="cat.value"
        class="budget-item"
        :class="{ 'has-budget': cat.status?.budget }"
      >
        <div class="budget-header">
          <span class="category-icon">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.label }}</span>
          <button 
            v-if="cat.status?.budget" 
            class="edit-btn"
            @click="openBudgetForm(cat.value)"
          >编辑</button>
        </div>

        <div v-if="cat.status?.budget" class="budget-details">
          <div class="budget-info">
            <span class="spent">已支出: ¥{{ formatMoney(cat.status.spent) }}</span>
            <span class="budget">预算: ¥{{ formatMoney(cat.status.budget) }}</span>
          </div>

          <div class="progress-container">
            <div 
              class="progress-bar"
              :style="{ 
                width: Math.min(cat.status.percentage, 100) + '%',
                backgroundColor: getProgressColor(cat.status)
              }"
            ></div>
          </div>

          <div class="budget-footer">
            <span 
              class="remaining"
              :style="{ color: getProgressColor(cat.status) }"
            >
              剩余: ¥{{ formatMoney(Math.max(0, cat.status.remaining)) }}
            </span>
            <span 
              class="percentage"
              :class="cat.status.warningLevel"
            >
              {{ cat.status.percentage.toFixed(1) }}%
            </span>
          </div>

          <div 
            v-if="cat.status.warningLevel === 'warning'" 
            class="warning-message warning"
          >
            ⚠️ 支出已达预算80%，请注意控制
          </div>
          <div 
            v-if="cat.status.warningLevel === 'danger'" 
            class="warning-message danger"
          >
            🚨 已超出预算！超支 ¥{{ formatMoney(cat.status.spent - cat.status.budget) }}
          </div>
        </div>

        <div v-else class="no-budget">
          <span>未设置预算</span>
          <button class="set-btn" @click="openBudgetForm(cat.value)">设置</button>
        </div>
      </div>
    </div>

    <div v-if="showBudgetForm" class="modal-overlay" @click.self="showBudgetForm = false">
      <div class="modal">
        <div class="modal-content">
          <h4>设置预算</h4>
          
          <div class="form-group">
            <label>支出类别</label>
            <select v-model="selectedCategory">
              <option 
                v-for="cat in EXPENSE_CATEGORIES" 
                :key="cat.value" 
                :value="cat.value"
              >
                {{ cat.icon }} {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>月度预算额度 (¥)</label>
            <input 
              type="number" 
              v-model.number="budgetAmount" 
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div class="form-actions">
            <button class="btn-cancel" @click="showBudgetForm = false">取消</button>
            <button class="btn-save" @click="saveBudget">保存</button>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.add-budget-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-budget-btn:hover {
  background: #43A047;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-item {
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.budget-item.has-budget {
  background: white;
  border: 1px solid #e0e0e0;
}

.budget-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  font-size: 20px;
}

.category-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.edit-btn {
  padding: 4px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #e0e0e0;
}

.budget-details {
  margin-top: 12px;
}

.budget-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.progress-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s, background-color 0.3s;
}

.budget-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 13px;
}

.remaining {
  font-weight: 500;
}

.percentage {
  color: #666;
}

.percentage.warning {
  color: #ff9800;
  font-weight: 500;
}

.percentage.danger {
  color: #f44336;
  font-weight: 500;
}

.warning-message {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.warning-message.warning {
  background: #fff3e0;
  color: #e65100;
}

.warning-message.danger {
  background: #ffebee;
  color: #c62828;
}

.no-budget {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #999;
}

.set-btn {
  padding: 4px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.set-btn:hover {
  background: #43A047;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 360px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.modal-content h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group select:focus,
.form-group input:focus {
  border-color: #4CAF50;
  outline: none;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save {
  background: #4CAF50;
  color: white;
}

.btn-save:hover {
  background: #43A047;
}
</style>
