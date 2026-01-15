import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';

export default function MonthlyHistoryScreen({ navigation, route }) {
  const { selectedMonth } = route?.params || {};
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonthData, setSelectedMonthData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState(selectedMonth ? 'details' : 'months'); // 'months' or 'details'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth && viewMode === 'details') {
      loadMonthDetails(selectedMonth.year, selectedMonth.month);
    }
  }, [selectedMonth, viewMode]);

  const loadData = async () => {
    try {
      const [monthlyDataResponse, categoriesData] = await Promise.all([
        expenseService.getByMonth(),
        categoryService.getAll(),
      ]);
      setMonthlyData(monthlyDataResponse.data);
      setCategories(categoriesData);
      
      if (selectedMonth) {
        setSelectedMonthData(selectedMonth);
        setViewMode('details');
        loadMonthDetails(selectedMonth.year, selectedMonth.month);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMonthDetails = async (year, month) => {
    try {
      const response = await expenseService.getByMonthYear(year, month);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error loading month details:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMonthPress = (monthData) => {
    setSelectedMonthData(monthData);
    setViewMode('details');
    loadMonthDetails(monthData.year, monthData.month);
  };

  const handleBackToMonths = () => {
    setViewMode('months');
    setSelectedMonthData(null);
    setExpenses([]);
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
    
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(dateKey => ({
        date: dateKey,
        dateFormatted: formatDateHeader(dateKey),
        expenses: grouped[dateKey].sort((a, b) => new Date(b.date) - new Date(a.date))
      }));
  };

  const renderMonthItem = ({ item }) => (
    <TouchableOpacity
      style={styles.monthCard}
      onPress={() => handleMonthPress(item)}
    >
      <View style={styles.monthCardContent}>
        <View style={styles.monthCardLeft}>
          <Text style={styles.monthName}>{item.monthName}</Text>
          <Text style={styles.monthStats}>
            {item.expenseCount} expense{item.expenseCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.monthCardRight}>
          <Text style={styles.monthTotal}>${item.total.toFixed(2)}</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
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

  if (viewMode === 'details' && selectedMonthData) {
    const groupedExpenses = groupExpensesByDate(expenses);
    
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToMonths} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{selectedMonthData.monthName}</Text>
            <Text style={styles.headerSubtitle}>
              Total: ${selectedMonthData.total.toFixed(2)} • {selectedMonthData.expenseCount} expenses
            </Text>
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
              <Text style={styles.emptyText}>No expenses for this month</Text>
            </View>
          }
        />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Monthly History</Text>
          <Text style={styles.headerSubtitle}>View spending by month</Text>
        </View>
      </View>

      {/* Months List */}
      <FlatList
        data={monthlyData}
        renderItem={renderMonthItem}
        keyExtractor={(item) => item.monthKey}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your expenses!
            </Text>
          </View>
        }
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 16,
  },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  monthCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthCardLeft: {
    flex: 1,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  monthStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  monthCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 8,
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
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
});
