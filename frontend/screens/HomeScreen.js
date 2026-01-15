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
  const [budgetForm, setBudgetForm] = useState({ category: '', amount: '', period: 'monthly' });

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
    if (!budgetForm.category || !budgetForm.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(budgetForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      if (editingBudget) {
        await budgetService.update(editingBudget._id, {
          amount: amountNum,
          period: budgetForm.period,
        });
      } else {
        await budgetService.create({
          category: budgetForm.category.trim(),
          amount: amountNum,
          period: budgetForm.period,
        });
      }
      setShowBudgetModal(false);
      setEditingBudget(null);
      setBudgetForm({ category: '', amount: '', period: 'monthly' });
      loadData();
    } catch (error) {
      console.error('Budget save error:', error);
      Alert.alert('Error', error.message || 'Failed to save budget');
    }
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
    if (budget) {
      setEditingBudget(budget);
      setBudgetForm({
        category: budget.category,
        amount: budget.amount.toString(),
        period: budget.period,
      });
    } else {
      setEditingBudget(null);
      setBudgetForm({ category: '', amount: '', period: 'monthly' });
    }
    setShowBudgetModal(true);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero: Safe to Spend Today */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={isOnTrack ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Safe to spend today</Text>
          <Text style={styles.heroAmount}>
            ${safeToSpendToday.toFixed(2)}
          </Text>
          <Text style={styles.heroSubtext}>
            {isOnTrack
              ? `$${monthlyRemaining.toFixed(2)} left this month`
              : 'Over budget this month'}
          </Text>
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
            {budgets.map((budget) => (
              <View key={budget._id} style={styles.budgetItem}>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetCategory}>{budget.category}</Text>
                  <Text style={styles.budgetAmount}>
                    ${budget.amount.toFixed(2)} / {budget.period}
                  </Text>
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
            ))}
          </View>
        )}
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No categories</Text>
          </View>
        ) : (
          <View style={styles.categoriesCard}>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <View key={cat._id || cat.name} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{cat.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Quick Add Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Add')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
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
                  {editingBudget ? 'Edit Budget' : 'New Budget'}
                </Text>
                <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              {editingBudget ? (
                <Text style={styles.formValue}>{budgetForm.category}</Text>
              ) : categories.length > 0 ? (
                <ScrollView 
                  style={styles.categorySelector}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id || cat.name}
                      style={[
                        styles.categoryOption,
                        budgetForm.category === cat.name &&
                          styles.categoryOptionActive,
                      ]}
                      onPress={() =>
                        setBudgetForm({ ...budgetForm, category: cat.name })
                      }
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          budgetForm.category === cat.name &&
                            styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                      {budgetForm.category === cat.name && (
                        <Ionicons name="checkmark" size={20} color="#6366f1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={styles.formInput}
                  value={budgetForm.category}
                  onChangeText={(text) =>
                    setBudgetForm({ ...budgetForm, category: text })
                  }
                  placeholder="Enter category name"
                  autoCapitalize="words"
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount</Text>
              <TextInput
                style={styles.formInput}
                value={budgetForm.amount}
                onChangeText={(text) =>
                  setBudgetForm({ ...budgetForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Period</Text>
              <View style={styles.periodSelector}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    budgetForm.period === 'weekly' && styles.periodButtonActive,
                  ]}
                  onPress={() =>
                    setBudgetForm({ ...budgetForm, period: 'weekly' })
                  }
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      budgetForm.period === 'weekly' &&
                        styles.periodButtonTextActive,
                    ]}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    budgetForm.period === 'monthly' &&
                      styles.periodButtonActive,
                  ]}
                  onPress={() =>
                    setBudgetForm({ ...budgetForm, period: 'monthly' })
                  }
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      budgetForm.period === 'monthly' &&
                        styles.periodButtonTextActive,
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveBudget}
            >
              <Text style={styles.saveButtonText}>Save</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  budgetCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 13,
    color: '#6b7280',
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  categoriesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#1f2937',
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
    maxHeight: 200,
    marginTop: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryOptionActive: {
    backgroundColor: '#6366f1',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  categoryOptionTextActive: {
    color: '#fff',
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
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
