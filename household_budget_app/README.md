# Household Budget App

A simple household budget tracking application for Goose MCP.

## Features

- Track expenses and income
- Categorize transactions
- View balance and reports
- Custom expense categories

## Usage

### Adding an expense

```javascript
// Example: Add an expense
const result = await goose.invoke("household_budget_app", "addExpense", {
  amount: 1500,
  category: "Food",
  description: "Grocery shopping",
  date: "2025-09-28"
});
```

### Adding income

```javascript
// Example: Add income
const result = await goose.invoke("household_budget_app", "addIncome", {
  amount: 5000,
  source: "Salary",
  description: "Monthly salary",
  date: "2025-09-28"
});
```

### Checking balance

```javascript
// Example: Get current balance
const balance = await goose.invoke("household_budget_app", "getBalance");
console.log(`Current balance: ${balance.balance} ${balance.currency}`);
```

### Getting expense reports

```javascript
// Example: Get expenses for a specific category and date range
const expenses = await goose.invoke("household_budget_app", "getExpenses", {
  startDate: "2025-09-01",
  endDate: "2025-09-30",
  category: "Food"
});
```

### Adding a custom category

```javascript
// Example: Add a new expense category
const result = await goose.invoke("household_budget_app", "addCategory", {
  name: "Education"
});
```

## Data Structure

All data is stored locally and includes:
- Expenses with amount, category, description, and date
- Income entries with amount, source, description, and date
- Custom categories
- Application settings (currency)