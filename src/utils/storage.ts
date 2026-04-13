import type { Transaction, DailySummary, MonthlySummary, Budget, BudgetStatus, SearchFilters } from '../types'
import type { ExpenseCategory } from '../types'

const STORAGE_KEY = 'finance_transactions'
const BUDGET_STORAGE_KEY = 'finance_budgets'

export function loadTransactions(): Transaction[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data) as Transaction[]
  } catch {
    return []
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  return `${year}-${month}-${day} ${weekDay}`
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function getToday(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export function getCurrentMonth(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

export function groupByDate(transactions: Transaction[]): DailySummary[] {
  const grouped: Record<string, DailySummary> = {}

  const sorted = [...transactions].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) return dateCompare
    return b.createdAt - a.createdAt
  })

  for (const t of sorted) {
    if (!grouped[t.date]) {
      grouped[t.date] = {
        date: t.date,
        income: 0,
        expense: 0,
        transactions: [],
      }
    }
    grouped[t.date].transactions.push(t)
    if (t.type === 'income') {
      grouped[t.date].income += t.amount
    } else {
      grouped[t.date].expense += t.amount
    }
  }

  return Object.values(grouped)
}

export function calculateMonthlySummary(transactions: Transaction[], month: string): MonthlySummary {
  const monthTransactions = transactions.filter(t => t.date.startsWith(month))

  let totalIncome = 0
  let totalExpense = 0
  const categoryBreakdown: Record<string, number> = {}

  for (const t of monthTransactions) {
    if (t.type === 'income') {
      totalIncome += t.amount
    } else {
      totalExpense += t.amount
    }
    const key = `${t.type}-${t.category}`
    categoryBreakdown[key] = (categoryBreakdown[key] || 0) + t.amount
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryBreakdown,
  }
}

export function loadBudgets(): Budget[] {
  const data = localStorage.getItem(BUDGET_STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data) as Budget[]
  } catch {
    return []
  }
}

export function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets))
}

export function setBudget(category: ExpenseCategory, month: string, amount: number): void {
  const budgets = loadBudgets()
  const existingIndex = budgets.findIndex(b => b.category === category && b.month === month)
  if (existingIndex >= 0) {
    budgets[existingIndex].amount = amount
  } else {
    budgets.push({ category, month, amount })
  }
  saveBudgets(budgets)
}

export function getBudget(category: ExpenseCategory, month: string): number {
  const budgets = loadBudgets()
  const budget = budgets.find(b => b.category === category && b.month === month)
  return budget ? budget.amount : 0
}

export function calculateCategorySpending(transactions: Transaction[], category: ExpenseCategory, month: string): number {
  return transactions
    .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getBudgetStatuses(transactions: Transaction[], month: string): BudgetStatus[] {
  const categories: ExpenseCategory[] = ['catering', 'transport', 'shopping', 'entertainment', 'other']
  
  return categories.map(category => {
    const budget = getBudget(category, month)
    const spent = calculateCategorySpending(transactions, category, month)
    const remaining = budget > 0 ? budget - spent : 0
    const percentage = budget > 0 ? (spent / budget) * 100 : 0
    
    let warningLevel: 'normal' | 'warning' | 'danger' = 'normal'
    if (percentage >= 100) {
      warningLevel = 'danger'
    } else if (percentage >= 80) {
      warningLevel = 'warning'
    }
    
    return {
      category,
      budget,
      spent,
      remaining,
      percentage,
      warningLevel,
    }
  })
}

export function getWeekRange(): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function getMonthRange(): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function filterTransactions(transactions: Transaction[], filters: SearchFilters): Transaction[] {
  let result = [...transactions]
  
  let effectiveStart = ''
  let effectiveEnd = ''
  
  switch (filters.dateRange) {
    case 'week':
      const weekRange = getWeekRange()
      effectiveStart = weekRange.start
      effectiveEnd = weekRange.end
      break
    case 'month':
      const monthRange = getMonthRange()
      effectiveStart = monthRange.start
      effectiveEnd = monthRange.end
      break
    case 'custom':
      effectiveStart = filters.startDate
      effectiveEnd = filters.endDate
      break
  }
  
  if (effectiveStart) {
    result = result.filter(t => t.date >= effectiveStart)
  }
  if (effectiveEnd) {
    result = result.filter(t => t.date <= effectiveEnd)
  }
  
  if (filters.type !== 'all') {
    result = result.filter(t => t.type === filters.type)
  }
  
  if (filters.category !== 'all') {
    result = result.filter(t => t.category === filters.category)
  }
  
  if (filters.minAmount) {
    result = result.filter(t => t.amount >= parseFloat(filters.minAmount))
  }
  if (filters.maxAmount) {
    result = result.filter(t => t.amount <= parseFloat(filters.maxAmount))
  }
  
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(t => 
      t.note.toLowerCase().includes(keyword) ||
      t.category.toLowerCase().includes(keyword)
    )
  }
  
  return result
}
