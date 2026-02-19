import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  NativeModules,
} from "react-native";
import { Fingerprint } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { theme } from "@/theme";

// Assets
const MANTRA_IMG = require("../../assets/images/Mantra.png");
const MORPHO_IMG = require("../../assets/images/Morpho.jpg");

interface BiometricScannerProps {
  onScanSuccess: (pidData: string) => void;
  onScanError?: (error: string) => void;
  wadh?: string;
  reset?: boolean; // Add this prop
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  onScanSuccess,
  onScanError,
  reset = false, // Default to false
  wadh
}) => {
  const [selectedDevice, setSelectedDevice] =
    useState<"Mantra" | "Morpho">("Mantra");
  const [isScanning, setIsScanning] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [capturedData, setCapturedData] = useState<string | null>(null);

  const { MantraRD } = NativeModules;

  // Reset effect when reset prop changes to true
  useEffect(() => {
    if (reset) {
      setHasData(false);
      setScanError(null);
      setCapturedData(null);
      setIsScanning(false);
    }
  }, [reset]);

  const handleStartScan = async () => {
    if (selectedDevice !== "Mantra") {
      setHasData(false);
      setScanError("Morpho device is not supported yet");
      return;
    }

    try {
      setIsScanning(true);
      setHasData(false);
      setScanError(null);

      if (!MantraRD || !MantraRD.captureFingerprint) {
        throw new Error("Mantra RD Service not linked");
      }


      const pidXml: string = await MantraRD.captureFingerprint( wadh|| "");

      if (!pidXml || !pidXml.includes("<PidData")) {
        throw new Error("Invalid biometric data received");
      }

      // Check for error response from device
      const errCodeMatch = pidXml.match(/errCode="(\d+)"/);
      if (errCodeMatch) {
        const errCode = errCodeMatch[1];
        if (errCode !== "0") {
          const errInfoMatch = pidXml.match(/errInfo="([^"]+)"/);
          const errInfo = errInfoMatch ? errInfoMatch[1] : "Unknown error";
          throw new Error(`Device Error ${errCode}: ${errInfo}`);
        }
      }

      setHasData(true);
      setScanError(null);
      setCapturedData(pidXml);
      onScanSuccess(pidXml);

      Toast.show({
        type: "success",
        text1: "Fingerprint Captured",
      });
    } catch (error: any) {
      const errorMsg = error?.message || "Fingerprint scan failed";

      console.log(errorMsg);

      setHasData(false);
      setScanError(errorMsg);
      setCapturedData(null);
      onScanError?.(errorMsg);

      Toast.show({
        type: "error",
        text1: "Scan Failed",
        text2: errorMsg,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Clear error when switching device
  const handleDeviceChange = (device: "Mantra" | "Morpho") => {
    setSelectedDevice(device);
    setScanError(null);
    // Don't clear hasData automatically when switching devices
    // Only clear if reset is explicitly triggered
  };

  return (
    <View style={styles.biometricBox}>
      <Text style={styles.sectionLabel}>Biometric Verification</Text>

      {/* Device Selector */}
      <View style={styles.deviceRow}>
        <DeviceButton
          label="Mantra"
          image={MANTRA_IMG}
          isActive={selectedDevice === "Mantra"}
          onPress={() => handleDeviceChange("Mantra")}
        />
        <DeviceButton
          label="Morpho"
          image={MORPHO_IMG}
          isActive={selectedDevice === "Morpho"}
          onPress={() => handleDeviceChange("Morpho")}
        />
      </View>

      {/* Scan Button */}
      <TouchableOpacity
        style={[styles.scanBtn, isScanning && { opacity: 0.7 }]}
        onPress={handleStartScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Fingerprint color="#FFF" size={20} />
            <Text style={styles.scanBtnText}>
              {hasData ? "Rescan Fingerprint" : "Start Fingerprint Scan"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* SUCCESS MESSAGE */}
      {hasData && !isScanning && !scanError && (
        <Text style={styles.scanSuccess}>Data Captured ✓</Text>
      )}

      {/* ERROR MESSAGE */}
      {scanError && !isScanning && (
        <Text style={styles.scanError}>{scanError}</Text>
      )}
    </View>
  );
};

// ---------------- Device Button ----------------

const DeviceButton = ({ label, image, isActive, onPress }: any) => (
  <TouchableOpacity
    style={[styles.deviceBtn, isActive && styles.deviceBtnActive]}
    onPress={onPress}
  >
    <Image source={image} style={styles.deviceIcon} resizeMode="contain" />
    <Text style={[styles.deviceText, isActive && styles.deviceTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ---------------- Styles ----------------

const styles = StyleSheet.create({
  biometricBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 10,
  },
  deviceRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  deviceBtn: {
    flex: 1,
    height: 75,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFF",
  },
  deviceBtnActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
    borderWidth: 1.5,
  },
  deviceIcon: {
    width: 35,
    height: 35,
    marginBottom: 4,
  },
  deviceText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  deviceTextActive: {
    color: theme.colors.primary[600],
  },
  scanBtn: {
    backgroundColor: "#334155",
    height: 45,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  scanBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  scanSuccess: {
    color: "#10B981",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  scanError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
});