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
  AlignmentType
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
      const children: Paragraph[] = [];

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

      children.push(
        new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
        new Paragraph({ text: data.summary, spacing: { after: 240 } })
      );

      if (data.strengths.length) {
        children.push(new Paragraph({ text: 'KEY STRENGTHS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.strengths.forEach(s => children.push(new Paragraph({ text: `• ${s}`, spacing: { after: 60 } })));
      }

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

      if (data.certifications.length) {
        children.push(new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.certifications.forEach(c => children.push(new Paragraph({ text: `• ${c}`, spacing: { after: 60 } })));
      }

      if (data.skills.length) {
        children.push(new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        children.push(new Paragraph({ text: data.skills.join('  •  '), spacing: { after: 120 } }));
      }

      if (data.languages.length) {
        children.push(new Paragraph({ text: 'LANGUAGES', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.languages.forEach(l => children.push(new Paragraph({ text: `${l.language}: ${l.level}`, spacing: { after: 60 } })));
      }

      if (data.awards.length) {
        children.push(new Paragraph({ text: 'HONORS & AWARDS', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
        data.awards.forEach(a => children.push(new Paragraph({ text: `• ${a}`, spacing: { after: 60 } }));
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
        className="print-container max-w-[210mm] mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full min-h-[297mm] flex flex-col md:flex-row"
      >
        {/* Left Sidebar */}
        <aside className="w-full md:w-[32%] bg-slate-900 text-slate-300 p-8 md:p-10 flex flex-col gap-10 print:w-[32%] print:bg-slate-900 print:text-slate-300">
          {/* Profile */}
          <div className="text-center md:text-left">
            <h1
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateField('name', e.currentTarget.textContent)}
              className={getArClasses(data.name, "text-3xl font-display font-extrabold text-white mb-2 outline-none editable-focus px-1 break-words")}
            >
              {data.name}
            </h1>
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateField('title', e.currentTarget.textContent)}
              className={getArClasses(data.title, "text-blue-400 font-medium text-sm tracking-wider uppercase outline-none editable-focus px-1 break-words")}
            >
              {data.title}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Contact</h3>
            <div className="space-y-3">
              {[
                { icon: <Mail size={14} />, field: 'email', value: data.email, extra: 'break-all' },
                { icon: <Phone size={14} />, field: 'phone', value: data.phone, extra: '' },
                { icon: <MapPin size={14} />, field: 'location', value: data.location, extra: '' },
                { icon: <Linkedin size={14} />, field: 'linkedin', value: data.linkedin, extra: 'break-all' },
              ].map(({ icon, field, value, extra }) => (
                <div key={field} className="flex items-center gap-3 group">
                  <div className="p-2 bg-slate-800 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                    {icon}
                  </div>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateField(field, e.currentTarget.textContent)}
                    className={`text-xs outline-none editable-focus ${extra}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Strengths</h3>
              <button onClick={() => addItem('strengths', '')} className="p-1 text-slate-500 hover:text-blue-400 transition-all no-print"><Plus size={14} /></button>
            </div>
            <ul className="space-y-3">
              {data.strengths.map((strength, i) => (
                <li key={i} className="group relative flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const newStrengths = [...data.strengths];
                      newStrengths[i] = e.currentTarget.textContent || '';
                      setData({ ...data, strengths: newStrengths });
                    }}
                    className={getArClasses(strength, "text-xs outline-none editable-focus flex-grow break-words", "text-right")}
                    dir={isArabic(strength) ? 'rtl' : 'ltr'}
                  >
                    {strength}
                  </span>
                  <button onClick={() => removeItem('strengths', i)} className="opacity-0 group-hover:opacity-100 transition-all no-print text-rose-500"><Trash2 size={12} /></button>
                </li>
              ))}
            </ul>
          </div>

          {/* Skills */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Skills</h3>
              <button onClick={() => addItem('skills', '')} className="p-1 text-slate-500 hover:text-blue-400 transition-all no-print"><Plus size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <div key={i} className="group relative">
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const newSkills = [...data.skills];
                      newSkills[i] = e.currentTarget.textContent || '';
                      setData({ ...data, skills: newSkills });
                    }}
                    className={getArClasses(skill, "px-3 py-1.5 bg-slate-800 text-slate-300 text-[11px] font-semibold rounded-lg outline-none break-words hover:bg-slate-700 transition-all inline-block")}
                  >
                    {skill}
                  </span>
                  <button onClick={() => removeItem('skills', i)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all no-print"><X size={10} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Education</h3>
              <button onClick={() => addItem('education', { degree: '', institution: '', period: '', grade: '', details: [] })} className="p-1 text-slate-500 hover:text-blue-400 transition-all no-print"><Plus size={14} /></button>
            </div>
            <div className="space-y-8">
              {data.education.map((edu, i) => (
                <div key={i} className="group relative border-l border-slate-800 pl-4 ml-1">
                  <button onClick={() => removeItem('education', i)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all no-print"><X size={10} /></button>
                  <div
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => { const n = [...data.education]; n[i].degree = e.currentTarget.textContent || ''; setData({ ...data, education: n }); }}
                    className={getArClasses(edu.degree, "text-sm font-bold text-white mb-1 outline-none editable-focus break-words", "text-right")}
                    dir={isArabic(edu.degree) ? 'rtl' : 'ltr'}
                  >{edu.degree}</div>
                  <div
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => { const n = [...data.education]; n[i].institution = e.currentTarget.textContent || ''; setData({ ...data, education: n }); }}
                    className={getArClasses(edu.institution, "text-xs font-medium text-slate-400 mb-1 outline-none editable-focus break-words", "text-right")}
                    dir={isArabic(edu.institution) ? 'rtl' : 'ltr'}
                  >{edu.institution}</div>
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <div
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => { const n = [...data.education]; n[i].period = e.currentTarget.textContent || ''; setData({ ...data, education: n }); }}
                      className="text-[10px] font-mono text-slate-500 outline-none"
                    >{edu.period}</div>
                    {edu.grade && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-600 uppercase">Grade:</span>
                        <span
                          contentEditable suppressContentEditableWarning
                          onBlur={(e) => { const n = [...data.education]; n[i].grade = e.currentTarget.textContent || ''; setData({ ...data, education: n }); }}
                          className="text-[10px] font-bold text-blue-400 outline-none"
                        >{edu.grade}</span>
                      </div>
                    )}
                  </div>
                  {edu.details && edu.details.length > 0 && (
                    <ul className="space-y-1.5 mt-2">
                      {edu.details.map((detail, di) => (
                        <li key={di} className="group/detail relative flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-700 mt-1.5 shrink-0" />
                          <span
                            contentEditable suppressContentEditableWarning
                            onBlur={(e) => { const n = [...data.education]; n[i].details[di] = e.currentTarget.textContent || ''; setData({ ...data, education: n }); }}
                            className={getArClasses(detail, "text-[10px] text-slate-400 leading-relaxed outline-none break-words", "text-right")}
                            dir={isArabic(detail) ? 'rtl' : 'ltr'}
                          >{detail}</span>
                          <button onClick={() => { const n = [...data.education]; n[i].details.splice(di, 1); setData({ ...data, education: n }); }} className="opacity-0 group-hover/detail:opacity-100 transition-all no-print text-rose-500"><Trash2 size={10} /></button>
                        </li>
                      ))}
                      <button onClick={() => { const n = [...data.education]; n[i].details.push(''); setData({ ...data, education: n }); }} className="text-[9px] text-slate-600 hover:text-blue-400 transition-all no-print flex items-center gap-1">
                        <Plus size={10} /> Add Detail
                      </button>
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Certifications</h3>
              <button onClick={() => addItem('certifications', '')} className="p-1 text-slate-500 hover:text-blue-400 transition-all no-print"><Plus size={14} /></button>
            </div>
            <ul className="space-y-3">
              {data.certifications.map((cert, i) => (
                <li key={i} className="group relative flex items-start gap-3">
                  <div className="p-1.5 bg-slate-800 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                    <Award size={12} />
                  </div>
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => { const n = [...data.certifications]; n[i] = e.currentTarget.textContent || ''; setData({ ...data, certifications: n }); }}
                    className={getArClasses(cert, "text-xs text-slate-300 outline-none editable-focus flex-grow break-words", "text-right")}
                    dir={isArabic(cert) ? 'rtl' : 'ltr'}
                  >{cert}</span>
                  <button onClick={() => removeItem('certifications', i)} className="opacity-0 group-hover:opacity-100 transition-all no-print text-rose-500"><Trash2 size={12} /></button>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Languages</h3>
              <button onClick={() => addItem('languages', { language: '', level: '' })} className="p-1 text-slate-500 hover:text-blue-400 transition-all no-print"><Plus size={14} /></button>
            </div>
            <div className="space-y-3">
              {data.languages.map((lang, i) => (
                <div key={i} className="group relative flex justify-between items-center">
                  <div className="flex flex-col">
                    <span
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => { const n = [...data.languages]; n[i].language = e.currentTarget.textContent || ''; setData({ ...data, languages: n }); }}
                      className={getArClasses(lang.language, "text-xs font-bold text-slate-200 outline-none editable-focus")}
                    >{lang.language}</span>
                    <span
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => { const n = [...data.languages]; n[i].level = e.currentTarget.textContent || ''; setData({ ...data, languages: n }); }}
                      className="text-[10px] text-slate-500 uppercase tracking-wider"
                    >{lang.level}</span>
                  </div>
                  <button onClick={() => removeItem('languages', i)} className="opacity-0 group-hover:opacity-100 transition-all no-print text-rose-500"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <main className="flex-grow p-8 md:p-12 bg-white flex flex-col gap-12">
          {/* Summary */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Profile</h3>
              <div className="h-px flex-grow bg-slate-100" />
            </div>
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateField('summary', e.currentTarget.textContent)}
              className={getArClasses(data.summary, "text-slate-600 leading-relaxed text-justify text-sm outline-none editable-focus p-4 bg-slate-50 rounded-2xl transition-all break-words", "text-right")}
              dir={isArabic(data.summary) ? 'rtl' : 'ltr'}
            >
              {data.summary}
            </p>
          </section>

          {/* Experience */}
          <section>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4 flex-grow">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">Experience</h3>
                <div className="h-px flex-grow bg-slate-100" />
              </div>
              <button onClick={() => addItem('experience', { company: '', location: '', roles: [{ title: '', period: '', description: [''] }] })} className="ml-4 p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all no-print"><Plus size={16} /></button>
            </div>
            <div className="space-y-12">
              {data.experience.map((exp, i) => (
                <div key={i} className="group relative">
                  <button onClick={() => removeItem('experience', i)} className="absolute -top-4 -right-4 p-2 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all no-print"><Trash2 size={16} /></button>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-6 gap-2">
                    <h4
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => { const n = [...data.experience]; n[i].company = e.currentTarget.textContent || ''; setData({ ...data, experience: n }); }}
                      className={getArClasses(exp.company, "text-xl font-display font-bold text-slate-900 outline-none editable-focus break-words")}
                    >{exp.company}</h4>
                    <div className="flex items-center gap-3">
                      <span
                        contentEditable suppressContentEditableWarning
                        onBlur={(e) => { const n = [...data.experience]; n[i].location = e.currentTarget.textContent || ''; setData({ ...data, experience: n }); }}
                        className={getArClasses(exp.location, "text-[10px] font-bold text-slate-400 uppercase tracking-widest outline-none")}
                      >{exp.location}</span>
                      <button
                        onClick={() => { const n = [...data.experience]; n[i].roles.push({ title: 'New Role', period: 'Period', description: [''] }); setData({ ...data, experience: n }); }}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all no-print"
                        title="Add Role"
                      ><Plus size={12} /></button>
                    </div>
                  </div>
                  {exp.roles.map((role, ri) => (
                    <div key={ri} className="mb-8 last:mb-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4 gap-1">
                        <div
                          contentEditable suppressContentEditableWarning
                          onBlur={(e) => { const n = [...data.experience]; n[i].roles[ri].title = e.currentTarget.textContent || ''; setData({ ...data, experience: n }); }}
                          className={getArClasses(role.title, "text-base font-bold text-blue-600 outline-none editable-focus break-words")}
                        >{role.title}</div>
                        <div className="flex items-center gap-3">
                          <div
                            contentEditable suppressContentEditableWarning
                            onBlur={(e) => { const n = [...data.experience]; n[i].roles[ri].period = e.currentTarget.textContent || ''; setData({ ...data, experience: n }); }}
                            className="text-[10px] font-mono font-medium text-slate-400 whitespace-nowrap outline-none"
                          >{role.period}</div>
                          {exp.roles.length > 1 && (
                            <button
                              onClick={() => { const n = [...data.experience]; n[i].roles.splice(ri, 1); setData({ ...data, experience: n }); }}
                              className="p-1 text-rose-300 hover:text-rose-600 transition-all no-print"
                            ><Trash2 size={12} /></button>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {role.description.map((desc, di) => (
                          <li key={di} className={`text-sm text-slate-600 flex gap-4 leading-relaxed group/desc ${isArabic(desc) ? 'flex-row-reverse text-right' : ''}`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-200 mt-2 shrink-0 group-hover/desc:bg-blue-500 transition-all" />
                            <div className="flex-grow relative">
                              <span
                                contentEditable suppressContentEditableWarning
                                onBlur={(e) => { const n = [...data.experience]; n[i].roles[ri].description[di] = e.currentTarget.textContent || ''; setData({ ...data, experience: n }); }}
                                className={getArClasses(desc, "outline-none editable-focus px-1 rounded block break-words")}
                                dir={isArabic(desc) ? 'rtl' : 'ltr'}
                              >{desc}</span>
                              <div className="absolute -right-8 top-0 flex gap-1 opacity-0 group-hover/desc:opacity-100 transition-all no-print">
                                <button onClick={() => { const n = [...data.experience]; n[i].roles[ri].description.splice(di + 1, 0, ''); setData({ ...data, experience: n }); }} className="text-slate-300 hover:text-blue-500"><Plus size={12} /></button>
                                <button onClick={() => { const n = [...data.experience]; n[i].roles[ri].description.splice(di, 1); setData({ ...data, experience: n }); }} className="text-slate-300 hover:text-rose-500"><X size={12} /></button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Awards */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4 flex-grow">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">Honors & Awards</h3>
                <div className="h-px flex-grow bg-slate-100" />
              </div>
              <button onClick={() => addItem('awards', '')} className="ml-4 p-2 text-slate-400 hover:text-blue-600 transition-all no-print"><Plus size={16} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {data.awards.map((award, i) => (
                <div key={i} className="group relative flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                  <Award size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => { const n = [...data.awards]; n[i] = e.currentTarget.textContent || ''; setData({ ...data, awards: n }); }}
                    className={getArClasses(award, "text-sm text-slate-700 outline-none editable-focus flex-grow break-words", "text-right")}
                    dir={isArabic(award) ? 'rtl' : 'ltr'}
                  >{award}</span>
                  <button onClick={() => removeItem('awards', i)} className="opacity-0 group-hover:opacity-100 transition-all no-print text-rose-300 hover:text-rose-600"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 no-print"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Export Preview</h2>
                    <p className="text-sm text-slate-500">A4 Document Format</p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all group active:scale-95 ${
                      isExportingPDF
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                    }`}
                  >
                    {isExportingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />}
                    {isExportingPDF ? 'Generating…' : 'Save as PDF'}
                  </button>
                  <button
                    onClick={handleExportWord}
                    disabled={isExportingWord}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all group active:scale-95 ${
                      isExportingWord
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                    }`}
                  >
                    {isExportingWord ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                    {isExportingWord ? 'Generating…' : 'Save as Word'}
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-grow overflow-y-auto p-4 sm:p-8 md:p-12 bg-slate-50/50 flex justify-center custom-scrollbar">
                <div
                  ref={cvPreviewRef}
                  className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] flex flex-col md:flex-row overflow-hidden rounded-lg"
                >
                  {/* Preview Sidebar */}
                  <aside className="w-full md:w-[32%] bg-slate-900 text-slate-300 p-8 flex flex-col gap-8">
                    <div className="text-center md:text-left">
                      <h1 className={getArClasses(data.name, "text-2xl font-display font-extrabold text-white mb-1 break-words")}>{data.name}</h1>
                      <p className={getArClasses(data.title, "text-blue-400 font-medium text-[10px] tracking-wider uppercase break-words")}>{data.title}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><Mail size={12} className="text-blue-400" /><span className="break-all text-[9px]">{data.email}</span></div>
                      <div className="flex items-center gap-2"><Award size={12} className="text-blue-400" /><span className="text-[9px]">{data.phone}</span></div>
                    </div>
                    <div>
                      <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Strengths</h3>
                      <ul className="space-y-2">
                        {data.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span className={getArClasses(s, "text-[10px] leading-relaxed break-words")} dir={isArabic(s) ? 'rtl' : 'ltr'}>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {data.skills.map((s, i) => <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-[9px] font-semibold rounded-md">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Education</h3>
                      {data.education.map((edu, i) => (
                        <div key={i} className="break-words border-l border-slate-800 pl-3 ml-0.5 mb-4">
                          <div className={getArClasses(edu.degree, "text-[11px] font-bold text-white")}>{edu.degree}</div>
                          <div className={getArClasses(edu.institution, "text-[10px] text-slate-400")}>{edu.institution}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-[9px] font-mono text-slate-500">{edu.period}</div>
                            {edu.grade && <div className="text-[9px] font-bold text-blue-400">Grade: {edu.grade}</div>} 
                          </div>
                        </div>
                      ))}
                    </div>
                    {data.certifications.length > 0 && (
                      <div>
                        <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Certifications</h3>
                        <ul className="space-y-2">
                          {data.certifications.map((cert, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Award size={10} className="text-blue-400 shrink-0 mt-0.5" />
                              <span className={getArClasses(cert, "text-[10px] leading-relaxed")} dir={isArabic(cert) ? 'rtl' : 'ltr'}>{cert}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.languages.length > 0 && (
                      <div>
                        <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Languages</h3>
                        {data.languages.map((l, i) => (
                          <div key={i} className="mb-1">
                            <span className="text-[10px] font-bold text-slate-200">{l.language}</span>
                            <span className="text-[9px] text-slate-500 ml-2">{l.level}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </aside>

                  {/* Preview Main */}
                  <main className="flex-grow p-10 bg-white flex flex-col gap-10">
                    <section>
                      <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4">Professional Profile</h3>
                      <p className={getArClasses(data.summary, "text-slate-600 leading-relaxed text-sm text-justify break-words")} dir={isArabic(data.summary) ? 'rtl' : 'ltr'}>{data.summary}</p>
                    </section>
                    <section>
                      <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-6">Experience</h3>
                      <div className="space-y-8">
                        {data.experience.map((exp, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-baseline mb-4">
                              <h4 className={getArClasses(exp.company, "text-lg font-bold text-slate-900")}>{exp.company}</h4>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{exp.location}</span>
                            </div>
                            {exp.roles.map((role, ri) => (
                              <div key={ri} className="mb-6 last:mb-0">
                                <div className="flex justify-between items-baseline mb-3">
                                  <div className={getArClasses(role.title, "text-sm font-bold text-blue-600")}>{role.title}</div>
                                  <div className="text-[9px] font-mono text-slate-400">{role.period}</div>
                                </div>
                                <ul className="space-y-2">
                                  {role.description.map((desc, di) => (
                                    <li key={di} className="flex gap-3 text-xs text-slate-600 leading-relaxed">
                                      <div className="w-1 h-1 rounded-full bg-blue-200 mt-1.5 shrink-0" />
                                      <span className={getArClasses(desc, "break-words")} dir={isArabic(desc) ? 'rtl' : 'ltr'}>{desc}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </section>
                    {data.awards.length > 0 && (
                      <section>
                        <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4">Honors & Awards</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {data.awards.map((award, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                              <Award size={14} className="text-blue-500 shrink-0 mt-0.5" />
                              <span className={getArClasses(award, "text-xs text-slate-700 break-words")} dir={isArabic(award) ? 'rtl' : 'ltr'}>{award}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </main>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-8 max-w-sm bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 no-print z-40"
          >
            <button onClick={() => setShowInstructions(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 transition-all">
              <X size={18} />
            </button>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-2xl"><Info size={20} /></div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Quick Guide</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Click any text to edit. Use the <Plus size={12} className="inline" /> buttons to add sections. Hover over items to delete them.
                </p>
                <div className="mt-3 flex gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Download size={12} className="text-blue-500" /> PDF Export
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <FileDown size={12} className="text-emerald-500" /> Word Export
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Sparkles size={12} className="text-amber-500" /> AI Powered
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[210mm] mx-auto mt-12 no-print text-slate-400 text-sm text-center pb-12">
        <p>© {new Date().getFullYear()} Ahmed Hussain CV Builder • Built with AI Precision</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CVApp />
    </ErrorBoundary>
  );
}