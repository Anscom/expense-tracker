import express from 'express';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import Streak from '../models/Streak.js';
import { generateWeeklyInsights } from '../utils/insights.js';
import { isUnderBudget } from '../utils/budgetCalculations.js';

const router = express.Router();

// Get weekly insights
router.get('/weekly', async (req, res) => {
  try {
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
    
    const budgets = await Budget.find({ userId: 'default-user' });
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const insights = generateWeeklyInsights(expenses, budgets, totalSpent, totalBudget);
    
    res.json({
      period: {
        start: startOfWeek,
        end: endOfWeek
      },
      totalSpent,
      totalBudget,
      insights
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get spending streak
router.get('/streak', async (req, res) => {
  try {
    let streak = await Streak.findOne({ userId: 'default-user' });
    
    if (!streak) {
      streak = new Streak({ userId: 'default-user' });
      await streak.save();
    }
    
    // Check if user was under budget this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const budgets = await Budget.find({ userId: 'default-user' });
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    
    const expenses = await Expense.find({
      userId: 'default-user',
      date: { $gte: startOfWeek, $lt: endOfWeek }
    });
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const underBudget = isUnderBudget(totalBudget, totalSpent);
    
    // Update streak if under budget
    if (underBudget) {
      const lastDate = streak.lastUnderBudgetDate;
      const daysSince = lastDate 
        ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))
        : 7;
      
      if (daysSince >= 7) {
        // New week, increment streak
        streak.currentStreak += 1;
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
        streak.lastUnderBudgetDate = now;
      }
      
      streak.weeklyUnderBudget = true;
    } else {
      // Reset streak if over budget
      if (streak.weeklyUnderBudget && !underBudget) {
        streak.currentStreak = 0;
      }
      streak.weeklyUnderBudget = false;
    }
    
    await streak.save();
    
    res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      weeklyUnderBudget: streak.weeklyUnderBudget,
      lastUnderBudgetDate: streak.lastUnderBudgetDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Weekly review summary
router.get('/review', async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const expenses = await Expense.find({
      userId: 'default-user',
      date: { $gte: startOfWeek, $lt: endOfWeek }
    }).sort({ date: -1 });
    
    const budgets = await Budget.find({ userId: 'default-user' });
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Category breakdown
    const categorySpending = {};
    expenses.forEach(expense => {
      categorySpending[expense.category] = (categorySpending[expense.category] || 0) + expense.amount;
    });
    
    // Get streak
    const streak = await Streak.findOne({ userId: 'default-user' });
    
    res.json({
      period: {
        start: startOfWeek,
        end: endOfWeek
      },
      summary: {
        totalBudget,
        totalSpent,
        remaining: Math.max(0, totalBudget - totalSpent),
        percentageUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      },
      categorySpending,
      expenses: expenses.slice(0, 10), // Last 10 expenses
      streak: streak ? {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak
      } : { currentStreak: 0, longestStreak: 0 },
      insights: generateWeeklyInsights(expenses, budgets, totalSpent, totalBudget)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
