import React, { useState } from "react";
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    ActivityIndicator, KeyboardAvoidingView, Platform 
} from "react-native";
import { theme } from "@/theme";
import { Ticket, AlignLeft, Send, CheckCircle } from "lucide-react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { getLatLong } from "@/utils/location";
import Toast from "react-native-toast-message";
import { createTicketApi } from "../api/complaintsTickets.api";
import CustomInput from "@/components/ui/CustomInput";
import CustomDropdown from "@/components/ui/CustomDropdown";

const CreateTicket = () => {
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("low");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const priorities = [
        { label: "Low Priority", value: "low" },
        { label: "Medium Priority", value: "medium" },
        { label: "High Priority", value: "high" },
    ];

    const handleCreate = async () => {
        if (!subject.trim() || !description.trim()) {
            Toast.show({ type: "error", text1: "Error", text2: "Please fill in all fields" });
            return;
        }

        try {
            setLoading(true);
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");
            const domain = Constants.expoConfig?.extra?.tenantData?.domain || "laxmeepay.com";

            const res = await createTicketApi({
                subject,
                description,
                priority,
                domain,
                latitude: location?.latitude?.toString() || "0",
                longitude: location?.longitude?.toString() || "0",
                token: token || "",
            });

            if (res.success) {
                Toast.show({ 
                    type: "success", 
                    text1: "Success", 
                    text2: `Ticket ${res.data.data.ticket_number} created!` 
                });
                router.back(); 
            }
        } catch (error: any) {
            Toast.show({ type: "error", text1: "Error", text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formCard}>
                    <Text style={styles.title}>New Support Ticket</Text>
                    
                    <CustomInput
                        label="Subject"
                        placeholder="Enter subject"
                        value={subject}
                        onChangeText={setSubject}
                        iconStart={Ticket}
                    />

                    <CustomDropdown
                        label="Priority"
                        open={open}
                        value={priority}
                        items={priorities}
                        setOpen={setOpen}
                        setValue={setPriority}
                        zIndex={3000} // Keeps dropdown above the next input
                    />

                    <CustomInput
                        label="Description"
                        placeholder="Tell us more about the issue..."
                        value={description}
                        onChangeText={setDescription}
                        iconStart={AlignLeft}
                        multiline
                        numberOfLines={4}
                    />

                    <TouchableOpacity 
                        style={[styles.btn, loading && { opacity: 0.7 }]} 
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <View style={styles.btnRow}>
                                <Send size={18} color="#FFF" />
                                <Text style={styles.btnText}>Submit Ticket</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F1F5F9" },
    scrollContent: { padding: 20 },
    formCard: { 
        backgroundColor: "#FFF", 
        borderRadius: 20, 
        padding: 20, 
        shadowColor: "#000", 
        shadowOpacity: 0.05, 
        shadowRadius: 10, 
        elevation: 2 
    },
    title: { fontSize: 20, fontWeight: "800", color: "#1E293B", marginBottom: 15 },
    btn: { 
        backgroundColor: theme.colors.primary[500], 
        height: 55, 
        borderRadius: 15, 
        justifyContent: "center", 
        alignItems: "center", 
        marginTop: 25 
    },
    btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    btnText: { color: "#FFF", fontSize: 16, fontWeight: "700" }
});

export default CreateTicket;