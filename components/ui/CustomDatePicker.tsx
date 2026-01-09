import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native'; // Assuming lucide-react-native is installed
import { theme } from '@/theme';

interface CustomDatePickerProps {
    label: string;
    dateValue: string;
    onDateChange: (formattedDate: string) => void;
    theme: any; // Pass your theme object
}

const CustomDatePicker = ({ label, dateValue, onDateChange, theme }: CustomDatePickerProps) => {
    const [show, setShow] = useState(false);
    const [internalDate, setInternalDate] = useState(new Date());

    const handleChange = (_event: any, selectedDate?: Date) => {
        setShow(false);
        if (selectedDate) {
            setInternalDate(selectedDate);
            const formattedDate = `${String(selectedDate.getDate()).padStart(2, "0")}-${String(
                selectedDate.getMonth() + 1
            ).padStart(2, "0")}-${selectedDate.getFullYear()}`;
            onDateChange(formattedDate);
        }
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            
            <TouchableOpacity 
                style={styles.dateInputRow} 
                onPress={() => setShow(true)}
                activeOpacity={0.7}
            >
                <TextInput
                    style={styles.input}
                    placeholder="DD-MM-YYYY"
                    value={dateValue}
                    editable={false}
                    placeholderTextColor={theme.colors.text.secondary}
                />
                <View style={styles.calendarBtn}>
                    <Calendar size={20} color={theme.colors.primary[500]} />
                </View>
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    value={internalDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    inputLabel: { 
        fontSize: 13, 
        fontWeight: '600', 
        color: theme.colors.text.secondary,
        marginBottom: 8, 
        marginTop: 12 
    },
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 14, // Matches Dropdown
        borderColor: "rgba(0,0,0,0.1)", // Matches Dropdown
        backgroundColor: theme.colors.background.dark || "#FFF",
        minHeight: 55, // Matches Dropdown
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    calendarBtn: {
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomDatePicker;