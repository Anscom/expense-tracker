import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import { getPresetCategories } from '../enums/categories.js';

dotenv.config();

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expensetracker');
    console.log('Connected to MongoDB');

    // Get preset categories from enum
    const defaultCategories = getPresetCategories();

    // Upsert preset categories (don't delete existing user-created categories)
    for (const category of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: category.name },
        category,
        { upsert: true, new: true }
      );
    }
    console.log('Seeded preset categories');

    const count = await Category.countDocuments();
    console.log(`Total categories: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
