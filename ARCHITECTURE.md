# Architecture Overview

## System Architecture

The application follows a client-server architecture with a React Native mobile frontend and a Node.js/Express backend.

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React Native  │  HTTP   │   Express API   │  ODM    │  MongoDB Atlas   │
│   (Expo)        │◄────────►│   (Node.js)     │◄───────►│   (Database)     │
│   Frontend      │          │   Backend       │         │                  │
└─────────────────┘          └─────────────────┘         └─────────────────┘
```

## Backend Architecture

### Structure
```
backend/
├── models/          # Mongoose schemas (Expense, Budget, Category, Streak)
├── routes/          # Express route handlers
├── utils/           # Business logic utilities
│   ├── categorization.js      # Auto-categorization rules
│   ├── budgetCalculations.js  # Budget pacing calculations
│   └── insights.js            # Weekly insights generation
└── server.js        # Express app entry point
```

### Key Design Decisions

1. **Single-User MVP**: Uses `userId: 'default-user'` for MVP simplicity. Easy to extend to multi-user with authentication.

2. **Rule-Based Categorization**: Keyword matching for auto-categorization. Extensible to ML-based categorization later.

3. **Budget Pacing Algorithm**: 
   - Calculates expected spending based on time elapsed
   - Provides "safe to spend" amount
   - Tracks pacing percentage
   - Calculates daily allowance for remaining period

4. **Streak Tracking**: 
   - Tracks consecutive weeks under budget
   - Updates on weekly basis
   - Maintains longest streak record

5. **Weekly Insights**: 
   - Plain-English format (no charts)
   - Focuses on actionable insights
   - Category-specific warnings

## Frontend Architecture

### Structure
```
frontend/
├── screens/         # React Native screen components
│   ├── HomeScreen.js        # Dashboard with budget pacing
│   ├── AddExpenseScreen.js  # Quick expense entry
│   ├── HistoryScreen.js     # Expense list with filters
│   ├── SettingsScreen.js    # Budget/category management
│   └── ReviewScreen.js      # Weekly review
├── services/        # API service layer
│   ├── expenseService.js
│   ├── budgetService.js
│   ├── categoryService.js
│   └── insightService.js
├── config/          # Configuration
│   └── api.js       # Axios instance with base URL
└── App.js           # Navigation setup
```

### Navigation Structure

```
Tab Navigator (Bottom Tabs)
├── Home (Stack Navigator)
│   ├── HomeMain (HomeScreen)
│   └── Review (ReviewScreen)
├── Add (AddExpenseScreen)
├── History (HistoryScreen)
└── Settings (SettingsScreen)
```

### Key Design Decisions

1. **One-Tap Entry**: 
   - Quick amount buttons ($5, $10, $20, $50, $100)
   - Minimal required fields (amount + description)
   - Auto-categorization by default

2. **Bottom Sheet for Categories**: 
   - Uses @gorhom/bottom-sheet for smooth UX
   - Non-blocking category selection

3. **Pull-to-Refresh**: 
   - Available on Home and History screens
   - Keeps data fresh

4. **Visual Feedback**: 
   - Color-coded budget status (green/red)
   - Progress bars for pacing
   - Gradient cards for important metrics

## Data Models

### Expense
```javascript
{
  amount: Number,
  description: String,
  category: String,
  date: Date,
  userId: String
}
```

### Budget
```javascript
{
  category: String,
  amount: Number,
  period: 'weekly' | 'monthly',
  userId: String
}
```

### Category
```javascript
{
  name: String,
  keywords: [String],
  icon: String,
  color: String
}
```

### Streak
```javascript
{
  userId: String,
  currentStreak: Number,
  longestStreak: Number,
  lastUnderBudgetDate: Date,
  weeklyUnderBudget: Boolean
}
```

## API Design

### RESTful Endpoints

- **Expenses**: `/api/expenses`
- **Budgets**: `/api/budgets`
- **Categories**: `/api/categories`
- **Insights**: `/api/insights`

### Response Format
```json
{
  "data": {...},
  "error": "Error message" // on error
}
```

## Security Considerations (Future)

1. **Authentication**: JWT tokens for multi-user support
2. **Authorization**: User-specific data access
3. **Input Validation**: express-validator for request validation
4. **Rate Limiting**: Prevent API abuse
5. **HTTPS**: Required for production

## Performance Optimizations

1. **Database Indexing**: 
   - Indexed on `userId` and `date` for fast queries
   - Category index for filtering

2. **Caching**: 
   - Consider Redis for frequently accessed data
   - Cache budget calculations

3. **Pagination**: 
   - Expense list supports limit parameter
   - Default limit of 50 items

## Scalability Considerations

1. **Horizontal Scaling**: 
   - Stateless API design
   - MongoDB Atlas for managed scaling

2. **Database Sharding**: 
   - Shard by userId for multi-tenant support

3. **CDN**: 
   - Serve static assets via CDN

4. **Background Jobs**: 
   - Weekly streak calculations
   - Insight generation

## Testing Strategy (Future)

1. **Unit Tests**: 
   - Utility functions (categorization, calculations)
   - API route handlers

2. **Integration Tests**: 
   - API endpoints
   - Database operations

3. **E2E Tests**: 
   - React Native Testing Library
   - Critical user flows

## Deployment

### Backend
- Deploy to Heroku, Railway, or AWS
- Environment variables for configuration
- MongoDB Atlas for database

### Frontend
- Expo EAS Build for production builds
- OTA updates via Expo Updates
- App Store / Play Store distribution

## Monitoring & Analytics

1. **Error Tracking**: Sentry or similar
2. **Analytics**: Mixpanel or Amplitude
3. **Performance**: New Relic or Datadog
4. **Logging**: Winston or Pino
