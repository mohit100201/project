import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { CheckCircle, XCircle } from "lucide-react-native";

type Props = {
  visible: boolean;
  status: boolean | null;
  message?: string;
  onClose: () => void;
};

export default function SdkResultModal({
  visible,
  status,
  message,
  onClose,
}: Props) {
  if (status === null) return null;

  const isSuccess = status === true;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {isSuccess ? (
            <CheckCircle color="#16a34a" size={64} />
          ) : (
            <XCircle color="#dc2626" size={64} />
          )}

          <Text style={styles.title}>
            {isSuccess ? "Success" : "Failed"}
          </Text>

          <Text style={styles.message}>
            {message ?? "Something went wrong"}
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    color: "#555",
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});