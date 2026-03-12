export type CompanyProfileSubmissionInput = {
  name: string;
  businessType: string;
  phone: string;
  email: string;
  instagramId: string;
  website: string;
  message: string;
};

export type CompanyProfileSubmissionErrors = Partial<
  Record<keyof CompanyProfileSubmissionInput, string>
>;

export const EMPTY_COMPANY_PROFILE_SUBMISSION: CompanyProfileSubmissionInput = {
  name: "",
  businessType: "",
  phone: "",
  email: "",
  instagramId: "",
  website: "",
  message: "",
};

export const COMPANY_PROFILE_SUBMISSION_FIELD_ORDER: Array<keyof CompanyProfileSubmissionInput> = [
  "name",
  "businessType",
  "phone",
  "email",
  "instagramId",
  "website",
  "message",
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7;
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidWebsite(value: string) {
  const normalizedWebsite = normalizeWebsite(value);

  if (!normalizedWebsite) {
    return true;
  }

  try {
    const parsed = new URL(normalizedWebsite);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

export function validateCompanyProfileSubmission(formData: CompanyProfileSubmissionInput) {
  const errors: CompanyProfileSubmissionErrors = {};

  if (!formData.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!formData.businessType.trim()) {
    errors.businessType = "Please enter your business type.";
  }

  if (!formData.phone.trim()) {
    errors.phone = "Please enter your phone number.";
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!formData.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (formData.website.trim() && !isValidWebsite(formData.website)) {
    errors.website = "Please enter a valid website URL.";
  }

  return errors;
}

export function sanitizeCompanyProfileSubmission(formData: CompanyProfileSubmissionInput) {
  return {
    name: formData.name.trim(),
    businessType: formData.businessType.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim().toLowerCase(),
    instagramId: formData.instagramId.trim(),
    website: normalizeWebsite(formData.website),
    message: formData.message.trim(),
  };
}
