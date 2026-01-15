# Expense Tracker Mobile Application

A production-ready expense tracking mobile application built with React Native (Expo) and Node.js backend.

## Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Node.js (Express)
- **Database**: MongoDB Atlas

## Features

### Core Features (MVP)

- ✅ One-tap expense entry (fast, minimal fields)
- ✅ Smart auto-categorization (rule-based, extensible)
- ✅ Budget pacing with "safe to spend" calculation
- ✅ Plain-English weekly insights (no complex charts)
- ✅ Spending streak tracking (days under budget)
- ✅ Weekly 2-minute review flow

### Navigation

- Bottom tab navigation with:
  - **Home**: Shows total spent, remaining "safe to spend", and budget pacing
  - **Add (+)**: Modal/bottom sheet for quick expense entry
  - **History**: List of past expenses with filters
  - **Settings**: Budgets, categories, preferences

## Project Structure

```
expensetracker/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── screens/         # React Native screens
│   ├── services/        # API service layer
│   ├── config/          # Configuration files
│   ├── App.js           # Main app component
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB Atlas connection string:
```
PORT=3000
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/expensetracker?retryWrites=true&w=majority
NODE_ENV=development
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the API base URL in `config/api.js` if your backend is running on a different URL or port.

4. Start the Expo development server:
```bash
npm start
```

5. Use the Expo Go app on your phone to scan the QR code, or press `i` for iOS simulator, `a` for Android emulator.

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses (with optional filters)
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats/total` - Get total spent

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get single budget
- `POST /api/budgets` - Create/update budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/:id/pacing` - Get budget pacing
- `GET /api/budgets/summary/overall` - Get overall budget summary

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `GET /api/categories/defaults/list` - Get default categories

### Insights
- `GET /api/insights/weekly` - Get weekly insights
- `GET /api/insights/streak` - Get spending streak
- `GET /api/insights/review` - Get weekly review data

## Key Features Implementation

### Smart Auto-Categorization
The app uses rule-based categorization that matches expense descriptions against keyword lists. Categories include:
- Food & Dining
- Transportation
- Shopping
- Bills & Utilities
- Entertainment
- Health & Fitness
- Education
- Other (default)

### Budget Pacing
Calculates:
- Safe to spend amount
- Expected spending based on time elapsed
- Pacing percentage
- Daily allowance for remaining period

### Spending Streak
Tracks consecutive weeks where spending is under budget, encouraging consistent financial discipline.

### Weekly Insights
Provides plain-English insights about:
- Top spending categories
- Budget status
- Spending patterns
- Category-specific warnings

## Development Notes

- The app uses a single-user model for MVP (userId: 'default-user')
- All dates are handled in UTC
- Budget periods can be weekly or monthly
- Auto-categorization can be overridden by manual selection

## Future Enhancements

- Multi-user support with authentication
- Recurring expenses
- Export functionality (CSV, PDF)
- Push notifications for budget warnings
- Machine learning for improved categorization
- Integration with bank accounts
- Receipt scanning with OCR

## License

ISC
