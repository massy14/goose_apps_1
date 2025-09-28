/**
 * Household Budget App - Goose MCP Application
 * A simple budget tracking application for household finances
 */

// Data storage for budget items
let budgetItems = [];
let categories = ['Food', 'Housing', 'Transportation', 'Utilities', 'Entertainment', 'Other'];
let settings = { currency: 'JPY' };

// Initialize the application
function initialize(context) {
  console.log('Initializing Household Budget App');
  
  // Load saved data if available
  if (context.storage.has('budgetItems')) {
    budgetItems = context.storage.get('budgetItems');
  }
  
  if (context.storage.has('categories')) {
    categories = context.storage.get('categories');
  }
  
  if (context.storage.has('settings')) {
    settings = context.storage.get('settings');
  } else {
    // Use default from manifest if available
    if (context.manifest.settings && context.manifest.settings.default_currency) {
      settings.currency = context.manifest.settings.default_currency;
    }
  }
  
  return {
    name: 'household_budget_app',
    version: '1.0.0',
    description: 'Track and manage household expenses',
    capabilities: ['addExpense', 'getExpenses', 'addIncome', 'getBalance', 'addCategory']
  };
}

// Add a new expense
async function addExpense(request) {
  const { amount, category, description, date } = request.params;
  
  if (!amount || isNaN(parseFloat(amount))) {
    return { error: 'Invalid amount' };
  }
  
  const newExpense = {
    id: generateId(),
    type: 'expense',
    amount: parseFloat(amount),
    category: category || 'Other',
    description: description || '',
    date: date || new Date().toISOString().split('T')[0]
  };
  
  budgetItems.push(newExpense);
  request.context.storage.set('budgetItems', budgetItems);
  
  return {
    success: true,
    expense: newExpense
  };
}

// Add a new income
async function addIncome(request) {
  const { amount, source, description, date } = request.params;
  
  if (!amount || isNaN(parseFloat(amount))) {
    return { error: 'Invalid amount' };
  }
  
  const newIncome = {
    id: generateId(),
    type: 'income',
    amount: parseFloat(amount),
    source: source || 'General',
    description: description || '',
    date: date || new Date().toISOString().split('T')[0]
  };
  
  budgetItems.push(newIncome);
  request.context.storage.set('budgetItems', budgetItems);
  
  return {
    success: true,
    income: newIncome
  };
}

// Get all expenses, with optional filtering
async function getExpenses(request) {
  const { startDate, endDate, category } = request.params;
  
  let filteredItems = budgetItems.filter(item => item.type === 'expense');
  
  if (startDate) {
    filteredItems = filteredItems.filter(item => item.date >= startDate);
  }
  
  if (endDate) {
    filteredItems = filteredItems.filter(item => item.date <= endDate);
  }
  
  if (category) {
    filteredItems = filteredItems.filter(item => item.category === category);
  }
  
  return {
    expenses: filteredItems,
    total: filteredItems.reduce((sum, item) => sum + item.amount, 0),
    currency: settings.currency
  };
}

// Get current balance
async function getBalance() {
  const incomes = budgetItems.filter(item => item.type === 'income');
  const expenses = budgetItems.filter(item => item.type === 'expense');
  
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    income: totalIncome,
    expenses: totalExpense,
    balance: totalIncome - totalExpense,
    currency: settings.currency
  };
}

// Add a new category
async function addCategory(request) {
  const { name } = request.params;
  
  if (!name) {
    return { error: 'Category name is required' };
  }
  
  if (categories.includes(name)) {
    return { error: 'Category already exists', categories };
  }
  
  categories.push(name);
  request.context.storage.set('categories', categories);
  
  return {
    success: true,
    categories
  };
}

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Export the MCP functions
module.exports = {
  initialize,
  addExpense,
  getExpenses,
  addIncome,
  getBalance,
  addCategory
};