import type { Transaction, DailySummary, MonthlySummary, Budget, BudgetStatus, SearchFilters, ExpenseCategory } from '../types'
import { EXPENSE_CATEGORIES, CATEGORY_LABELS } from '../types'

const STORAGE_KEY = 'finance_transactions'
const BUDGET_KEY = 'finance_budgets'
const AUTH_KEY = 'finance_auth'

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

export function loadBudgets(): Budget[] {
  const data = localStorage.getItem(BUDGET_KEY)
  if (!data) return []
  try {
    return JSON.parse(data) as Budget[]
  } catch {
    return []
  }
}

export function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets))
}

export function setBudget(category: ExpenseCategory, amount: number, month: string): void {
  const budgets = loadBudgets()
  const index = budgets.findIndex(b => b.category === category && b.month === month)
  if (index >= 0) {
    budgets[index].amount = amount
  } else {
    budgets.push({ category, amount, month })
  }
  saveBudgets(budgets)
}

export function getBudgetStatus(transactions: Transaction[], month: string, _refreshKey?: number): BudgetStatus[] {
  const budgets = loadBudgets()
  const monthTransactions = transactions.filter(t => t.date.startsWith(month) && t.type === 'expense')
  
  return EXPENSE_CATEGORIES.map(cat => {
    const budget = budgets.find(b => b.category === cat.value && b.month === month)?.amount || 0
    const spent = monthTransactions
      .filter(t => t.category === cat.value)
      .reduce((sum, t) => sum + t.amount, 0)
    const remaining = budget - spent
    const percentage = budget > 0 ? (spent / budget) * 100 : 0
    
    let warningLevel: 'none' | 'warning' | 'danger' = 'none'
    if (budget > 0) {
      if (percentage >= 100) {
        warningLevel = 'danger'
      } else if (percentage >= 80) {
        warningLevel = 'warning'
      }
    }
    
    return {
      category: cat.value,
      categoryLabel: cat.label,
      budget,
      spent,
      remaining,
      percentage,
      warningLevel
    }
  })
}

export function searchTransactions(transactions: Transaction[], filters: SearchFilters): Transaction[] {
  let result = [...transactions]
  
  if (filters.dateRange && filters.dateRange !== 'all') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (filters.dateRange) {
      case 'week': {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        result = result.filter(t => new Date(t.date) >= weekStart)
        break
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        result = result.filter(t => new Date(t.date) >= monthStart)
        break
      }
      case 'custom': {
        if (filters.startDate) {
          result = result.filter(t => t.date >= filters.startDate!)
        }
        if (filters.endDate) {
          result = result.filter(t => t.date <= filters.endDate!)
        }
        break
      }
    }
  }
  
  if (filters.type) {
    result = result.filter(t => t.type === filters.type)
  }
  
  if (filters.category) {
    result = result.filter(t => t.category === filters.category)
  }
  
  if (filters.minAmount !== undefined && filters.minAmount > 0) {
    result = result.filter(t => t.amount >= filters.minAmount!)
  }
  
  if (filters.maxAmount !== undefined && filters.maxAmount > 0) {
    result = result.filter(t => t.amount <= filters.maxAmount!)
  }
  
  if (filters.keyword && filters.keyword.trim()) {
    const keyword = filters.keyword.trim().toLowerCase()
    result = result.filter(t => {
      const categoryLabel = CATEGORY_LABELS[t.category].toLowerCase()
      const note = (t.note || '').toLowerCase()
      return categoryLabel.includes(keyword) || note.includes(keyword)
    })
  }
  
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_KEY, token)
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_KEY)
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function generateAuthToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`
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
