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
    const { category, amount, period } = req.body;
    
    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }
    
    const budget = await Budget.findOneAndUpdate(
      { category, userId: 'default-user' },
      { category, amount: parseFloat(amount), period: period || 'weekly', userId: 'default-user' },
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

// Get monthly budget summary
router.get('/summary/monthly', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: 'default-user' });
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    
    // Get current month expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const expenses = await Expense.find({
      userId: 'default-user',
      date: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const daysElapsed = Math.floor((now - startOfMonth) / (1000 * 60 * 60 * 24)) + 1;
    const daysTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysTotal - daysElapsed;
    const dailyAllowance = remainingDays > 0 ? (totalBudget - totalSpent) / remainingDays : 0;
    
    res.json({
      totalBudget,
      totalSpent,
      remaining: Math.max(0, totalBudget - totalSpent),
      daysElapsed,
      daysTotal,
      remainingDays,
      safeToSpendToday: Math.max(0, dailyAllowance),
      percentageUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
