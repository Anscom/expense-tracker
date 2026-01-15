import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  weekdayAmount: {
    type: Number,
    min: 0,
    default: null
  },
  weekendAmount: {
    type: Number,
    min: 0,
    default: null
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'monthly'
  },
  userId: {
    type: String,
    default: 'default-user'
  }
}, {
  timestamps: true
});

budgetSchema.index({ userId: 1, category: 1 });

export default mongoose.model('Budget', budgetSchema);
