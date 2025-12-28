import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HeadmasterDashboardScreen from '../screens/headmaster/DashboardScreen';
import ApprovalsDashboard from '../screens/headmaster/ApprovalsDashboard';
import ReviewAssessmentScreen from '../screens/headmaster/ReviewAssessmentScreen';
import PromotionDashboard from '../screens/headmaster/PromotionDashboard';
import BulkPromotionWizard from '../screens/headmaster/BulkPromotionWizard';
import IndividualPromotionScreen from '../screens/headmaster/IndividualPromotionScreen';
import ReportCardsScreen from '../screens/headmaster/ReportCardsScreen';
import ViewReportCardScreen from '../screens/headmaster/ViewReportCardScreen';
import BulkReportCardsScreen from '../screens/headmaster/BulkReportCardsScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Home, UserCircle, CheckCircle, GraduationCap, FileText } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HeadmasterTabs() {
  const theme = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface.primary },
        headerTintColor: theme.colors.text.primary,
        headerRight: () => (
          <View style={{ paddingRight: 12 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <UserCircle color={theme.colors.text.primary} size={24} />
            </TouchableOpacity>
          </View>
        ),
        tabBarActiveTintColor: theme.colors.primary.base,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: { backgroundColor: theme.colors.surface.primary },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Dashboard':
              return <Home color={color} size={size} />;
            case 'Approvals':
              return <CheckCircle color={color} size={size} />;
            case 'Promotions':
              return <GraduationCap color={color} size={size} />;
            case 'ReportCards':
              return <FileText color={color} size={size} />;
            default:
              return null;
          }
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={HeadmasterDashboardScreen} />
      <Tab.Screen 
        name="Approvals" 
        component={ApprovalsDashboard}
        options={{ title: 'Approvals' }}
      />
      <Tab.Screen 
        name="Promotions" 
        component={PromotionDashboard}
        options={{ title: 'Promotions' }}
      />
      <Tab.Screen 
        name="ReportCards" 
        component={ReportCardsScreen}
        options={{ title: 'Report Cards' }}
      />
    </Tab.Navigator>
  );
}

export default function HeadmasterNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="HeadmasterTabs" component={HeadmasterTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ReviewAssessment"
        component={ReviewAssessmentScreen}
        options={{ title: 'Review Assessment', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="BulkPromotionWizard"
        component={BulkPromotionWizard}
        options={{ title: 'Bulk Promotion', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="IndividualPromotion"
        component={IndividualPromotionScreen}
        options={{ title: 'Individual Promotion', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="ViewReportCard"
        component={ViewReportCardScreen}
        options={{ title: 'Report Card', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="BulkReportCards"
        component={BulkReportCardsScreen}
        options={{ title: 'Bulk Report Cards', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Preferences', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

