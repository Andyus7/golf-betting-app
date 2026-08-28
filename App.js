import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/theme/theme';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ScorecardScreen from './src/screens/ScorecardScreen';
import WagersScreen from './src/screens/WagersScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import PlayersScreen from './src/screens/PlayersScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.bgCard,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Inicio') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Tarjeta') {
              iconName = focused ? 'clipboard' : 'clipboard-outline';
            } else if (route.name === 'Apuestas') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else if (route.name === 'Historial') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Jugadores') {
              iconName = focused ? 'people' : 'people-outline';
            }

            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
        <Tab.Screen name="Tarjeta" component={ScorecardScreen} options={{ tabBarLabel: 'Tarjeta' }} />
        <Tab.Screen name="Apuestas" component={WagersScreen} options={{ tabBarLabel: 'Apuestas' }} />
        <Tab.Screen name="Historial" component={HistoryScreen} options={{ tabBarLabel: 'Historial' }} />
        <Tab.Screen name="Jugadores" component={PlayersScreen} options={{ tabBarLabel: 'Jugadores' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
