import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import HistoryScreen from './screens/HistoryScreen';
import MonthlyHistoryScreen from './screens/MonthlyHistoryScreen';
import ReviewScreen from './screens/ReviewScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Review" 
        component={ReviewScreen}
        options={{ 
          title: 'Weekly Review',
          headerStyle: { backgroundColor: '#6366f1' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HistoryMain" 
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MonthlyHistory" 
        component={MonthlyHistoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Add') {
                iconName = focused ? 'add-circle' : 'add-circle-outline';
              } else if (route.name === 'History') {
                iconName = focused ? 'list' : 'list-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              height: 60,
              paddingBottom: 5,
              paddingTop: 5,
            },
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeStack}
            options={{ headerShown: false }}
          />
          <Tab.Screen 
            name="Add" 
            component={AddExpenseScreen}
            options={{
              tabBarLabel: '',
              tabBarIcon: ({ focused, color, size }) => (
                <View style={styles.addButtonContainer}>
                  <LinearGradient
                    colors={focused ? ['#6366f1', '#8b5cf6'] : ['#6366f1', '#8b5cf6']}
                    style={styles.addButtonGradient}
                  >
                    <Ionicons 
                      name="add" 
                      size={28} 
                      color="#fff" 
                    />
                  </LinearGradient>
                </View>
              ),
            }}
          />
          <Tab.Screen 
            name="History" 
            component={HistoryStack}
            options={{ headerShown: false }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: -28,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
