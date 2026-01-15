import express from 'express';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import { calculateBudgetPacing, isUnderBudget } from '../utils/budgetCalculations.js';

const router = express.Router();

// Get all budgets
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: 'default-user' });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single budget
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update budget
router.post('/', async (req, res) => {
  try {
    const { category, amount, weekdayAmount, weekendAmount, period } = req.body;
    
    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }
    
    const updateData = {
      category,
      amount: parseFloat(amount),
      period: period || 'monthly',
      userId: 'default-user'
    };
    
    // Add weekday/weekend amounts if provided
    if (weekdayAmount !== undefined && weekdayAmount !== null) {
      updateData.weekdayAmount = parseFloat(weekdayAmount);
    }
    if (weekendAmount !== undefined && weekendAmount !== null) {
      updateData.weekendAmount = parseFloat(weekendAmount);
    }
    
    const budget = await Budget.findOneAndUpdate(
      { category, userId: 'default-user' },
      updateData,
      { upsert: true, new: true }
    );
    
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update budget
router.put('/:id', async (req, res) => {
  try {
    const { amount, period } = req.body;
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (period !== undefined) updateData.period = period;
    
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget pacing (with spending data)
router.get('/:id/pacing', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Get start and end of current period
    const now = new Date();
    let startDate, endDate;
    
    if (budget.period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    
    // Calculate spent for this category in this period
    const expenses = await Expense.find({
      userId: 'default-user',
      category: budget.category,
      date: { $gte: startDate, $lt: endDate }
    });
    
    const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pacing = calculateBudgetPacing(budget.amount, spent, budget.period);
    
    res.json(pacing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overall budget summary
router.get('/summary/overall', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: 'default-user' });
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    
    // Get current week expenses
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const expenses = await Expense.find({
      userId: 'default-user',
      date: { $gte: startOfWeek, $lt: endOfWeek }
    });
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pacing = calculateBudgetPacing(totalBudget, totalSpent, 'weekly');
    
    res.json(pacing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly budget summary with category breakdown
router.get('/summary/monthly', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: 'default-user' });
    
    // Get current month expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const expenses = await Expense.find({
      userId: 'default-user',
      date: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const daysElapsed = Math.floor((now - startOfMonth) / (1000 * 60 * 60 * 24)) + 1;
    const daysTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysTotal - daysElapsed;
    
    // Calculate per-category spending (separate weekday and weekend)
    const categorySpending = { weekday: {}, weekend: {}, total: {} };
    expenses.forEach(exp => {
      const expenseDate = new Date(exp.date);
      const dayOfWeek = expenseDate.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayType = isWeekend ? 'weekend' : 'weekday';
      
      if (!categorySpending.total[exp.category]) {
        categorySpending.total[exp.category] = 0;
        categorySpending.weekday[exp.category] = 0;
        categorySpending.weekend[exp.category] = 0;
      }
      categorySpending.total[exp.category] += exp.amount;
      categorySpending[dayType][exp.category] += exp.amount;
    });
    
    // Calculate weekday and weekend days in the month
    const weekdayCount = [];
    const weekendCount = [];
    for (let day = 1; day <= daysTotal; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendCount.push(day);
      } else {
        weekdayCount.push(day);
      }
    }
    const weekdayDaysTotal = weekdayCount.length;
    const weekendDaysTotal = weekendCount.length;
    const weekdayDaysElapsed = weekdayCount.filter(day => day <= daysElapsed).length;
    const weekendDaysElapsed = weekendCount.filter(day => day <= daysElapsed).length;
    const weekdayDaysRemaining = weekdayDaysTotal - weekdayDaysElapsed;
    const weekendDaysRemaining = weekendDaysTotal - weekendDaysElapsed;
    
    // Check if today is weekday or weekend
    const todayDayOfWeek = now.getDay();
    const isTodayWeekend = todayDayOfWeek === 0 || todayDayOfWeek === 6;
    
    // Calculate category-based budgets with progress
    const categoryBudgets = budgets.map(budget => {
      const totalSpent = categorySpending.total[budget.category] || 0;
      const weekdaySpent = categorySpending.weekday[budget.category] || 0;
      const weekendSpent = categorySpending.weekend[budget.category] || 0;
      
      // Determine which budget to use
      const hasSeparateBudgets = budget.weekdayAmount !== null && budget.weekendAmount !== null;
      const weekdayBudget = hasSeparateBudgets ? budget.weekdayAmount : budget.amount;
      const weekendBudget = hasSeparateBudgets ? budget.weekendAmount : budget.amount;
      const totalBudget = hasSeparateBudgets 
        ? (weekdayBudget * weekdayDaysTotal) + (weekendBudget * weekendDaysTotal)
        : budget.amount;
      
      // Calculate remaining and daily allowance
      // For separate budgets, calculate based on daily amounts
      // For regular budgets, use the total amount
      let safeToSpendToday = 0;
      let remaining = 0;
      
      if (hasSeparateBudgets) {
        if (isTodayWeekend) {
          const weekendRemaining = Math.max(0, (weekendBudget * weekendDaysTotal) - weekendSpent);
          safeToSpendToday = weekendDaysRemaining > 0 ? weekendRemaining / weekendDaysRemaining : 0;
        } else {
          const weekdayRemaining = Math.max(0, (weekdayBudget * weekdayDaysTotal) - weekdaySpent);
          safeToSpendToday = weekdayDaysRemaining > 0 ? weekdayRemaining / weekdayDaysRemaining : 0;
        }
        remaining = Math.max(0, totalBudget - totalSpent);
      } else {
        // Regular budget - divide remaining by all remaining days
        remaining = Math.max(0, totalBudget - totalSpent);
        safeToSpendToday = remainingDays > 0 ? remaining / remainingDays : 0;
      }
      
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      
      return {
        category: budget.category,
        budget: totalBudget,
        weekdayBudget: weekdayBudget,
        weekendBudget: weekendBudget,
        hasSeparateBudgets: hasSeparateBudgets,
        spent: totalSpent,
        weekdaySpent: weekdaySpent,
        weekendSpent: weekendSpent,
        remaining: remaining,
        percentageUsed: Math.round(percentageUsed * 10) / 10,
        safeToSpendToday: Math.max(0, safeToSpendToday),
        isOnTrack: totalSpent <= totalBudget,
        isTodayWeekend: isTodayWeekend
      };
    });
    
    // Calculate totals (accounting for weekday/weekend budgets)
    const totalBudget = budgets.reduce((sum, b) => {
      if (b.period === 'monthly') {
        return sum + b.amount;
      } else {
        return sum + (b.amount * 4.33);
      }
    }, 0);
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    
    // Calculate total daily allowance based on whether today is weekday or weekend
    let totalDailyAllowance = 0;
    if (isTodayWeekend) {
      const weekendTotalRemaining = categoryBudgets.reduce((sum, cat) => {
        if (cat.hasSeparateBudgets) {
          const weekendRemaining = Math.max(0, (cat.weekendBudget * weekendDaysTotal) - cat.weekendSpent);
          return sum + (weekendRemaining / Math.max(1, weekendDaysRemaining));
        }
        return sum + (cat.remaining / Math.max(1, remainingDays));
      }, 0);
      totalDailyAllowance = weekendTotalRemaining;
    } else {
      const weekdayTotalRemaining = categoryBudgets.reduce((sum, cat) => {
        if (cat.hasSeparateBudgets) {
          const weekdayRemaining = Math.max(0, (cat.weekdayBudget * weekdayDaysTotal) - cat.weekdaySpent);
          return sum + (weekdayRemaining / Math.max(1, weekdayDaysRemaining));
        }
        return sum + (cat.remaining / Math.max(1, remainingDays));
      }, 0);
      totalDailyAllowance = weekdayTotalRemaining;
    }
    
    res.json({
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalSpent,
      remaining: totalRemaining,
      daysElapsed,
      daysTotal,
      remainingDays,
      safeToSpendToday: Math.max(0, totalDailyAllowance),
      percentageUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      categories: categoryBudgets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
