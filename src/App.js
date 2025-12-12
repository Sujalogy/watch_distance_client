// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import WebWatchScreen from './screens/WatchScreen';
import WatchScreen from './screens/WatchScreen';

// Make sure these files exist in src/screens/ (See Step 2)

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="WatchScreen" component={WatchScreen} />
        <Stack.Screen name="WebWatchScreen" component={WebWatchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}