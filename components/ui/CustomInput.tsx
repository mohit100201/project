import React, { useState } from "react";
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

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  iconStart: IconStart,
  iconEnd: IconEnd,
  iconSize = 20,
  iconColor = theme.colors.primary[500],
  style,
  value,
  onChangeText,
  editable = true,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputWrapper,
        error ? styles.inputError : null,
        !editable ? styles.inputDisabled : null,
        isFocused && !error && styles.inputFocused,
        props.multiline && { minHeight: 100, alignItems: 'flex-start', paddingTop: 12 }
      ]}>

        {IconStart && (
          <View style={styles.iconContainerStart}>
            <IconStart size={iconSize} color={isFocused ? theme.colors.primary[500] : iconColor} />
          </View>
        )}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.text.secondary}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {IconEnd && (
          <View style={styles.iconContainerEnd}>
            <IconEnd size={iconSize} color={isFocused ? theme.colors.primary[500] : iconColor} />
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
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    minHeight: 48,
    overflow: "hidden",
  },
  inputFocused: {
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: "#D1D5DB",
    borderColor: "#9CA3AF",
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 8,
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
    paddingLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerEnd: {
    paddingRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});