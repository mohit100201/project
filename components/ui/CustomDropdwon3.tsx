import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { theme } from "@/theme";
import { ChevronDown, X } from "lucide-react-native";

interface DropdownItem {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label?: string;
  value: string | null;
  items: DropdownItem[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onSelect: (item: DropdownItem) => void;
}

const CustomDropdown3: React.FC<CustomDropdownProps> = ({
  label,
  value,
  items,
  placeholder = "Select option",
  error,
  disabled = false,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel =
    items.find(i => i.value === value)?.label || placeholder;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(i =>
      i.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, items]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* INPUT LOOKALIKE */}
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={() => {
          setFocused(true);
          setOpen(true);
        }}
        style={[
          styles.inputWrapper,
          focused && !error && styles.inputFocused,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholderText,
          ]}
        >
          {selectedLabel}
        </Text>

        <ChevronDown
          size={20}
          color={focused ? theme.colors.primary[500] : "#6B7280"}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* MODAL */}
      <Modal visible={open} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || "Select option"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setOpen(false);
                  setFocused(false);
                  setSearch("");
                }}
              >
                <X size={22} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <TextInput
              placeholder="Search..."
              value={search}
              onChangeText={setSearch}
              autoFocus
              style={styles.searchInput}
              placeholderTextColor={theme.colors.text.secondary}
            />

            {/* List */}
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.value}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>No results found</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                    setFocused(false);
                    setSearch("");
                  }}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: "#D1D5DB",
    borderColor: "#9CA3AF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  inputText: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text.primary,
  },
  searchInput: {
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  itemText: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#6B7280",
  },
});


export default CustomDropdown3;
