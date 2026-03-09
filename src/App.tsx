import React, { useState, useRef, useEffect, Component } from 'react';
import {
  Download, FileText, Loader2, Mail, Phone, MapPin,
  Linkedin, Award,
  RotateCcw, CheckCircle2, AlertCircle, Plus, Trash2, X,
  Sparkles, Info, FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { CVData } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, WidthType,
  Table, TableRow, TableCell
} from 'docx';
import { saveAs } from 'file-saver';

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
interface EBState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('CV App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-red-400 mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_DATA: CVData = {
  name: "Ahmed Hussain",
  title: "Business Development Manager | B2B Sales & Strategic Partnerships",
  location: "Riyadh Region, Saudi Arabia",
  phone: "+966 549 734 522",
  email: "AhmedChester40@gmail.com",
  linkedin: "linkedin.com/in/ahmed-hussain-chester",
  summary: "Experienced Business Development Manager with a proven track record of driving revenue growth and forging strategic partnerships in competitive markets (Tech, Food, & Telecom). Currently managing key accounts at noon, where I successfully exceeded sales targets by 18% and optimized deal-closing time by 30%. My career progression from Customer Service to Senior Sales and Business Development demonstrates my adaptability and relentless drive for results. I combine data-driven strategies with strong relationship-building skills—competencies rooted in my early background in education, which honed my ability to communicate complex value propositions effectively. Seeking new challenges in Sales Leadership or Business Development roles in Riyadh or Jeddah to contribute to regional growth and Vision 2030 goals.",
  strengths: [
    "Strategic Sales: Consistently delivering 110-125% of targets.",
    "Market Expansion: Increasing market share and vertical opportunities.",
    "Client Retention: Building trust with C-level executives and partners.",
    "Tech-Savvy: Leveraging AI and CRM tools to enhance productivity."
  ],
  experience: [
    {
      company: "noon",
      location: "Jeddah, Saudi Arabia",
      roles: [
        {
          title: "Business Development Manager",
          period: "Jun 2025 – Sep 2025",
          description: [
            "Successfully coached and supported a remote sales team in Taif, achieving 18% above target in three months.",
            "Enhanced conversion rates by 22% through improved follow-ups and client qualification strategies.",
            "Established strategic partnerships with national restaurant chains, utilizing customized proposals and on-site meetings.",
            "Streamlined coordination between operations, procurement, and customer service, reducing deal-closing time by 30%."
          ]
        },
        {
          title: "Business Development Executive",
          period: "Sep 2024 – May 2025",
          description: [
            "Performance Excellence: Achieved consistent performance growth from initial ramp-up period to reliably delivering 110-125% of targets over consecutive months.",
            "Strategic Partnership Development: Secured multiple high-value restaurant partnerships, contributing to steady growth in Noon Food's market share across Western Saudi Arabia region.",
            "Market Intelligence & Analysis: Conducted comprehensive competitive analysis and market research, identifying new vertical opportunities.",
            "Enterprise Sales Excellence: Managed full sales cycle from prospecting to contract closure with C-level executives, achieving high client satisfaction rates.",
            "Cross-Functional Collaboration: Participated in integration projects with operations, marketing, and product teams, contributing to improved partner onboarding efficiency."
          ]
        }
      ]
    },
    {
      company: "Rentokil Boecker",
      location: "Jeddah, Saudi Arabia",
      roles: [
        {
          title: "Sales Consultant (Internship)",
          period: "Jul 2024 – Sep 2024",
          description: [
            "Acquired intensive hands-on experience in structured B2B sales within the health and hygiene sector, working with corporate accounts ranging from hospitality to healthcare facilities.",
            "Delivered tailored environmental health solutions aligned with regulatory compliance and operational efficiency needs, developing expertise in solution-based selling and technical consultation.",
            "Developed comprehensive understanding of account management practices, client lifecycle engagement, and renewal strategy during strategic transition period."
          ]
        }
      ]
    },
    {
      company: "stc",
      location: "Riyadh, Saudi Arabia",
      roles: [
        {
          title: "Senior Sales Representative",
          period: "Nov 2021 – Jul 2024",
          description: [
            "Acted as a key frontliner in promoting STC's 5G and fiber-optic solutions across residential and high-traffic public areas.",
            "Successfully built trust with diverse customers, including non-Arabic speakers, by delivering product explanations in English and tailoring offers to individual usage needs.",
            "Became one of the few field agents recognized for strategic selling—focusing on long-term customer value rather than transactional volume.",
            "Consistently exceeded sales targets, ranking in the top percentile for monthly KPIs.",
            "Invested in professional growth beyond job scope by completing multiple self-paced sales certifications (consultative selling, account-based strategy, solution selling)."
          ]
        }
      ]
    }
  ],
  education: [
    {
      degree: "Bachelor's degree, Islamic Studies",
      institution: "Al-Azhar University",
      period: "Oct 2015 – May 2021",
      grade: "76%",
      details: [
        "Taught Hadith and Seerah to secondary school students part-time for 15 months, developing strong communication and leadership skills."
      ]
    }
  ],
  certifications: [
    "Google AI Essentials (Google, Feb 2026)",
    "AI for business specialization (Coursera, May 2024)",
    "Sales Strategy & Consultative Selling",
    "Account Management Basics"
  ],
  skills: [
    'Business Development Consultancy', 'Client Accounts', 'Digital Marketing',
    'Partnership Marketing', 'Commercial Development', 'New Product Release',
    'Acquiring', 'Prompting', 'Relationship Building', 'Leadership',
    'Salesforce', 'HubSpot', 'B2B Sales'
  ],
  languages: [
    { language: "Arabic", level: "Native" },
    { language: "English", level: "Professional working proficiency" }
  ],
  awards: [
    "Top 5% nationally achiever (Mawarid Electronics LTD. / stc, Jul 2023)"
  ]
};

