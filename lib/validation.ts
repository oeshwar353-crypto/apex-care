export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateLoginForm(values: { emailOrStoreId: string; password: string }): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.emailOrStoreId.trim()) {
    errors.emailOrStoreId = "Please enter your registered email or store number.";
  }

  if (!values.password) {
    errors.password = "Please enter your password.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSignupForm(values: {
  pharmacyName: string;
  ownerName: string;
  email: string;
  licenseNumber: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.pharmacyName.trim()) {
    errors.pharmacyName = "Pharmacy name is required.";
  }
  if (!values.ownerName.trim()) {
    errors.ownerName = "Owner name is required.";
  }
  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.licenseNumber.trim()) {
    errors.licenseNumber = "Registered pharmacy / drug license number is required.";
  }
  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!values.termsAccepted) {
    errors.termsAccepted = "You must accept the terms & conditions.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBatchForm(values: {
  medicineName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  batchNumber: string;
  quantity: number | string;
  purchasePrice: number | string;
  sellingPrice: number | string;
  expiryDate: string;
  reorderThreshold: number | string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.medicineName.trim()) {
    errors.medicineName = "Medicine name is required.";
  }
  if (!values.batchNumber.trim()) {
    errors.batchNumber = "Batch number is required.";
  }
  if (Number(values.quantity) < 0 || isNaN(Number(values.quantity))) {
    errors.quantity = "Quantity must be 0 or greater.";
  }
  if (Number(values.purchasePrice) < 0 || isNaN(Number(values.purchasePrice))) {
    errors.purchasePrice = "Purchase price must be positive.";
  }
  if (Number(values.sellingPrice) <= 0 || isNaN(Number(values.sellingPrice))) {
    errors.sellingPrice = "Selling price must be greater than 0.";
  }
  if (Number(values.sellingPrice) < Number(values.purchasePrice)) {
    errors.sellingPrice = "Selling price cannot be less than purchase price.";
  }
  if (!values.expiryDate) {
    errors.expiryDate = "Expiry date is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
