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
  period: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'weekly'
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