// ─── Main App ─────────────────────────────────────────────────────────────────
function CVApp() {
  const [data, setData] = useState<CVData>(() => {
    try {
      const saved = localStorage.getItem('ahmed_hussain_cv_data');
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>).name) {
          return parsed as CVData;
        }
      }
    } catch (e) {
      console.error("Failed to load saved data", e);
    }
    return INITIAL_DATA;
  });

  const [isExtracting, setIsExtracting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' });
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ahmed_hussain_cv_data', JSON.stringify(data));
  }, [data]);

  const setStatusMsg = (type: 'success' | 'error' | 'idle', message: string, autoClear = 4000) => {
    setStatus({ type, message });
    if (autoClear > 0) {
      setTimeout(() => setStatus({ type: 'idle', message: '' }), autoClear);
    }
  };

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    const cvElement = cvPreviewRef.current;
    if (!cvElement) return;
    setIsExportingPDF(true);
    setStatusMsg('idle', 'Generating PDF…', 0);
    try {
      const canvas = await html2canvas(cvElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: cvElement.scrollWidth,
        height: cvElement.scrollHeight,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yOffset = 0;
      while (yOffset < pdfHeight) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, pdfHeight);
        yOffset += pageHeight;
      }
      const fileName = `${(data.name || 'CV').replace(/\s+/g, '_')}_CV.pdf`;
      pdf.save(fileName);
      setStatusMsg('success', 'PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      setStatusMsg('error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ── Word Export ─────────────────────────────────────────────────────────────
  const handleExportWord = async () => {
    setIsExportingWord(true);
    setStatusMsg('idle', 'Generating Word document…', 0);
    try {
      const children: (Paragraph | Table)[] = [];

      // Header
      children.push(
        new Paragraph({ text: data.name, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: data.title, alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new TextRun({ text: `${data.email}  |  ${data.phone}  |  ${data.location}  |  ${data.linkedin}`, size: 18 })
          ]
        })
      );

      // Summary
      children.push(
        new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
        new Paragraph({ text: data.summary, spacing: { after: 240 } })
      );

      // Strengths
      if (data.strengths.length) {
        children.push(new Paragraph({ text: 'KEY STRENGTHS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.strengths.forEach(s => children.push(new Paragraph({ text: `• ${s}`, spacing: { after: 60 } })));
      }

      // Experience
      if (data.experience.length) {
        children.push(new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.experience.forEach(exp => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: exp.company, bold: true, size: 24 }),
                new TextRun({ text: `  —  ${exp.location}`, size: 20, color: '666666' })
              ],
              spacing: { before: 160, after: 80 }
            })
          );
          exp.roles.forEach(role => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: role.title, bold: true, color: '1d4ed8' }),
                  new TextRun({ text: `   ${role.period}`, italics: true, color: '666666' })
                ],
                spacing: { before: 80, after: 60 }
              })
            );
            role.description.forEach(desc => children.push(new Paragraph({ text: `• ${desc}`, spacing: { after: 40 } })));
          });
        });
      }

      // Education
      if (data.education.length) {
        children.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.education.forEach(edu => {
          children.push(
            new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true })], spacing: { before: 120, after: 40 } }),
            new Paragraph({
              children: [
                new TextRun({ text: edu.institution }),
                new TextRun({ text: `  |  ${edu.period}`, color: '666666' }),
                ...(edu.grade ? [new TextRun({ text: `  |  Grade: ${edu.grade}`, color: '666666' })] : [])
              ],
              spacing: { after: 60 }
            })
          );
          (edu.details ?? []).forEach(d => children.push(new Paragraph({ text: `• ${d}`, spacing: { after: 40 } })));
        });
      }

      // Certifications
      if (data.certifications.length) {
        children.push(new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.certifications.forEach(c => children.push(new Paragraph({ text: `• ${c}`, spacing: { after: 60 } })));
      }

      // Skills
      if (data.skills.length) {
        children.push(new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        children.push(new Paragraph({ text: data.skills.join('  •  '), spacing: { after: 120 } }));
      }

      // Languages
      if (data.languages.length) {
        children.push(new Paragraph({ text: 'LANGUAGES', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.languages.forEach(l => children.push(new Paragraph({ text: `${l.language}: ${l.level}`, spacing: { after: 60 } })));
      }

      // Awards
      if (data.awards.length) {
        children.push(new Paragraph({ text: 'HONORS & AWARDS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.awards.forEach(a => children.push(new Paragraph({ text: `• ${a}`, spacing: { after: 60 } })));
      }

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      const fileName = `${(data.name || 'CV').replace(/\s+/g, '_')}_CV.docx`;
      saveAs(blob, fileName);
      setStatusMsg('success', 'Word document downloaded successfully!');
    } catch (err) {
      console.error('Word export error:', err);
      setStatusMsg('error', 'Failed to generate Word document. Please try again.');
    } finally {
      setIsExportingWord(false);
    }
  };

  // ── Reset / Clear ───────────────────────────────────────────────────────────
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset to original data? All your edits will be lost.")) {
      setData(INITIAL_DATA);
      setStatusMsg('success', 'Data reset successfully');
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all data to start fresh?")) {
      setData({
        name: "Your Name", title: "Professional Title", location: "City, Country",
        phone: "+000 000 000", email: "email@example.com", linkedin: "linkedin.com/in/username",
        summary: "Write a short summary of your professional background...",
        strengths: ["Strength 1"], experience: [], education: [],
        certifications: [], skills: ["Skill 1"],
        languages: [{ language: "Language", level: "Level" }], awards: []
      });
      setStatusMsg('success', 'Canvas cleared');
    }
  };

  // ── AI Import ───────────────────────────────────────────────────────────────
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsExtracting(true);
    setStatusMsg('idle', 'AI is analyzing your profile…', 0);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-2.0-flash";

      const parts = await Promise.all(
        Array.from(files).map(async (file: File) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          return { inlineData: { mimeType: file.type, data: base64 } };
        })
      );

      const prompt = `
        You are a world-class CV writer. Extract all professional information from these LinkedIn profile screenshots.
        Your goal is to create a high-impact, logical, and error-free CV.
        Guidelines:
        1. Professional Tone: Use active verbs (e.g., "Spearheaded", "Optimized", "Negotiated").
        2. Logical Grouping: Group multiple roles under the same company correctly.
        3. Data Extraction: Ensure dates, locations, and titles are precise.
        4. Summary & Strengths: Write a punchy, 3-4 sentence summary and 4 key strengths based on the experience.
        5. Skills: Extract a comprehensive list of technical and soft skills.
        Return the data in the following JSON format strictly:
        {
          "name": string, "title": string, "location": string, "phone": string,
          "email": string, "linkedin": string, "summary": string, "strengths": string[],
          "experience": [{ "company": string, "location": string, "roles": [{ "title": string, "period": string, "description": string[] }] }],
          "education": [{ "degree": string, "institution": string, "period": string, "grade": string, "details": string[] }],
          "certifications": string[], "skills": string[],
          "languages": [{ "language": string, "level": string }], "awards": string[]
        }
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [...parts, { text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const extractedData = JSON.parse(response.text ?? '{}') as Partial<CVData>;
      setData(prev => ({ ...prev, ...extractedData }));
      setStatusMsg('success', 'AI successfully updated your CV!');
    } catch (error) {
      console.error("Extraction error:", error);
      setStatusMsg('error', 'AI failed to analyze images. Please try again.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Data helpers ─────────────────────────────────────────────────────────────
  const updateField = (path: string, value: string | null) => {
    setData(prev => {
      const newData = { ...prev } as Record<string, unknown>;
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        const existing = current[keys[i]];
        current[keys[i]] = Array.isArray(existing) ? [...existing] : { ...(existing as object) };
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      return newData as unknown as CVData;
    });
  };

  const addItem = (path: string, defaultValue: unknown) => {
    setData(prev => {
      const newData = { ...prev } as Record<string, unknown>;
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        const existing = current[keys[i]];
        current[keys[i]] = Array.isArray(existing) ? [...existing] : { ...(existing as object) };
        current = current[keys[i]] as Record<string, unknown>;
      }
      const arr = current[keys[keys.length - 1]] as unknown[];
      current[keys[keys.length - 1]] = [...arr, defaultValue];
      return newData as unknown as CVData;
    });
  };

  const removeItem = (path: string, index: number) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>;
      }
      const arr = current[keys[keys.length - 1]] as unknown[];
      current[keys[keys.length - 1]] = arr.filter((_, i) => i !== index);
      return newData as unknown as CVData;
    });
  };

  const isArabic = (text: unknown): boolean => {
    if (typeof text !== 'string') return false;
    return /[\u0600-\u06FF]/.test(text);
  };

  const getArClasses = (text: string, baseClasses: string, arabicExtra = "") => {
    if (!isArabic(text)) return baseClasses;
    const cleaned = baseClasses
      .split(' ')
      .filter(c => !c.startsWith('tracking-') && c !== 'uppercase' && c !== 'italic')
      .join(' ');
    return `${cleaned} font-arabic ${arabicExtra}`;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans selection:bg-blue-100">

      {/* Floating Toolbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 no-print w-full max-w-2xl px-4">
        <div className="glass px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 border border-white/50 flex-wrap">

          {/* Export PDF */}
          <button
            onClick={() => setShowPreview(true)}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 whitespace-nowrap text-sm"
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>

          {/* Export Word */}
          <button
            onClick={handleExportWord}
            disabled={isExportingWord}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all active:scale-95 whitespace-nowrap text-sm ${
              isExportingWord
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
            }`}
          >
            {isExportingWord ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            <span>{isExportingWord ? 'Generating…' : 'Export Word'}</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* AI Import */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all active:scale-95 whitespace-nowrap text-sm ${
                isExtracting
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-500" />}
              <span>{isExtracting ? 'Analyzing…' : 'AI Import'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              title="Reset to Template"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Status Toast */}
      <AnimatePresence>
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 font-medium border ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              status.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' :
              'bg-slate-50 text-slate-700 border-slate-100'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={18} /> :
             status.type === 'error' ? <AlertCircle size={18} /> :
             <Loader2 size={18} className="animate-spin" />}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main CV Container (editable) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        id="cv-content-editable"
        className="print-container max-w-[210mm] mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full min-h-[297mm] flex flex-col md:flex-row"
      >
        {/* Sidebar */}
        <aside className="w-full md:w-[32%] bg-slate-900 text-slate-300 p-8 md:p-10 flex flex-col gap-10 print:w-[32%] print:bg-slate-900 print:text-slate-300">...
      </motion.div>

      <div className="max-w-[210mm] mx-auto mt-12 no-print text-slate-400 text-sm text-center pb-12">
        <p>© {new Date().getFullYear()} Ahmed Hussain CV Builder • Built with AI Precision</p>
      </div>
    </div>
  );
}

// Wrap with ErrorBoundary for export
export default function App() {
  return (
    <ErrorBoundary>
      <CVApp />
    </ErrorBoundary>
  );
}