export interface Experience {
  company: string;
  location: string;
  roles: {
    title: string;
    period: string;
    description: string[];
  }[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  grade?: string;
  details?: string[];
}

export interface CVData {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  summary: string;
  strengths: string[];
  experience: Experience[];
  education: Education[];
  certifications: string[];
  skills: string[];
  languages: { language: string; level: string }[];
  awards: string[];
}
