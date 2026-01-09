import React from "react";
import { View, Text, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { theme } from "@/theme";

export type DropdownItem = {
  label: string;
  value: string;
};

interface AppDropdownProps {
  label?: string;
  open: boolean;
  value: string | null;
  items: DropdownItem[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  zIndex?: number;
}

const CustomDropdown: React.FC<AppDropdownProps> = ({
  label, open, value, items, setOpen, setValue,
  placeholder = "Select option", loading = false,
  disabled = false, searchable = false, zIndex = 0,
}) => {
  return (
    <View style={{ zIndex }}>
      {label && <Text style={styles.label}>{label}</Text>}

      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        placeholder={placeholder}
        loading={loading}
        disabled={disabled}
        searchable={searchable}
        listMode="SCROLLVIEW"
        dropDownDirection="BOTTOM"
        maxHeight={250}
        // Matching styles
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        placeholderStyle={{ color: theme.colors.text.secondary, fontSize: 15 }}
        labelStyle={{ color: theme.colors.text.primary, fontSize: 15 }}
        // --- ADD THESE PROPS ---
        disabledItemContainerStyle={{
          opacity: 0.5,
          backgroundColor: '#F3F4F6', // Light grey background for disabled rows
        }}
        disabledItemLabelStyle={{
          color: '#9CA3AF', // Grey text for disabled labels
        }}
        // -----------------------
        scrollViewProps={{ nestedScrollEnabled: true }}
        zIndex={zIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: 8,
    marginTop: 12,
  },
  dropdown: {
    backgroundColor: theme.colors.background.dark || "#FFF", // Consistent BG
    borderRadius: 14, // Consistent Radius
    borderColor: "rgba(0,0,0,0.1)", // Subtle border
    minHeight: 55, // Consistent Height
    paddingHorizontal: 12,
  },
  dropdownContainer: {
    backgroundColor: theme.colors.background.dark || "#FFF",
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 14,
    elevation: 5,
  },
});

export default CustomDropdown