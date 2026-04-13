<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SearchFilters, Category, TransactionType } from '../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types'
import { getToday } from '../utils/storage'

const emit = defineEmits<{
  (e: 'filters-change', filters: SearchFilters): void
}>()

const showFilters = ref(false)

const filters = ref<SearchFilters>({
  dateRange: 'all',
  startDate: '',
  endDate: '',
  type: 'all',
  category: 'all',
  minAmount: '',
  maxAmount: '',
  keyword: '',
})

const allCategories = computed(() => {
  return [
    ...EXPENSE_CATEGORIES.map(c => ({ ...c, type: 'expense' as const })),
    ...INCOME_CATEGORIES.map(c => ({ ...c, type: 'income' as const })),
  ]
})

const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
]

const dateRangeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' },
]

watch(filters, () => {
  emit('filters-change', filters.value)
}, { deep: true })

function resetFilters() {
  filters.value = {
    dateRange: 'all',
    startDate: '',
    endDate: '',
    type: 'all',
    category: 'all',
    minAmount: '',
    maxAmount: '',
    keyword: '',
  }
}

function toggleFilters() {
  showFilters.value = !showFilters.value
}
</script>

<template>
  <div class="search-panel">
    <div class="search-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索备注、类别..."
          class="search-input"
        />
        <button v-if="filters.keyword" class="clear-btn" @click="filters.keyword = ''">
          ✕
        </button>
      </div>
      <button class="filter-btn" :class="{ active: showFilters }" @click="toggleFilters">
        <span>⚙️ 筛选</span>
        <span v-if="hasActiveFilters" class="filter-badge"></span>
      </button>
    </div>

    <div v-show="showFilters" class="filters-expanded">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">时间范围</label>
          <select v-model="filters.dateRange" class="filter-select">
            <option v-for="opt in dateRangeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div v-if="filters.dateRange === 'custom'" class="filter-group date-group">
          <label class="filter-label">开始日期</label>
          <input v-model="filters.startDate" type="date" class="filter-input" />
        </div>

        <div v-if="filters.dateRange === 'custom'" class="filter-group date-group">
          <label class="filter-label">结束日期</label>
          <input v-model="filters.endDate" type="date" class="filter-input" />
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">收支类型</label>
          <select v-model="filters.type" class="filter-select">
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">类别</label>
          <select v-model="filters.category" class="filter-select">
            <option value="all">全部类别</option>
            <optgroup label="支出">
              <option v-for="cat in EXPENSE_CATEGORIES" :key="cat.value" :value="cat.value">
                {{ cat.icon }} {{ cat.label }}
              </option>
            </optgroup>
            <optgroup label="收入">
              <option v-for="cat in INCOME_CATEGORIES" :key="cat.value" :value="cat.value">
                {{ cat.icon }} {{ cat.label }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">最小金额</label>
          <input
            v-model="filters.minAmount"
            type="number"
            placeholder="0.00"
            class="filter-input"
            min="0"
            step="0.01"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">最大金额</label>
          <input
            v-model="filters.maxAmount"
            type="number"
            placeholder="不限"
            class="filter-input"
            min="0"
            step="0.01"
          />
        </div>

        <div class="filter-group actions">
          <button class="reset-btn" @click="resetFilters">重置全部</button>
        </div>
      </div>
    </div>

    <div v-if="hasActiveFilters" class="active-tags">
      <span class="tag-label">已选筛选:</span>
      <span v-if="filters.dateRange !== 'all'" class="filter-tag">
        {{ dateRangeOptions.find(o => o.value === filters.dateRange)?.label }}
        <button @click="filters.dateRange = 'all'">✕</button>
      </span>
      <span v-if="filters.type !== 'all'" class="filter-tag">
        {{ typeOptions.find(o => o.value === filters.type)?.label }}
        <button @click="filters.type = 'all'">✕</button>
      </span>
      <span v-if="filters.category !== 'all'" class="filter-tag">
        {{ allCategories.find(c => c.value === filters.category)?.label }}
        <button @click="filters.category = 'all'">✕</button>
      </span>
      <span v-if="filters.minAmount" class="filter-tag">
        ≥ ¥{{ filters.minAmount }}
        <button @click="filters.minAmount = ''">✕</button>
      </span>
      <span v-if="filters.maxAmount" class="filter-tag">
        ≤ ¥{{ filters.maxAmount }}
        <button @click="filters.maxAmount = ''">✕</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 16px;
  color: #999;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #f0f0f0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4CAF50;
}

.clear-btn {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  border: none;
  background: #e0e0e0;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.clear-btn:hover {
  background: #bdbdbd;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: 2px solid #f0f0f0;
  background: white;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.filter-btn:hover {
  border-color: #e0e0e0;
}

.filter-btn.active {
  border-color: #4CAF50;
  background: #f1f8e9;
}

.filter-badge {
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
  position: absolute;
  top: 8px;
  right: 8px;
}

.filters-expanded {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.filters-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.filter-group.date-group {
  min-width: 160px;
}

.filter-group.actions {
  justify-content: flex-end;
}

.filter-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.filter-select,
.filter-input {
  padding: 10px 12px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: white;
}

.filter-select:focus,
.filter-input:focus {
  border-color: #4CAF50;
}

.reset-btn {
  padding: 10px 16px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  transition: background 0.2s;
  margin-top: 18px;
}

.reset-btn:hover {
  background: #e0e0e0;
}

.active-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.tag-label {
  font-size: 13px;
  color: #666;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 16px;
  font-size: 12px;
}

.filter-tag button {
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  padding: 0;
}

.filter-tag button:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
