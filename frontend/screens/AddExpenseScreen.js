import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';

const DEFAULT_QUICK_AMOUNTS = [5, 10, 20, 50, 100];
const QUICK_AMOUNTS_STORAGE_KEY = '@quick_amounts';

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [quickAmounts, setQuickAmounts] = useState(DEFAULT_QUICK_AMOUNTS);
  const [loading, setLoading] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showQuickAmountsSheet, setShowQuickAmountsSheet] = useState(false);
  const [editingQuickAmount, setEditingQuickAmount] = useState('');
  const bottomSheetRef = React.useRef(null);
  const quickAmountsSheetRef = React.useRef(null);

  useEffect(() => {
    loadCategories();
    loadQuickAmounts();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAll();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadQuickAmounts = async () => {
    try {
      const stored = await AsyncStorage.getItem(QUICK_AMOUNTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQuickAmounts(parsed);
      }
    } catch (error) {
      console.error('Error loading quick amounts:', error);
    }
  };

  const saveQuickAmounts = async (amounts) => {
    try {
      await AsyncStorage.setItem(QUICK_AMOUNTS_STORAGE_KEY, JSON.stringify(amounts));
      setQuickAmounts(amounts);
    } catch (error) {
      console.error('Error saving quick amounts:', error);
    }
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleAddQuickAmount = () => {
    const value = parseFloat(editingQuickAmount);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (quickAmounts.includes(value)) {
      Alert.alert('Error', 'This amount already exists');
      return;
    }

    const newAmounts = [...quickAmounts, value].sort((a, b) => a - b);
    saveQuickAmounts(newAmounts);
    setEditingQuickAmount('');
    setShowQuickAmountsSheet(false);
    quickAmountsSheetRef.current?.close();
  };

  const handleRemoveQuickAmount = (value) => {
    const newAmounts = quickAmounts.filter(amt => amt !== value);
    saveQuickAmounts(newAmounts);
  };

  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await expenseService.create({
        amount: amountNum,
        description: description.trim() || undefined,
        category: selectedCategory?.name || undefined,
      });

      // Reset form
      setAmount('');
      setDescription('');
      setSelectedCategory(null);

      Alert.alert('Success', 'Expense added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const snapPoints = React.useMemo(() => ['60%', '85%'], []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Expense</Text>
            <Text style={styles.subtitle}>Quick entry</Text>
          </View>

          {/* Amount Input Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                autoFocus
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountsContainer}>
              <View style={styles.quickAmountsHeader}>
                <Text style={styles.quickAmountsLabel}>Quick amounts</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowQuickAmountsSheet(true);
                    quickAmountsSheetRef.current?.expand();
                  }}
                  style={styles.editButton}
                >
                  <Ionicons name="settings-outline" size={18} color="#6366f1" />
                </TouchableOpacity>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.quickAmountsScroll}
                contentContainerStyle={styles.quickAmounts}
              >
                {quickAmounts.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickAmountButton,
                      amount === value.toString() && styles.quickAmountButtonActive,
                    ]}
                    onPress={() => handleQuickAmount(value)}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        amount === value.toString() && styles.quickAmountTextActive,
                      ]}
                    >
                      ${value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Category Selection Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => {
                setShowCategorySheet(true);
                bottomSheetRef.current?.expand();
              }}
            >
              {selectedCategory ? (
                <View style={styles.selectedCategory}>
                  <Text style={styles.categoryIcon}>{selectedCategory.icon || '💰'}</Text>
                  <Text style={styles.categoryName}>{selectedCategory.name}</Text>
                </View>
              ) : (
                <View style={styles.noCategory}>
                  <Ionicons name="pricetag-outline" size={20} color="#9ca3af" />
                  <Text style={styles.noCategoryText}>Select category</Text>
                </View>
              )}
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Description Input Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="What did you spend on?"
              multiline
              maxLength={200}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setShowCategorySheet(false)}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Select Category</Text>
          <ScrollView style={styles.categoryList}>
            <TouchableOpacity
              style={styles.categoryOption}
              onPress={() => {
                setSelectedCategory(null);
                bottomSheetRef.current?.close();
              }}
            >
              <View style={[styles.categoryOptionContent, !selectedCategory && styles.categoryOptionSelected]}>
                <Ionicons name="pricetag-outline" size={24} color={!selectedCategory ? "#6366f1" : "#6b7280"} />
                <Text style={[styles.categoryOptionText, !selectedCategory && styles.categoryOptionTextSelected]}>
                  Auto-categorize
                </Text>
              </View>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id || cat.name}
                style={styles.categoryOption}
                onPress={() => {
                  setSelectedCategory(cat);
                  bottomSheetRef.current?.close();
                }}
              >
                <View style={[
                  styles.categoryOptionContent,
                  selectedCategory?.name === cat.name && styles.categoryOptionSelected
                ]}>
                  <Text style={styles.categoryOptionIcon}>{cat.icon || '💰'}</Text>
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory?.name === cat.name && styles.categoryOptionTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                  {selectedCategory?.name === cat.name && (
                    <Ionicons name="checkmark-circle" size={20} color="#6366f1" style={styles.checkIcon} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>

      {/* Quick Amounts Management Bottom Sheet */}
      <BottomSheet
        ref={quickAmountsSheetRef}
        index={-1}
        snapPoints={['50%', '70%']}
        enablePanDownToClose
        onClose={() => {
          setShowQuickAmountsSheet(false);
          setEditingQuickAmount('');
        }}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Manage Quick Amounts</Text>
          <Text style={styles.bottomSheetSubtitle}>Add frequently used amounts</Text>
          
          {/* Add New Amount */}
          <View style={styles.addAmountContainer}>
            <View style={styles.addAmountInputContainer}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.addAmountInput}
                value={editingQuickAmount}
                onChangeText={setEditingQuickAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddQuickAmount}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Quick Amounts List */}
          <ScrollView style={styles.quickAmountsList}>
            {quickAmounts.map((value) => (
              <View key={value} style={styles.quickAmountItem}>
                <Text style={styles.quickAmountItemText}>${value}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveQuickAmount(value)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {quickAmounts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="pricetags-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No quick amounts yet</Text>
                <Text style={styles.emptyStateSubtext}>Add frequently used amounts above</Text>
              </View>
            )}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  currency: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  quickAmountsContainer: {
    marginTop: 16,
  },
  quickAmountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAmountsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  editButton: {
    padding: 4,
  },
  quickAmountsScroll: {
    marginHorizontal: -4,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickAmountButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  quickAmountTextActive: {
    color: '#fff',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  noCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noCategoryText: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 8,
  },
  descriptionInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
  },
  bottomSheetIndicator: {
    backgroundColor: '#d1d5db',
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  categoryList: {
    flex: 1,
  },
  categoryOption: {
    marginBottom: 8,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  categoryOptionSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  categoryOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  categoryOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  addAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  addAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  addAmountInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAmountsList: {
    flex: 1,
  },
  quickAmountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 8,
  },
  quickAmountItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});
