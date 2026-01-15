# Expense Tracker Backend API

Node.js/Express backend for the Expense Tracker mobile application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
PORT=3000
MONGODB_URI=your-mongodb-connection-string
NODE_ENV=development
```

3. Start development server:
```bash
npm run dev
```

## API Documentation

See main README.md for endpoint documentation.

## Models

- **Expense**: Stores individual expense entries
- **Budget**: Stores budget limits per category
- **Category**: Stores expense categories with keywords
- **Streak**: Tracks spending streak data

## Utilities

- **categorization.js**: Rule-based auto-categorization logic
- **budgetCalculations.js**: Budget pacing and safe-to-spend calculations
- **insights.js**: Weekly insights generation
