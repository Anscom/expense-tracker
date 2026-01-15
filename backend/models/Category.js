import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  icon: {
    type: String,
    default: '💰'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  isPreset: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Category', categorySchema);
