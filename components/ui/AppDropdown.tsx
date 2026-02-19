import React, { useState } from "react";
import { View, Text, StyleSheet, ImageStyle } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { theme } from "@/theme";

interface CustomDropdownPickerProps<T extends string | number> {
  label?: string;
  placeholder?: string;
  items: ItemType<T>[];
  value: T | null;
  onValueChange: (value: T) => void;
  error?: string;
  zIndex?: number;
  zIndexInverse?: number;
  disabled?: boolean;
  listMode?: "SCROLLVIEW" | "FLATLIST" | "MODAL";
  maxHeight?: number;
}

const CustomDropdownPicker2 = <T extends string | number>({
  label,
  placeholder = "Select an option",
  items,
  value,
  onValueChange,
  error,
  zIndex = 3000,
  zIndexInverse = 1000,
  disabled = false,
  listMode = "SCROLLVIEW",
  maxHeight = 200,
}: CustomDropdownPickerProps<T>) => {
  const [open, setOpen] = useState(false);
  const [internalItems, setInternalItems] = useState<ItemType<T>[]>(items);

  return (
    <View style={[styles.wrapper, { zIndex }]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <DropDownPicker
        open={open}
        value={value}
        items={internalItems}
        setOpen={setOpen}
        setValue={(cb) => {
          const resolved = typeof cb === "function" ? cb(value) : cb;
          if (resolved !== null) onValueChange(resolved as T);
        }}
        setItems={setInternalItems}
        placeholder={placeholder}
        listMode={listMode}
        maxHeight={maxHeight}
        disabled={disabled}
        zIndex={zIndex}
        zIndexInverse={zIndexInverse}
        style={[
          styles.dropdown,
          open && !error ? styles.dropdownOpen : null,
          error ? styles.dropdownError : null,
          disabled ? styles.dropdownDisabled : null,
        ]}
        dropDownContainerStyle={styles.dropdownContainer}
        placeholderStyle={styles.placeholder}
        labelStyle={styles.labelStyle}
        selectedItemLabelStyle={styles.selectedLabel}
        listItemLabelStyle={styles.listItemLabel}
        tickIconStyle={styles.tickIcon as ImageStyle}
        arrowIconStyle={styles.arrowIcon as ImageStyle}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  dropdown: {
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 15,
  },
  dropdownError: {
    borderColor: "#EF4444",
  },
  dropdownOpen: {
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
  },
  dropdownDisabled: {
    backgroundColor: "#D1D5DB",
    borderColor: "#9CA3AF",
  },
  dropdownContainer: {
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 14,
    backgroundColor: "#FFF",
  },
  placeholder: {
    color: theme.colors.text.secondary,
    fontSize: 15,
  },
  labelStyle: {
    color: theme.colors.text.primary,
    fontSize: 15,
  },
  selectedLabel: {
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  listItemLabel: {
    color: theme.colors.text.primary,
    fontSize: 15,
  },
  tickIcon: {
    tintColor: theme.colors.primary[500],
  },
  arrowIcon: {
    tintColor: theme.colors.text.secondary,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default CustomDropdownPicker2;