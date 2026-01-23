import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
} from 'react-native';

interface DatePickerModalProps {
    visible: boolean;
    currentDate: Date;
    onClose: () => void;
    onSelectDate: (date: Date) => void;
}

export default function DatePickerModal({
    visible,
    currentDate,
    onClose,
    onSelectDate,
}: DatePickerModalProps) {
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 2 + i); // Start from 2 years ago, show 12 years

    const handleConfirm = () => {
        const newDate = new Date(selectedYear, selectedMonth, 1);
        onSelectDate(newDate);
        onClose();
    };

    const handleToday = () => {
        const today = new Date();
        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
        onSelectDate(today);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Date</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Year Selector */}
                    <Text style={styles.label}>Year</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.yearScroll}
                        contentContainerStyle={styles.yearScrollContent}
                    >
                        {years.map((year) => (
                            <TouchableOpacity
                                key={year}
                                style={[
                                    styles.yearButton,
                                    selectedYear === year && styles.yearButtonActive,
                                ]}
                                onPress={() => setSelectedYear(year)}
                            >
                                <Text
                                    style={[
                                        styles.yearText,
                                        selectedYear === year && styles.yearTextActive,
                                    ]}
                                >
                                    {year}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Month Selector */}
                    <Text style={styles.label}>Month</Text>
                    <View style={styles.monthGrid}>
                        {months.map((month, index) => (
                            <TouchableOpacity
                                key={month}
                                style={[
                                    styles.monthButton,
                                    selectedMonth === index && styles.monthButtonActive,
                                ]}
                                onPress={() => setSelectedMonth(index)}
                            >
                                <Text
                                    style={[
                                        styles.monthText,
                                        selectedMonth === index && styles.monthTextActive,
                                    ]}
                                >
                                    {month}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.todayButton}
                            onPress={handleToday}
                        >
                            <Text style={styles.todayText}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmText}>Go to Date</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    closeButton: {
        fontSize: 20,
        color: '#8E8E93',
        fontWeight: '500',
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6B6B6B',
        marginBottom: 12,
        marginTop: 8,
    },
    yearScroll: {
        marginBottom: 20,
        maxHeight: 50,
    },
    yearScrollContent: {
        paddingRight: 20,
    },
    yearButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F7F7F8',
        marginRight: 10,
        justifyContent: 'center',
    },
    yearButtonActive: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#1A1A1A',
    },
    yearText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8E8E93',
    },
    yearTextActive: {
        color: '#FFFFFF',
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    monthButton: {
        width: '14.5%', // Fits 6 per row approx with gaps
        paddingVertical: 12, // Use padding for vertical centering instead of aspectRatio
        borderRadius: 20, // High curvature
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    monthButtonActive: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
    },
    monthText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    monthTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    todayButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#F7F7F8',
        alignItems: 'center',
    },
    todayText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
