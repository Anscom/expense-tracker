import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReviewScreen({ route, navigation }) {
  const { reviewData } = route.params || {};

  if (!reviewData) {
    return (
      <View style={styles.container}>
        <Text>No review data available</Text>
      </View>
    );
  }

  const { summary, categorySpending, insights, streak } = reviewData;

  return (
    <ScrollView style={styles.container}>
      {/* Summary Card */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryTitle}>Weekly Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatLabel}>Spent</Text>
            <Text style={styles.summaryStatValue}>
              ${summary.totalSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatLabel}>Budget</Text>
            <Text style={styles.summaryStatValue}>
              ${summary.totalBudget.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatLabel}>Remaining</Text>
            <Text style={styles.summaryStatValue}>
              ${summary.remaining.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(summary.percentageUsed, 100)}%`,
                backgroundColor:
                  summary.percentageUsed > 100 ? '#ef4444' : '#10b981',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {summary.percentageUsed.toFixed(0)}% of budget used
        </Text>
      </LinearGradient>

      {/* Insights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week's Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Ionicons
              name={
                insight.type === 'on_track'
                  ? 'checkmark-circle'
                  : insight.type === 'warning'
                  ? 'warning'
                  : 'alert-circle'
              }
              size={20}
              color={
                insight.type === 'on_track'
                  ? '#10b981'
                  : insight.type === 'warning'
                  ? '#f59e0b'
                  : '#ef4444'
              }
            />
            <Text style={styles.insightText}>{insight.message}</Text>
          </View>
        ))}
      </View>

      {/* Category Breakdown */}
      {Object.keys(categorySpending).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          {Object.entries(categorySpending)
            .sort(([, a], [, b]) => b - a)
            .map(([category, amount]) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryAmount}>
                  ${amount.toFixed(2)}
                </Text>
              </View>
            ))}
        </View>
      )}

      {/* Streak */}
      {streak && (
        <View style={styles.card}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={24} color="#f97316" />
            <Text style={styles.cardTitle}>Your Streak</Text>
          </View>
          <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
          <Text style={styles.streakLabel}>
            {streak.currentStreak === 1
              ? 'week under budget'
              : 'weeks under budget'}
          </Text>
          {streak.longestStreak > streak.currentStreak && (
            <Text style={styles.streakBest}>
              Best streak: {streak.longestStreak} weeks
            </Text>
          )}
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryStatValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryName: {
    fontSize: 16,
    color: '#1f2937',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  streakBest: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#6366f1',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
