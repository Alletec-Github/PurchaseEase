import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';
import type {
  RootStackParamList,
  BottomTabParamList,
  DashboardStackParamList,
  OrdersStackParamList,
  CreateStackParamList,
  InvoicesStackParamList,
  SettingsStackParamList,
} from '../types/navigation';

// Screen imports
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OrderListScreen from '../screens/OrderListScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import EditOrderScreen from '../screens/EditOrderScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import ScanDocumentScreen from '../screens/ScanDocumentScreen';
import PostedInvoicesScreen from '../screens/PostedInvoicesScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const CreateStack = createNativeStackNavigator<CreateStackParamList>();
const InvoicesStack = createNativeStackNavigator<InvoicesStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.white,
  headerTitleStyle: { fontWeight: '600' as const },
};

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={screenOptions}>
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <DashboardStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Detail' }}
      />
      <DashboardStack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'New Purchase Order' }}
      />
    </DashboardStack.Navigator>
  );
}

function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator screenOptions={screenOptions}>
      <OrdersStack.Screen
        name="OrderList"
        component={OrderListScreen}
        options={{ title: 'Purchase Orders' }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Detail' }}
      />
      <OrdersStack.Screen
        name="EditOrder"
        component={EditOrderScreen}
        options={{ title: 'Edit Order' }}
      />
    </OrdersStack.Navigator>
  );
}

function CreateStackScreen() {
  return (
    <CreateStack.Navigator screenOptions={screenOptions}>
      <CreateStack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'New Purchase Order' }}
      />
      <CreateStack.Screen
        name="ScanDocument"
        component={ScanDocumentScreen}
        options={{ title: 'Scan Document' }}
      />
    </CreateStack.Navigator>
  );
}

function InvoicesStackScreen() {
  return (
    <InvoicesStack.Navigator screenOptions={screenOptions}>
      <InvoicesStack.Screen
        name="PostedInvoices"
        component={PostedInvoicesScreen}
        options={{ title: 'Posted Invoices' }}
      />
      <InvoicesStack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ title: 'Invoice Detail' }}
      />
    </InvoicesStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={screenOptions}>
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </SettingsStack.Navigator>
  );
}

const tabIcons: Record<keyof BottomTabParamList, string> = {
  DashboardTab: 'home',
  OrdersTab: 'file-document',
  CreateTab: 'plus-circle',
  InvoicesTab: 'receipt',
  SettingsTab: 'cog',
};

const tabLabels: Record<keyof BottomTabParamList, string> = {
  DashboardTab: 'Dashboard',
  OrdersTab: 'Orders',
  CreateTab: 'Create',
  InvoicesTab: 'Invoices',
  SettingsTab: 'Settings',
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <Icon
            name={tabIcons[route.name]}
            size={route.name === 'CreateTab' ? 28 : size}
            color={color}
          />
        ),
        tabBarLabel: tabLabels[route.name],
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.white,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}>
      <Tab.Screen name="DashboardTab" component={DashboardStackScreen} />
      <Tab.Screen name="OrdersTab" component={OrdersStackScreen} />
      <Tab.Screen
        name="CreateTab"
        component={CreateStackScreen}
        options={{
          tabBarIconStyle: { marginTop: -2 },
        }}
      />
      <Tab.Screen name="InvoicesTab" component={InvoicesStackScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  isLoggedIn: boolean;
}

export default function AppNavigator({ isLoggedIn }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
