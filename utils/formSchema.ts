import { z } from "zod";

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().length(6, "Must be 6 digits"),
});

export const kycSchema = z.object({
  // Identity
  full_name: z.string().min(1, "Full name required"),
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
  mobile: z.string().length(10, "10 digits required"),
  dob: z.string().min(1, "DOB required"),
  gender: z.string().min(1, "Gender required"),
  pan_no: z.string().regex(/[A-Z]{5}[0-9]{4}[A-Z]{1}/, "Invalid PAN"),
  aadhar_no: z.string().length(12, "12 digits required"),

  // Three Address Objects
  address1: addressSchema,
  address2: addressSchema,
  address3: addressSchema,

  // Documents
  aadhar_front: z.any().refine((f) => f?.uri, "Required"),
  aadhar_back: z.any().refine((f) => f?.uri, "Required"),
  pan_card: z.any().refine((f) => f?.uri, "Required"),
});

export type KYCFormData = z.infer<typeof kycSchema>;