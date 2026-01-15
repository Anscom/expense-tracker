import express from 'express';
import Expense from '../models/Expense.js';
import { categorizeExpense } from '../utils/categorization.js';

const router = express.Router();

// Get all expenses with optional filters
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, category, limit = 50 } = req.query;
    const query = { userId: 'default-user' };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (category) {
      query.category = category;
    }
    
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single expense
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense (one-tap entry)
router.post('/', async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    
    if (!amount || !description) {
      return res.status(400).json({ error: 'Amount and description are required' });
    }
    
    // Auto-categorize if not provided
    const finalCategory = category || categorizeExpense(description);
    
    const expense = new Expense({
      amount: parseFloat(amount),
      description: description.trim(),
      category: finalCategory,
      date: date ? new Date(date) : new Date(),
      userId: 'default-user'
    });
    
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = new Date(date);
    
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total spent for a period
router.get('/stats/total', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: 'default-user' };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const result = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const total = result.length > 0 ? result[0].total : 0;
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's expenses grouped by category
router.get('/today/by-category', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const expenses = await Expense.find({
      userId: 'default-user',
      date: { $gte: startOfDay, $lt: endOfDay }
    });
    
    const categorySpending = {};
    expenses.forEach(expense => {
      categorySpending[expense.category] = (categorySpending[expense.category] || 0) + expense.amount;
    });
    
    const categoryList = Object.entries(categorySpending).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);
    
    res.json({
      total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      byCategory: categoryList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
