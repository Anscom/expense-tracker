import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';

export default function HistoryScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const [expensesData, categoriesData] = await Promise.all([
        expenseService.getAll(params),
        categoryService.getAll(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Group expenses by date
  const groupExpensesByDate = (expenses) => {
    const grouped = {};
    expenses.forEach(expense => {
      const dateKey = new Date(expense.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });
    
    // Convert to array format for FlatList
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a)) // Sort dates descending
      .map(dateKey => ({
        date: dateKey,
        dateFormatted: formatDateHeader(dateKey),
        expenses: grouped[dateKey].sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort expenses within date descending
      }));
  };

  const groupedExpenses = groupExpensesByDate(expenses);

  const renderDateHeader = ({ item }) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateHeaderText}>{item.dateFormatted}</Text>
    </View>
  );

  const renderExpenseItem = ({ item }) => {
    const category = categories.find(cat => cat.name === item.category);
    const categoryIcon = category?.icon || '💰';
    
    return (
      <View style={styles.expenseItem}>
        <View style={styles.expenseLeft}>
          <View style={styles.expenseIconContainer}>
            <Text style={styles.expenseIcon}>{categoryIcon}</Text>
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseDescription}>{item.description}</Text>
            <View style={styles.expenseMeta}>
              <Text style={styles.expenseCategory}>{item.category}</Text>
              <Text style={styles.expenseTime}>{formatTime(item.date)}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </View>
    );
  };

  const renderSection = ({ item }) => (
    <View style={styles.dateSection}>
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeaderText}>{item.dateFormatted}</Text>
      </View>
      <View style={styles.expensesContainer}>
        {item.expenses.map((expense, index) => (
          <View key={expense._id}>
            {renderExpenseItem({ item: expense })}
            {index < item.expenses.length - 1 && <View style={styles.expenseDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Spending title and View All Button */}
        <View style={styles.headerBar}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Spending</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('MonthlyHistory')}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
              <Ionicons name="calendar-outline" size={18} color="#6366f1" />
            </TouchableOpacity>
          </View>
          <View style={styles.filterBar}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterBarContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  !selectedCategory && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    !selectedCategory && styles.filterButtonTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id || cat.name}
                  style={[
                    styles.filterButton,
                    selectedCategory === cat.name && styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === cat.name ? null : cat.name
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedCategory === cat.name && styles.filterButtonTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.filterMoreButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons name="options" size={20} color="#6366f1" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

      {/* Expenses List */}
      <FlatList
        data={groupedExpenses}
        renderItem={renderSection}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your expenses!
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id || item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalCategoryItem}
                  onPress={() => {
                    setSelectedCategory(
                      selectedCategory === item.name ? null : item.name
                    );
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={styles.modalCategoryText}>{item.name}</Text>
                  {selectedCategory === item.name && (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  filterBar: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 6,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterMoreButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 16,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIcon: {
    fontSize: 24,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  expenseTime: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  expensesContainer: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  expenseDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 76,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCategoryText: {
    fontSize: 16,
    color: '#1f2937',
  },
});
