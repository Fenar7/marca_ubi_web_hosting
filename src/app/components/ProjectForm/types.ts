export interface ProjectFormData {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  category: string;
  service: string;
  language: string;
  projectName: string;
  projectDescription: string;
  industry: string;
  website: string;
  agencyStatus: string;
  referral: string;
  timeline: string;
  inspirationLinks: string;
  showcasePermission: string;
  extraNotes: string;
}

export const initialFormData: ProjectFormData = {
  name: "",
  email: "",
  phone: "",
  instagram: "",
  category: "",
  service: "",
  language: "",
  projectName: "",
  projectDescription: "",
  industry: "",
  website: "",
  agencyStatus: "",
  referral: "",
  timeline: "",
  inspirationLinks: "",
  showcasePermission: "",
  extraNotes: "",
};
