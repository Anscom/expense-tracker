import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { budgetService } from '../services/budgetService';
import { categoryService } from '../services/categoryService';

export default function SettingsScreen() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ category: '', amount: '', period: 'weekly' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [budgetsData, categoriesData] = await Promise.all([
        budgetService.getAll(),
        categoryService.getAll(),
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetForm.category || !budgetForm.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (editingBudget) {
        await budgetService.update(editingBudget._id, {
          amount: parseFloat(budgetForm.amount),
          period: budgetForm.period,
        });
      } else {
        await budgetService.create(budgetForm);
      }
      setShowBudgetModal(false);
      setEditingBudget(null);
      setBudgetForm({ category: '', amount: '', period: 'weekly' });
      loadData();
    } catch (error) {
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
      setBudgetForm({ category: '', amount: '', period: 'weekly' });
    }
    setShowBudgetModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Budgets Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budgets</Text>
          <TouchableOpacity
            style={styles.addButton}
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
          budgets.map((budget) => (
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
                  <Ionicons name="pencil" size={20} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteBudget(budget._id)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
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
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <View key={cat._id || cat.name} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat.name}</Text>
              </View>
            ))}
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
              ) : (
                <ScrollView style={styles.categorySelector}>
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
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
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
    maxHeight: '80%',
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
  },
  categoryOption: {
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
