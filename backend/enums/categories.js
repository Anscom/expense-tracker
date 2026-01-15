// Category Enum and Constants

// Category Names
export const CATEGORY_NAMES = {
  FOOD_BEVERAGES: 'Food & Beverages',
  TRANSPORTATION: 'Transportation',
  HOME_UTILITIES: 'Home Utilities',
  ENTERTAINMENT: 'Entertainment',
  OTHER: 'Other',
};

// Preset Category Definitions
export const PRESET_CATEGORIES = [
  {
    name: CATEGORY_NAMES.FOOD_BEVERAGES,
    keywords: [
      'restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner',
      'breakfast', 'mcdonald', 'starbucks', 'uber eats', 'doordash',
      'grubhub', 'pizza', 'burger', 'subway', 'kfc', 'taco', 'sushi',
      'chinese', 'italian', 'mexican', 'beverage', 'drink', 'snack', 'grocery'
    ],
    icon: '🍔',
    color: '#f59e0b',
    isPreset: true
  },
  {
    name: CATEGORY_NAMES.TRANSPORTATION,
    keywords: [
      'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway',
      'bus', 'train', 'airport', 'flight', 'car', 'vehicle', 'maintenance',
      'repair', 'petrol', 'diesel', 'gasoline'
    ],
    icon: '🚗',
    color: '#3b82f6',
    isPreset: true
  },
  {
    name: CATEGORY_NAMES.HOME_UTILITIES,
    keywords: [
      'electric', 'water', 'gas bill', 'internet', 'phone', 'cable',
      'utility', 'rent', 'mortgage', 'heating', 'cooling', 'trash', 'sewer'
    ],
    icon: '🏠',
    color: '#ef4444',
    isPreset: true
  },
  {
    name: CATEGORY_NAMES.ENTERTAINMENT,
    keywords: [
      'movie', 'cinema', 'theater', 'concert', 'event', 'ticket', 'game',
      'gaming', 'streaming', 'music', 'book', 'magazine', 'netflix', 'spotify'
    ],
    icon: '🎬',
    color: '#ec4899',
    isPreset: true
  }
];

// Category Rules for Auto-Categorization
export const CATEGORY_RULES = {
  [CATEGORY_NAMES.FOOD_BEVERAGES]: [
    'restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner', 'breakfast',
    'mcdonald', 'starbucks', 'uber eats', 'doordash', 'grubhub', 'pizza', 'burger',
    'subway', 'kfc', 'taco', 'sushi', 'chinese', 'italian', 'mexican', 'beverage',
    'drink', 'snack', 'grocery', 'beer', 'wine', 'alcohol'
  ],
  [CATEGORY_NAMES.TRANSPORTATION]: [
    'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway', 'bus',
    'train', 'airport', 'flight', 'car', 'vehicle', 'maintenance', 'repair', 
    'petrol', 'diesel', 'gasoline'
  ],
  [CATEGORY_NAMES.HOME_UTILITIES]: [
    'electric', 'water', 'gas bill', 'internet', 'phone', 'cable', 'utility',
    'rent', 'mortgage', 'heating', 'cooling', 'trash', 'sewer', 'wifi'
  ],
  [CATEGORY_NAMES.ENTERTAINMENT]: [
    'movie', 'cinema', 'theater', 'concert', 'event', 'ticket', 'game', 'gaming',
    'streaming', 'music', 'book', 'magazine', 'netflix', 'spotify', 'hulu', 'disney'
  ],
  [CATEGORY_NAMES.OTHER]: [] // Default category
};

// Helper function to get preset categories (for seeding/upserting)
export function getPresetCategories() {
  return PRESET_CATEGORIES;
}

// Helper function to get preset categories as simple objects (name, icon, color, isPreset)
export function getPresetCategoriesSimple() {
  return PRESET_CATEGORIES.map(cat => ({
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isPreset: cat.isPreset
  }));
}

// Helper function to get category rules
export function getCategoryRules() {
  return CATEGORY_RULES;
}

// Helper function to categorize expense based on description
export function categorizeExpense(description) {
  if (!description) return CATEGORY_NAMES.OTHER;
  
  const lowerDescription = description.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some(keyword => lowerDescription.includes(keyword))) {
      return category;
    }
  }
  
  return CATEGORY_NAMES.OTHER;
}
