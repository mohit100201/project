import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { theme } from "@/theme";
import { LucideIcon } from "lucide-react-native";

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  iconStart?: LucideIcon; // Icon for the front
  iconEnd?: LucideIcon;   // Icon for the back
  iconSize?: number;
  iconColor?: string;
}

// No changes needed to the logic, but here is how it looks fully ready for state
const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  iconStart: IconStart,
  iconEnd: IconEnd,
  iconSize = 20,
  iconColor = theme.colors.primary[500],
  style,
  value,          // Explicitly extracting these for clarity
  onChangeText,   // Explicitly extracting these for clarity
  editable = true,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputWrapper,
        error ? styles.inputError : null,
        !editable ? styles.inputDisabled : null,
        props.multiline && { minHeight: 100, alignItems: 'flex-start', paddingTop: 12 }
      ]}>

        {IconStart && (
          <View style={styles.iconContainerStart}>
            <IconStart size={iconSize} color={iconColor} />
          </View>
        )}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.text.secondary}
          value={value}             // Pass state value here
          onChangeText={onChangeText} // Pass setState function here
          editable={editable}
          {...props}
        />

        {IconEnd && (
          <View style={styles.iconContainerEnd}>
            <IconEnd size={iconSize} color={iconColor} />
          </View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default CustomInput;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: 8,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF", // Default background
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    minHeight: 55,
    overflow: "hidden",
  },
  inputDisabled: {
    backgroundColor: "#D1D5DB", // Tailwind Gray-300
    borderColor: "#9CA3AF",     // Tailwind Gray-400
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  iconContainerStart: {
    paddingLeft: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerEnd: {
    paddingRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});