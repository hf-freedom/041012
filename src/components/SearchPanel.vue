<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Transaction, SearchFilters, TransactionType } from '../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '../types'
import { formatMoney, searchTransactions } from '../utils/storage'

const props = defineProps<{
  transactions: Transaction[]
}>()

const emit = defineEmits<{
  (e: 'edit', transaction: Transaction): void
  (e: 'delete', id: string): void
}>()

const showSearch = ref(false)

const filters = ref<SearchFilters>({
  dateRange: 'all',
  startDate: '',
  endDate: '',
  type: undefined,
  category: undefined,
  minAmount: undefined,
  maxAmount: undefined,
  keyword: ''
})

const filteredTransactions = computed(() => {
  return searchTransactions(props.transactions, filters.value)
})

const resultCount = computed(() => filteredTransactions.value.length)

const totalIncome = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalExpense = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

function resetFilters() {
  filters.value = {
    dateRange: 'all',
    startDate: '',
    endDate: '',
    type: undefined,
    category: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    keyword: ''
  }
}

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    resetFilters()
  }
}

function handleTypeChange(type: TransactionType | undefined) {
  filters.value.type = type
  filters.value.category = undefined
}

function handleDelete(id: string) {
  if (confirm('确定要删除这条记录吗？')) {
    emit('delete', id)
  }
}
</script>

<template>
  <div class="search-section">
    <button class="search-toggle-btn" @click="toggleSearch">
      <span class="search-icon">🔍</span>
      {{ showSearch ? '关闭搜索' : '智能搜索' }}
    </button>

    <div v-if="showSearch" class="search-panel">
      <div class="search-filters">
        <div class="filter-group">
          <label class="filter-label">时间范围</label>
          <div class="filter-options">
            <button 
              :class="['filter-btn', { active: filters.dateRange === 'all' }]"
              @click="filters.dateRange = 'all'"
            >
              全部
            </button>
            <button 
              :class="['filter-btn', { active: filters.dateRange === 'week' }]"
              @click="filters.dateRange = 'week'"
            >
              本周
            </button>
            <button 
              :class="['filter-btn', { active: filters.dateRange === 'month' }]"
              @click="filters.dateRange = 'month'"
            >
              本月
            </button>
            <button 
              :class="['filter-btn', { active: filters.dateRange === 'custom' }]"
              @click="filters.dateRange = 'custom'"
            >
              自定义
            </button>
          </div>
          <div v-if="filters.dateRange === 'custom'" class="date-range-inputs">
            <input 
              v-model="filters.startDate"
              type="date"
              class="date-input"
            />
            <span class="date-separator">至</span>
            <input 
              v-model="filters.endDate"
              type="date"
              class="date-input"
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">收支类型</label>
          <div class="filter-options">
            <button 
              :class="['filter-btn', { active: filters.type === undefined }]"
              @click="handleTypeChange(undefined)"
            >
              全部
            </button>
            <button 
              :class="['filter-btn expense', { active: filters.type === 'expense' }]"
              @click="handleTypeChange('expense')"
            >
              支出
            </button>
            <button 
              :class="['filter-btn income', { active: filters.type === 'income' }]"
              @click="handleTypeChange('income')"
            >
              收入
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">类别</label>
          <select v-model="filters.category" class="category-select">
            <option :value="undefined">全部类别</option>
            <optgroup v-if="!filters.type || filters.type === 'expense'" label="支出">
              <option 
                v-for="cat in EXPENSE_CATEGORIES" 
                :key="cat.value"
                :value="cat.value"
              >
                {{ cat.icon }} {{ cat.label }}
              </option>
            </optgroup>
            <optgroup v-if="!filters.type || filters.type === 'income'" label="收入">
              <option 
                v-for="cat in INCOME_CATEGORIES" 
                :key="cat.value"
                :value="cat.value"
              >
                {{ cat.icon }} {{ cat.label }}
              </option>
            </optgroup>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">金额区间</label>
          <div class="amount-range">
            <input 
              v-model.number="filters.minAmount"
              type="number"
              class="amount-input"
              placeholder="最小金额"
              min="0"
            />
            <span class="amount-separator">-</span>
            <input 
              v-model.number="filters.maxAmount"
              type="number"
              class="amount-input"
              placeholder="最大金额"
              min="0"
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">关键词搜索</label>
          <input 
            v-model="filters.keyword"
            type="text"
            class="keyword-input"
            placeholder="搜索备注、类别名称..."
          />
        </div>

        <button class="reset-btn" @click="resetFilters">
          <span>↺</span> 重置筛选
        </button>
      </div>

      <div class="search-results">
        <div class="results-header">
          <span class="results-count">找到 {{ resultCount }} 条记录</span>
          <div class="results-summary">
            <span v-if="totalIncome > 0" class="income-tag">
              收入: +¥{{ formatMoney(totalIncome) }}
            </span>
            <span v-if="totalExpense > 0" class="expense-tag">
              支出: -¥{{ formatMoney(totalExpense) }}
            </span>
          </div>
        </div>

        <div v-if="filteredTransactions.length === 0" class="empty-results">
          <div class="empty-icon">🔍</div>
          <p>没有找到匹配的记录</p>
        </div>

        <div v-else class="results-list">
          <div 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id"
            class="result-item"
          >
            <div class="result-date">{{ transaction.date }}</div>
            <div class="result-icon">{{ CATEGORY_ICONS[transaction.category] }}</div>
            <div class="result-info">
              <div class="result-category">{{ CATEGORY_LABELS[transaction.category] }}</div>
              <div v-if="transaction.note" class="result-note">{{ transaction.note }}</div>
            </div>
            <div class="result-amount" :class="transaction.type">
              {{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatMoney(transaction.amount) }}
            </div>
            <div class="result-actions">
              <button class="action-btn edit" @click="emit('edit', transaction)" title="编辑">
                ✏️
              </button>
              <button class="action-btn delete" @click="handleDelete(transaction.id)" title="删除">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-section {
  margin-bottom: 16px;
}

