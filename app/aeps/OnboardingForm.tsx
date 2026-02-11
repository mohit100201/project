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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import Toast from "react-native-toast-message";
import { 
  User, 
  MapPin, 
  FileText, 
  Calendar, 
  UploadCloud, 
  CheckCircle2, 
  Copy,
  Check
} from 'lucide-react-native';

// Local Imports
import { kycSchema, KYCFormData } from '../../utils/formSchema';
import { city } from '../../utils/data';
import { getLatLong } from '@/utils/location';
import { apiClient } from '../../api/api.client';

type AddressPath = "address1" | "address2" | "address3";

// Added Prop Interface
interface OnboardingFormProps {
  onSubmissionSuccess: () => void;
}

const KYCForm = ({ onSubmissionSuccess }: OnboardingFormProps) => {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
    mode: 'onTouched',
  });

   

  const states = Object.keys(city).sort();

  // Watchers for UI state
  const s1 = watch("address1.state");
  const s2 = watch("address2.state");
  const s3 = watch("address3.state");
  const dobValue = watch("dob");
  const aadharFront = watch("aadhar_front");
  const aadharBack = watch("aadhar_back");
  const panCard = watch("pan_card");

  const copyPrimaryAddress = (targetPath: "address2" | "address3") => {
    const primary = watch("address1");
    if (!primary?.street) {
      Toast.show({ type: 'error', text1: 'Primary Address is empty' });
      return;
    }
    setValue(`${targetPath}.street`, primary.street);
    setValue(`${targetPath}.state`, primary.state);
    setValue(`${targetPath}.city`, primary.city);
    setValue(`${targetPath}.pincode`, primary.pincode);
    Toast.show({ type: 'success', text1: 'Address Copied' });
  };

  const handleUpload = async (name: keyof KYCFormData, label: string) => {
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

  const onSubmit = async (data: KYCFormData) => {
    try {
      setLoading(true);
      
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      const userRaw = await SecureStore.getItemAsync("userData");
      const userId = userRaw ? JSON.parse(userRaw).id : "70"; 
      

      const formData = new FormData();

      // Text Fields
      formData.append("full_name", data.full_name);
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      formData.append("email", data.email);
      formData.append("mobile_number", data.mobile);
      formData.append("dob", data.dob);
      formData.append("gender", data.gender);
      formData.append("pan_number", data.pan_no);
      formData.append("aadhaar_number", data.aadhar_no);
      formData.append("user_id", userId);

      // Address Fields
      formData.append("address", data.address1.street);
      formData.append("state", data.address1.state);
      formData.append("city", data.address1.city);
      formData.append("pincode", data.address1.pincode);

      formData.append("address1", data.address2.street);
      formData.append("state1", data.address2.state);
      formData.append("city1", data.address2.city);
      formData.append("pincode1", data.address2.pincode);

      formData.append("address2", data.address3.street);
      formData.append("state2", data.address3.state);
      formData.append("city2", data.address3.city);
      formData.append("pincode2", data.address3.pincode);

      // File Fields
      formData.append("aadhaar_doc", data.aadhar_front as any);
      formData.append("aadhaar_back_doc", data.aadhar_back as any);
      formData.append("pan_doc", data.pan_card as any);

      const res = await apiClient({
        endpoint: "/bankit/kyc/submit",
        method: "POST",
        body: formData,
        headers: {
          
          latitude: String(location?.latitude || "0.0"),
          longitude: String(location?.longitude || "0.0"),
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.success) {
        Toast.show({ 
          type: "success", 
          text1: "Success", 
          text2: "KYC submitted successfully" 
        });
        
        // Trigger parent status re-fetch
        if (onSubmissionSuccess) {
          onSubmissionSuccess();
        }
      } else {
        // Specific check for duplicate entry error to guide the user
        const msg = res.message?.includes("Duplicate entry") 
          ? "KYC already submitted for this account." 
          : res.message;

        Toast.show({ 
          type: "error", 
          text1: "Submission Failed", 
          text2: msg || "Unknown error" 
        });
      }
    } catch (error: any) {
      Toast.show({ 
        type: "error", 
        text1: "Upload Failed", 
        text2: "Network error or file size too large."
      });
    } finally {
      setLoading(false);
    }
  };

  const RenderAddress = ({ num, stateWatch, path }: { num: number, stateWatch: string, path: AddressPath }) => {
    const addressErrors = errors[path];
    return (
      <View style={{ marginBottom: 20 }}>
        <View style={styles.sectionRow}>
          <Text style={styles.internalLabel}>{num}. Address Details</Text>
          {num > 1 && (
            <TouchableOpacity onPress={() => copyPrimaryAddress(path as any)} style={styles.copyBtn}>
              <Copy size={12} color="#4F46E5" />
              <Text style={styles.copyBtnText}>Same as Primary</Text>
            </TouchableOpacity>
          )}
        </View>
        <FormInput name={`${path}.street`} label="Street" control={control} error={addressErrors?.street} />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={styles.label}>State</Text>
            <View style={[styles.pickerBox, addressErrors?.state && styles.inputError]}>
              <Controller control={control} name={`${path}.state`} render={({ field: { onChange, value } }) => (
                <Picker selectedValue={value} onValueChange={(v) => { onChange(v); setValue(`${path}.city`, ""); }}>
                  <Picker.Item label="Select" value="" color="#999" />
                  {states.map(s => <Picker.Item key={s} label={s} value={s} />)}
                </Picker>
              )} />
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={styles.label}>City</Text>
            <View style={[styles.pickerBox, addressErrors?.city && styles.inputError]}>
              <Controller control={control} name={`${path}.city`} render={({ field: { onChange, value } }) => (
                <Picker selectedValue={value} enabled={!!stateWatch} onValueChange={onChange}>
                  <Picker.Item label="Select" value="" color="#999" />
                  {(stateWatch ? (city as any)[stateWatch] || [] : []).map((c: string) => <Picker.Item key={c} label={c} value={c} />)}
                </Picker>
              )} />
            </View>
          </View>
        </View>
        <FormInput name={`${path}.pincode`} label="Pincode" keyboardType="numeric" maxLength={6} control={control} error={addressErrors?.pincode} />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <CheckCircle2 size={28} color="#27AE60" />
        <Text style={styles.mainTitle}>KYC Verification</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}><User size={18} color="#333" /><Text style={styles.sectionHeader}>Personal Details</Text></View>
        <FormInput name="full_name" label="Full Name" control={control} error={errors.full_name} />
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
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={styles.label}>Gender</Text>
            <View style={[styles.pickerBox, errors.gender && styles.inputError]}>
              <Controller control={control} name="gender" render={({ field: { onChange, value } }) => (
                <Picker selectedValue={value} onValueChange={onChange}>
                  <Picker.Item label="Select" value="" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                </Picker>
              )} />
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dobValue ? new Date(dobValue) : new Date(2000, 0, 1)}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(e, d) => { setShowDatePicker(false); if(d) setValue("dob", d.toISOString().split('T')[0])}}
          />
        )}

        <FormInput name="pan_no" label="PAN No" autoCapitalize="characters" control={control} error={errors.pan_no} />
        <FormInput name="aadhar_no" label="Aadhaar No" keyboardType="numeric" maxLength={12} control={control} error={errors.aadhar_no} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}><MapPin size={18} color="#333" /><Text style={styles.sectionHeader}>Addresses</Text></View>
        <RenderAddress num={1} stateWatch={s1} path="address1" />
        <View style={styles.divider} />
        <RenderAddress num={2} stateWatch={s2} path="address2" />
        <View style={styles.divider} />
        <RenderAddress num={3} stateWatch={s3} path="address3" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}><FileText size={18} color="#333" /><Text style={styles.sectionHeader}>Documents</Text></View>
        <UploadBtn label="Aadhaar Front" fileData={aadharFront} onPress={() => handleUpload('aadhar_front', 'Aadhaar Front')} error={errors.aadhar_front} />
        <UploadBtn label="Aadhaar Back" fileData={aadharBack} onPress={() => handleUpload('aadhar_back', 'Aadhaar Back')} error={errors.aadhar_back} />
        <UploadBtn label="PAN Card" fileData={panCard} onPress={() => handleUpload('pan_card', 'PAN Card')} error={errors.pan_card} />
      </View>

      <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit(onSubmit)} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit KYC</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const FormInput = ({ name, label, control, error, style, ...props }: any) => (
  <View style={[{ marginBottom: 12 }, style]}>
    <Text style={styles.label}>{label}</Text>
    <Controller name={name} control={control} render={({ field: { onChange, value, onBlur } }) => (
      <TextInput style={[styles.input, error && styles.inputError]} onBlur={onBlur} onChangeText={onChange} value={value} {...props} />
    )} />
    {error && <Text style={styles.err}>{error.message}</Text>}
  </View>
);

const UploadBtn = ({ label, fileData, onPress, error }: any) => {
  const isUploaded = !!fileData?.uri;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.uploadBox, isUploaded && styles.uploadSuccessBox]} onPress={onPress}>
        {isUploaded ? <Check size={18} color="#27AE60" /> : <UploadCloud size={18} color="#3498DB" />}
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: isUploaded ? '#27AE60' : '#3498DB', fontWeight: 'bold', fontSize: 13 }}>
            {isUploaded ? "Attached" : "Upload Image"}
          </Text>
          {isUploaded && <Text style={{ color: '#666', fontSize: 10 }} numberOfLines={1}>{fileData.name}</Text>}
        </View>
      </TouchableOpacity>
      {error && <Text style={styles.err}>{error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 8 },
  section: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 4 },
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
  submitBtn: { backgroundColor: '#27AE60', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default KYCForm;