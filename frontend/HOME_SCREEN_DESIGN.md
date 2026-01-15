# Home Screen Design - Expense Tracker

## Design Philosophy

**Goal**: Help users quickly decide "Can I spend today?" with minimal cognitive load.

**Principles**:
- Behavior-focused (action-oriented information)
- Mobile-first (thumb-friendly, scannable)
- Minimal (no charts, no clutter)
- Clear hierarchy (most important info first)

## Layout Structure (Top to Bottom)

### 1. Hero Section - "Safe to Spend Today" (Primary Focus)
**Purpose**: Answer the main question immediately

- **Large gradient card** (full width, prominent)
- **Label**: "Safe to spend today" (small, uppercase)
- **Amount**: Large number ($XX.XX) - 56px font, bold
- **Subtext**: Contextual info (e.g., "$XXX left this month" or "Over budget")
- **Color coding**:
  - Green gradient: When safe to spend (on track)
  - Red gradient: When over budget
- **Visual weight**: Highest priority, takes ~200px vertical space

### 2. Monthly Summary Section
**Purpose**: Provide monthly context

- **Section title**: "This Month"
- **Summary card**: White card with 3 rows
  - Spent: $XXX.XX
  - Budget: $XXX.XX
  - Remaining: $XXX.XX (red if negative)
- **No charts**: Just clean text in rows
- **Spacing**: Generous padding for readability

### 3. Today's Spending by Category
**Purpose**: Show where money went today

- **Section title**: "Today's Spending"
- **Category list**: White card with rows
  - Each row: Category name | Amount
  - Sorted by amount (highest first)
  - Total row at bottom (bold, separated)
- **Only shown if**: There are expenses today
- **Minimal design**: No icons, just text

### 4. Recent Expenses
**Purpose**: Quick glance at latest activity

- **Section header**: "Recent" + "See all" link
- **List of 3 most recent expenses**:
  - Description (truncated if long)
  - Category • Time (e.g., "Food • 2:30 PM")
  - Amount (right-aligned)
- **Clickable**: "See all" navigates to History screen

### 5. Streak Indicator (Optional)
**Purpose**: Motivation through gamification

- **Badge style**: Centered, orange/amber background
- **Icon**: Flame emoji/icon
- **Text**: "X weeks under budget"
- **Only shown if**: Streak > 0
- **Subtle**: Doesn't compete with main content

### 6. Quick Action Button
**Purpose**: Primary action (add expense)

- **Floating action style**: Full-width button
- **Icon + Text**: "Add Expense"
- **Color**: Primary brand color (indigo)
- **Prominent**: Easy thumb reach

## Component Structure

```jsx
<ScrollView>
  {/* 1. Hero Card */}
  <HeroCard 
    safeToSpend={dailyAllowance}
    monthlyRemaining={remaining}
    isOnTrack={boolean}
  />

  {/* 2. Monthly Summary */}
  <Section title="This Month">
    <SummaryCard>
      <Row label="Spent" value={spent} />
      <Row label="Budget" value={budget} />
      <Row label="Remaining" value={remaining} />
    </SummaryCard>
  </Section>

  {/* 3. Today's Spending */}
  {todaySpending.length > 0 && (
    <Section title="Today's Spending">
      <CategoryCard>
        {categories.map(cat => (
          <CategoryRow category={cat.name} amount={cat.amount} />
        ))}
        <TotalRow total={todayTotal} />
      </CategoryCard>
    </Section>
  )}

  {/* 4. Recent Expenses */}
  {recentExpenses.length > 0 && (
    <Section title="Recent" action="See all">
      <ExpensesCard>
        {recentExpenses.map(expense => (
          <ExpenseRow 
            description={expense.description}
            category={expense.category}
            time={expense.time}
            amount={expense.amount}
          />
        ))}
      </ExpensesCard>
    </Section>
  )}

  {/* 5. Streak Badge */}
  {streak > 0 && <StreakBadge count={streak} />}

  {/* 6. Add Button */}
  <AddButton onPress={navigateToAdd} />
</ScrollView>
```

## Visual Hierarchy

1. **Hero Card** (56px font, gradient, centered)
2. **Section Titles** (18px, bold, dark)
3. **Summary Values** (18px, bold)
4. **Category/Expense Text** (15px, medium)
5. **Meta Text** (13px, gray)

## Color Palette

- **Primary**: Indigo (#6366f1)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Text Primary**: Dark gray (#111827)
- **Text Secondary**: Medium gray (#6b7280)
- **Text Tertiary**: Light gray (#9ca3af)
- **Background**: Light gray (#f9fafb)
- **Cards**: White (#fff)

## Spacing System

- **Section padding**: 20px horizontal
- **Card padding**: 16-20px
- **Row padding**: 12px vertical
- **Section spacing**: 24px between sections
- **Hero padding**: 32px (extra space for prominence)

## Typography

- **Hero amount**: 56px, bold, -1px letter spacing
- **Section titles**: 18px, bold
- **Summary values**: 18px, bold
- **Body text**: 15px, medium
- **Meta text**: 13px, regular
- **Labels**: 14px, medium, uppercase (hero)

## Interaction Patterns

- **Pull to refresh**: Standard iOS/Android pattern
- **"See all" link**: Navigates to History screen
- **Add button**: Navigates to Add Expense screen
- **No clickable cards**: Keep it simple, actions are explicit

## Responsive Considerations

- **Minimum touch target**: 44px height
- **Text truncation**: Long descriptions truncated with ellipsis
- **Safe area**: Respects notches and status bars
- **Scroll behavior**: Smooth, native feel

## Accessibility

- **Color contrast**: WCAG AA compliant
- **Text sizes**: Minimum 13px for readability
- **Touch targets**: Minimum 44x44px
- **Semantic structure**: Proper heading hierarchy

## Data Requirements

### API Endpoints Needed:
1. `GET /budgets/summary/monthly` - Monthly budget summary
2. `GET /expenses/today/by-category` - Today's spending by category
3. `GET /expenses?limit=3` - Last 3 expenses
4. `GET /insights/streak` - Spending streak

### Calculations:
- **Safe to spend today**: `(Monthly Budget - Monthly Spent) / Remaining Days in Month`
- **Monthly remaining**: `Monthly Budget - Monthly Spent`
- **Is on track**: `Safe to spend today > 0`

## Edge Cases Handled

1. **No expenses today**: Hide "Today's Spending" section
2. **No recent expenses**: Hide "Recent" section
3. **No streak**: Hide streak badge
4. **Over budget**: Show red hero card, negative remaining
5. **No budget set**: Show $0.00 safe to spend
6. **Loading state**: Show spinner
7. **Error state**: Graceful degradation (show what's available)
