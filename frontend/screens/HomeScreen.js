import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { budgetService } from '../services/budgetService';
import { expenseService } from '../services/expenseService';
import { insightService } from '../services/insightService';
import { categoryService } from '../services/categoryService';

export default function HomeScreen({ navigation }) {
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [todaySpending, setTodaySpending] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [streak, setStreak] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState({}); // { categoryName: { amount: '', weekdayAmount: '', weekendAmount: '', useSeparateBudgets: false } }
  const [initialBudgetCategories, setInitialBudgetCategories] = useState(new Set()); // Track which categories had budgets when modal opened
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async () => {
    try {
      const [monthly, today, recent, streakData, budgetsData, categoriesData] = await Promise.all([
        budgetService.getMonthlySummary(),
        expenseService.getTodayByCategory(),
        expenseService.getAll({ limit: 3 }),
        insightService.getStreak(),
        budgetService.getAll(),
        categoryService.getAll(),
      ]);
      setMonthlySummary(monthly);
      setTodaySpending(today);
      setRecentExpenses(recent);
      setStreak(streakData);
      setBudgets(budgetsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const categoryBudgets = monthlySummary?.categories || [];
  const safeToSpendToday = monthlySummary?.safeToSpendToday || 0;
  const monthlySpent = monthlySummary?.totalSpent || 0;
  const monthlyBudget = monthlySummary?.totalBudget || 0;
  const monthlyRemaining = monthlySummary?.remaining || 0;
  const isOnTrack = safeToSpendToday > 0;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleSaveBudget = async () => {
    // If creating a new category, save it first
    if (showNewCategoryInput && newCategoryName.trim()) {
      try {
        await categoryService.create({
          name: newCategoryName.trim(),
          keywords: [],
          icon: '💰',
          color: '#6366f1',
        });
        // Add the new category to selected categories
        setSelectedCategories({
          ...selectedCategories,
          [newCategoryName.trim()]: { amount: '' }
        });
        // Update categories list
        const updatedCategories = await categoryService.getAll();
        setCategories(updatedCategories);
        setShowNewCategoryInput(false);
        setNewCategoryName('');
        return; // Let user set amount for new category
      } catch (error) {
        console.log('Category creation note:', error.message);
      }
    }

    // Get all selected categories with valid amounts
    const budgetsToSave = Object.entries(selectedCategories)
      .filter(([category, data]) => {
        if (data.useSeparateBudgets) {
          return (data.weekdayAmount && parseFloat(data.weekdayAmount) > 0) || 
                 (data.weekendAmount && parseFloat(data.weekendAmount) > 0);
        }
        return data.amount && parseFloat(data.amount) > 0;
      })
      .map(([category, data]) => {
        const budgetData = {
          category: category.trim(),
          period: 'monthly', // Always monthly
        };
        
        if (data.useSeparateBudgets) {
          // For separate budgets, send the daily amounts
          // The backend will calculate the monthly total based on actual weekday/weekend days in the month
          const weekdayAmount = data.weekdayAmount ? parseFloat(data.weekdayAmount) : 0;
          const weekendAmount = data.weekendAmount ? parseFloat(data.weekendAmount) : 0;
          
          // Calculate approximate monthly total (backend will recalculate with actual days)
          // Average month has ~22 weekdays and ~8-9 weekend days
          const weekdayDaysPerMonth = 22;
          const weekendDaysPerMonth = 8;
          const totalMonthly = (weekdayAmount * weekdayDaysPerMonth) + (weekendAmount * weekendDaysPerMonth);
          
          budgetData.amount = totalMonthly;
          budgetData.weekdayAmount = weekdayAmount;
          budgetData.weekendAmount = weekendAmount;
        } else {
          budgetData.amount = parseFloat(data.amount);
        }
        
        return budgetData;
      });

    // Find categories that had budgets initially but are no longer selected
    const categoriesToDelete = Array.from(initialBudgetCategories).filter(
      category => {
        if (!selectedCategories[category]) return true;
        const data = selectedCategories[category];
        if (data.useSeparateBudgets) {
          const weekday = data.weekdayAmount ? parseFloat(data.weekdayAmount) : 0;
          const weekend = data.weekendAmount ? parseFloat(data.weekendAmount) : 0;
          return weekday <= 0 && weekend <= 0;
        }
        return !data.amount || parseFloat(data.amount) <= 0;
      }
    );

    // If no budgets to save and no budgets to delete, show error
    if (budgetsToSave.length === 0 && categoriesToDelete.length === 0) {
      Alert.alert('Error', 'Please select at least one category and enter an amount');
      return;
    }

    try {
      // Save/update all selected budgets
      if (budgetsToSave.length > 0) {
        await Promise.all(
          budgetsToSave.map(budget => budgetService.create(budget))
        );
      }

      // Delete budgets for unchecked categories
      if (categoriesToDelete.length > 0) {
        // Find the budget IDs for categories to delete
        const budgetsToDelete = budgets.filter(b => 
          categoriesToDelete.includes(b.category)
        );
        
        await Promise.all(
          budgetsToDelete.map(budget => budgetService.delete(budget._id))
        );
      }
      
      setShowBudgetModal(false);
      setSelectedCategories({});
      setInitialBudgetCategories(new Set());
      setShowNewCategoryInput(false);
      setNewCategoryName('');
      loadData();
    } catch (error) {
      console.error('Budget save error:', error);
      Alert.alert('Error', error.message || 'Failed to save budgets');
    }
  };

  const handleCategoryToggle = (categoryName) => {
    if (selectedCategories[categoryName]) {
      // Uncheck - remove from selection
      const newSelection = { ...selectedCategories };
      delete newSelection[categoryName];
      setSelectedCategories(newSelection);
    } else {
      // Check - add to selection with default values
      setSelectedCategories({
        ...selectedCategories,
        [categoryName]: { 
          amount: '',
          weekdayAmount: '',
          weekendAmount: '',
          useSeparateBudgets: false
        }
      });
    }
  };

  const handleCategoryAmountChange = (categoryName, amount) => {
    handleMonthlyAmountChange(categoryName, amount);
  };

  const handleWeekdayAmountChange = (categoryName, amount) => {
    setSelectedCategories({
      ...selectedCategories,
      [categoryName]: {
        ...selectedCategories[categoryName],
        weekdayAmount: amount
      }
    });
  };

  const handleWeekendAmountChange = (categoryName, amount) => {
    setSelectedCategories({
      ...selectedCategories,
      [categoryName]: {
        ...selectedCategories[categoryName],
        weekendAmount: amount
      }
    });
  };

  const handleToggleSeparateBudgets = (categoryName) => {
    const currentData = selectedCategories[categoryName];
    const newUseSeparate = !currentData.useSeparateBudgets;
    
    let weekdayAmount = currentData.weekdayAmount || '';
    let weekendAmount = currentData.weekendAmount || '';
    
    // If turning on separate budgets and monthly amount exists, auto-split 50/50
    if (newUseSeparate && currentData.amount) {
      const monthlyAmount = parseFloat(currentData.amount);
      if (!isNaN(monthlyAmount) && monthlyAmount > 0) {
        // Split monthly budget 50/50: $1500 -> $750 for weekdays, $750 for weekends
        // Then calculate daily amounts: $750 / 22 weekdays, $750 / 8 weekends
        const halfMonthly = monthlyAmount / 2;
        weekdayAmount = (halfMonthly / 22).toFixed(2);
        weekendAmount = (halfMonthly / 8).toFixed(2);
      }
    }
    
    setSelectedCategories({
      ...selectedCategories,
      [categoryName]: {
        ...selectedCategories[categoryName],
        useSeparateBudgets: newUseSeparate,
        weekdayAmount: weekdayAmount,
        weekendAmount: weekendAmount,
      }
    });
  };

  const handleMonthlyAmountChange = (categoryName, amount) => {
    const currentData = selectedCategories[categoryName];
    
    // Auto-update weekday/weekend if separate budgets is enabled
    let weekdayAmount = currentData.weekdayAmount || '';
    let weekendAmount = currentData.weekendAmount || '';
    
    if (currentData.useSeparateBudgets && amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
      const monthlyAmount = parseFloat(amount);
      // Split 50/50: $1500 -> $750 each, then divide by days
      const halfMonthly = monthlyAmount / 2;
      weekdayAmount = (halfMonthly / 22).toFixed(2);
      weekendAmount = (halfMonthly / 8).toFixed(2);
    }
    
    setSelectedCategories({
      ...selectedCategories,
      [categoryName]: {
        ...selectedCategories[categoryName],
        amount: amount,
        weekdayAmount: weekdayAmount,
        weekendAmount: weekendAmount,
      }
    });
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryService.delete(categoryId);
              // Remove from selected categories if selected
              const newSelection = { ...selectedCategories };
              delete newSelection[categoryName];
              setSelectedCategories(newSelection);
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleDeleteBudget = (id) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetService.delete(id);
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const openBudgetModal = (budget = null) => {
    // Track which categories had budgets when modal opens
    const initialCategories = new Set(budgets.map(b => b.category));
    setInitialBudgetCategories(initialCategories);

    if (budget) {
      // For editing, load ALL existing budgets into selectedCategories
      // so user can see and edit all budgets, not just the one clicked
      setEditingBudget(budget);
      const allBudgetsMap = {};
      budgets.forEach(b => {
        const hasSeparate = b.weekdayAmount !== null && b.weekendAmount !== null;
        allBudgetsMap[b.category] = {
          amount: b.amount.toString(),
          weekdayAmount: b.weekdayAmount ? b.weekdayAmount.toString() : '',
          weekendAmount: b.weekendAmount ? b.weekendAmount.toString() : '',
          useSeparateBudgets: hasSeparate
        };
      });
      setSelectedCategories(allBudgetsMap);
      setShowNewCategoryInput(false);
    } else {
      // For creating new budgets, start with existing budgets pre-selected
      setEditingBudget(null);
      const existingBudgetsMap = {};
      budgets.forEach(b => {
        const hasSeparate = b.weekdayAmount !== null && b.weekendAmount !== null;
        existingBudgetsMap[b.category] = {
          amount: b.amount.toString(),
          weekdayAmount: b.weekdayAmount ? b.weekdayAmount.toString() : '',
          weekendAmount: b.weekendAmount ? b.weekendAmount.toString() : '',
          useSeparateBudgets: hasSeparate
        };
      });
      setSelectedCategories(existingBudgetsMap);
      setShowNewCategoryInput(false);
      setNewCategoryName('');
    }
    setShowBudgetModal(true);
  };

  const handleCreateNewCategory = () => {
    setShowNewCategoryInput(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero: Safe to Spend Today with Budget Progress */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={isOnTrack ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Safe to spend today</Text>
          <Text style={styles.heroAmount}>
            ${safeToSpendToday.toFixed(2)}
          </Text>
          {/* Category Budget Progress inside Hero Section */}
          {categoryBudgets.length > 0 && (
            <View style={styles.budgetsProgressCardInHero}>
            {categoryBudgets.map((catBudget, index) => {
              const category = categories.find(cat => cat.name === catBudget.category);
              const categoryIcon = category?.icon || '💰';
              const progressPercentage = Math.min(100, catBudget.percentageUsed);
              const isOverBudget = catBudget.spent > catBudget.budget;
              const isLast = index === categoryBudgets.length - 1;
              const dayTypeLabel = catBudget.isTodayWeekend ? 'Weekend' : 'Weekday';
              
              return (
                <View key={index} style={[styles.progressItemInHero, isLast && styles.progressItemLast]}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressCategoryInfo}>
                      <Text style={styles.progressCategoryIcon}>{categoryIcon}</Text>
                      <View style={styles.progressCategoryText}>
                        <Text style={styles.progressCategoryNameInHero}>{catBudget.category}</Text>
                        {catBudget.hasSeparateBudgets ? (
                          <Text style={styles.progressCategoryAmountInHero}>
                            {catBudget.isTodayWeekend 
                              ? `Weekend: $${catBudget.weekendSpent.toFixed(2)} / $${(catBudget.weekendBudget * 8).toFixed(2)}`
                              : `Weekday: $${catBudget.weekdaySpent.toFixed(2)} / $${(catBudget.weekdayBudget * 22).toFixed(2)}`
                            }
                          </Text>
                        ) : (
                          <Text style={styles.progressCategoryAmountInHero}>
                            ${catBudget.spent.toFixed(2)} / ${catBudget.budget.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text style={[
                      styles.progressSafeToSpendInHero,
                      isOverBudget && styles.progressSafeToSpendOverInHero
                    ]}>
                      ${catBudget.safeToSpendToday.toFixed(2)}/{dayTypeLabel.toLowerCase()}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainerInHero}>
                    <View 
                      style={[
                        styles.progressBarInHero,
                        { width: `${progressPercentage}%` },
                        isOverBudget ? styles.progressBarOverInHero : styles.progressBarNormalInHero
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentageInHero}>
                    {progressPercentage.toFixed(1)}% used
                  </Text>
                </View>
              );
            })}
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Monthly Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryValue}>${monthlySpent.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Budget</Text>
            <Text style={styles.summaryValue}>${monthlyBudget.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text
              style={[
                styles.summaryValue,
                monthlyRemaining < 0 && styles.summaryValueNegative,
              ]}
            >
              ${monthlyRemaining.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Today's Spending by Category */}
      {todaySpending && todaySpending.byCategory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Spending</Text>
          <View style={styles.categoryCard}>
            {todaySpending.byCategory.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.categoryRow,
                  index < todaySpending.byCategory.length - 1 &&
                    styles.categoryRowBorder,
                ]}
              >
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.categoryAmount}>
                  ${item.amount.toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={[styles.categoryRow, styles.categoryRowTotal]}>
              <Text style={styles.categoryTotalLabel}>Total</Text>
              <Text style={styles.categoryTotalAmount}>
                ${todaySpending.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.expensesCard}>
            {recentExpenses.map((expense, index) => (
              <View
                key={expense._id}
                style={[
                  styles.expenseRow,
                  index === recentExpenses.length - 1 && styles.expenseRowLast,
                ]}
              >
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseDescription} numberOfLines={1}>
                    {expense.description}
                  </Text>
                  <Text style={styles.expenseMeta}>
                    {expense.category} • {formatTime(expense.date)}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  ${expense.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Streak Indicator */}
      {streak && streak.currentStreak > 0 && (
        <View style={styles.section}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#f97316" />
            <Text style={styles.streakText}>
              {streak.currentStreak} week{streak.currentStreak !== 1 ? 's' : ''}{' '}
              under budget
            </Text>
          </View>
        </View>
      )}

      {/* Budgets Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budgets</Text>
          <TouchableOpacity
            style={styles.addIconButton}
            onPress={() => openBudgetModal()}
          >
            <Ionicons name="add" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No budgets set</Text>
            <Text style={styles.emptySubtext}>
              Add a budget to track your spending
            </Text>
          </View>
        ) : (
          <View style={styles.budgetsCard}>
            {budgets.map((budget) => {
              const category = categories.find(cat => cat.name === budget.category);
              const categoryIcon = category?.icon || '💰';
              const hasSeparateBudgets = budget.weekdayAmount !== null && budget.weekendAmount !== null;
              
              return (
                <View key={budget._id} style={styles.budgetItem}>
                  <View style={styles.budgetInfo}>
                    <View style={styles.budgetCategoryRow}>
                      <Text style={styles.budgetCategoryIcon}>{categoryIcon}</Text>
                      <Text style={styles.budgetCategory}>{budget.category}</Text>
                    </View>
                    {hasSeparateBudgets ? (
                      <View style={styles.budgetAmountContainer}>
                        <Text style={styles.budgetAmount}>
                          ${budget.amount.toFixed(2)} / month
                        </Text>
                        <View style={styles.budgetBreakdown}>
                          <Text style={styles.budgetBreakdownText}>
                            Weekday: ${budget.weekdayAmount.toFixed(2)}/day
                          </Text>
                          <Text style={styles.budgetBreakdownText}>
                            Weekend: ${budget.weekendAmount.toFixed(2)}/day
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.budgetAmount}>
                        ${budget.amount.toFixed(2)} / month
                      </Text>
                    )}
                  </View>
                  <View style={styles.budgetActions}>
                    <TouchableOpacity
                      onPress={() => openBudgetModal(budget)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="pencil" size={18} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteBudget(budget._id)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>


      {/* Budget Modal */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingBudget ? 'Edit Budget' : 'Set Budgets'}
                </Text>
                <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>

              {/* Category Selection with Checkboxes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Categories</Text>
                <ScrollView 
                  style={styles.categorySelector}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {categories.map((cat) => {
                    const isSelected = !!selectedCategories[cat.name];
                    const categoryData = selectedCategories[cat.name] || { amount: '' };
                    
                    return (
                      <View key={cat._id || cat.name} style={styles.categoryCheckboxItem}>
                        <View style={styles.checkboxRowContainer}>
                          <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => handleCategoryToggle(cat.name)}
                          >
                            <View style={[
                              styles.checkbox,
                              isSelected && styles.checkboxChecked
                            ]}>
                              {isSelected && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                              )}
                            </View>
                            <Text style={styles.categoryIcon}>{cat.icon || '💰'}</Text>
                            <Text style={styles.categoryCheckboxLabel}>{cat.name}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteCategoryButton}
                            onPress={() => handleDeleteCategory(cat._id || cat.name, cat.name)}
                          >
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                        
                        {isSelected && (
                          <View style={styles.categoryBudgetInput}>
                            <Text style={styles.budgetLabel}>Monthly Budget Limit</Text>
                            <View style={styles.amountInputContainer}>
                              <Text style={styles.currencySymbol}>$</Text>
                              <TextInput
                                style={styles.amountInputField}
                                value={categoryData.amount}
                                onChangeText={(text) => handleMonthlyAmountChange(cat.name, text)}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                              />
                            </View>

                            <TouchableOpacity
                              style={styles.separateBudgetToggle}
                              onPress={() => handleToggleSeparateBudgets(cat.name)}
                            >
                              <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>Separate Weekday/Weekend Budgets</Text>
                                <View style={[
                                  styles.toggleSwitch,
                                  categoryData.useSeparateBudgets && styles.toggleSwitchActive
                                ]}>
                                  {categoryData.useSeparateBudgets && (
                                    <View style={styles.toggleSwitchThumb} />
                                  )}
                                </View>
                              </View>
                            </TouchableOpacity>

                            {categoryData.useSeparateBudgets && (
                              <>
                                <Text style={styles.budgetLabel}>Weekday Daily Budget</Text>
                                <View style={styles.amountInputContainer}>
                                  <Text style={styles.currencySymbol}>$</Text>
                                  <TextInput
                                    style={styles.amountInputField}
                                    value={categoryData.weekdayAmount || ''}
                                    onChangeText={(text) => handleWeekdayAmountChange(cat.name, text)}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                  />
                                </View>
                                <Text style={styles.budgetLabel}>Weekend Daily Budget</Text>
                                <View style={styles.amountInputContainer}>
                                  <Text style={styles.currencySymbol}>$</Text>
                                  <TextInput
                                    style={styles.amountInputField}
                                    value={categoryData.weekendAmount || ''}
                                    onChangeText={(text) => handleWeekendAmountChange(cat.name, text)}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                  />
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
                
                {/* Create New Category */}
                {showNewCategoryInput ? (
                  <View style={styles.newCategoryInputContainer}>
                    <TextInput
                      style={styles.formInput}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      placeholder="Enter new category name"
                      autoCapitalize="words"
                      autoFocus
                    />
                    <View style={styles.newCategoryActions}>
                      <TouchableOpacity
                        style={styles.cancelNewCategoryButton}
                        onPress={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName('');
                        }}
                      >
                        <Text style={styles.cancelNewCategoryText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.addCategoryButton}
                        onPress={handleSaveBudget}
                      >
                        <Text style={styles.addCategoryButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.createCategoryButton}
                    onPress={handleCreateNewCategory}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
                    <Text style={styles.createCategoryText}>Create New Category</Text>
                  </TouchableOpacity>
                )}
              </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                Object.keys(selectedCategories).length === 0 && styles.saveButtonDisabled
              ]}
              onPress={handleSaveBudget}
              disabled={Object.keys(selectedCategories).length === 0}
            >
              <Text style={styles.saveButtonText}>
                Save {Object.keys(selectedCategories).length > 0 ? `${Object.keys(selectedCategories).length} ` : ''}Budget{Object.keys(selectedCategories).length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingTop: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    opacity: 0.95,
  },
  heroAmount: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroSubtext: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryValueNegative: {
    color: '#ef4444',
  },
  budgetsProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressItem: {
    marginBottom: 20,
  },
  progressItemLast: {
    marginBottom: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressCategoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  progressCategoryText: {
    flex: 1,
  },
  progressCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  progressCategoryAmount: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressSafeToSpend: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  progressSafeToSpendOver: {
    color: '#ef4444',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarNormal: {
    backgroundColor: '#10b981',
  },
  progressBarOver: {
    backgroundColor: '#ef4444',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6b7280',
  },
  budgetsProgressCardInHero: {
    width: '100%',
    marginBottom: 20,
  },
  progressItemInHero: {
    marginBottom: 16,
  },
  progressCategoryNameInHero: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  progressCategoryAmountInHero: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  progressSafeToSpendInHero: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.95,
  },
  progressSafeToSpendOverInHero: {
    color: '#fff',
    opacity: 0.9,
  },
  progressBarContainerInHero: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarInHero: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarNormalInHero: {
    backgroundColor: '#fff',
  },
  progressBarOverInHero: {
    backgroundColor: '#fff',
    opacity: 0.8,
  },
  progressPercentageInHero: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.85,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  categoryName: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  categoryTotalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  categoryTotalAmount: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  expensesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseRowLast: {
    borderBottomWidth: 0,
  },
  expenseLeft: {
    flex: 1,
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  expenseMeta: {
    fontSize: 13,
    color: '#9ca3af',
  },
  expenseAmount: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  streakText: {
    fontSize: 14,
    color: '#9a3412',
    fontWeight: '600',
    marginLeft: 6,
  },
  addIconButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
  },
  budgetsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetCategoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  budgetCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  budgetAmount: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  budgetAmountContainer: {
    marginTop: 4,
  },
  budgetBreakdown: {
    marginTop: 6,
    gap: 2,
  },
  budgetBreakdownText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formValue: {
    fontSize: 16,
    color: '#1f2937',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  formInput: {
    fontSize: 16,
    color: '#1f2937',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categorySelector: {
    maxHeight: 300,
    marginTop: 8,
  },
  categoryCheckboxItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkboxRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9ca3af',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryCheckboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  categoryBudgetInput: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  separateBudgetToggle: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#6366f1',
  },
  toggleSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  deleteCategoryButton: {
    padding: 8,
  },
  newCategoryInputContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  newCategoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  addCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  addCategoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  createCategoryText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 8,
  },
  cancelNewCategoryButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  cancelNewCategoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 8,
  },
  amountInputField: {
    flex: 1,
    fontSize: 18,
    color: '#1f2937',
    paddingVertical: 12,
  },
  amountInputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
