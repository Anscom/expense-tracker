# Expense Tracker Frontend

React Native (Expo) mobile application for expense tracking.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update API base URL in `config/api.js` if needed.

3. Start Expo development server:
```bash
npm start
```

## Screens

- **HomeScreen**: Dashboard with budget pacing and safe-to-spend
- **AddExpenseScreen**: Quick expense entry with one-tap functionality
- **HistoryScreen**: Expense list with category filters
- **SettingsScreen**: Budget and category management
- **ReviewScreen**: Weekly review with insights and streak

## Services

- **expenseService**: Expense CRUD operations
- **budgetService**: Budget management
- **categoryService**: Category management
- **insightService**: Insights and streak data

## Navigation

Uses React Navigation with:
- Bottom tabs for main navigation
- Stack navigator for Home/Review flow
