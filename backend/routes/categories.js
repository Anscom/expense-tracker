import express from 'express';
import Category from '../models/Category.js';
import { getCategoryRules } from '../utils/categorization.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { name, keywords, icon, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const category = new Category({
      name,
      keywords: keywords || [],
      icon: icon || '💰',
      color: color || '#6366f1'
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, keywords, icon, color } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get default categories (from rules)
router.get('/defaults/list', async (req, res) => {
  try {
    const rules = getCategoryRules();
    const defaultCategories = Object.keys(rules).map(name => ({
      name,
      keywords: rules[name],
      icon: '💰',
      color: '#6366f1'
    }));
    res.json(defaultCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
