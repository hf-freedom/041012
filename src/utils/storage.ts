import type { Transaction, DailySummary, MonthlySummary, Budget, BudgetStatus, SearchParams, ExpenseCategory } from '../types'
import { EXPENSE_CATEGORIES } from '../types'

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

export function getBudgetForCategory(category: ExpenseCategory, month: string, budgets: Budget[]): number {
  const budget = budgets.find(b => b.category === category && b.month === month)
  return budget?.limit || 0
}

export function calculateBudgetStatus(
  transactions: Transaction[],
  budgets: Budget[],
  month: string
): BudgetStatus[] {
  const monthTransactions = transactions.filter(t => 
    t.date.startsWith(month) && t.type === 'expense'
  )

  const categorySpending: Record<string, number> = {}
  for (const t of monthTransactions) {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount
  }

  return EXPENSE_CATEGORIES.map(cat => {
    const budget = getBudgetForCategory(cat.value, month, budgets)
    const spent = categorySpending[cat.value] || 0
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
      label: cat.label,
      icon: cat.icon,
      budget,
      spent,
      remaining,
      percentage,
      warningLevel,
    }
  })
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
}

export function searchTransactions(transactions: Transaction[], params: SearchParams): Transaction[] {
  let result = [...transactions]

  if (params.dateRange !== 'all') {
    const today = new Date()
    let startDate: Date
    let endDate: Date

    switch (params.dateRange) {
      case 'thisWeek':
        startDate = getWeekStart(today)
        endDate = getWeekEnd(today)
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'custom':
        if (params.customStartDate) {
          startDate = new Date(params.customStartDate)
        } else {
          startDate = new Date(0)
        }
        if (params.customEndDate) {
          endDate = new Date(params.customEndDate)
        } else {
          endDate = new Date()
        }
        break
      default:
        startDate = new Date(0)
        endDate = new Date()
    }

    result = result.filter(t => {
      const tDate = new Date(t.date)
      return tDate >= startDate && tDate <= endDate
    })
  }

  if (params.type && params.type !== 'all') {
    result = result.filter(t => t.type === params.type)
  }

  if (params.category && params.category !== 'all') {
    result = result.filter(t => t.category === params.category)
  }

  if (params.minAmount !== undefined && params.minAmount > 0) {
    result = result.filter(t => t.amount >= params.minAmount)
  }

  if (params.maxAmount !== undefined && params.maxAmount > 0) {
    result = result.filter(t => t.amount <= params.maxAmount)
  }

  if (params.keyword && params.keyword.trim()) {
    const keyword = params.keyword.trim().toLowerCase()
    result = result.filter(t => 
      t.note.toLowerCase().includes(keyword) ||
      t.category.toLowerCase().includes(keyword)
    )
  }

  return result.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) return dateCompare
    return b.createdAt - a.createdAt
  })
}
