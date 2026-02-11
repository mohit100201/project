import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { theme } from "@/theme";
import { KYCApplicationFormData, kycFormSchema } from "@/utils/kycFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import {
    User,
    MapPin,
    FileText,
    Calendar,
    UploadCloud,
    CheckCircle2,
    Copy,
    Check,
    Briefcase
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import CustomDropdown from "@/components/ui/CustomDropdown";
import { city } from "@/utils/data";
import { getLatLong } from "@/utils/location";
import { submitKYCForm } from "@/api/kyc.api";
import { KeyboardAvoidingView } from "react-native";
import { businessTypes } from "@/utils/businessTypesData";

type Props = {
  onKycSubmitted?: () => void;
};

const KYCApplicationForm = ({ onKycSubmitted }: Props) => {
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const states = Object.keys(city).sort();

    

    const gstOptions = [
        { label: "Yes", value: "Yes" },
        { label: "No", value: "No" },
    ];

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<KYCApplicationFormData>({
        resolver: zodResolver(kycFormSchema),
        mode: "onTouched",
        defaultValues: {
            address: {
                permanent_address: "",
                state: "",
                city: "",
                pincode: "",
            },
        },
    });
    ;

    const passportSizePhoto = watch("passport_size_photo")
    const aadharFront = watch("aadhar_front");
    const aadharBack = watch("aadhar_back");
    const panCard = watch("pan_card");
    const dobValue = watch("dob");
    const stateWatch = watch("address.state");
    const selectedState = watch("address.state");
    const isGSTAvailable = watch("is_GST_registered");



    const handleUpload = async (name: keyof KYCApplicationFormData, label: string) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Updated from deprecated MediaTypeOptions
                quality: 0.3,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled) {
                const asset = result.assets[0];

                const fileObj = {
                    uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: asset.fileName || `${name}_${Date.now()}.jpg`,
                };

                setValue(name, fileObj as any, { shouldValidate: true });

                Toast.show({
                    type: 'success',
                    text1: 'Image Selected',
                    text2: `${label} ready to upload.`
                });
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: error.message });
        }
    };

    const onSubmit = async (data: KYCApplicationFormData) => {
        try {
            setLoading(true);
           

            // 1️⃣ Get location
            const location = await getLatLong();

            if (!location) {
                Toast.show({
                    type: "error",
                    text1: "Location Required",
                    text2: "Please enable location services and try again",
                });
                return;
            }


            // 2️⃣ Get auth token
            const token = await SecureStore.getItemAsync("userToken");

            // 3️⃣ Get user id (optional, if backend needs it later)
            const userRaw = await SecureStore.getItemAsync("userData");
            const userId = userRaw ? JSON.parse(userRaw).id : "70";

            if (!token) {
                throw new Error("User not authenticated");
            }

            // 4️⃣ Call API
            await submitKYCForm({
                data,
                latitude: String(location.latitude),
                longitude: String(location.longitude),
                token,
            });
            

            // 5️⃣ Success toast
            Toast.show({
                type: "success",
                text1: "KYC Submitted",
                text2: "Your KYC has been submitted for verification",
            });

            onKycSubmitted?.();

        } catch (error: any) {
            console.error("KYC submit error:", error);

            Toast.show({
                type: "error",
                text1: "Submission Failed",
                text2: error?.message || "Something went wrong",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            >
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Header */}
                    <Text
                        style={{
                            fontSize: theme.typography.fontSizes.xl,
                            fontWeight: theme.typography.fontWeights.medium,
                            alignSelf: "center",
                            marginTop: 16,
                        }}
                    >
                        Submit KYC Application
                    </Text>

                    <Text
                        style={{
                            fontSize: theme.typography.fontSizes.sm,
                            alignSelf: "center",

                        }}
                    >
                        Please complete all steps to verify your account.
                    </Text>

                    {/* Section 1 */}
                    <AnimatedCard style={{ marginTop: 16 }}>
                        <View style={styles.sectionTitleRow}><FileText size={18} color="#333" /><Text style={styles.sectionHeader}>Documents</Text></View>
                        <UploadBtn label="Aadhaar Front" fileData={aadharFront} onPress={() => handleUpload('aadhar_front', 'Aadhaar Front')} error={errors.aadhar_front} />
                        <UploadBtn label="Aadhaar Back" fileData={aadharBack} onPress={() => handleUpload('aadhar_back', 'Aadhaar Back')} error={errors.aadhar_back} />
                        <UploadBtn label="PAN Card" fileData={panCard} onPress={() => handleUpload('pan_card', 'PAN Card')} error={errors.pan_card} />
                        <UploadBtn label="Passport Size Phote" fileData={passportSizePhoto} onPress={() => handleUpload('passport_size_photo', 'Passport Size Photo')} error={errors.passport_size_photo} />


                    </AnimatedCard>

                    <AnimatedCard style={{ marginTop: 16 }}>
                        <View style={styles.sectionTitleRow}><User size={18} color="#333" /><Text style={styles.sectionHeader}>Personal Details</Text></View>

                        <View style={styles.row}>
                            <FormInput name="first_name" label="First Name" style={{ flex: 1, marginRight: 5 }} control={control} error={errors.first_name} />
                            <FormInput name="last_name" label="Last Name" style={{ flex: 1, marginLeft: 5 }} control={control} error={errors.last_name} />
                        </View>
                        <FormInput name="email" label="Email" keyboardType="email-address" control={control} error={errors.email} />
                        <FormInput name="mobile" label="Mobile" keyboardType="phone-pad" maxLength={10} control={control} error={errors.mobile} />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={styles.label}>DOB</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }, errors.dob && styles.inputError]}>
                                    <Text style={{ color: dobValue ? '#333' : '#999' }}>{dobValue || "YYYY-MM-DD"}</Text>
                                    <Calendar size={14} color="#666" />
                                </TouchableOpacity>
                            </View>

                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dobValue ? new Date(dobValue) : new Date(2000, 0, 1)}
                                mode="date"
                                display="default"
                                maximumDate={new Date()}
                                onChange={(e, d) => { setShowDatePicker(false); if (d) setValue("dob", d.toISOString().split('T')[0]) }}
                            />
                        )}

                        <FormInput name="pan_no" label="PAN No" autoCapitalize="characters" control={control} error={errors.pan_no} />
                        <FormInput name="aadhar_no" label="Aadhaar No" keyboardType="numeric" maxLength={12} control={control} error={errors.aadhar_no} />


                    </AnimatedCard>
                    <AnimatedCard style={{ marginTop: 16 }}>
                        <View style={styles.sectionTitleRow}><Briefcase size={18} color="#333" /><Text style={styles.sectionHeader}>Business Details</Text></View>
                        <FormInput name="business_name" label="Business Name" control={control} error={errors.email} />

                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text style={styles.label}>Business Type</Text>

                            <View style={[styles.pickerBox, errors?.business_type && styles.inputError]}>
                                <Controller
                                    control={control}
                                    name="business_type"
                                    render={({ field: { onChange, value } }) => (
                                        <Picker
                                            selectedValue={value}
                                            onValueChange={(v) => onChange(v)}
                                        >
                                            <Picker.Item label="Select Business Type" value="" color="#999" />
                                            {businessTypes.map((item) => (
                                                <Picker.Item
                                                    key={item.value}
                                                    label={item.label}
                                                    value={item.value}
                                                />
                                            ))}
                                        </Picker>
                                    )}
                                />
                            </View>

                            {errors.business_type && (
                                <Text style={styles.err}>{errors.business_type.message}</Text>
                            )}
                        </View>

                        <View style={{ flex: 1, marginTop: 8, marginRight: 5 }}>
                            <Text style={styles.label}>Is GST Available?</Text>

                            <View
                                style={[
                                    styles.pickerBox,
                                    errors?.is_GST_registered && styles.inputError,
                                ]}
                            >
                                <Controller
                                    control={control}
                                    name="is_GST_registered"
                                    render={({ field: { onChange, value } }) => (
                                        <Picker
                                            selectedValue={value}
                                            onValueChange={(v) => {
                                                onChange(v);

                                                // clear GST number if "no"
                                                if (v === "No") {
                                                    setValue("GST_number", "");
                                                }
                                            }}
                                        >
                                            <Picker.Item label="Select" value="" color="#999" />
                                            {gstOptions.map((item) => (
                                                <Picker.Item
                                                    key={item.value}
                                                    label={item.label}
                                                    value={item.value}
                                                />
                                            ))}
                                        </Picker>
                                    )}
                                />
                            </View>

                            {errors.is_GST_registered && (
                                <Text style={styles.err}>{errors.is_GST_registered.message}</Text>
                            )}
                        </View>

                        {/* ✅ SHOW ONLY WHEN YES */}
                        {isGSTAvailable === "Yes" && (
                            <FormInput
                                name="GST_number"
                                label="GST Number"
                                autoCapitalize="characters"
                                control={control}
                                error={errors.GST_number}
                            />
                        )}
                    </AnimatedCard>

                    <AnimatedCard style={{ marginTop: 16 }}>
                        <View style={styles.sectionTitleRow}>
                            <MapPin size={18} color="#333" />
                            <Text style={styles.sectionHeader}>Address Details</Text>
                        </View>

                        {/* Permanent Address (Address Line) */}
                        <FormInput
                            name="address.permanent_address"
                            label="Permanent Address"
                            control={control}
                            error={errors.address?.permanent_address}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={styles.label}>State</Text>
                                <View style={[styles.pickerBox, errors?.address?.state && styles.inputError]}>
                                    <Controller control={control} name="address.state" render={({ field: { onChange, value } }) => (
                                        <Picker selectedValue={value} onValueChange={(v) => { onChange(v); setValue("address.city", ""); }}>
                                            <Picker.Item label="Select" value="" color="#999" />
                                            {states.map(s => <Picker.Item key={s} label={s} value={s} />)}
                                        </Picker>
                                    )} />
                                </View>
                            </View>
                            <View style={{ flex: 1, marginLeft: 5 }}>
                                <Text style={styles.label}>City</Text>
                                <View style={[styles.pickerBox, errors?.address?.city && styles.inputError]}>
                                    <Controller control={control} name="address.city" render={({ field: { onChange, value } }) => (
                                        <Picker selectedValue={value} enabled={!!stateWatch} onValueChange={onChange}>
                                            <Picker.Item label="Select" value="" color="#999" />
                                            {(stateWatch ? (city as any)[stateWatch] || [] : []).map((c: string) => <Picker.Item key={c} label={c} value={c} />)}
                                        </Picker>
                                    )} />
                                </View>
                            </View>
                        </View>



                        {/* PINCODE */}
                        <FormInput
                            name="address.pincode"
                            label="Pincode"
                            keyboardType="numeric"
                            maxLength={6}
                            control={control}
                            error={errors.address?.pincode}
                        />
                    </AnimatedCard>

                    <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit(onSubmit)} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit KYC</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const UploadBtn = ({ label, fileData, onPress, error }: any) => {
    const isUploaded = !!fileData?.uri;
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 4 }}>{label}</Text>
            <TouchableOpacity style={[{ borderStyle: 'dashed', borderWidth: 1, borderColor: '#AAA', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9' }, isUploaded && { borderStyle: 'solid', borderColor: '#27AE60', backgroundColor: '#F0FFF0' }]} onPress={onPress}>
                {isUploaded ? <Check size={18} color="#27AE60" /> : <UploadCloud size={18} color="#3498DB" />}
                <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ color: isUploaded ? '#27AE60' : '#3498DB', fontWeight: 'bold', fontSize: 13 }}>
                        {isUploaded ? "Attached" : "Upload Image"}
                    </Text>
                    {isUploaded && <Text style={{ color: '#666', fontSize: 10 }} numberOfLines={1}>{fileData.name}</Text>}
                </View>
            </TouchableOpacity>
            {error && <Text style={{ color: '#E74C3C', fontSize: 10, marginTop: 2 }}>{error.message}</Text>}
        </View>
    );
};

