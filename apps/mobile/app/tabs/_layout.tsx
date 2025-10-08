import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C5BD83',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#fff' },
        headerShown: false,
      }}
    >

    <Tabs.Screen
      name="organisation"
      options={{
        title: 'organisation',
        tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
      }}
    />

    <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />


    </Tabs>
  );
}
