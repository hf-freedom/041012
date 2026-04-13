<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SearchParams, Category, Transaction } from '../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '../types'
import { formatMoney, formatDate, searchTransactions, getToday } from '../utils/storage'

const props = defineProps<{
  transactions: Transaction[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const searchParams = ref<SearchParams>({
  dateRange: 'all',
  type: 'all',
  category: 'all',
  keyword: '',
})

const customStartDate = ref('')
const customEndDate = ref('')
const minAmount = ref<number | undefined>(undefined)
const maxAmount = ref<number | undefined>(undefined)

const showResults = ref(false)

const allCategories = computed(() => {
  return [
    { value: 'all', label: '全部类别', icon: '📋' },
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES,
  ]
})

const searchResults = computed(() => {
  const params: SearchParams = {
    ...searchParams.value,
    customStartDate: searchParams.value.dateRange === 'custom' ? customStartDate.value : undefined,
    customEndDate: searchParams.value.dateRange === 'custom' ? customEndDate.value : undefined,
    minAmount: minAmount.value,
    maxAmount: maxAmount.value,
  }
  return searchTransactions(props.transactions, params)
})

const resultSummary = computed(() => {
  const results = searchResults.value
  let totalIncome = 0
  let totalExpense = 0
  
  for (const t of results) {
    if (t.type === 'income') {
      totalIncome += t.amount
    } else {
      totalExpense += t.amount
    }
  }
  
  return {
    count: results.length,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  }
})

function handleSearch() {
  showResults.value = true
}

function resetSearch() {
  searchParams.value = {
    dateRange: 'all',
    type: 'all',
    category: 'all',
    keyword: '',
  }
  customStartDate.value = ''
  customEndDate.value = ''
  minAmount.value = undefined
  maxAmount.value = undefined
  showResults.value = false
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="search-panel">
    <div class="panel-header">
      <h3>🔍 智能搜索</h3>
      <button class="close-btn" @click="handleClose">✕</button>
    </div>

    <div class="search-form">
      <div class="form-row">
        <div class="form-group">
          <label>日期范围</label>
          <select v-model="searchParams.dateRange">
            <option value="all">全部</option>
            <option value="thisWeek">本周</option>
            <option value="thisMonth">本月</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div class="form-group">
          <label>收支类型</label>
          <select v-model="searchParams.type">
            <option value="all">全部</option>
            <option value="income">收入</option>
            <option value="expense">支出</option>
          </select>
        </div>
      </div>

      <div v-if="searchParams.dateRange === 'custom'" class="form-row">
        <div class="form-group">
          <label>开始日期</label>
          <input type="date" v-model="customStartDate" />
        </div>
        <div class="form-group">
          <label>结束日期</label>
          <input type="date" v-model="customEndDate" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>类别</label>
          <select v-model="searchParams.category">
            <option v-for="cat in allCategories" :key="cat.value" :value="cat.value">
              {{ cat.icon }} {{ cat.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>最小金额</label>
          <input 
            type="number" 
            v-model.number="minAmount" 
            placeholder="不限"
            min="0"
            step="0.01"
          />
        </div>
        <div class="form-group">
          <label>最大金额</label>
          <input 
            type="number" 
            v-model.number="maxAmount" 
            placeholder="不限"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div class="form-group">
        <label>关键词搜索</label>
        <input 
          type="text" 
          v-model="searchParams.keyword" 
          placeholder="搜索备注、类别名称..."
          maxlength="50"
        />
      </div>

      <div class="form-actions">
        <button class="btn-reset" @click="resetSearch">重置</button>
        <button class="btn-search" @click="handleSearch">搜索</button>
      </div>
    </div>

    <div v-if="showResults" class="search-results">
      <div class="results-header">
        <h4>搜索结果</h4>
        <span class="result-count">共 {{ resultSummary.count }} 条记录</span>
      </div>

      <div class="results-summary">
        <div class="summary-item income">
          <span class="label">收入</span>
          <span class="amount">+¥{{ formatMoney(resultSummary.totalIncome) }}</span>
        </div>
        <div class="summary-item expense">
          <span class="label">支出</span>
          <span class="amount">-¥{{ formatMoney(resultSummary.totalExpense) }}</span>
        </div>
        <div class="summary-item balance" :class="{ negative: resultSummary.balance < 0 }">
          <span class="label">结余</span>
          <span class="amount">¥{{ formatMoney(Math.abs(resultSummary.balance)) }}</span>
        </div>
      </div>

      <div v-if="searchResults.length === 0" class="no-results">
        <p>未找到匹配的记录</p>
      </div>

      <div v-else class="results-list">
        <div 
          v-for="transaction in searchResults" 
          :key="transaction.id"
          class="result-item"
        >
          <div class="item-icon">
            {{ CATEGORY_ICONS[transaction.category] }}
          </div>
          <div class="item-info">
            <div class="item-category">
              {{ CATEGORY_LABELS[transaction.category] }}
            </div>
            <div class="item-date">{{ transaction.date }}</div>
            <div v-if="transaction.note" class="item-note">
              {{ transaction.note }}
            </div>
          </div>
          <div class="item-amount" :class="transaction.type">
            {{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatMoney(transaction.amount) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-height: 80vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.search-form {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
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
  margin-top: 16px;
}

.btn-reset,
.btn-search {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset {
  background: #f5f5f5;
  color: #666;
}

.btn-reset:hover {
  background: #e0e0e0;
}

.btn-search {
  background: #4CAF50;
  color: white;
}

.btn-search:hover {
  background: #43A047;
}

.search-results {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.results-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.result-count {
  font-size: 13px;
  color: #999;
}

.results-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.summary-item.income {
  background: #e8f5e9;
}

.summary-item.expense {
  background: #ffebee;
}

.summary-item.balance {
  background: #e3f2fd;
}

.summary-item.balance.negative {
  background: #fce4ec;
}

.summary-item .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-item .amount {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.item-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-size: 18px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-category {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.item-date {
  font-size: 12px;
  color: #999;
}

.item-note {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-amount {
  font-size: 15px;
  font-weight: 600;
}

.item-amount.income {
  color: #4CAF50;
}

.item-amount.expense {
  color: #f44336;
}

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }
  
  .results-summary {
    flex-direction: column;
  }
}
</style>
