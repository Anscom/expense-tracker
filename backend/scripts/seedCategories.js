import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

const defaultCategories = [
  {
    name: 'Food & Dining',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner',
      'breakfast', 'mcdonald', 'starbucks', 'uber eats', 'doordash',
      'grubhub', 'pizza', 'burger', 'subway', 'kfc', 'taco', 'sushi',
      'chinese', 'italian', 'mexican'
    ],
    icon: '🍔',
    color: '#f59e0b'
  },
  {
    name: 'Transportation',
    keywords: [
      'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway',
      'bus', 'train', 'airport', 'flight', 'car', 'vehicle', 'maintenance',
      'repair', 'petrol'
    ],
    icon: '🚗',
    color: '#3b82f6'
  },
  {
    name: 'Shopping',
    keywords: [
      'amazon', 'target', 'walmart', 'store', 'shop', 'purchase', 'buy',
      'mall', 'retail', 'clothing', 'apparel', 'electronics', 'online'
    ],
    icon: '🛍️',
    color: '#8b5cf6'
  },
  {
    name: 'Bills & Utilities',
    keywords: [
      'electric', 'water', 'gas bill', 'internet', 'phone', 'cable',
      'utility', 'rent', 'mortgage', 'insurance', 'subscription', 'netflix',
      'spotify'
    ],
    icon: '💳',
    color: '#ef4444'
  },
  {
    name: 'Entertainment',
    keywords: [
      'movie', 'cinema', 'theater', 'concert', 'event', 'ticket', 'game',
      'gaming', 'streaming', 'music', 'book', 'magazine'
    ],
    icon: '🎬',
    color: '#ec4899'
  },
  {
    name: 'Health & Fitness',
    keywords: [
      'gym', 'pharmacy', 'doctor', 'hospital', 'medical', 'medicine',
      'drug', 'vitamin', 'supplement', 'fitness', 'yoga', 'pilates'
    ],
    icon: '💊',
    color: '#10b981'
  },
  {
    name: 'Education',
    keywords: [
      'school', 'tuition', 'course', 'book', 'textbook', 'education',
      'learning', 'university', 'college', 'class'
    ],
    icon: '📚',
    color: '#6366f1'
  },
  {
    name: 'Other',
    keywords: [],
    icon: '💰',
    color: '#6b7280'
  }
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expensetracker');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert default categories
    await Category.insertMany(defaultCategories);
    console.log('Seeded default categories');

    const count = await Category.countDocuments();
    console.log(`Total categories: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
