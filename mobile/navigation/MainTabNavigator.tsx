import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import FeedScreen from '../screens/FeedScreen';
import GroupScreen from '../screens/GroupScreen';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component (matches existing design)
function CustomTabBar({ state, descriptors, navigation }: any) {
    return (
        <View style={styles.bottomNav}>
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                // Get icon and label
                let icon = '';
                let label = '';

                if (route.name === 'HomeTab') {
                    icon = '🏠';
                    label = 'Home';
                } else if (route.name === 'CalendarTab') {
                    icon = '📅';
                    label = 'Calendar';
                } else if (route.name === 'FeedTab') {
                    icon = '📬';
                    label = 'Feed';
                } else if (route.name === 'GroupsTab') {
                    icon = '👥';
                    label = 'Collaborate';
                }

                return (
                    <TouchableOpacity
                        key={route.key}
                        style={isFocused ? styles.navItemActive : styles.navItem}
                        onPress={onPress}
                    >
                        <Text style={isFocused ? styles.navIconActive : styles.navIcon}>
                            {icon}
                        </Text>
                        {isFocused && (
                            <Text style={styles.navLabelActive}>{label}</Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="FeedTab" component={FeedScreen} />
            <Tab.Screen name="CalendarTab" component={CalendarScreen} />
            <Tab.Screen name="GroupsTab" component={GroupScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#2D2D2D',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    navItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navItemActive: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navIcon: {
        fontSize: 24,
    },
    navIconActive: {
        fontSize: 22,
    },
    navLabelActive: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
});