.search-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-toggle-btn:hover {
  background: #40a9ff;
}

.search-icon {
  font-size: 16px;
}

.search-panel {
  margin-top: 12px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.search-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.filter-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.filter-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.filter-btn.expense.active {
  background: #ff4d4f;
  border-color: #ff4d4f;
}

.filter-btn.income.active {
  background: #52c41a;
  border-color: #52c41a;
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.date-separator {
  color: #999;
  font-size: 13px;
}

.category-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.amount-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-input {
  width: 120px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.amount-separator {
  color: #999;
}

.keyword-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  max-width: 300px;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.reset-btn:hover {
  background: #e8e8e8;
}

.search-results {
  margin-top: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.results-count {
  font-size: 14px;
  color: #666;
}

.results-summary {
  display: flex;
  gap: 12px;
}

.income-tag {
  padding: 4px 10px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-size: 13px;
  color: #389e0d;
}

.expense-tag {
  padding: 4px 10px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  font-size: 13px;
  color: #cf1322;
}

.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.result-date {
  font-size: 12px;
  color: #999;
  min-width: 90px;
}

.result-icon {
  font-size: 20px;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-category {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.result-note {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.result-amount {
  font-size: 15px;
  font-weight: 600;
  min-width: 100px;
  text-align: right;
}

.result-amount.income {
  color: #52c41a;
}

.result-amount.expense {
  color: #ff4d4f;
}

.result-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.2s;
}

.action-btn:hover {
  opacity: 1;
  background: #f0f0f0;
}

@media (max-width: 600px) {
  .results-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .result-item {
    flex-wrap: wrap;
  }
  
  .result-date {
    min-width: auto;
  }
  
  .result-amount {
    min-width: auto;
  }
}
</style>