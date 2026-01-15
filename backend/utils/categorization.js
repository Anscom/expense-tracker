// Rule-based auto-categorization
const categoryRules = {
  'Food & Dining': [
    'restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner', 'breakfast',
    'mcdonald', 'starbucks', 'uber eats', 'doordash', 'grubhub', 'pizza', 'burger',
    'subway', 'kfc', 'taco', 'sushi', 'chinese', 'italian', 'mexican'
  ],
  'Transportation': [
    'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway', 'bus',
    'train', 'airport', 'flight', 'car', 'vehicle', 'maintenance', 'repair', 
    'petrol', 'diesel', 'gasoline', 'gas'
  ],
  'Shopping': [
    'amazon', 'target', 'walmart', 'store', 'shop', 'purchase', 'buy', 'mall',
    'retail', 'clothing', 'apparel', 'electronics', 'online'
  ],
  'Bills & Utilities': [
    'electric', 'water', 'gas bill', 'internet', 'phone', 'cable', 'utility',
    'rent', 'mortgage', 'insurance', 'subscription', 'netflix', 'spotify'
  ],
  'Entertainment': [
    'movie', 'cinema', 'theater', 'concert', 'event', 'ticket', 'game', 'gaming',
    'streaming', 'music', 'book', 'magazine'
  ],
  'Health & Fitness': [
    'gym', 'pharmacy', 'doctor', 'hospital', 'medical', 'medicine', 'drug',
    'vitamin', 'supplement', 'fitness', 'yoga', 'pilates'
  ],
  'Education': [
    'school', 'tuition', 'course', 'book', 'textbook', 'education', 'learning',
    'university', 'college', 'class'
  ],
  'Other': [] // Default category
};

export function categorizeExpense(description) {
  if (!description) return 'Other';
  
  const lowerDescription = description.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryRules)) {
    if (keywords.some(keyword => lowerDescription.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

export function getCategoryRules() {
  return categoryRules;
}