const FormInput = ({ name, label, control, error, style, ...props }: any) => (
    <View style={[{ marginVertical: 8 }, style]}>
        <Text style={styles.label}>{label}</Text>
        <Controller name={name} control={control} render={({ field: { onChange, value, onBlur } }) => (
            <TextInput style={[styles.input, error && styles.inputError]} onBlur={onBlur} onChangeText={onChange} value={value} {...props} />
        )} />
        {error && <Text style={styles.err}>{error.message}</Text>}
    </View>
);



const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 8 },
    section: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 3 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 8 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 8 },
    internalLabel: { fontSize: 13, fontWeight: 'bold', color: '#4F46E5' },
    copyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0FF', padding: 5, borderRadius: 4 },
    copyBtnText: { fontSize: 10, color: '#4F46E5', fontWeight: '700', marginLeft: 4 },
    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 10, fontSize: 14, height: 45, backgroundColor: '#FAFAFA' },
    pickerBox: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, height: 45, justifyContent: 'center' },
    inputError: { borderColor: '#E74C3C', backgroundColor: '#FFF5F5' },
    err: { color: '#E74C3C', fontSize: 10, marginTop: 2 },
    row: { flexDirection: 'row', marginBottom: 8 },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
    uploadBox: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#AAA', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9' },
    uploadSuccessBox: { borderStyle: 'solid', borderColor: '#27AE60', backgroundColor: '#F0FFF0' },
    submitBtn: { backgroundColor: '#27AE60', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30, marginTop: 16 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});



export default KYCApplicationForm;
