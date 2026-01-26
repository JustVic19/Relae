import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useDeepInsights } from '../hooks/useProfile';

const { width } = Dimensions.get('window');

interface InsightsModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function InsightsModal({ visible, onClose }: InsightsModalProps) {
    const { insights, isLoading } = useDeepInsights();

    const chartConfig = {
        backgroundColor: '#FFFFFF',
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#F5F5F7',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#6C63FF',
        },
    };

    const formatHour = (hour: number) => {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    };

    const getDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>📊 Deep Insights</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#6C63FF" />
                        </View>
                    ) : insights ? (
                        <>
                            {/* Key Metrics */}
                            <View style={styles.metricsContainer}>
                                <View style={styles.metricCard}>
                                    <Text style={styles.metricIcon}>✅</Text>
                                    <Text style={styles.metricValue}>{insights.totalCompleted}</Text>
                                    <Text style={styles.metricLabel}>Tasks (30 days)</Text>
                                </View>
                                <View style={styles.metricCard}>
                                    <Text style={styles.metricIcon}>📈</Text>
                                    <Text style={styles.metricValue}>{insights.averagePerDay}</Text>
                                    <Text style={styles.metricLabel}>Avg / Day</Text>
                                </View>
                                {insights.peakProductivityHour !== null && (
                                    <View style={styles.metricCard}>
                                        <Text style={styles.metricIcon}>⏰</Text>
                                        <Text style={styles.metricValue}>
                                            {formatHour(insights.peakProductivityHour).split(' ')[0]}
                                        </Text>
                                        <Text style={styles.metricLabel}>Peak Hour</Text>
                                    </View>
                                )}
                            </View>

                            {/* Productivity Trend (Last 7 Days) */}
                            {insights.dailyTrend.length > 0 && (
                                <View style={styles.chartSection}>
                                    <Text style={styles.chartTitle}>📅 Weekly Productivity Trend</Text>
                                    <LineChart
                                        data={{
                                            labels: insights.dailyTrend.map((d) =>
                                                getDateLabel(d.date).split(' ')[1] // Just day number
                                            ),
                                            datasets: [
                                                {
                                                    data: insights.dailyTrend.map((d) => d.count),
                                                },
                                            ],
                                        }}
                                        width={width - 48}
                                        height={220}
                                        chartConfig={chartConfig}
                                        bezier
                                        style={styles.chart}
                                        yAxisInterval={1}
                                    />
                                </View>
                            )}

                            {/* Weekday Distribution */}
                            {insights.weekdayDistribution.some((w) => w.count > 0) && (
                                <View style={styles.chartSection}>
                                    <Text style={styles.chartTitle}>📊 Performance by Day</Text>
                                    <BarChart
                                        data={{
                                            labels: insights.weekdayDistribution.map((w) => w.day),
                                            datasets: [
                                                {
                                                    data: insights.weekdayDistribution.map((w) => w.count || 0.1), // Min 0.1 to show bar
                                                },
                                            ],
                                        }}
                                        width={width - 48}
                                        height={220}
                                        yAxisLabel=""
                                        yAxisSuffix=""
                                        chartConfig={{
                                            ...chartConfig,
                                            barPercentage: 0.7,
                                        }}
                                        style={styles.chart}
                                        yAxisInterval={1}
                                        fromZero
                                        showValuesOnTopOfBars
                                    />
                                </View>
                            )}

                            {/* Peak Productivity Insight */}
                            {insights.peakProductivityHour !== null && (
                                <View style={styles.insightCard}>
                                    <Text style={styles.insightIcon}>💡</Text>
                                    <Text style={styles.insightTitle}>Your Peak Hour</Text>
                                    <Text style={styles.insightText}>
                                        You're most productive at {formatHour(insights.peakProductivityHour)}.
                                        Try scheduling important tasks during this time!
                                    </Text>
                                </View>
                            )}

                            {/* Empty State */}
                            {insights.totalCompleted === 0 && (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>📊</Text>
                                    <Text style={styles.emptyText}>
                                        Complete more tasks to unlock insights!
                                    </Text>
                                    <Text style={styles.emptySubtext}>
                                        Your productivity trends will appear here once you've completed some tasks.
                                    </Text>
                                </View>
                            )}

                            <View style={{ height: 40 }} />
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>❌</Text>
                            <Text style={styles.emptyText}>Failed to load insights</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    closeButton: {
        fontSize: 28,
        color: '#9BA0A8',
        padding: 4,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    metricsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        padding: 20,
    },
    metricCard: {
        flex: 1,
        minWidth: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    metricIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#6B6B6B',
        textAlign: 'center',
    },
    chartSection: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    chart: {
        borderRadius: 16,
        paddingRight: 0,
    },
    insightCard: {
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#6C63FF',
    },
    insightIcon: {
        fontSize: 32,
        marginBottom: 12,
    },
    insightTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    insightText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B6B6B',
        textAlign: 'center',
    },
});
