import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { theme } from '@/theme';

interface CustomDatePickerProps {
    label: string;
    dateValue: string;
    onDateChange: (formattedDate: string) => void;
    error?: string;
    theme?: any; // Make theme optional since we're importing it
}

const CustomDatePicker = ({
    label,
    dateValue,
    onDateChange,
    error,
    theme: propTheme
}: CustomDatePickerProps) => {
    const [show, setShow] = useState(false);
    const [internalDate, setInternalDate] = useState(new Date());
    const [isFocused, setIsFocused] = useState(false);

    // Use theme from props or imported theme
    const activeTheme = propTheme || theme;

    const handleChange = (_event: any, selectedDate?: Date) => {
        setShow(false);
        setIsFocused(false);
        if (selectedDate) {
            setInternalDate(selectedDate);
            const formattedDate = `${String(selectedDate.getDate()).padStart(2, "0")}-${String(
                selectedDate.getMonth() + 1
            ).padStart(2, "0")}-${selectedDate.getFullYear()}`;
            onDateChange(formattedDate);
        }
    };

    const handlePress = () => {
        setShow(true);
        setIsFocused(true);
    };

    const handleCancel = () => {
        setShow(false);
        setIsFocused(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={[
                    styles.dateInputRow,
                    error ? styles.inputError : null,
                    isFocused && !error && styles.inputFocused
                ]}
                onPress={handlePress}
                activeOpacity={0.7}
            >


                <TextInput
                    style={styles.input}
                    placeholder="DD-MM-YYYY"
                    value={dateValue}
                    editable={false}
                    placeholderTextColor={activeTheme.colors.text.secondary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <View style={styles.iconContainerStart}>
                    <Calendar
                        size={20}
                        color={isFocused ? activeTheme.colors.primary[500] : activeTheme.colors.primary[500]}
                    />
                </View>
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {show && (
                <DateTimePicker
                    value={internalDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleChange}
                    maximumDate={new Date()}
                />
            )}

            {/* For iOS, add a cancel button */}
            {show && Platform.OS === "ios" && (
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%'
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.text.secondary,
        marginBottom: 8,
        marginTop: 16,
    },
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 14,
        borderColor: "rgba(0,0,0,0.1)",
        backgroundColor: "#FFF",
        minHeight: 48,
        overflow: 'hidden',
    },
    inputFocused: {
        borderColor: theme.colors.primary[500],
        borderWidth: 2,
    },
    inputError: {
        borderColor: "#EF4444",
    },
    iconContainerStart: {
        paddingRight: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    input: {
        flex: 1,
        paddingHorizontal: 8,
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 11,
        marginTop: 4,
        fontWeight: "600",
    },
    cancelButton: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: theme.colors.primary[500],
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CustomDatePicker;