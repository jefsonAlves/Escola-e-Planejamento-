/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Check, Home, Users, Calendar, MessageSquare, Plus, Search, Filter, ShieldAlert, Award, AlertTriangle, FileText, Send, MoreVertical, X, Menu, Upload, Briefcase, UserCircle, MapPin, Smile, AlertOctagon, ChevronDown, Moon, Sun, LayoutDashboard, UserCheck, MessageCircle, Book, Clock, Sparkles, TriangleAlert, Ban, Camera, Mic, Save, ChevronLeft, ChevronRight, Settings, FileUp, GripVertical, Eye, EyeOff, Edit2, Video, Link2, Trash2, UploadCloud, GraduationCap, Lock, CreditCard, Megaphone, Download, ShieldCheck, CheckCircle2, Copy, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp, collection, query, where, getDocs, getDocFromServer } from 'firebase/firestore';

import { Capacitor } from '@capacitor/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// --- Types ---
declare global {
  interface Window {
    Capacitor: any;
  }
}

type Screen = 'login' | 'dashboard' | 'attendance' | 'agenda' | 'reports' | 'boletim' | 'occurrence' | 'settings' | 'classes' | 'director' | 'materials' | 'studentsHub' | 'admin';

interface AdminNotice {
  id: string;
  text: string;
  date: string;
  type: 'info' | 'warning' | 'critical';
}

interface StudentEvaluation {
  id: string;
  method: string;
  points: number;
  date: string;
  bimester?: string;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  room: string;
  status: 'present' | 'absent' | 'late' | 'none';
  offset?: string; // for late students
  attendanceHistory?: Record<string, 'present' | 'absent' | 'late' | 'none'>;
  diagnostic?: string;
  evaluations?: StudentEvaluation[];
  specialNeeds?: string[]; // e.g., ['TEA', 'DI']
}

// --- Mock Data ---
const STUDENTS: Student[] = [
  { id: '1', name: 'Artur Silveira', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBX3fO0KgQ1noNCDlpRUkaXY1QJoe31Nyd0mbexlKmmyEbdAp7J_jCuW0B1mC6f754zpM84WmK50oe9LS3JdGEHy8y0ukY0pJ7dpRjG2mSGUaetld1qrnUdiBsmZMgVb1Cdbk0anS6-j3QnsEFzV0kMGsXtrj-TGfl-8Y-lukitu6BCDEcMEQn6bNnVFkvFzSovoFCJ2AE6kyFcveou8x4qWEPKjQ0qeJx9rZcZcvt7t_zsJuZ62rQAxjOev6R-VW7WBMnzaETfoCG', grade: '3º Ano B', room: '104', status: 'present' },
  { id: '2', name: 'Beatriz Mendes', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe2jV1hFd2REf5AyIlOHVzHu-LRV0wYzUXlXUElLek8zhIY_LPf3eMo3Ru0f7LzLZZOZfFAhxYE0la-Wz167Xop5c2w_1rKqkSeZwBZfbeKv1yG-DYxZs-Su7dabFHwxfX1DrmDxtTU9k5zfZJV3rraRR9rXK_H_wQLxYg6G5ppFqlWvJY6owYlRmgmXecldoAqmIVcHwDqsEud3uqz5FVSyKgh3ehAiXUC9HT3WBOimP7fO1DHnHzzhmb6qaQlUVcx0gRcmat8pzJ', grade: '3º Ano B', room: '104', status: 'absent' },
  { id: '3', name: 'Cauã Rodrigues', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC622g2C1lMYtAfFGPkzuaHiC-K3ua6LsBzE_qdrEgh_Dy3UdaIoLP4ZuQsa1G3JKk9hABe53252oK65FSlJHWqK3Isw0k19ZCo_n0XabVzkkPxKNsHjt2Cd4D8mUamdPiA_r7vd9yF9lJNI8bx0LqYEpyhExuu-D5EFfQvBXBBgxJCzYTLDbrk5egLogOwhDFZPH8VSZUyi6sFkf7ug1SW9f8Pk-70KCODykr8i_wI-W-QPGuVMG_kfIXgIHHsC0SB9H5NV29HDZU3', grade: '3º Ano B', room: '104', status: 'present' },
  { id: '4', name: 'Daniela Lima', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2PytF6S3eTtOVDSlbGnt7c7cD5DHr7QS-nEJXVfNoY_uNXTkIWWpXLz83TcG-5AbENXO9DXVdAATecFpjYtQWQQas-HxcdrRz1Ddd0Z-Fcq2zUTl-GDB1RcD1gofT45bz96kzTFF-sX3VZ5FzCgl9D109M_q91dm7bKi1prjdzIyjx08Y7ihX6aBe11vimjdNN-clFrR0pkbOKpmm1EreqqdOxoQHn2ySzZ4s55mE3X1tc2zmSfTCjgOXyUDiqjjAaVfTv7fHKZUz', grade: '3º Ano B', room: '104', status: 'late', offset: '15 min' },
  { id: '5', name: 'Eduardo Gomes', avatar: '', grade: '3º Ano B', room: '104', status: 'none' },
];

const TEACHER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAwf4l9S8ZAeaCAGQkpch-iZRa2GzSDW3dEwi3GSkT6SIRfcwMh7YVTpwOQbcxnu2JABJ1Kf8bde4CTi9KMl9TrAruaVHFFBh4P-asdiUbe-Mgxre9HeypmKxIzaWkcq5pykDwPXPSpCpeSeSR-EDApL4M1epX3KMBDdnGfcuOub9FnLYkd_10BZr6JRDCLhCtqNDcFiiKJ7mY2sE9f_uqfhkZy3n91QB39QNQs2N-wcHJ6Id5_bY1ECoBtpj-IjaC2nly6TTR0zvO';

// --- Shared Components ---

const SystemNotices = ({ notices }: { notices: AdminNotice[] }) => {
  if (!notices || notices.length === 0) return null;
  const latest = notices[0];
  
  return (
    <div className={`mb-6 p-4 rounded-2xl border flex gap-3 items-start ${
      latest.type === 'critical' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-900/50 dark:text-red-400' :
      latest.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-500/10 dark:border-amber-900/50 dark:text-amber-400' :
      'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-900/50 dark:text-blue-400'
    }`}>
      <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Aviso Oficial</p>
          <div className="w-1 h-1 rounded-full bg-current opacity-40" />
          <p className="text-[9px] font-bold opacity-60 uppercase">{latest.date}</p>
        </div>
        <p className="text-sm font-manrope font-bold leading-tight">{latest.text}</p>
      </div>
    </div>
  );
};

const Header = ({ title, showBack, onBack, onSettings, avatarUrl, onNavigateDirector }: { title: string; showBack?: boolean; onBack?: () => void; onSettings?: () => void; avatarUrl?: string; onNavigateDirector?: () => void }) => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-3 glass-card shadow-sm border-b border-white/20 dark:border-slate-700/50">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={onBack} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
        )}
        <h1 className="text-xl font-bold text-primary truncate max-w-[200px] sm:max-w-none">{title}</h1>
      </div>
      <div className="flex items-center gap-3 w-auto flex-nowrap shrink-0">
        <button onClick={toggleTheme} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90 text-primary">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {onSettings && (
          <button onClick={onSettings} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90 text-primary">
            <Settings className="w-5 h-5" />
          </button>
        )}
        <motion.div 
          whileTap={{ scale: 0.9 }}
          onClick={onNavigateDirector}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <img src={avatarUrl?.trim() || TEACHER_AVATAR} alt="User Avatar" className="w-full h-full object-cover" />
        </motion.div>
      </div>
    </header>
  );
};

const BottomNav = ({ active, onChange, role, isSuperAdmin }: { active: Screen; onChange: (s: Screen) => void; role?: 'teacher' | 'student' | 'both'; isSuperAdmin?: boolean }) => {
  let items: { id: Screen; label: string; icon: any }[] = [
    { id: 'studentsHub', label: 'Alunos', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  if (role === 'student') {
    items = items.filter(item => item.id !== 'studentsHub');
  }

  // Se for super admin, inserir a engrenagem no meio
  if (isSuperAdmin) {
     const middleIndex = Math.floor(items.length / 2);
     items.splice(middleIndex, 0, { id: 'admin', label: 'Admin', icon: Settings });
  }

  const handlePress = (id: Screen) => {
    if (navigator.vibrate) navigator.vibrate(50);
    onChange(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-card border-t border-white/30 dark:border-slate-700/50 pb-safe px-6 py-2 flex justify-around items-center rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      {items.map((item) => {
        const isActive = active === item.id || (active === 'attendance' && item.id === 'studentsHub') || (active === 'occurrence' && item.id === 'studentsHub') || (active === 'boletim' && item.id === 'studentsHub');
        return (
          <button
            key={item.id}
            onClick={() => handlePress(item.id)}
            className={`relative flex flex-col items-center gap-1 p-2 transition-all duration-300 w-16 ${
              isActive ? 'text-primary dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <div className={`relative p-2 rounded-full transition-all duration-300 ${
              isActive ? 'bg-primary/10 dark:bg-blue-500/10 scale-110' : 'scale-100'
            }`}>
              <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wider transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70 font-bold'}`}>{item.label}</span>
            {isActive && (
              <motion.div layoutId="nav-glow" className="absolute -top-3 w-8 h-1 bg-primary dark:bg-blue-400 rounded-full shadow-[0_0_8px_rgba(0,35,111,0.5)] dark:shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            )}
          </button>
        )
      })}
    </nav>
  );
};

export interface MaterialData {
  id: string;
  title: string;
  link: string;
  type: 'video' | 'document' | 'link';
  targetClasses: string[];
}

interface AppState {
  schoolName: string;
  teacherName: string; // Used as main user name for backward compatibility
  role?: 'teacher' | 'student' | 'both';
  avatarUrl?: string;
  birthDate?: string;
  cpf?: string;
  password?: string;
  googleSynced?: boolean;
  classes: ClassData[];
  occurrences: Occurrence[];
  notifications?: NotificationData[];
  googleCalendarEvents?: GoogleEvent[];
  googleClassroomActivities?: GoogleCourseWork[];
  materials?: MaterialData[];
  adminNotices?: AdminNotice[];
  billingStatus?: 'active' | 'overdue' | 'trial';
  billingExpiry?: string;
}

interface GoogleEvent {
  id: string;
  title: string;
  start: string;
  month: string;
  day: string;
  isCustom?: boolean;
  dateIso?: string;
  syncedToGoogle?: boolean;
}

interface GoogleCourseWork {
  id: string;
  courseId: string;
  courseName: string;
  teacherName?: string;
  title: string;
  dueDateStr: string;
  postDateStr?: string;
  isSoon: boolean;
  messages?: ClassroomMessage[];
  role?: 'teacher' | 'student';
  isCompletedLocal?: boolean;
}

interface ClassroomMessage {
  id: string;
  authorName: string;
  text: string;
  date: string;
}


interface NotificationData {
  id: string;
  title: string;
  body: string;
  urgency: 'important' | 'update' | 'normal';
  targetClasses?: string[]; // Array of class IDs or 'all'
  date: string;
}

export interface ClassSchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

interface ClassData {
  id: string;
  name: string;
  students: Student[];
  evaluationMethods?: string[];
  schedule?: ClassSchedule;
}

interface Occurrence {
  id: string;
  studentId: string;
  date: string;
  status: 'praise' | 'attention' | 'critical';
  tags: string[];
  notes: string;
  justification?: string;
  attachmentUrl?: string; // Base64 or Blob URL for attachment
  meetingReminderDate?: string;
  meetingReminderTime?: string;
}

// --- Screen Components ---

const formatCPF = (val: string) => {
  let v = val.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
};

const RegistrationScreen = ({ onComplete, onSwitchToLogin, onShowNotification }: { onComplete: (data: AppState) => void, onSwitchToLogin: () => void, onShowNotification?: (msg: string, type: 'critical' | 'info') => void }) => {
  const [step, setStep] = useState(0); // step 0 is for role selection
  const [role, setRole] = useState<'teacher' | 'student' | 'both'>('teacher');
  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [newClassName, setNewClassName] = useState('');
  
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');

  const nextStep = () => {
    if (step === 0 && role) setStep(1);
    else if (step === 1 && schoolName && teacherName && birthDate && cpf && password) {
      if (role === 'student') {
        onComplete({ schoolName, teacherName, role, birthDate, cpf, password, googleSynced: false, classes: [], occurrences: [] });
      } else {
        setStep(2);
      }
    }
    else if (step === 2 && classes.length > 0) setStep(3);
  };

  const addClass = () => {
    if (!newClassName.trim()) return;
    setClasses([...classes, { id: Date.now().toString(), name: newClassName, students: [] }]);
    setNewClassName('');
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClassId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newStudents = lines
        .map(line => line.split(',')[0].trim())
        .filter(name => name.length > 0)
        .map((name, index) => ({
          id: Date.now().toString() + index,
          name,
          avatar: '',
          grade: classes.find(c => c.id === activeClassId)?.name || '',
          room: '',
          status: 'none' as const
        }));

      if (newStudents.length > 0) {
        setClasses(classes.map(c => {
          if (c.id === activeClassId) {
            return {
              ...c,
              students: [...c.students, ...newStudents]
            };
          }
          return c;
        }));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const addStudent = () => {
    if (!newStudentName.trim() || !activeClassId) return;

    // Support comma or newline separated names for batch addition
    const names = newStudentName.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    setClasses(classes.map(c => {
      if (c.id === activeClassId) {
        const newStudents = names.map((name, idx) => ({
            id: Date.now().toString() + idx,
            name: name,
            avatar: '',
            grade: c.name,
            room: 'N/A',
            status: 'none' as const
        }));
        return {
          ...c,
          students: [...c.students, ...newStudents]
        };
      }
      return c;
    }));
    setNewStudentName('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-surface-base px-6 py-12">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px]" />
      
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary mb-2">
            {step === 0 ? 'Bem-vindo(a)' : step === 1 ? 'Configure sua Conta' : step === 2 ? 'Suas Turmas' : 'Seus Alunos'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-manrope">
            {step === 0 ? 'Como você vai usar o sistema?' :
             step === 1 ? 'Vamos configurar o seu ambiente escolar e acesso.' : 
             step === 2 ? 'Cadastre as turmas.' : 
             'Adicione os alunos.'}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-xl">
          
          {step === 0 && (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setRole('student')} 
                  className={`p-4 rounded-2xl flex items-center gap-4 border-2 transition-all text-left ${role === 'student' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-700/50 hover:border-primary/50'}`}
                >
                  <div className={`p-3 rounded-xl ${role === 'student' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Book className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Sou Aluno</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Acompanhar minhas aulas e atividades</p>
                  </div>
                </button>

                <button 
                  onClick={() => setRole('teacher')} 
                  className={`p-4 rounded-2xl flex items-center gap-4 border-2 transition-all text-left ${role === 'teacher' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-700/50 hover:border-primary/50'}`}
                >
                  <div className={`p-3 rounded-xl ${role === 'teacher' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Sou Professor</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gerenciar turmas e alunos</p>
                  </div>
                </button>
              </div>

              <button 
                onClick={nextStep}
                disabled={!role}
                className="w-full primary-gradient text-white font-bold py-4 rounded-2xl shadow-lg mt-4 disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Continuar
              </button>
              <div className="mt-4 text-center">
                <button onClick={onSwitchToLogin} className="text-xs font-bold text-slate-400 uppercase hover:text-primary transition-colors">Já tenho conta</button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">Instituição de Ensino</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ex: Colégio Horizonte ou escolha da lista"
                    list="registered-schools"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                  />
                  <datalist id="registered-schools">
                    <option value="Colégio Horizonte" />
                    <option value="Escola Estadual São João" />
                    <option value="Colégio Santa Cruz" />
                    <option value="Instituto Federal" />
                    <option value="CEFET" />
                  </datalist>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">Seu Nome Completo</label>
                <input 
                  type="text" 
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">Data de Nascimento</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">CPF de Acesso</label>
                <input 
                  type="text" 
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">Senha de Acesso</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button 
                onClick={nextStep}
                disabled={!schoolName || !teacherName || !birthDate || !cpf || !password}
                className="w-full primary-gradient text-white font-bold py-3.5 rounded-2xl shadow-lg mt-4 disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Avançar
              </button>
              
              <button onClick={onSwitchToLogin} className="w-full mt-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                Já tem cadastro? Faça login
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase ml-1">Nova Turma</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addClass()}
                    placeholder="Ex: 3º Ano B"
                    className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                  />
                  <button onClick={addClass} className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {classes.length > 0 && (
                <Reorder.Group axis="y" values={classes} onReorder={setClasses} className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {classes.map(c => (
                    <Reorder.Item key={c.id} value={c} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing">
                      <div className="flex gap-3 items-center">
                        <GripVertical className="w-5 h-5 text-slate-300" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope">{c.name}</span>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              <button 
                onClick={nextStep}
                disabled={classes.length === 0}
                className="w-full primary-gradient text-white font-bold py-4 rounded-2xl shadow-lg mt-4 disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Avançar
              </button>
              <button onClick={() => setStep(1)} className="w-full py-2 text-xs font-bold text-slate-400 uppercase hover:text-primary transition-colors">Voltar</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase ml-1">Selecione a Turma</label>
                <select 
                  value={activeClassId || ''}
                  onChange={(e) => setActiveClassId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="" disabled>Escolha...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {activeClassId && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase ml-1">Novo Aluno</label>
                    <div className="flex gap-2">
                      <textarea 
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addStudent())}
                        placeholder="Ex: João Silva ou cole uma lista (separada por vírgula ou linha)"
                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors min-h-[50px] resize-y"
                      />
                      <button onClick={addStudent} className="bg-secondary text-white p-3 rounded-xl hover:bg-secondary/90 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ou importe</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>
                  
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-primary transition-colors text-slate-500 dark:text-slate-400">
                    <FileUp className="w-5 h-5" />
                    <span className="text-sm font-bold">Importar arquivo CSV</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                  </label>
                </div>
              )}

              {activeClassId && classes.find(c => c.id === activeClassId)?.students.length! > 0 && (
                <Reorder.Group 
                  axis="y" 
                  values={classes.find(c => c.id === activeClassId)?.students!} 
                  onReorder={(newStudents: Student[]) => {
                    setClasses(classes.map(c => {
                      if (c.id === activeClassId) return { ...c, students: newStudents };
                      return c;
                    }));
                  }} 
                  className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar"
                >
                  {classes.find(c => c.id === activeClassId)?.students.map(s => (
                    <Reorder.Item key={s.id} value={s} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing">
                      <div className="flex gap-3 items-center">
                        <GripVertical className="w-5 h-5 text-slate-300" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope">{s.name.toUpperCase()}</span>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              <button 
                onClick={() => onComplete({ schoolName, teacherName, birthDate, cpf, password, googleSynced: false, classes, occurrences: [] })}
                className="w-full primary-gradient text-white font-bold py-4 rounded-2xl shadow-lg mt-4 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Concluir Cadastro
              </button>
              <button onClick={() => setStep(2)} className="w-full py-2 text-xs font-bold text-slate-400 uppercase hover:text-primary transition-colors">Voltar</button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

const GoogleIntegrationBlocks = ({ appData, onSyncGoogle, isSyncingGoogle, onShowNotification, currentViewRole, onUpdateActivities }: { appData: AppState, onSyncGoogle: () => void, isSyncingGoogle?: boolean, onShowNotification: (msg: string) => void, currentViewRole?: 'teacher' | 'student', onUpdateActivities?: (activities: GoogleCourseWork[]) => void }) => {
  const [localRoleFilter, setLocalRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [localClassFilter, setLocalClassFilter] = useState<string>('all');

  const availableClasses = Array.from(new Set(appData.googleClassroomActivities?.map(a => a.courseName).filter(Boolean))) as string[];

  const filteredActivities = appData.googleClassroomActivities?.filter(act => {
    // Check role filter
    let roleMatch = true;
    if (localRoleFilter !== 'all') {
      if (act.role && act.role !== localRoleFilter) roleMatch = false;
    } else if (appData.role === 'both' && currentViewRole) {
      if (act.role && act.role !== currentViewRole) roleMatch = false;
    }
    
    if (!roleMatch) return false;

    // Check class filter
    if (localClassFilter !== 'all') {
      if (act.courseName !== localClassFilter) return false;
    }

    return true;
  });

  return (
    <>
      {!appData.googleSynced && (
        <section className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-50/50">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Sincronizar Workspace</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-manrope mb-3 leading-relaxed">Conecte sua conta do Google para acessar suas salas no Classroom e Agenda diretamente por aqui.</p>
              <button onClick={onSyncGoogle} disabled={isSyncingGoogle} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 flex items-center gap-2">
                {isSyncingGoogle && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isSyncingGoogle ? 'Sincronizando...' : 'Sincronizar Conta'}
              </button>
            </div>
          </div>
        </section>
      )}

/* Classroom Activities UI */
      <section className="glass-card rounded-3xl p-6 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-4 mb-6">
          <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" /> Atividades Recentes (Classroom)
            {appData.googleSynced && (
              <button 
                onClick={onSyncGoogle}
                disabled={isSyncingGoogle}
                title="Sincronizar com o Google"
                className={`ml-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isSyncingGoogle ? 'text-primary' : 'text-slate-400'}`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
              </button>
            )}
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {appData.googleSynced && availableClasses.length > 0 && (
              <select 
                value={localClassFilter} 
                onChange={(e) => setLocalClassFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary shadow-sm"
              >
                <option value="all">Todas as turmas</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {appData.role === 'both' && appData.googleSynced && (
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setLocalRoleFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${localRoleFilter === 'all' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Tudo
                </button>
                <button 
                  onClick={() => setLocalRoleFilter('student')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${localRoleFilter === 'student' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Aluno
                </button>
                <button 
                  onClick={() => setLocalRoleFilter('teacher')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${localRoleFilter === 'teacher' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Professor
                </button>
              </div>
            )}
          </div>
        </div>
        
        {appData.googleSynced ? (
          <div className="space-y-4">
            {filteredActivities && filteredActivities.length > 0 ? (
              filteredActivities.map(act => (
                <details key={act.id} className={`group/details p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 ${act.isCompletedLocal ? 'border-l-green-500 opacity-60' : act.isSoon ? 'border-l-red-500' : 'border-l-secondary'} cursor-pointer transition-all`}>
                  <summary className="flex items-center justify-between outline-none">
                    <div className="flex items-center gap-3">
                      {onUpdateActivities && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            const newActivities = appData.googleClassroomActivities!.map(a => 
                              a.id === act.id ? { ...a, isCompletedLocal: !a.isCompletedLocal } : a
                            );
                            onUpdateActivities(newActivities);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${act.isCompletedLocal ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                        >
                          {act.isCompletedLocal && <Check className="w-3 h-3" />}
                        </button>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold transition-colors ${act.isCompletedLocal ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100 group-open/details:text-primary'}`}>{act.title}</h4>
                          {appData.role === 'both' && act.role && (
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${act.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {act.role === 'teacher' ? 'Prof' : 'Aluno'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{act.courseName} {act.teacherName && `• ${act.teacherName}`}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className={`text-xs font-extrabold px-2 py-1 rounded-md ${act.isSoon ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>Até {act.dueDateStr}</span>
                    </div>
                  </summary>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 text-xs">
                    <p className="text-slate-500 dark:text-slate-400 mb-3"><span className="font-bold text-slate-700 dark:text-slate-300">Postado em:</span> {act.postDateStr}</p>
                    
                    {act.messages && act.messages.length > 0 ? (
                      <div className="space-y-2 mt-2 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                        <h5 className="font-bold text-[10px] uppercase text-slate-400 mb-2">Comentários da Turma</h5>
                        {act.messages.map(msg => (
                          <div key={msg.id} className="bg-slate-50 dark:bg-slate-900 rounded p-2">
                            <p className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">{msg.authorName}</p>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Nenhuma mensagem ou comentário.</p>
                    )}
                  </div>
                </details>
              ))
            ) : (
              <div className="text-center py-6 opacity-60">
                <p className="font-manrope text-sm font-bold">Nenhuma atividade pendente.</p>
              </div>
            )}
            <button onClick={() => { onShowNotification('Sincronizando novas atividades...'); onSyncGoogle(); }} className="w-full text-center text-[10px] font-bold text-primary uppercase mt-4 hover:underline">Atualizar Atividades</button>
          </div>
        ) : (
          <div className="text-center py-8 opacity-50">
            <Book className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="font-manrope text-sm font-bold">Sincronize para ver as atividades</p>
          </div>
        )}
      </section>

      {/* Calendar Events */}
      <section className="glass-card rounded-3xl p-6 relative overflow-hidden group">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" /> Próximos Agendamentos (Calendar)
        </h3>
        
        {appData.googleSynced ? (
          <div className="space-y-4">
            {appData.googleCalendarEvents && appData.googleCalendarEvents.length > 0 ? (
              appData.googleCalendarEvents.map((evt, idx) => (
                <div key={evt.id} className="flex items-center gap-4">
                  <div className={`flex flex-col items-center justify-center ${idx % 2 === 0 ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'} rounded-xl w-14 h-14 shrink-0`}>
                    <span className="text-xs font-bold uppercase">{evt.month}</span>
                    <span className="text-lg font-extrabold -mt-1">{evt.day}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{evt.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {evt.start}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 opacity-60">
                <p className="font-manrope text-sm font-bold">Nenhum evento futuro na agenda.</p>
              </div>
            )}
            <button onClick={() => { onShowNotification('Sincronizando agenda...'); onSyncGoogle(); }} className="w-full text-center text-[10px] font-bold text-secondary uppercase mt-4 hover:underline">Atualizar Agenda</button>
          </div>
        ) : (
          <div className="text-center py-8 opacity-50">
            <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="font-manrope text-sm font-bold">Sincronize para ver o mural da agenda</p>
          </div>
        )}
      </section>
    </>
  );
};

const QuickGradeDialog = ({ 
  isOpen, 
  onClose, 
  appData, 
  onShowNotification, 
  onUpdateClasses 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  appData: AppState, 
  onShowNotification: (msg: string) => void,
  onUpdateClasses?: (classes: ClassData[]) => void
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [evalBimester, setEvalBimester] = useState('1º Bimestre');
  const [pointsMap, setPointsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const classes = appData.classes || [];
      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id);
      }
    }
  }, [isOpen, appData.classes, selectedClassId]);

  useEffect(() => {
    // Populate points map when activity or class changes
    const classes = appData.classes || [];
    const activeClass = classes.find(c => c.id === selectedClassId);
    const students = activeClass?.students || [];
    const newPointsMap: Record<string, string> = {};
    
    if (selectedActivity.trim()) {
      students.forEach(student => {
        const existingEval = student.evaluations?.find(e => e.method === selectedActivity.trim() && e.bimester === evalBimester);
        if (existingEval) {
          newPointsMap[student.id] = String(existingEval.points);
        }
      });
    }
    setPointsMap(newPointsMap);
  }, [selectedClassId, selectedActivity, evalBimester, appData.classes]);

  if (!isOpen) return null;

  const classes = appData.classes || [];
  const activeClass = classes.find(c => c.id === selectedClassId);
  const students = [...(activeClass?.students || [])].sort((a, b) => a.name.localeCompare(b.name));

  const handleApplyGrades = () => {
    if (!activeClass || !selectedActivity.trim() || !onUpdateClasses) {
      onShowNotification("Preencha a atividade e selecione uma turma.");
      return;
    }

    let updatedCount = 0;
    const newStudents = students.map(student => {
      const pointsStr = pointsMap[student.id];
      const activityName = selectedActivity.trim();
      let newEvaluations = [...(student.evaluations || [])];
      
      const existingEvalIndex = newEvaluations.findIndex(e => e.method === activityName && e.bimester === evalBimester);

      if (pointsStr !== undefined && pointsStr.trim() !== '') {
        const points = Number(pointsStr);
        if (!isNaN(points)) {
          if (existingEvalIndex >= 0) {
            if (newEvaluations[existingEvalIndex].points !== points) {
              newEvaluations[existingEvalIndex] = { ...newEvaluations[existingEvalIndex], points };
              updatedCount++;
            }
          } else {
            newEvaluations.push({
              id: crypto.randomUUID(),
              method: activityName,
              points,
              date: new Date().toISOString(),
              bimester: evalBimester
            });
            updatedCount++;
          }
        }
      } else {
        // If empty, remove it if it existed
        if (existingEvalIndex >= 0) {
          newEvaluations.splice(existingEvalIndex, 1);
          updatedCount++;
        }
      }

      return {
        ...student,
        evaluations: newEvaluations
      };
    });

    if (updatedCount === 0) {
      onShowNotification("Nenhuma alteração de nota.");
      onClose();
      return;
    }

    const newClasses = classes.map(c => 
      c.id === activeClass.id ? { ...c, students: newStudents } : c
    );
    
    onUpdateClasses(newClasses);
    onShowNotification(`${updatedCount} nota(s) atualizada(s) com sucesso!`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="w-full max-w-md bg-white dark:bg-[#1a1b21] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Lançamento de Notas
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Turma</label>
              <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bimestre</label>
              <select value={evalBimester} onChange={e => setEvalBimester(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer transition-colors shadow-sm">
                <option value="1º Bimestre">1º Bimestre</option>
                <option value="2º Bimestre">2º Bimestre</option>
                <option value="3º Bimestre">3º Bimestre</option>
                <option value="4º Bimestre">4º Bimestre</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Atividade (Ex: Prova 1)</label>
              <input list="quick-activities" type="text" value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} placeholder="Nome da atividade" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold transition-colors shadow-sm" />
              <datalist id="quick-activities">
                {appData.googleClassroomActivities?.map(a => <option key={a.id} value={a.title} />)}
              </datalist>
            </div>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Notas dos Alunos (vazio p/ ignorar)</label>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 pb-2">
                {students.map(student => (
                  <div key={student.id} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2 flex-1">{student.name.toUpperCase()}</span>
                      <input 
                        type="number" 
                        placeholder="0.0" 
                        value={pointsMap[student.id] || ''} 
                        onChange={e => setPointsMap({...pointsMap, [student.id]: e.target.value})}
                        className="w-20 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-primary shrink-0" 
                      />
                    </div>
                    {student.evaluations && student.evaluations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 text-xs flex flex-wrap gap-1">
                        {student.evaluations.map(ev => (
                           <span key={ev.id} className="bg-primary/5 border border-primary/10 text-primary px-2 py-0.5 rounded font-medium max-w-full truncate">
                             {ev.bimester.split(' ')[0]} - {ev.method}: <span className="font-bold">{ev.points} pts</span>
                           </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhum aluno nesta turma.</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800">
            <button onClick={handleApplyGrades} className="w-full primary-gradient text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest">
              Lançar Notas
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const TeacherDashboard = ({ onNavigate, onNewOccurrence, appData, onShowNotification, onSyncGoogle, isSyncingGoogle, onUpdateActivities, onUpdateClasses }: { onNavigate: (screen: Screen) => void, onNewOccurrence: () => void, appData: AppState, onShowNotification: (msg: string) => void, onSyncGoogle: () => void, isSyncingGoogle?: boolean, onUpdateActivities?: (activities: GoogleCourseWork[]) => void, onUpdateClasses?: (classes: ClassData[]) => void }) => {
  const allStudents = (appData.classes || []).flatMap(c => c.students) || [];
  const totalStudents = allStudents.length;
  
  const presentOrLate = allStudents.filter(s => s.status === 'present' || s.status === 'late').length;
  const missingStudents = allStudents.filter(s => s.status === 'absent').length;
  const criticalOccurrences = appData.occurrences.filter(o => o.status === 'critical').length;
  const evasionRiskCount = missingStudents + criticalOccurrences;
  
  const studentsWithActivity = new Set(appData.occurrences.map(o => o.studentId)).size;

  const attendancePercent = totalStudents > 0 
    ? Math.round((presentOrLate / totalStudents) * 100) 
    : 0;
    
  const activityPercent = totalStudents > 0
    ? Math.round((studentsWithActivity / totalStudents) * 100)
    : 0;

  // Circle stroke math (226 is typical for r=36)
  const attendanceOffset = 226 - (226 * attendancePercent) / 100;
  const activityOffset = 226 - (226 * activityPercent) / 100;

  const totalClasses = (appData.classes || []).length;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const recentOccurrencesCount = appData.occurrences.filter(o => new Date(o.date) >= oneMonthAgo).length;

  return (
    <div className="space-y-6 pb-24">
      
      <GoogleIntegrationBlocks appData={appData} onSyncGoogle={onSyncGoogle} isSyncingGoogle={isSyncingGoogle} onShowNotification={onShowNotification} onUpdateActivities={onUpdateActivities} />

      {/* Quick Actions (Ações Rápidas) */}
      <section className="grid grid-cols-1 gap-3">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('studentsHub')}
          className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Central do Aluno</span>
        </motion.button>
      </section>

      {/* Resumo Geral */}
      <section className="grid grid-cols-3 gap-3">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('classes')}
          className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <Book className="w-5 h-5 text-primary mb-2" />
          <span className="text-2xl font-extrabold text-[#1a1b21] dark:text-slate-50">{totalClasses}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Turmas</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('classes')}
          className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <Users className="w-5 h-5 text-secondary mb-2" />
          <span className="text-2xl font-extrabold text-[#1a1b21] dark:text-slate-50">{totalStudents}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Alunos</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('reports')}
          className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <FileText className="w-5 h-5 text-amber-500 mb-2" />
          <span className="text-2xl font-extrabold text-[#1a1b21] dark:text-slate-50">{recentOccurrencesCount}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Ocorrências<br/>(30 dias)</span>
        </motion.button>
      </section>

      {/* Next Class */}
      <section className="glass-card rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Book className="w-32 h-32" />
        </div>
        <span className="text-[11px] font-extrabold text-secondary uppercase tracking-[0.2em] mb-2 block">PRÓXIMA AULA</span>
        <h2 className="text-2xl font-bold text-primary mb-4">{(appData.classes || [])[0]?.name || 'Adicione uma turma'}</h2>
        <div className="flex flex-wrap gap-4 text-slate-500 dark:text-slate-400 text-sm mb-6 font-manrope">
          <div className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>08:45 — 10:15</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded-lg">
            <MapPin className="w-4 h-4" />
            <span>Lab 402</span>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('materials')}
          className="w-full primary-gradient text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm mt-4"
        >
          Preparar Materiais
        </motion.button>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('attendance')}
          className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/40 dark:bg-slate-800/40 active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <UserCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1a1b21] dark:text-slate-50">Chamada</span>
        </button>
        <button 
          onClick={() => onNavigate('agenda')}
          className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/40 dark:bg-slate-800/40 active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1a1b21] dark:text-slate-50">Agenda</span>
        </button>
      </div>

      {/* AI Insights */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h3 className="text-sm font-extrabold uppercase tracking-widest">Insights da IA</h3>
        </div>
        <div className="flex overflow-x-auto gap-4 py-2 no-scrollbar px-1">
          <div className={`min-w-[280px] p-4 rounded-2xl flex gap-4 border ${evasionRiskCount > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            <TriangleAlert className={`w-6 h-6 shrink-0 ${evasionRiskCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <div>
              <p className={`text-xs font-extrabold uppercase ${evasionRiskCount > 0 ? 'text-red-800' : 'text-green-800'}`}>Risco de Evasão</p>
              <p className={`text-sm font-manrope leading-tight mt-1 ${evasionRiskCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {evasionRiskCount > 0 ? `${evasionRiskCount} alunos apresentam faltas ou ocorrências críticas.` : 'Nenhum aluno em risco detectado.'}
              </p>
            </div>
          </div>
          <div className={`min-w-[280px] p-4 rounded-2xl flex gap-4 border ${appData.occurrences.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'}`}>
            <FileText className={`w-6 h-6 shrink-0 ${appData.occurrences.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <div>
              <p className={`text-xs font-extrabold uppercase ${appData.occurrences.length > 0 ? 'text-amber-800' : 'text-slate-600 dark:text-slate-300'}`}>
                Relatório Pronto
              </p>
              <p className={`text-sm font-manrope leading-tight mt-1 ${appData.occurrences.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                {appData.occurrences.length > 0 ? `${appData.occurrences.length} ocorrências registradas para revisão.` : 'Nenhum dado de ocorrências recente para relatório.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Summary */}
      <section className="glass-card rounded-3xl p-6">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2">Engajamento das Turmas</h3>
        <div className="flex justify-around items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border-8 border-primary/20 flex items-center justify-center relative group">
              <span className="text-lg font-bold text-primary">{attendancePercent}%</span>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#00236f" strokeWidth="8" strokeDasharray="226" strokeDashoffset={attendanceOffset} />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Presença</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border-8 border-secondary/20 flex items-center justify-center relative">
              <span className="text-lg font-bold text-secondary">{activityPercent}%</span>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#712ae2" strokeWidth="8" strokeDasharray="226" strokeDashoffset={activityOffset} />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Atividades</span>
          </div>
        </div>
      </section>
    </div>
  );
};

const StudentDashboard = ({ appData, onShowNotification, onSyncGoogle, isSyncingGoogle, onNavigate, onUpdateActivities }: { appData: AppState, onShowNotification: (msg: string) => void, onSyncGoogle: () => void, isSyncingGoogle?: boolean, onNavigate: (screen: Screen) => void, onUpdateActivities?: (activities: GoogleCourseWork[]) => void }) => {
  return (
    <div className="space-y-6 pb-24">
      <GoogleIntegrationBlocks appData={appData} onSyncGoogle={onSyncGoogle} isSyncingGoogle={isSyncingGoogle} onShowNotification={onShowNotification} currentViewRole="student" onUpdateActivities={onUpdateActivities} />
    </div>
  );
};

const DashboardScreen = ({ onNavigate, onNewOccurrence, appData, onShowNotification, onSyncGoogle, isSyncingGoogle, currentViewRole, onToggleViewRole, onUpdateActivities, onUpdateClasses }: { onNavigate: (screen: Screen) => void, onNewOccurrence: () => void, appData: AppState, onShowNotification: (msg: string) => void, onSyncGoogle: () => void, isSyncingGoogle?: boolean, currentViewRole: 'teacher' | 'student', onToggleViewRole: (r: 'teacher' | 'student') => void, onUpdateActivities?: (activities: GoogleCourseWork[]) => void, onUpdateClasses?: (classes: ClassData[]) => void }) => {
  return (
    <div className="space-y-6">
      {currentViewRole === 'student' ? (
        <StudentDashboard appData={appData} onShowNotification={onShowNotification} onSyncGoogle={onSyncGoogle} isSyncingGoogle={isSyncingGoogle} onNavigate={onNavigate} onUpdateActivities={onUpdateActivities} />
      ) : (
        <TeacherDashboard onNavigate={onNavigate} onNewOccurrence={onNewOccurrence} appData={appData} onShowNotification={onShowNotification} onSyncGoogle={onSyncGoogle} isSyncingGoogle={isSyncingGoogle} onUpdateActivities={onUpdateActivities} onUpdateClasses={onUpdateClasses} />
      )}
    </div>
  );
};

const StudentsHubScreen = ({ onNavigate, onOpenGrades }: { onNavigate: (screen: Screen) => void, onOpenGrades: () => void }) => {
  const actions = [
    { id: 'attendance', label: 'Frequência', icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { id: 'boletim', label: 'Boletim', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'grades', label: 'Lançar Notas', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', action: onOpenGrades },
    { id: 'reports', label: 'Relatórios', icon: LayoutDashboard, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'occurrence', label: 'Advertência', icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 'classes', label: 'Turmas/Alunos', icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
  ];

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Central do Aluno</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">Acesse as ferramentas focadas no aluno.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {actions.map((act) => (
          <motion.button
            key={act.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (act.action) {
                act.action();
              } else {
                onNavigate(act.id as Screen);
              }
            }}
            className="flex flex-col items-center justify-center p-6 glass-card rounded-[2rem] hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md gap-4"
          >
            <div className={`w-20 h-20 rounded-full ${act.bg} ${act.border} border-2 flex items-center justify-center`}>
              <act.icon className={`w-10 h-10 ${act.color}`} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide text-center">{act.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Reusable Badge for Special Needs
const SpecialNeedBadge = ({ type }: { type: string, key?: any }) => {
  const configs: Record<string, { label: string, bg: string, text: string, icon: string }> = {
    'TEA': { label: 'TEA', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: '🧩' },
    'DI': { label: 'DI', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: '🧠' },
    'DEF': { label: 'DEF', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: '♿' },
    'OUT': { label: 'OUT', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', icon: '✨' },
  };

  const config = configs[type] || configs['OUT'];

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-tighter ${config.bg} ${config.text} border border-current/10 shadow-sm animate-pulse`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

const AttendanceScreen = ({ onSelectStudent, classes, onFinish, onUpdateStatus }: { onSelectStudent: (id: string) => void, classes: ClassData[], onFinish: () => void, onUpdateStatus: (classId: string, studentId: string, date: string, status: 'present' | 'absent' | 'late' | 'none') => void }) => {
  const getDayName = (dayIndex: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayIndex];
  };

  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);

  const selectedDateObj = new Date(attendanceDate + 'T12:00:00');
  const selectedDayName = getDayName(selectedDateObj.getDay());
  const isSelectedToday = attendanceDate === new Date().toISOString().split('T')[0];

  const today = new Date();
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentTimeShort = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  // Prioritize classes that happen on selected day
  const sortedClasses = [...classes].sort((a, b) => {
    const aIsSelectedDay = a.schedule?.days?.some(d => d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)));
    const bIsSelectedDay = b.schedule?.days?.some(d => d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)));

    if (aIsSelectedDay && !bIsSelectedDay) return -1;
    if (!aIsSelectedDay && bIsSelectedDay) return 1;

    if (aIsSelectedDay && bIsSelectedDay && a.schedule && b.schedule) {
      const aStarts = a.schedule.startTime;
      const bStarts = b.schedule.startTime;
      return aStarts.localeCompare(bStarts);
    }
    return 0;
  });

  const [activeClassId, setActiveClassId] = useState<string | null>(sortedClasses[0]?.id || null);

  // Keep track of activeClassId with a stable default when sortedClasses changes
  useEffect(() => {
    // If the currently selected class is not for the selected day, but there IS a class for the selected day, switch to it.
    const hasClassForDay = sortedClasses.some(c => c.schedule?.days?.some(d => d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3))));
    const activeClassIsForDay = classes.find(c => c.id === activeClassId)?.schedule?.days?.some(d => d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)));
    
    if (hasClassForDay && !activeClassIsForDay) {
      setActiveClassId(sortedClasses[0]?.id || null);
    }
  }, [attendanceDate, selectedDayName]);

  const [searchQuery, setSearchQuery] = useState('');
  
  const activeClass = classes.find(c => c.id === activeClassId);
  const students = activeClass?.students || [];

  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

  const filteredStudents = sortedStudents.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStudentStatus = (student: Student) => {
    return student.attendanceHistory?.[attendanceDate] || 'none';
  };

  const presentCount = students.filter(s => getStudentStatus(s) === 'present').length;
  const exceptionCount = students.filter(s => getStudentStatus(s) !== 'present' && getStudentStatus(s) !== 'none').length;

  return (
    <div className="space-y-6 pb-24 overflow-x-hidden">
      <div className="flex justify-between items-end mb-4">
        <div>
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Selecione a Turma</label>
          <select 
            value={activeClassId || ''}
            onChange={e => {setActiveClassId(e.target.value); setSearchQuery('');}}
            className="text-xl font-bold text-primary bg-transparent outline-none cursor-pointer border-b-2 border-primary/20 pb-1 pr-6"
          >
            {sortedClasses.map(c => {
              const isTargetDay = c.schedule?.days?.some(d => d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)));
              return (
                <option key={c.id} value={c.id}>
                  {isTargetDay ? '⭐ ' : ''}{c.name} {isTargetDay ? (isSelectedToday ? '(Hoje)' : `(${selectedDayName})`) : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-primary text-xs font-bold relative">
          <Calendar className="w-4 h-4 shrink-0" />
          <input 
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-primary font-manrope uppercase cursor-pointer max-w-[120px]"
          />
        </div>
      </div>

      {/* Selected Day's Schedule Quick Rail */}
      {sortedClasses.filter(c => c.schedule?.days?.some(d => d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)))).length > 0 && (
        <div className="space-y-2">
           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
             <Sparkles className="w-3 h-3 text-amber-500" /> Aulas de {isSelectedToday ? 'Hoje' : selectedDayName}
           </h4>
           <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth no-scrollbar">
              {sortedClasses.filter(c => c.schedule?.days?.some(d => d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)))).map(c => (
                 <button
                    key={c.id}
                    onClick={() => { setActiveClassId(c.id); setSearchQuery(''); }}
                    className={`shrink-0 px-4 py-3 rounded-2xl border-2 transition-all flex flex-col gap-1 min-w-[140px] ${
                       activeClassId === c.id 
                       ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                       : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/30'
                    }`}
                 >
                    <span className="font-bold text-sm truncate">{c.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter opacity-70 flex items-center gap-1`}>
                       <Clock className="w-3 h-3" /> {c.schedule?.startTime} - {c.schedule?.endTime}
                    </span>
                 </button>
              ))}
           </div>
        </div>
      )}

      {activeClass?.schedule?.days?.length ? (
        <div className="glass-card p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" /> Agenda Recorrente:
          </p>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {activeClass.schedule.days.join(', ')} • {activeClass.schedule.startTime} às {activeClass.schedule.endTime}
          </p>
        </div>
      ) : null}

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar aluno pelo nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-primary pl-12 pr-4 py-3 rounded-2xl font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 rounded-xl text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
          <p className="text-xl font-bold text-primary">{students.length}</p>
        </div>
        <div className="glass-card p-3 rounded-xl text-center border-b-2 border-primary">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Presentes</p>
          <p className="text-xl font-bold text-primary">{presentCount}</p>
        </div>
        <div className="glass-card p-3 rounded-xl text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Exceções</p>
          <p className="text-xl font-bold text-secondary">{exceptionCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-manrope">Nenhum aluno encontrado{searchQuery ? ' para a busca' : ' nesta turma'}.</div>
        ) : filteredStudents.map((student) => {
          const currentStatus = getStudentStatus(student);
          return (
          <motion.div 
            key={student.id} 
            layout
            className={`glass-card p-4 rounded-2xl flex items-center justify-between group hover:shadow-lg transition-all duration-300 border-l-4 ${
              currentStatus === 'absent' ? 'border-red-500' : 
              currentStatus === 'late' ? 'border-amber-500' : 'border-transparent'
            }`}
          >
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => onSelectStudent(student.id)}
            >
              <div className="relative">
                {student.avatar && student.avatar.trim() !== '' ? (
                  <img src={student.avatar} alt={student.name} className={`w-12 h-12 rounded-full border-2 border-white ring-2 ring-slate-100 ${currentStatus === 'absent' ? 'grayscale opacity-50' : ''}`} />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                )}
                {currentStatus === 'present' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {currentStatus === 'absent' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <X className="w-3 h-3 text-white" />
                  </div>
                )}
                {currentStatus === 'late' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="font-manrope">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{student.name.toUpperCase()}</h3>
                  <div className="flex gap-1">
                    {student.specialNeeds?.map(need => (
                      <SpecialNeedBadge key={need} type={need} />
                    ))}
                  </div>
                </div>
                <p className={`text-[11px] font-extrabold uppercase ${
                  currentStatus === 'absent' ? 'text-red-500' : 
                  currentStatus === 'late' ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {currentStatus === 'present' ? `Presente` : 
                   currentStatus === 'absent' ? 'Falta' : 
                   currentStatus === 'late' ? `Atraso (${student.offset || '15 min'})` : `Vazio`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 shrinks-0">
              {currentStatus !== 'present' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(activeClassId!, student.id, attendanceDate, 'present'); }}
                  className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
              {currentStatus !== 'absent' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(activeClassId!, student.id, attendanceDate, 'absent'); }}
                  className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <Ban className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        )})}
      </div>

      <button onClick={onFinish} className="fixed bottom-24 right-6 primary-gradient text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3 active:scale-95 transition-all z-40 hover:shadow-primary/30">
        <Check className="w-6 h-6 stroke-[3px]" />
        <span className="text-xs font-extrabold uppercase tracking-widest">Finalizar Chamada</span>
      </button>
    </div>
  );
};

const OccurrenceScreen = ({ student, occurrences, onSave, onCancel, classes, onSelectStudent }: { student?: Student, occurrences: Occurrence[], onSave: (occ: Omit<Occurrence, 'id'>) => void, onCancel: () => void, classes?: ClassData[], onSelectStudent?: (id: string) => void }) => {
  const [tab, setTab] = useState<'new' | 'history' | 'charts'>('new');
  const [activeStatus, setActiveStatus] = useState<'praise' | 'attention' | 'critical'>('attention');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'praise' | 'attention' | 'critical'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tagsList = ['Falta de Material', 'Conversa Paralela', 'Desempenho Extraordinário', 'Conflito entre Pares', 'Uso de Celular'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (!student) return;
    onSave({
      studentId: student.id,
      date: new Date().toISOString(),
      status: activeStatus,
      tags: selectedTags,
      notes,
      justification,
      meetingReminderDate: meetingDate,
      meetingReminderTime: meetingTime,
      attachmentUrl
    });
  };
  
  const [studentSearch, setStudentSearch] = useState('');
  const [activeClassId, setActiveClassId] = useState<string | null>(classes?.[0]?.id || null);

  if (!student && classes && onSelectStudent) {
    const activeClass = classes.find(c => c.id === activeClassId);
  const studentsToShow = [...(activeClass?.students || [])].sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="space-y-6 pb-24">
        <div>
          <h2 className="text-2xl font-bold text-primary">Nova Advertência</h2>
          <p className="text-sm text-slate-500 font-manrope">Selecione o aluno para registrar a ocorrência.</p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Turma</label>
            <select 
              value={activeClassId || ''}
              onChange={e => {setActiveClassId(e.target.value); setStudentSearch('');}}
              className="w-full text-lg font-bold text-primary bg-transparent outline-none cursor-pointer border-b-2 border-primary/20 pb-1 pr-6"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Ou busque aluno pelo nome..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-primary pl-12 pr-4 py-3 rounded-2xl font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
          />
        </div>

        <div className="space-y-2 pt-2">
           {studentsToShow.length === 0 ? (
              <p className="text-center py-12 text-slate-400 font-manrope">Nenhum aluno encontrado.</p>
           ) : (
              <div className="glass-card p-4 rounded-xl">
                 <div className="space-y-1">
                    {studentsToShow.map(s => (
                       <div key={s.id} onClick={() => onSelectStudent(s.id)} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors group">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                             {s.avatar ? <img src={s.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : <UserCheck className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{s.name.toUpperCase()}</p>
                            <p className="text-xs text-slate-400">{s.grade || (activeClass?.name)} • Toque para selecionar</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-primary transition-colors" />
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Student context */}
      <section className="glass-card rounded-2xl p-6 flex items-center gap-4">
        {student?.avatar && student.avatar.trim() !== '' ? (
          <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-slate-300" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-primary">{student?.name?.toUpperCase() || 'ALUNO'}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student?.grade || 'Turma'} • Sala {student?.room || 'N/A'}</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button 
          onClick={() => setTab('new')}
          className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${tab === 'new' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
        >
          Registrar
        </button>
        <button 
          onClick={() => setTab('history')}
          className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${tab === 'history' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
        >
          Histórico
        </button>
        <button 
          onClick={() => setTab('charts')}
          className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${tab === 'charts' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
        >
          Desempenho
        </button>
      </div>

      {tab === 'new' && (
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
          {/* Status */}
          <section className="space-y-3 mb-6">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1">Status da Ocorrência</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setActiveStatus('praise')}
                className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border-b-4 ${activeStatus === 'praise' ? 'border-green-500 bg-green-50/20' : 'border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50'}`}
              >
                <Smile className={`w-10 h-10 ${activeStatus === 'praise' ? 'text-green-600 fill-green-600/10' : 'text-slate-300'}`} />
                <span className={`text-[10px] font-bold uppercase ${activeStatus === 'praise' ? 'text-green-700' : 'text-slate-400'}`}>Elogio</span>
              </button>
              <button 
                onClick={() => setActiveStatus('attention')}
                className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border-b-4 ${activeStatus === 'attention' ? 'border-amber-500 bg-amber-50/20' : 'border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50'}`}
              >
                <TriangleAlert className={`w-10 h-10 ${activeStatus === 'attention' ? 'text-amber-600 fill-amber-600/10' : 'text-slate-300'}`} />
                <span className={`text-[10px] font-bold uppercase ${activeStatus === 'attention' ? 'text-amber-700' : 'text-slate-400'}`}>Atenção</span>
              </button>
              <button 
                onClick={() => setActiveStatus('critical')}
                className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border-b-4 ${activeStatus === 'critical' ? 'border-red-500 bg-red-50/20' : 'border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50'}`}
              >
                <AlertOctagon className={`w-10 h-10 ${activeStatus === 'critical' ? 'text-red-600 fill-red-600/10' : 'text-slate-300'}`} />
                <span className={`text-[10px] font-bold uppercase ${activeStatus === 'critical' ? 'text-red-700' : 'text-slate-400'}`}>Crítico</span>
              </button>
            </div>
          </section>

          {/* Tags */}
          <section className="glass-card rounded-2xl p-6 space-y-6 mb-6">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">Categorias Rápidas</h3>
            <div className="flex flex-wrap gap-2">
              {tagsList.map((tag) => (
                <span 
                  key={tag} 
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all ${
                    selectedTags.includes(tag) ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais / Justificativa detalhada do professor..." 
              className="w-full bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 p-0 py-4 text-sm resize-none font-manrope"
              rows={3}
            />
          </section>

          {/* Evidence */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1">Anexos e Evidências</h3>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="glass-card rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-700 h-32 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40 active:scale-95 transition-all overflow-hidden relative"
            >
              {attachmentUrl ? (
                <div className="absolute inset-0 w-full h-full">
                  <img src={attachmentUrl} alt="Evidência" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Trocar</span>
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold text-slate-400 group-hover:text-primary uppercase tracking-widest">Toque para Anexar Foto ou Arquivo</span>
                </>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} />
          </section>

          {/* Meeting Reminder */}
          <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Agendar Reunião com Responsável
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data</label>
                <input 
                  type="date" 
                  value={meetingDate} 
                  onChange={e => setMeetingDate(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hora</label>
                <input 
                  type="time" 
                  value={meetingTime} 
                  onChange={e => setMeetingTime(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </section>

          <button onClick={handleSave} className="fixed bottom-24 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:ml-[340px] primary-gradient text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all z-40 hover:shadow-primary/40">
            <Save className="w-6 h-6" />
            <span className="text-xs font-extrabold uppercase tracking-widest hidden sm:inline">Finalizar Ocorrência</span>
          </button>
        </motion.div>
      )}

      {tab === 'history' && (
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-4 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
             {['all', 'praise', 'attention', 'critical'].map(f => (
               <button 
                 key={f} 
                 onClick={() => setHistoryFilter(f as any)} 
                 className={`px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all ${historyFilter === f ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
               >
                 {f === 'all' ? 'Todos' : f === 'praise' ? 'Elogios' : f === 'attention' ? 'Atenção' : 'Críticos'}
               </button>
             ))}
          </div>
          
          {occurrences.filter((o) => historyFilter === 'all' || o.status === historyFilter).length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-manrope text-sm bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-slate-700/50">
              Nenhuma ocorrência encontrada para este filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {occurrences.filter((o) => historyFilter === 'all' || o.status === historyFilter).slice().reverse().map((occ) => (
                 <div key={occ.id} className={`glass-card p-4 rounded-2xl border-l-4 ${occ.status === 'critical' ? 'border-red-500' : occ.status === 'attention' ? 'border-amber-500' : 'border-green-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${occ.status === 'critical' ? 'text-red-500' : occ.status === 'attention' ? 'text-amber-500' : 'text-green-500'}`}>
                        {occ.status === 'critical' ? 'CRÍTICO' : occ.status === 'attention' ? 'ATENÇÃO' : 'ELOGIO'}
                      </span>
                      <span className="text-xs text-slate-400 font-manrope font-medium">{new Date(occ.date).toLocaleDateString()}</span>
                    </div>
                    {occ.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {occ.tags.map(t => <span key={t} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{t}</span>)}
                      </div>
                    )}
                    {occ.notes && (
                      <p className="text-sm font-manrope text-slate-600 mt-2 bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">{occ.notes}</p>
                    )}
                    {occ.justification && (
                      <p className="text-xs font-manrope text-slate-500 mt-2 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">Justificativa: {occ.justification}</p>
                    )}
                    {occ.attachmentUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden max-h-32">
                        <img src={occ.attachmentUrl} alt="Anexo" className="w-full object-cover" />
                      </div>
                    )}
                    {(occ.meetingReminderDate || occ.meetingReminderTime) && (
                      <div className="mt-2 text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 w-fit px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        Reunião: {occ.meetingReminderDate} às {occ.meetingReminderTime}
                      </div>
                    )}
                 </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === 'charts' && (
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-4 pt-2 pb-12">
          <div className="glass-card p-4 rounded-2xl">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1 flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" /> Evolução de Notas
            </h3>
            {student?.evaluations && student.evaluations.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    [...student.evaluations].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ev => ({
                      name: ev.method.substring(0, 10),
                      nota: ev.points,
                      bimester: ev.bimester
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{fontSize: 10}} tickMargin={10} stroke="#94a3b8" />
                    <YAxis tick={{fontSize: 10}} stroke="#94a3b8" domain={[0, 'dataMax']} />
                    <RechartsTooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}}
                      labelStyle={{fontWeight: 'bold', color: '#1e293b'}}
                    />
                    <Line type="monotone" dataKey="nota" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 font-manrope text-sm bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-slate-700/50">
                Nenhuma nota lançada para criar o gráfico.
              </div>
            )}
          </div>
          
          <div className="glass-card p-4 rounded-2xl">
             <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1 mb-4">Estatísticas</h3>
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Média Geral</p>
                   <p className="text-2xl font-extrabold text-primary">
                     {student?.evaluations?.length ? (student.evaluations.reduce((acc, curr) => acc + curr.points, 0) / student.evaluations.length).toFixed(1) : '0.0'}
                   </p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Total Ocorrências</p>
                   <p className="text-2xl font-extrabold text-amber-500">
                     {occurrences.length}
                   </p>
                 </div>
             </div>
          </div>
        </motion.div>
      )}

    </div>
  );
};

const AgendaScreen = ({ appData, onShowNotification, onSyncGoogle, isSyncingGoogle, onSaveEvent }: { appData: AppState, onShowNotification: (msg: string) => void, onSyncGoogle: () => void, isSyncingGoogle?: boolean, onSaveEvent: (e: GoogleEvent) => void }) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const isSelectedDate = (day: number | null) => {
    if (!day) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentDate.getMonth() && 
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const handleDateClick = (day: number | null) => {
    if (day) {
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      if (viewMode === 'week') setViewMode('day');
    }
  };

  const handleAddEvent = () => {
    if (!newEventTitle || !newEventTime) {
      onShowNotification('Preencha título e horário.');
      return;
    }
    
    const [hours, minutes] = newEventTime.split(':').map(Number);
    const eventDate = new Date(selectedDate);
    eventDate.setHours(hours, minutes, 0, 0);

    onSaveEvent({
      id: 'local_' + Date.now(),
      title: newEventTitle,
      start: newEventTime,
      month: monthNames[selectedDate.getMonth()].substring(0, 3).toUpperCase(),
      day: selectedDate.getDate().toString().padStart(2, '0'),
      isCustom: true,
      dateIso: eventDate.toISOString(),
      syncedToGoogle: false
    });
    setShowEventForm(false);
    setNewEventTitle('');
    setNewEventTime('');
    onShowNotification('Lembrete salvo com sucesso!');
  };

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const filteredEvents = appData.googleCalendarEvents?.filter(event => {
    if (!event.dateIso) {
      // Falback se não houver dateIso
      if (viewMode === 'day') {
        const d = selectedDate.getDate().toString();
        const dPad = d.padStart(2, '0');
        return event.day === d || event.day === dPad;
      }
      return true; // no week mode fallback
    }
    const evDate = new Date(event.dateIso);
    if (viewMode === 'day') {
      return evDate.getDate() === selectedDate.getDate() && 
             evDate.getMonth() === selectedDate.getMonth() &&
             evDate.getFullYear() === selectedDate.getFullYear();
    } else {
      // Week mode
      return evDate >= startOfWeek && evDate <= endOfWeek;
    }
  }) || [];

  const formattedSelectedDate = `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-2xl font-bold text-primary">Agenda Escolar</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">
          {viewMode === 'day' ? formattedSelectedDate : `${selectedDate.getDate()} - ${selectedDate.getDate() + 6} de ${monthNames[selectedDate.getMonth()]}`}
        </p>
      </div>

      <div className="flex items-center gap-2 glass-card p-1 rounded-2xl w-fit mb-4">
        <button 
          onClick={() => setViewMode('day')}
          className={`px-8 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'day' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          Dia
        </button>
        <button 
          onClick={() => setViewMode('week')}
          className={`px-8 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          Semana
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <div className="flex gap-4">
                <ChevronLeft onClick={prevMonth} className="w-5 h-5 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                <ChevronRight onClick={nextMonth} className="w-5 h-5 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-4 text-center font-manrope">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
                <span key={`header-${idx}`} className="text-[10px] font-extrabold text-slate-300">{d}</span>
              ))}
              {days.map((d, idx) => (
                <span 
                  key={`day-${idx}`} 
                  onClick={() => handleDateClick(d)}
                  className={`text-sm py-1.5 font-bold transition-all ${d ? 'cursor-pointer' : ''} ${isSelectedDate(d) ? 'bg-primary text-white rounded-full shadow-sm' : 'text-slate-400 hover:text-primary'}`}
                >
                  {d || ''}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-secondary flex flex-col gap-1 shadow-sm">
            {appData.googleSynced ? (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="flex items-center gap-2 text-secondary mb-1">
                    <Check className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Sincronizado</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-manrope">Agenda atualizada</p>
                </div>
                <button 
                  onClick={onSyncGoogle}
                  disabled={isSyncingGoogle}
                  title="Sincronizar com o Google"
                  className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isSyncingGoogle ? 'text-secondary' : 'text-slate-400'}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Google Agenda</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 font-manrope">Não sincronizado</p>
                </div>
                <button onClick={onSyncGoogle} disabled={isSyncingGoogle} className="text-[10px] bg-secondary text-white font-bold px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2">
                  {isSyncingGoogle && <RefreshCw className="w-3 h-3 animate-spin"/>}
                  {isSyncingGoogle ? 'Sinc.' : 'Sincronizar'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {viewMode === 'day' ? (
            appData.googleSynced && appData.googleCalendarEvents ? (
              filteredEvents.length > 0 ? (
                filteredEvents.sort((a,b) => (a.start||"").localeCompare(b.start||"")).map((event, i) => (
                  <div key={event.id || i} className="flex gap-6 items-start group">
                    <span className="text-[11px] font-extrabold text-slate-400 w-10 pt-4 font-manrope">{event.start}</span>
                    <div className="flex-1">
                      <motion.div 
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={`glass-card p-5 rounded-2xl border-l-4 ${event.isCustom && !event.syncedToGoogle ? 'border-amber-500' : (i % 2 === 0 ? 'border-primary' : 'border-secondary')} shadow-sm hover:shadow-md transition-all cursor-pointer relative`}
                      >
                        {event.isCustom && !event.syncedToGoogle && (
                          <div className="absolute top-2 right-2 text-[8px] uppercase tracking-widest font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Não Sincronizado</div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="font-manrope">
                            <h4 className={`text-sm font-bold ${event.isCustom && !event.syncedToGoogle ? 'text-amber-600' : (i % 2 === 0 ? 'text-primary' : 'text-secondary')}`}>{event.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">{event.day} de {event.month}</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 opacity-60">
                  <p className="font-manrope text-sm font-bold">Nenhum evento na agenda neste dia.</p>
                </div>
              )
            ) : (
              [
                { time: '08:00', title: 'Exemplo: Matemática Avançada', desc: 'Turma 102-B • Lab 04', color: 'border-primary' },
                { time: '09:30', title: 'Exemplo: Conselho de Classe', desc: 'Sala de Reuniões Norte', color: 'border-secondary', icon: Users },
                { time: '11:00', empty: true },
              ].map((event, i) => (
                <div key={i} className="flex gap-6 items-start group opacity-60 grayscale-[50%]">
                  <span className="text-[11px] font-extrabold text-slate-400 w-10 pt-4 font-manrope">{event.time}</span>
                  <div className="flex-1">
                    {event.empty ? (
                      <div className="h-10 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-center">
                        <button className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest cursor-default">Sincronize para ver reais</button>
                      </div>
                    ) : (
                      <div className={`glass-card p-5 rounded-2xl border-l-4 ${event.color} bg-slate-50 dark:bg-slate-800/20`}>
                        <div className="flex justify-between items-start">
                          <div className="font-manrope">
                            <h4 className={`text-sm font-bold text-slate-500`}>{event.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">{event.desc}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 5 }).map((_, i) => {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(dayDate.getDate() + i + 1); // Monday to Friday (startOfWeek is Sunday)
                const dayStr = dayDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
                
                const dayEvents = filteredEvents.filter(ev => {
                  if (!ev.dateIso) return false;
                  const eDate = new Date(ev.dateIso);
                  return eDate.getDate() === dayDate.getDate() && eDate.getMonth() === dayDate.getMonth();
                }).sort((a,b) => (a.start||"").localeCompare(b.start||""));
                
                return (
                  <div key={i} className="min-w-[120px] space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 text-center mb-2 capitalize">{dayStr}</h4>
                    
                    {dayEvents.length > 0 ? (
                      dayEvents.map((ev, idx) => (
                        <div key={ev.id} className={`glass-card p-3 rounded-xl border-l-2 text-left shadow-sm ${ev.isCustom && !ev.syncedToGoogle ? 'border-amber-500' : 'border-primary'}`}>
                          <p className={`text-[10px] font-extrabold ${ev.isCustom && !ev.syncedToGoogle ? 'text-amber-600' : 'text-primary'}`}>{ev.start}</p>
                          <p className="text-[11px] font-bold mt-0.5 text-slate-700 dark:text-slate-200 leading-tight">{ev.title}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 opacity-30">
                        <p className="text-[10px] font-bold text-slate-400">Livre</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => setShowEventForm(true)}
        className="fixed bottom-24 right-6 w-14 h-14 primary-gradient text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-40 hover:shadow-primary/30"
      >
        <Plus className="w-8 h-8" />
      </button>

      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Adicionar Lembrete</h3>
            <p className="text-sm text-slate-500 mb-4">Lembrete para o dia {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Título</label>
                <input 
                  type="text" 
                  value={newEventTitle} 
                  onChange={e => setNewEventTitle(e.target.value)} 
                  placeholder="Ex: Reunião de Pais" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border items-center border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Horário</label>
                <input 
                  type="time" 
                  value={newEventTime} 
                  onChange={e => setNewEventTime(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowEventForm(false)}
                className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddEvent}
                className="flex-1 py-3 font-bold text-white bg-primary rounded-xl shadow-lg hover:shadow-primary/30"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const MaterialsScreen = ({ appData, onUpdateMaterials }: { appData: AppState, onUpdateMaterials: (materials: MaterialData[]) => void }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newType, setNewType] = useState<'video' | 'document' | 'link'>('document');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || (!newLink && newType !== 'document')) return;
    
    // If no classes selected, default to all classes
    const finalSelectedClasses = selectedClasses.length > 0 ? selectedClasses : (appData.classes || []).map(c => c.id);
    
    const newMaterial: MaterialData = {
      id: crypto.randomUUID(),
      title: newTitle,
      link: newLink,
      type: newType,
      targetClasses: finalSelectedClasses
    };
    onUpdateMaterials([...(appData.materials || []), newMaterial]);
    setShowAddForm(false);
    setNewTitle('');
    setNewLink('');
    setNewType('document');
    setSelectedClasses([]);
  };

  const handleDelete = (id: string) => {
    onUpdateMaterials((appData.materials || []).filter(m => m.id !== id));
  };

  const classes = appData.classes || [];
  const materials = appData.materials || [];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Materiais Didáticos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">Cadastre apostilas, vídeos e defina para quais turmas.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          {showAddForm ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5" />}
          <span className="hidden sm:inline">{showAddForm ? 'Cancelar' : 'Novo Material'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={handleAddSubmit}
          >
            <div className="glass-card p-6 rounded-3xl space-y-4 mb-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-secondary" /> Cadastrar Novo Material
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Título do Material</label>
                  <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} type="text" placeholder="Ex: Aula de Ciências - Fotossíntese" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo</label>
                  <select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer">
                    <option value="document">Apostila/Documento</option>
                    <option value="video">Vídeo Aula</option>
                    <option value="link">Link Externo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Link (URL)</label>
                <input required={newType !== 'document'} value={newLink} onChange={e => setNewLink(e.target.value)} type="url" placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Turmas Aplicadas (vazio = todas)</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setSelectedClasses(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${selectedClasses.includes(c.id) ? 'bg-secondary text-white border-secondary' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 dark:text-slate-400'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full md:w-auto mt-4 px-6 py-3 rounded-xl shadow-lg border-b-4 border-emerald-600 bg-emerald-500 font-extrabold text-white text-sm uppercase tracking-widest active:translate-y-1 active:border-b-0 hover:bg-emerald-400 transition-all flex justify-center items-center gap-2">
                  <Check className="w-5 h-5" /> Salvar Material
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.length === 0 && !showAddForm && (
          <div className="col-span-full py-16 text-center glass-card rounded-3xl border-dashed border-2 border-slate-200 dark:border-slate-700/50">
            <Book className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Nenhum material cadastrado</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Clique em "Novo Material" para adicionar apostilas, vídeos e recursos para suas turmas.</p>
          </div>
        )}
        {materials.map(m => (
          <div key={m.id} className="glass-card p-6 rounded-3xl flex flex-col justify-between group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  {m.type === 'video' ? <Video className="w-6 h-6"/> : m.type === 'link' ? <Link2 className="w-6 h-6"/> : <FileText className="w-6 h-6" />}
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 hover:shadow-md">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{m.title}</h4>
              <a href={m.link || '#'} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline break-all line-clamp-2 mb-6 block bg-primary/5 p-3 rounded-xl">{m.link || 'Arquivo Sem Link (Em breve upload real)'}</a>
            </div>
            
            <div className="mt-auto border-t border-slate-100 dark:border-slate-800/50 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Turmas</span>
              <div className="flex flex-wrap gap-2">
                {m.targetClasses.slice(0, 3).map(cid => {
                  const cname = classes.find(c => c.id === cid)?.name || 'Desconhecida';
                  return <span key={cid} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-bold">{cname}</span>;
                })}
                {m.targetClasses.length > 3 && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-bold">+{m.targetClasses.length - 3}</span>}
                {m.targetClasses.length === classes.length && classes.length > 0 && <span className="text-[10px] bg-secondary/10 text-secondary px-3 py-1 rounded-full font-bold ml-1 border border-secondary/20">Todas as Turmas</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsScreen = ({ appData, onUpdateClasses, onShowNotification, currentViewRole, initialModule }: { appData: AppState, onUpdateClasses: (classes: ClassData[]) => void, onShowNotification: (msg: string) => void, currentViewRole: 'teacher' | 'student', initialModule?: string }) => {
  const isStudent = currentViewRole === 'student';
  const [activeModule, setActiveModule] = useState<string | null>(initialModule || null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  
  const [editingDiag, setEditingDiag] = useState(false);
  const [diagText, setDiagText] = useState('');

  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalToDelete, setEvalToDelete] = useState<string | null>(null);
  const [evalMethodType, setEvalMethodType] = useState('Prova Bimestral');
  const [evalMethod, setEvalMethod] = useState('');
  const [evalPoints, setEvalPoints] = useState<number | ''>('');
  const [evalBimester, setEvalBimester] = useState('1º Bimestre');
  const [filterBimester, setFilterBimester] = useState('Todos');

  const reportModules = [
    { id: 'attendance', title: 'Relatório de Frequência', desc: 'Resumo de faltas e presenças por período.', icon: Book },
    { id: 'diagnostics', title: 'Diagnósticos (Prof)', desc: 'Análise do perfil e necessidades da classe.', icon: FileText, teacherOnly: true },
    { id: 'evaluations', title: 'Avaliações e Notas', desc: 'Acompanhe provas e trabalhos.', icon: Award },
  ];

  const visibleModules = reportModules.filter(m => isStudent ? !m.teacherOnly : true);

  const activeClass = (appData.classes || []).find(c => c.id === activeClassId);
  const activeStudent = activeClass?.students.find(s => s.id === activeStudentId);

  const handleQuickSaveDiagnostic = () => {
    if (!activeClass || !activeStudent) return;
    const newClasses = (appData.classes || []).map(c => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: c.students.map(s => s.id === activeStudentId ? { ...s, diagnostic: diagText } : s)
        };
      }
      return c;
    });
    onUpdateClasses(newClasses);
    onShowNotification('Diagnóstico salvo rapidamente!');
  };

  const handleSaveDiagnostic = () => {
    if (!activeClass || !activeStudent) return;
    const newClasses = (appData.classes || []).map(c => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: c.students.map(s => s.id === activeStudentId ? { ...s, diagnostic: diagText } : s)
        };
      }
      return c;
    });
    onUpdateClasses(newClasses);
    setEditingDiag(false);
    onShowNotification('Diagnóstico salvo com sucesso!');
  };

  const handleSaveEval = () => {
    if (!activeClass || !activeStudent) return;
    
    const finalMethod = evalMethodType === 'Outro' ? evalMethod.trim() : evalMethodType;
    
    if (!finalMethod) { onShowNotification('Informe o método de avaliação'); return; }
    if (evalPoints === '') { onShowNotification('Informe uma pontuação'); return; }
    
    // Auto-save method to class if it doesn't exist
    const methods = activeClass.evaluationMethods || [];
    let updatedMethods = methods;
    if (!methods.includes(finalMethod)) {
      updatedMethods = [...methods, finalMethod];
    }

    const newEval: StudentEvaluation = {
      id: Date.now().toString(),
      method: finalMethod,
      points: Number(evalPoints),
      date: new Date().toISOString(),
      bimester: evalBimester
    };

    const newClasses = (appData.classes || []).map(c => {
      if (c.id === activeClassId) {
        return {
          ...c,
          evaluationMethods: updatedMethods,
          students: c.students.map(s => {
            if (s.id === activeStudentId) {
              return { ...s, evaluations: [...(s.evaluations || []), newEval] };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateClasses(newClasses);
    setShowEvalForm(false);
    setEvalMethod('');
    setEvalPoints('');
    onShowNotification('Avaliação adicionada!');
  };

  const calculateTotalPoints = (evals?: StudentEvaluation[], filter?: string) => {
    if (!evals) return 0;
    const filtered = (filter && filter !== 'Todos') ? evals.filter(e => e.bimester === filter) : evals;
    return filtered.reduce((sum, e) => sum + e.points, 0);
  };

  if (!activeModule) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">Relatórios e Avaliações</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">Acompanhe diagnósticos e desempenho.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleModules.map(module => (
            <div key={module.id} className="glass-card p-5 rounded-2xl flex items-start gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700" onClick={() => setActiveModule(module.id)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <module.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">{module.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{module.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active Module View
  const moduleInfo = visibleModules.find(m => m.id === activeModule);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { setActiveModule(null); setActiveClassId(null); setActiveStudentId(null); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-95"><ChevronLeft className="w-5 h-5"/></button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{moduleInfo?.title}</h2>
        </div>
      </div>

      {/* Class Selection */}
      {!activeClassId && !isStudent && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Selecione uma Turma</h3>
          <div className="space-y-3">
            {(appData.classes || []).map(c => (
              <div key={c.id} onClick={() => setActiveClassId(c.id)} className="glass-card p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="font-bold text-slate-800 dark:text-slate-100">{c.name}</span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{c.students.length} alunos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student List View */}
      {((activeClassId || isStudent) && !activeStudentId) && (
        <div className="space-y-4">
          {!isStudent && (
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setActiveClassId(null)} className="text-xs font-bold text-primary flex items-center"><ChevronLeft className="w-3 h-3 mr-1" /> Voltar</button>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">Alunos - {activeClass?.name}</h3>
            </div>
          )}
          
          {/* Class Level Bimester Filter for Evaluations */}
          {activeModule === 'evaluations' && !isStudent && (
            <div className="mb-4">
              <select value={filterBimester} onChange={e => setFilterBimester(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold px-4 py-3 rounded-xl outline-none focus:border-primary cursor-pointer transition-colors shadow-sm">
                <option value="Todos">Somar Todos os Bimestres</option>
                <option value="1º Bimestre">Filtrar: 1º Bimestre</option>
                <option value="2º Bimestre">Filtrar: 2º Bimestre</option>
                <option value="3º Bimestre">Filtrar: 3º Bimestre</option>
                <option value="4º Bimestre">Filtrar: 4º Bimestre</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...(isStudent ? (appData.classes || []).flatMap(c => c.students) : activeClass?.students || [])]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(student => (
              <div key={student.id} onClick={() => { 
                if (isStudent) {
                  const studentClass = (appData.classes || []).find(c => c.students.some(s => s.id === student.id));
                  if (studentClass) setActiveClassId(studentClass.id);
                }
                setActiveStudentId(student.id); 
              }} className="glass-card p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors border border-transparent group">
                {student.avatar && student.avatar.trim() !== '' ? (
                  <img src={student.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">{student.name.toUpperCase()}</h4>
                    <div className="flex gap-1">
                      {student.specialNeeds?.map(need => (
                        <SpecialNeedBadge key={need} type={need} />
                      ))}
                    </div>
                  </div>
                  {activeModule === 'diagnostics' && student.diagnostic && (
                    <p className="text-[10px] uppercase font-bold text-emerald-500 mt-1 flex items-center gap-1"><Check className="w-3 h-3"/> Avaliado</p>
                  )}
                  {activeModule === 'diagnostics' && !student.diagnostic && (
                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 flex items-center gap-1">Pendente</p>
                  )}
                  {activeModule !== 'evaluations' && activeModule !== 'diagnostics' && (
                    <p className="text-xs text-slate-500 capitalize">{student.status === 'present' ? 'Presente' : student.status === 'absent' ? 'Ausente' : 'Sem Status'}</p>
                  )}
                </div>
                {activeModule === 'evaluations' && (
                  <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-lg font-extrabold leading-none">{calculateTotalPoints(student.evaluations, filterBimester)}</span>
                    <span className="text-[10px] font-bold uppercase mt-0.5">pts</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Details View */}
      {activeStudentId && activeStudent && activeClass && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 glass-card p-4 rounded-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full bg-primary`}></div>
            {activeStudent.avatar && activeStudent.avatar.trim() !== '' ? (
              <img src={activeStudent.avatar} alt={activeStudent.name} className="w-14 h-14 rounded-full object-cover shadow-md ml-2" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-md ml-2 shrink-0">
                <UserCheck className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{activeStudent.name.toUpperCase()}</h3>
                <div className="flex gap-1">
                  {activeStudent.specialNeeds?.map(need => (
                    <SpecialNeedBadge key={need} type={need} />
                  ))}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 font-manrope">{activeClass.name}</p>
            </div>
            {!isStudent && (
              <button onClick={() => { setActiveStudentId(null); setEditingDiag(false); setShowEvalForm(false); }} className="absolute top-4 right-4 text-xs font-bold text-primary flex items-center bg-transparent"><ChevronLeft className="w-3 h-3 mr-1" /> Voltar</button>
            )}
          </div>

          {/* Module: Diagnostics */}
          {activeModule === 'diagnostics' && (
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/> Diagnóstico Descritivo</h4>
              
              {!editingDiag ? (
                <>
                  {activeStudent.diagnostic ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-sm tracking-wide leading-relaxed text-slate-700 dark:text-slate-300 font-manrope whitespace-pre-wrap">{activeStudent.diagnostic}</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 opacity-50">
                      <p className="font-manrope text-sm font-bold">Nenhum diagnóstico registrado.</p>
                    </div>
                  )}
                  
                  {!isStudent && (
                    <button onClick={() => { setDiagText(activeStudent.diagnostic || ''); setEditingDiag(true); }} className="w-full text-xs font-bold text-primary py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                      {activeStudent.diagnostic ? 'Editar Diagnóstico' : 'Adicionar Diagnóstico'}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <textarea 
                    value={diagText}
                    onChange={e => setDiagText(e.target.value)}
                    rows={6}
                    placeholder="Digite suas observações e avaliação discursiva sobre o aluno..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-xl font-medium outline-none text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setEditingDiag(false)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">Cancelar</button>
                    <button onClick={handleQuickSaveDiagnostic} className="flex-1 py-3 font-bold text-secondary bg-secondary/10 border border-secondary/20 rounded-xl hover:bg-secondary/20 transition-colors">Salvar Rápido</button>
                    <button onClick={handleSaveDiagnostic} className="flex-1 py-3 font-bold text-white bg-primary rounded-xl shadow-lg hover:shadow-primary/30">Salvar e Fechar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Module: Evaluations */}
          {activeModule === 'evaluations' && (
            <div className="space-y-6">
              <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Award className="w-5 h-5 text-primary"/> Pontuação Total</h4>
                    <p className="text-xs text-slate-500 font-manrope mt-1">Soma das avaliações do período</p>
                  </div>
                  <div className="text-3xl font-extrabold text-primary">{calculateTotalPoints(activeStudent.evaluations, filterBimester)} pts</div>
                </div>
                <select value={filterBimester} onChange={e => setFilterBimester(e.target.value)} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold px-3 py-2 rounded-xl outline-none focus:ring-2 ring-primary/20 cursor-pointer">
                  <option value="Todos">Todos os Bimestres</option>
                  <option value="1º Bimestre">1º Bimestre</option>
                  <option value="2º Bimestre">2º Bimestre</option>
                  <option value="3º Bimestre">3º Bimestre</option>
                  <option value="4º Bimestre">4º Bimestre</option>
                </select>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Histórico de Avaliações</h4>
                  {!isStudent && !showEvalForm && (
                    <button onClick={() => setShowEvalForm(true)} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"><Plus className="w-4 h-4"/></button>
                  )}
                </div>

                {showEvalForm && !isStudent && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 mb-4 overflow-hidden">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bimestre</label>
                      <select value={evalBimester} onChange={e => setEvalBimester(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer transition-colors shadow-sm">
                        <option value="1º Bimestre">1º Bimestre</option>
                        <option value="2º Bimestre">2º Bimestre</option>
                        <option value="3º Bimestre">3º Bimestre</option>
                        <option value="4º Bimestre">4º Bimestre</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo de Avaliação</label>
                      <select value={evalMethodType} onChange={e => setEvalMethodType(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer transition-colors shadow-sm">
                        <option value="Prova Bimestral">Prova Bimestral</option>
                        <option value="Atividades e Trabalhos">Atividades e Trabalhos</option>
                        <option value="Vistos no Caderno">Vistos no Caderno</option>
                        <option value="Apresentação">Apresentação</option>
                        <option value="Participação">Participação / Comportamento</option>
                        <option value="Outro">Outro (Personalizado...)</option>
                      </select>
                    </div>
                    {evalMethodType === 'Outro' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome da Atividade</label>
                        <input list="methods-list" type="text" value={evalMethod} onChange={e => setEvalMethod(e.target.value)} placeholder="Ex: Feira de Ciências" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold transition-colors shadow-sm" />
                        <datalist id="methods-list">
                          {(activeClass.evaluationMethods || []).map(m => <option key={m} value={m} />)}
                        </datalist>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Pontos (pode ser negativo)</label>
                      <input type="number" value={evalPoints} onChange={e => setEvalPoints(Number(e.target.value))} placeholder="Ex: 5" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold font-mono transition-colors shadow-sm" />
                    </div>
                    
                    <div className="flex gap-2 pt-3">
                      <button onClick={() => setShowEvalForm(false)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors rounded-xl font-manrope">Cancelar</button>
                      <button onClick={handleSaveEval} className="flex-1 py-3 font-bold text-white bg-primary hover:bg-primary/90 transition-colors rounded-xl shadow-lg border-b-4 border-black/10 active:border-b-0 active:translate-y-1 font-manrope">Lançar Nota</button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  {activeStudent.evaluations && activeStudent.evaluations.length > 0 ? (
                    [...activeStudent.evaluations]
                      .filter(ev => filterBimester === 'Todos' || ev.bimester === filterBimester)
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(ev => (
                      <div key={ev.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{ev.method}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{ev.bimester || '1º Bimestre'} • {new Date(ev.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`font-extrabold ${ev.points >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {ev.points > 0 ? '+' : ''}{ev.points}
                          </div>
                          {!isStudent && (
                            <div className="flex items-center gap-1">
                              {evalToDelete === ev.id ? (
                                <>
                                  <button onClick={() => setEvalToDelete(null)} className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                                    <X className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => {
                                      const newClasses = (appData.classes || []).map(c => {
                                        if (c.id === activeClass.id) {
                                          return {
                                            ...c,
                                            students: c.students.map(s => {
                                              if (s.id === activeStudent.id) {
                                                return { ...s, evaluations: s.evaluations?.filter(e => e.id !== ev.id) };
                                              }
                                              return s;
                                            })
                                          };
                                        }
                                        return c;
                                      });
                                      onUpdateClasses(newClasses);
                                      setEvalToDelete(null);
                                  }} className="p-1 px-2 text-[10px] uppercase font-bold rounded bg-red-500 text-white">
                                    Sim
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => setEvalToDelete(ev.id)} className="p-1.5 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs font-bold text-slate-400 py-4 font-manrope">Nenhuma avaliação registrada.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Module: Attendance */}
          {activeModule === 'attendance' && (
            <div className="glass-card p-5 rounded-2xl space-y-4">
               <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Book className="w-5 h-5 text-primary"/> Resumo de Frequência</h4>
               <p className="text-sm text-slate-500 font-manrope">O histórico de presença deste aluno.</p>
               <div className="space-y-2">
                 {Object.entries(activeStudent.attendanceHistory || {}).map(([date, status]) => (
                   <div key={date} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                     <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{date}</span>
                     <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                       {status === 'present' ? 'Presente' : status === 'absent' ? 'Falta' : 'Atraso'}
                     </span>
                   </div>
                 ))}
                 {Object.keys(activeStudent.attendanceHistory || {}).length === 0 && (
                   <p className="text-center text-xs font-bold text-slate-400 py-4 font-manrope">Nenhuma chamada registrada.</p>
                 )}
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

const ClassesScreen = ({ appData, onUpdateClasses }: { appData: AppState, onUpdateClasses: (classes: ClassData[]) => void }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newStudentText, setNewStudentText] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');
  const [editingSpecialNeeds, setEditingSpecialNeeds] = useState<string[]>([]);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [transferringStudentId, setTransferringStudentId] = useState<string | null>(null);
  const [transferSelectedClassId, setTransferSelectedClassId] = useState<string | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState<{ id: string, name: string, studentsCount: number, teacherName: string, originalClass: any }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState('');

  const currentClass = appData.classes?.find(c => c.id === selectedClassId);

  const fetchSchoolClasses = async () => {
    if (!appData.schoolName) {
      setImportNotice("Adicione o nome da sua escola em Configurações para buscar turmas de outros professores.");
      return;
    }
    setIsImporting(true);
    setImportNotice('');
    try {
      const q = query(collection(db, 'users'), where('schoolName', '==', appData.schoolName));
      const querySnapshot = await getDocs(q);
      const fetchedClasses: any[] = [];
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id === auth.currentUser?.uid) return; // Skip own classes
        const data = docSnap.data();
        if (data.classesStr) {
           try {
              const parsedClasses = JSON.parse(data.classesStr);
              parsedClasses.forEach((c: any) => {
                 fetchedClasses.push({
                    id: Math.random().toString(36).substring(2, 9), // Generate new ID so we don't conflict
                    name: c.name,
                    studentsCount: c.students?.length || 0,
                    teacherName: data.teacherName || 'Professor(a)',
                    originalClass: c
                 });
              });
           } catch(e){}
        }
      });
      setSchoolClasses(fetchedClasses);
      if (fetchedClasses.length === 0) setImportNotice("Nenhuma turma encontrada nesta instituição.");
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
    setIsImporting(false);
  };

  const handleImportClasses = (selectedIds: string[]) => {
     let newClasses = [...(appData.classes || [])];
     selectedIds.forEach(id => {
        const found = schoolClasses.find(sc => sc.id === id);
        if (found) {
           // Create a fresh copy to prevent mutating the original downloaded structure
           const clonedClass = JSON.parse(JSON.stringify(found.originalClass));
           clonedClass.id = Math.random().toString(36).substring(2, 9); // fresh ID
           // Give students fresh IDs too, except maybe don't need to if we assume they won't conflict, but safer to do it
           clonedClass.students = (clonedClass.students || []).map((s: any) => ({
               ...s,
               id: Math.random().toString(36).substring(2, 9)
           }));
           newClasses.push(clonedClass);
        }
     });
     onUpdateClasses(newClasses);
     setShowImportModal(false);
  };

  const handleEditStudent = () => {
    if (!editingStudentId || !editingStudentName.trim() || !selectedClassId) return;
    const newName = editingStudentName.trim();
    const updatedClasses = (appData.classes || []).map(c => {
      if (c.id === selectedClassId) {
        return { 
          ...c, 
          students: c.students.map(s => s.id === editingStudentId ? { 
            ...s, 
            name: newName,
            specialNeeds: editingSpecialNeeds 
          } : s)
        };
      }
      return c;
    });
    onUpdateClasses(updatedClasses);
    setEditingStudentId(null);
    setEditingStudentName('');
    setEditingSpecialNeeds([]);
  };

  const handleEditClass = () => {
    if (!editingClassId || !editingClassName.trim()) return;
    const newName = editingClassName.trim();
    const updatedClasses = (appData.classes || []).map(c => {
      if (c.id === editingClassId) {
        return { 
          ...c, 
          name: newName,
          students: c.students.map(s => ({ ...s, grade: newName }))
        };
      }
      return c;
    });
    onUpdateClasses(updatedClasses);
    setEditingClassId(null);
    setEditingClassName('');
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassData = {
      id: Date.now().toString(),
      name: newClassName,
      students: [],
    };
    onUpdateClasses([...(appData.classes || []), newClass]);
    setNewClassName('');
    setSelectedClassId(newClass.id);
  };

  const handleAddStudents = () => {
    if (!newStudentText.trim() || !selectedClassId) return;
    
    const lines = newStudentText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const updatedClasses = (appData.classes || []).map(c => {
      if (c.id === selectedClassId) {
        const newStudents = lines.map((name, i) => ({
          id: Date.now().toString() + i,
          name: name,
          avatar: '',
          grade: c.name,
          room: 'N/A',
          status: 'none' as const
        }));
        return { ...c, students: [...c.students, ...newStudents] };
      }
      return c;
    });

    onUpdateClasses(updatedClasses);
    setNewStudentText('');
  };

  const handleRemoveStudent = (studentId: string) => {
    const updatedClasses = (appData.classes || []).map(c => {
      if (c.id === selectedClassId) {
        return { ...c, students: c.students.filter(s => s.id !== studentId) };
      }
      return c;
    });
    onUpdateClasses(updatedClasses);
  };

  const handleTransferStudent = () => {
    if (!transferringStudentId || !transferSelectedClassId || !selectedClassId || transferSelectedClassId === selectedClassId) return;
    const originalStudent = (appData.classes || []).find(cl => cl.id === selectedClassId)?.students.find(s => s.id === transferringStudentId);
    if (!originalStudent) return;

    const updatedClasses = (appData.classes || []).map(c => {
      if (c.id === selectedClassId) {
        return { ...c, students: c.students.filter(s => s.id !== transferringStudentId) };
      }
      if (c.id === transferSelectedClassId) {
        return { ...c, students: [...c.students, { ...originalStudent, grade: c.name }] };
      }
      return c;
    });
    onUpdateClasses(updatedClasses);
    setTransferringStudentId(null);
    setTransferSelectedClassId(null);
  };

  const handleRemoveClass = (classId: string) => {
    const updatedClasses = (appData.classes || []).filter(c => c.id !== classId);
    onUpdateClasses(updatedClasses);
    if (selectedClassId === classId) {
      setSelectedClassId(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Gerenciar Turmas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">Adicione turmas e alunos.</p>
        </div>
        <button 
          onClick={() => { setShowImportModal(true); fetchSchoolClasses(); }}
          className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Importar da Escola
        </button>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Importar Turmas</h3>
                  <p className="text-xs text-slate-500 font-manrope mt-1">
                    Baixe turmas cadastradas por outros professores de <span className="font-bold text-primary">{appData.schoolName || 'sua escola'}</span>.
                  </p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {isImporting ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold animate-pulse">Buscando turmas na instituição...</p>
                </div>
              ) : importNotice ? (
                <div className="py-8 text-center px-4">
                  <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold">{importNotice}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schoolClasses.map(sc => (
                    <div key={sc.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/30 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{sc.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-bold">{sc.studentsCount} alunos</span>
                          <span>•</span>
                          <span>Prof. {sc.teacherName}</span>
                        </p>
                      </div>
                      <button 
                         onClick={() => handleImportClasses([sc.id])}
                         className="bg-primary text-white p-2.5 rounded-lg font-bold text-xs hover:bg-primary/90 transition-colors shadow-sm"
                      >
                         Baixar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Classes List */}
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-2xl flex gap-2">
            <input 
              type="text" 
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
              placeholder="Nome da Nova Turma..."
              className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium outline-none transition-colors"
            />
            <button 
              onClick={handleAddClass}
              className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {(appData.classes || []).map(c => (
              <div 
                key={c.id} 
                className={`glass-card p-4 rounded-xl flex flex-col justify-center cursor-pointer transition-colors border-2 ${selectedClassId === c.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'}`}
              >
                {editingClassId === c.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editingClassName}
                      onChange={(e) => setEditingClassName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditClass()}
                      className="flex-1 bg-white dark:bg-slate-800 border-2 border-primary px-3 py-2 rounded-lg font-bold outline-none"
                    />
                    <button
                      onClick={handleEditClass}
                      className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditingClassId(null)}
                      className="bg-slate-200 dark:bg-slate-700 text-slate-500 p-2 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 flex items-center justify-between" onClick={() => setSelectedClassId(c.id)}>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{c.name}</span>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{c.students.length} alunos</span>
                    </div>
                    <div className="flex items-center ml-3 gap-1">
                      {classToDelete === c.id ? (
                        <>
                          <span className="text-[10px] font-bold text-red-500 uppercase mr-1">Tabela?</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setClassToDelete(null); }}
                            className="text-slate-400 hover:text-slate-600 p-2 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveClass(c.id); setClassToDelete(null); }}
                            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Sim
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingClassId(c.id); setEditingClassName(c.name); }}
                            className="text-slate-400 hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setClassToDelete(c.id); }}
                            className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!(appData.classes?.length) && (
              <p className="text-center text-sm font-bold text-slate-400 py-8">Nenhuma turma cadastrada.</p>
            )}
          </div>
        </div>

        {/* Students List */}
        {selectedClassId && currentClass && (
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Alunos em {currentClass.name}</h3>
            
            <div className="flex gap-2">
              <textarea 
                value={newStudentText}
                onChange={(e) => setNewStudentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddStudents())}
                placeholder="Nomes separados por linha ou vírgula..."
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium outline-none transition-colors resize-none h-14"
              />
              <button 
                onClick={handleAddStudents}
                className="bg-secondary text-white p-3 rounded-xl hover:bg-secondary/90 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {[...(currentClass.students || [])].sort((a, b) => a.name.localeCompare(b.name)).map((s, index) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800">
                  {editingStudentId === s.id ? (
                    <div className="space-y-4 w-full">
                      <div className="flex gap-2 w-full">
                        <input
                          autoFocus
                          type="text"
                          value={editingStudentName}
                          onChange={(e) => setEditingStudentName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEditStudent()}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-primary px-3 py-2 rounded-lg font-bold outline-none text-sm"
                        />
                        <button
                          onClick={handleEditStudent}
                          className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingStudentId(null); setEditingSpecialNeeds([]); }}
                          className="bg-slate-200 dark:bg-slate-700 text-slate-500 p-2 rounded-lg shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 px-1 pb-2">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Necessidades Especiais</p>
                         <div className="flex flex-wrap gap-2">
                            {['TEA', 'DI', 'DEF', 'OUT'].map(need => (
                               <button
                                  key={need}
                                  onClick={() => {
                                     if (editingSpecialNeeds.includes(need)) {
                                        setEditingSpecialNeeds(editingSpecialNeeds.filter(n => n !== need));
                                     } else {
                                        setEditingSpecialNeeds([...editingSpecialNeeds, need]);
                                     }
                                  }}
                                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border-2 ${
                                     editingSpecialNeeds.includes(need) 
                                     ? 'bg-primary border-primary text-white' 
                                     : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/30'
                                  }`}
                               >
                                  {need === 'TEA' ? '🧩 TEA' : need === 'DI' ? '🧠 DI' : need === 'DEF' ? '♿ DEF' : '✨ OUT'}
                               </button>
                            ))}
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 items-center truncate overflow-visible">
                        <span className="text-xs font-bold text-slate-400 w-4">{index + 1}</span>
                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope truncate">{s.name.toUpperCase()}</span>
                            <div className="flex gap-1">
                              {s.specialNeeds?.map(need => (
                                <SpecialNeedBadge key={need} type={need} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center ml-2 shrink-0 gap-1">
                        {studentToDelete === s.id ? (
                          <>
                            <span className="text-[10px] font-bold text-red-500 uppercase flex items-center mr-1">Excluir?</span>
                            <button 
                              onClick={() => setStudentToDelete(null)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { handleRemoveStudent(s.id); setStudentToDelete(null); }}
                              className="text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
                            >
                              Sim
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setTransferringStudentId(s.id); setTransferSelectedClassId(null); }}
                              className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                              title="Transferir Aluno"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { 
                                setEditingStudentId(s.id); 
                                setEditingStudentName(s.name); 
                                setEditingSpecialNeeds(s.specialNeeds || []);
                              }}
                              className="text-slate-400 hover:text-primary p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                              title="Editar Aluno"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setStudentToDelete(s.id)}
                              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10"
                              title="Remover Aluno"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {currentClass.students.length === 0 && (
                <p className="text-center text-xs font-bold text-slate-400 py-4">Nenhum aluno nesta turma.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedClassId && currentClass && (
        <div className="glass-card p-6 rounded-3xl mt-6">
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Configurar Horários da Turma</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dias da Semana</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                  <button
                    key={day}
                    onClick={() => {
                      const currentDays = currentClass.schedule?.days || [];
                      const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
                      const updatedClasses = (appData.classes || []).map(c => 
                        c.id === currentClass.id ? { ...c, schedule: { ...c.schedule, startTime: c.schedule?.startTime || '08:00', endTime: c.schedule?.endTime || '12:00', days: newDays } } : c
                      );
                      onUpdateClasses(updatedClasses);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors border ${currentClass.schedule?.days?.includes(day) ? 'bg-primary text-white border-primary' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Horário de Início</label>
                <input 
                  type="time" 
                  value={currentClass.schedule?.startTime || '08:00'}
                  onChange={(e) => {
                    const updatedClasses = (appData.classes || []).map(c => 
                      c.id === currentClass.id ? { ...c, schedule: { days: c.schedule?.days || [], endTime: c.schedule?.endTime || '12:00', startTime: e.target.value } } : c
                    );
                    onUpdateClasses(updatedClasses);
                  }}
                  className="w-full mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Horário de Término</label>
                <input 
                  type="time" 
                  value={currentClass.schedule?.endTime || '12:00'}
                  onChange={(e) => {
                    const updatedClasses = (appData.classes || []).map(c => 
                      c.id === currentClass.id ? { ...c, schedule: { days: c.schedule?.days || [], startTime: c.schedule?.startTime || '08:00', endTime: e.target.value } } : c
                    );
                    onUpdateClasses(updatedClasses);
                  }}
                  className="w-full mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {transferringStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setTransferringStudentId(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10 p-6 flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
               <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Transferir Aluno
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Selecione para qual turma deseja transferir:</p>
            <select 
               value={transferSelectedClassId || ''} 
               onChange={(e) => setTransferSelectedClassId(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
            >
               <option value="" disabled>Escolha a turma alvo...</option>
               {(appData.classes || []).filter(c => c.id !== selectedClassId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
               ))}
            </select>
            <div className="flex justify-end gap-2 pt-4">
               <button onClick={() => setTransferringStudentId(null)} className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
               <button onClick={handleTransferStudent} disabled={!transferSelectedClassId} className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const SettingsScreen = ({ appData, onUpdateField, onLogout, onSyncGoogle, isSyncingGoogle, onInstall, canInstall, onNavigateAdmin, isAdmin }: { 
  appData: AppState, 
  onUpdateField: (field: string, value: string) => void, 
  onLogout: () => void, 
  onSyncGoogle: () => void, 
  isSyncingGoogle?: boolean,
  onInstall?: () => void,
  canInstall?: boolean,
  onNavigateAdmin?: () => void,
  isAdmin?: boolean
}) => {
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUpdateField('avatarUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2">Perfil</h3>
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl bg-slate-200">
              <img src={appData.avatarUrl?.trim() || TEACHER_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 text-xs rounded-full cursor-pointer shadow-lg hover:scale-105 transition-transform">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">Tipo de Perfil</label>
            <select value={appData.role || 'teacher'} onChange={(e) => onUpdateField('role', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors">
              <option value="student">Aluno</option>
              <option value="teacher">Professor</option>
              <option value="both">Ambos</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">
              {appData.role === 'student' ? 'Nome do Aluno' : 'Nome do Professor'}
            </label>
            <input type="text" value={appData.teacherName} onChange={(e) => onUpdateField('teacherName', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">Nome da Escola</label>
            <input type="text" value={appData.schoolName} onChange={(e) => onUpdateField('schoolName', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">Data de Nascimento</label>
            <div className="relative">
              <input 
                type="date" 
                value={appData.birthDate || ''} 
                onChange={(e) => onUpdateField('birthDate', e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">CPF</label>
            <input 
              type="text" 
              value={appData.cpf || ''} 
              onChange={(e) => onUpdateField('cpf', formatCPF(e.target.value))} 
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors" 
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2">Instalação e App</h3>
        
        <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Aplicativo PWA</p>
                <p className="text-[10px] text-slate-500 font-medium">Instale na sua tela inicial</p>
              </div>
            </div>
            {canInstall ? (
              <button 
                onClick={onInstall}
                className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Instalar
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg font-bold">PWA Ativo</span>
                <button 
                  onClick={() => {
                    if (confirm('Deseja forçar a limpeza do cache e atualizar o aplicativo?')) {
                      if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(registrations => {
                          for (const registration of registrations) {
                            registration.unregister();
                          }
                          window.location.reload();
                        });
                      } else {
                        window.location.reload();
                      }
                    }
                  }}
                  className="text-[8px] font-black text-primary uppercase hover:underline"
                >
                  Forçar Atualização
                </button>
              </div>
            )}
          </div>

          {!canInstall && (
            <div className="pt-2 border-t border-primary/10">
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-manrope leading-relaxed">
                <span className="font-bold text-primary">Dica:</span> Se o botão não aparece, é porque você pode estar visualizando dentro do editor. 
                <br />
                1. Clique em <span className="font-bold">"Abrir em nova aba"</span> no topo do preview.
                <br />
                2. No <span className="font-bold">Android (Chrome)</span>, clique nos 3 pontinhos e "Instalar Aplicativo".
                <br />
                3. No <span className="font-bold">iPhone (Safari)</span>, clique no ícone de compartilhar e "Add à Tela de Início".
              </p>
            </div>
          )}
        </div>

        {isAdmin && (
           <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Administração</p>
                  <p className="text-[10px] text-slate-500 font-medium">Painel de controle Jefson</p>
                </div>
              </div>
              <button 
                onClick={onNavigateAdmin}
                className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
              >
                Acessar
              </button>
           </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full flex items-center justify-center w-10 h-10 ${appData.googleSynced ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              {appData.googleSynced ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Google Workspace</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{appData.googleSynced ? 'Sincronizado' : 'Não conectado'}</p>
            </div>
          </div>
          <button onClick={onSyncGoogle} disabled={isSyncingGoogle} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${appData.googleSynced ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isSyncingGoogle && <RefreshCw className="w-3 h-3 animate-spin"/>}
            {isSyncingGoogle ? 'Aguarde' : (appData.googleSynced ? 'Re-sincronizar' : 'Conectar')}
          </button>
        </div>
      </div>

      <button onClick={onLogout} className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 text-red-500 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
        <ArrowLeft className="w-5 h-5" /> 
        Sair da Conta
      </button>

    </div>
  );
};

const AdminScreen = ({ appData, onUpdateField, onShowNotification }: { 
  appData: AppState, 
  onUpdateField: (field: string, value: any) => void,
  onShowNotification: (msg: string, type: 'info' | 'critical') => void 
}) => {
  const [activeTab, setActiveTab] = useState<'access' | 'billing' | 'notices'>('access');
  const [noticeText, setNoticeText] = useState('');
  const [noticeType, setNoticeType] = useState<'info' | 'warning' | 'critical'>('info');
  const [totalUsersCount, setTotalUsersCount] = useState<number>(224);
  const [totalTeachersCount, setTotalTeachersCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { collection, query, where, getCountFromServer } = await import('firebase/firestore');
        const coll = collection(db, 'users');
        const snapshot = await getCountFromServer(coll);
        const ct = snapshot.data().count;
        setTotalUsersCount(ct > 224 ? ct : 224); // Show at least 224 as per request
        
        const qTeachers = query(coll, where('role', 'in', ['teacher', 'both']));
        const snapshotTeachers = await getCountFromServer(qTeachers);
        setTotalTeachersCount(snapshotTeachers.data().count);
      } catch (e) {
        console.error("Count fetch error", e);
      }
    };
    fetchCount();
  }, []);

  const addNotice = () => {
    if (!noticeText.trim()) return;
    const newNotice: AdminNotice = {
      id: Date.now().toString(),
      text: noticeText,
      date: new Date().toLocaleDateString('pt-BR'),
      type: noticeType
    };
    const currentNotices = appData.adminNotices || [];
    onUpdateField('adminNotices', [newNotice, ...currentNotices]);
    setNoticeText('');
  };

  const removeNotice = (id: string) => {
    const currentNotices = appData.adminNotices || [];
    onUpdateField('adminNotices', currentNotices.filter(n => n.id !== id));
  };

  const isJefsonEmail = auth.currentUser?.email === 'jefson.ti@gmail.com' || auth.currentUser?.email === 'jefson.s.a7@gmail.com';
  const isJefsonCpf = (appData.cpf || "").replace(/\D/g, "") === '00995845301';
  const isSuperAdmin = isJefsonEmail || isJefsonCpf;

  return (
    <div className="space-y-6 pb-24">
      {isSuperAdmin && (
        <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] mb-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
             <Settings className="w-32 h-32 text-primary animate-[spin_10s_linear_infinite]" />
          </div>
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative z-10"
          >
            <Settings className="w-10 h-10 text-primary" />
          </motion.div>
          
          <div className="relative z-10">
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Super Admin Console</p>
            <p className="text-sm text-slate-500 font-bold">Ambiente de Controle Root - Jefson</p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-tighter relative z-10">
             <ShieldCheck className="w-3 h-3" />
             Autenticação Root Ativa
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {(['access', 'billing', 'notices'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'
            }`}
          >
            {tab === 'access' ? 'Controle de Acesso' : tab === 'billing' ? 'Cobrança e Ativação' : 'Avisos'}
          </button>
        ))}
      </div>

      {activeTab === 'access' && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Status do Sistema</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Versão do App</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">v2.5.2-pro</p>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Base de Dados</p>
                <p className="text-sm font-bold text-green-500">Online</p>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Usuários Registrados</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalUsersCount}</p>
                   </div>
                   <Users className="w-8 h-8 text-primary opacity-20" />
                </div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Professores Cadastrados</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalTeachersCount}</p>
                   </div>
                   <Briefcase className="w-8 h-8 text-primary opacity-20" />
                </div>
             </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
             <div className="flex items-center justify-between">
                <div>
                   <span className="text-xs font-bold text-primary">Jefson (Admin Principal)</span>
                   <p className="text-[10px] text-slate-400">jefson.s.a7@gmail.com • Root Access</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-primary" />
             </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Controle de Ativação</h3>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Status de Licença de Uso</h4>
            <p className="text-[10px] text-blue-600 dark:text-blue-400">Controle aqui se o app está liberado para uso ou bloqueado por falta de pagamento.</p>
          </div>

          <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
             <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-primary uppercase">Receber via PIX</p>
                <div className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-[8px] font-bold">INSTANTÂNEO</div>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Chave PIX (E-mail)</p>
                <div className="flex items-center justify-between gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                   <code className="text-xs text-white font-mono">jefson.s.a7@gmail.com</code>
                   <button onClick={() => {
                     navigator.clipboard.writeText('jefson.s.a7@gmail.com');
                     onShowNotification('Chave PIX copiada!', 'info');
                   }} className="text-primary hover:text-white transition-colors">
                      <Copy className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['active', 'overdue', 'trial'] as const).map(status => (
              <button 
                key={status}
                onClick={() => onUpdateField('billingStatus', status)}
                className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${appData.billingStatus === status ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
              >
                {status === 'active' ? 'Liberado' : status === 'overdue' ? 'Bloqueado' : 'Teste'}
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-primary uppercase ml-1">Vencimento do Plano</label>
              <input 
                type="date"
                value={appData.billingExpiry || ''}
                onChange={(e) => onUpdateField('billingExpiry', e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold transition-colors"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex items-start gap-3 mt-4">
             <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
             <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                Aviso: Alterar o status de cobrança afeta o acesso imediato de todos os usuários vinculados.
             </p>
          </div>
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Comunicados Gerais</h3>
          </div>
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase ml-1">Novo Comunicado</label>
                <div className="flex gap-2 mb-2">
                   {(['info', 'warning', 'critical'] as const).map(t => (
                     <button 
                       key={t}
                       onClick={() => setNoticeType(t)}
                       className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${noticeType === t ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}
                     >
                       {t}
                     </button>
                   ))}
                </div>
                <textarea 
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors min-h-[80px] text-sm"
                  placeholder="Mensagem para todos..."
                />
                <button 
                  onClick={addNotice}
                  className="w-full bg-primary text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                   <Send className="w-4 h-4" /> Publicar Aviso
                </button>
             </div>
             
             <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Histórico de Publicações</p>
               <div className="space-y-3">
                 {(appData.adminNotices || []).map(notice => (
                    <div key={notice.id} className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 relative group">
                       <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${notice.type === 'critical' ? 'bg-red-500' : notice.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">{notice.date}</span>
                       </div>
                       <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{notice.text}</p>
                       <button 
                         onClick={() => removeNotice(notice.id)}
                         className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                    </div>
                 ))}
                 {(!appData.adminNotices || appData.adminNotices.length === 0) && (
                   <p className="text-center py-4 text-[10px] text-slate-400 font-bold italic">Nenhum aviso publicado.</p>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginScreen = ({ appData, onLogin, onSwitchToRegister, onWipeData, onShowNotification }: { appData: AppState | null, onLogin: (fetchedData?: AppState) => void, onSwitchToRegister: () => void, onWipeData?: () => void, onShowNotification?: (msg: string, type: 'critical' | 'info') => void }) => {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleLogin = async () => {
    if (appData && (cpf === appData.cpf || cpf.replace(/\D/g, '') === appData.cpf.replace(/\D/g, '')) && password === appData.password) {
      onLogin();
    } else {
      setIsGoogleLoading(true);
      try {
        const { signInAnonymously, signOut } = await import('firebase/auth');
        await signInAnonymously(auth);
        
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('cpf', '==', cpf.replace(/\D/g, '')), where('password', '==', password));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as AppState;
          if (onShowNotification) onShowNotification('Dados sincronizados da nuvem com sucesso! Sincronização em nuvem desativada, faça login com Google para reativar.', 'info');
          // Important: Sign out of the anonymous account so we do NOT overwrite
          // the real cloud document with a shadow copy later.
          await signOut(auth);
          onLogin(userData);
        } else {
          await signOut(auth);
          setError(true);
        }
      } catch (err) {
        console.error("Erro na busca online:", err);
        setError(true);
      } finally {
        setIsGoogleLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const clientId = '1067272365451-9tkkbb5d9t5a560205856eb2h7v9c30h.apps.googleusercontent.com'; // Placeholder
        const redirectUri = 'br.com.jefson.tarefaflow://auth';
        const scopes = encodeURIComponent('email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events');
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=${scopes}&nonce=tarefaflow123`;
        
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: authUrl });
      } else {
        // Fallback for web using Firebase built-in popup
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
        provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
        provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
        provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
        provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
        provider.addScope('https://www.googleapis.com/auth/calendar.events');
        provider.addScope('https://www.googleapis.com/auth/tasks.readonly');
        provider.addScope('https://www.googleapis.com/auth/tasks');
        provider.setCustomParameters({ prompt: 'select_account' });
        
        try {
          const result = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken || null;
          
          if (token) {
            localStorage.setItem('google_access_token', token);
            window.dispatchEvent(new CustomEvent('google-access-token-updated', { detail: token }));
          }
          if (result.user) {
            onLogin();
          }
        } catch (error: any) {
          if (error.code === 'auth/internal-error') {
            console.error("Firebase Internal Error during login. Checking authorized domains or pop-up blockers is recommended.", error);
            // This error is generic. Sometimes it helps to retry or inform the user about pop-up blockers.
            if (onShowNotification) {
              onShowNotification('Erro de autenticação (Internal Error). Verifique se seu navegador está bloqueando pop-ups.', 'critical');
            }
          }
          throw error; // Re-throw to be caught by the outer catch
        }
      }
    } catch (e: any) {
      if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        console.log("Login cancelado pelo usuário.");
      } else if (e?.code === 'auth/unauthorized-domain') {
        console.error("Domínio não autorizado no Firebase Auth", e);
        if (onShowNotification) {
          onShowNotification('Erro: Domínio não autorizado no Firebase. Adicione a URL atual no Firebase Console > Authentication > Authorized domains.', 'critical');
        } else {
          alert('Erro: Domínio não autorizado no Firebase. Adicione a URL atual no Firebase Console > Authentication > Authorized domains.');
        }
      } else {
        console.error("Auth error:", e);
        // Explicitly check for internal error here too if re-thrown
        if (e?.code === 'auth/internal-error') {
           // We already showed a notification if possible, but let's be sure
        }
      }
      setIsGoogleLoading(false);
    }
  };

  const handleRecoverWithGoogle = async () => {
    setRecoveryError('');
    if (!appData || !appData.googleSynced) {
      setRecoveryError('Nenhuma conta Google vinculada a este dispositivo.');
      return;
    }
    
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const clientId = '1067272365451-9tkkbb5d9t5a560205856eb2h7v9c30h.apps.googleusercontent.com'; // Placeholder
        const redirectUri = 'br.com.jefson.tarefaflow://auth';
        const scopes = encodeURIComponent('email profile');
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=${scopes}&nonce=tarefaflow123`;
        
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: authUrl });
      } else {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.setCustomParameters({ prompt: 'select_account' });
        
        try {
          const result = await signInWithPopup(auth, provider);
          if (result.user) {
            setRecoveredPassword(appData.password || '');
          }
        } catch (error: any) {
          if (error.code === 'auth/internal-error') {
            setRecoveryError('Erro interno do Firebase. Tente desativar bloqueadores de pop-up.');
          }
          throw error;
        }
      }
    } catch (e: any) {
      if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        console.log("Recuperação cancelada pelo usuário.");
      } else if (e?.code === 'auth/unauthorized-domain') {
        setRecoveryError('Erro: Domínio não autorizado no Firebase. Adicione a URL atual (ais-dev-...) no Console do Firebase > Authentication > Settings > Authorized domains.');
      } else {
        console.error("Recovery Auth error:", e);
        if (!recoveryError) setRecoveryError('Erro ao autenticar com o Google.');
      }
    }
  };

  if (isRecovering) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-surface-base px-6 py-12">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px]" />
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md z-10 glass-card p-8 rounded-3xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-primary mb-2">Recuperar Senha</h2>
            <p className="text-slate-500 font-manrope text-sm">
              Use sua conta Google vinculada para recuperar o acesso.
            </p>
          </div>

          {recoveredPassword ? (
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center space-y-4 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-manrope mb-2">Identidade confirmada!</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sua senha é:</p>
                <div className="mt-1 text-xl font-mono bg-white py-3 px-6 rounded-xl border border-green-200 text-slate-800 font-bold inline-block shadow-sm">
                  {recoveredPassword}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <button 
                onClick={handleRecoverWithGoogle}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold py-4 rounded-2xl shadow-[0_5px_15px_-5px_rgba(0,0,0,0.1)] hover:shadow-lg hover:border-blue-500/30 transition-all text-slate-700 dark:text-slate-200 flex items-center justify-center gap-3 active:scale-95 text-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Validar com Google
              </button>
              
              {recoveryError && (
                <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg border border-red-200">{recoveryError}</p>
              )}
            </div>
          )}

          <button 
            onClick={() => {
              setIsRecovering(false);
              setRecoveredPassword('');
              setRecoveryError('');
            }}
            className="w-full text-slate-500 font-bold py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors text-xs uppercase tracking-widest mt-2"
          >
            Voltar para o Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-surface-base px-6 py-12">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px]" />
      
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary mb-2">
            Bem-vindo(a) de volta!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-manrope">
            Faça login para acessar sua conta.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-primary uppercase ml-1">CPF</label>
              <input 
                type="text" 
                value={cpf}
                onChange={(e) => {setCpf(formatCPF(e.target.value)); setError(false);}}
                placeholder="000.000.000-00"
                inputMode="numeric"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">Senha</label>
                {appData?.googleSynced && (
                  <button 
                    onClick={() => setIsRecovering(true)}
                    className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors underline"
                  >
                    Esqueci a senha
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => {setPassword(e.target.value); setError(false);}}
                  placeholder="Sua senha"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-xs font-bold font-manrope bg-red-50 dark:bg-red-500/10 p-3 rounded-lg flex justify-center text-center">
                {appData ? 'CPF ou senha incorretos.' : 'Usuário não encontrado neste dispositivo. Por favor, cadastre-se.'}
              </p>
            )}

            <button 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold py-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest mt-4"
            >
              {isGoogleLoading ? (
                 <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
              )}
              Entrar com Google
            </button>

            <div className="flex items-center gap-4 my-2 opacity-50">
              <div className="h-px bg-slate-400 flex-1"></div>
              <span className="text-[10px] font-bold uppercase">Ou Local</span>
              <div className="h-px bg-slate-400 flex-1"></div>
            </div>

            <button 
              onClick={handleLogin}
              disabled={!cpf || !password}
              className="w-full primary-gradient text-white font-bold py-3.5 rounded-2xl shadow-lg mt-4 disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Entrar
            </button>
            <button onClick={onSwitchToRegister} className="w-full mt-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-center">
              Não tem conta? Cadastre-se
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import { initGoogleAuthListener } from './services/auth';
import { db as dexieDb } from './db/database';
import { addToSyncQueue, processSyncQueue } from './sync/syncManager';

// --- Main App ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('studentsHub');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      triggerNotification('O instalador não está disponível. Tente usar o menu do navegador "Instalar Aplicativo".', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      triggerNotification('Instalação iniciada!', 'info');
    }
  };

  useEffect(() => {
    console.log("Firestore Database ID:", (db as any)?.customUrl || (db as any)?._databaseId?.database || "default");
    const testConnectionBase = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
        // handleFirestoreError(error, OperationType.GET, 'test/connection'); // Optional for test connection
      }
    };
    testConnectionBase();
  }, []);

  const [appData, setAppData] = useState<AppState | null>(() => {
    try {
      const saved = localStorage.getItem('horizonte_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Local storage parsing error: ", e);
      return null;
    }
  });
  const [isLogged, setIsLogged] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'critical' | 'info'} | null>(null);
  const [showSyncConsent, setShowSyncConsent] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [currentViewRole, setCurrentViewRole] = useState<'teacher' | 'student'>('teacher');
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));

  const isAdminUser = () => {
    if (!appData) return false;
    const isJefsonEmail = auth.currentUser?.email === 'jefson.ti@gmail.com' || auth.currentUser?.email === 'jefson.s.a7@gmail.com';
    const isJefsonCpf = (appData.cpf || "").replace(/\D/g, "") === '00995845301';
    return isJefsonEmail || isJefsonCpf;
  };

  useEffect(() => {
    // Initial sync connection setup
    const handleOnline = () => {
      processSyncQueue();
      if (localStorage.getItem('google_access_token')) {
        executeGoogleSync(true); // Silent sync
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Attempt auto-sync right after mount if online and has token
    if (navigator.onLine && localStorage.getItem('google_access_token')) {
      handleOnline();
    }

    // Unify Duplicate Jefson profiles
    const fixJefsonProfile = async () => {
      try {
        const rawCpf = '00995845301';
        const formattedCpf = '009.958.453-01';
        
        const rawUser = await dexieDb.users.get(rawCpf);
        const formattedUser = await dexieDb.users.get(formattedCpf);
        
        let mergedUser = formattedUser || rawUser;
        if (mergedUser) {
           mergedUser.localId = formattedCpf;
           await dexieDb.users.put(mergedUser);
           if (rawUser) {
             await dexieDb.users.delete(rawCpf);
           }
        }
        
        const localData = localStorage.getItem('horizonte_data');
        if (localData) {
           const parsed = JSON.parse(localData);
           if (parsed.cpf === rawCpf || parsed.cpf === formattedCpf) {
              parsed.cpf = formattedCpf;
              parsed.password = '81864895';
              localStorage.setItem('horizonte_data', JSON.stringify(parsed));
              
              setAppData(prev => {
                if (prev) {
                  return { ...prev, cpf: formattedCpf, password: '81864895' };
                }
                return prev;
              });
           }
        }
      } catch (e) {
        console.error("Migration error: ", e);
      }
    };
    fixJefsonProfile();
    
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const updateAppData = (updater: (prev: AppState) => AppState) => {
    setAppData((prev) => {
      let latestPrev = prev;
      if (!latestPrev) {
        // Try fallback to local storage
        const saved = localStorage.getItem('horizonte_data');
        if (saved) {
           try {
             latestPrev = JSON.parse(saved);
           } catch(e) {}
        }
      }
      if (!latestPrev) return prev; // Keep as is if still null
      
      const newData = updater(latestPrev);
      localStorage.setItem('horizonte_data', JSON.stringify(newData));
      
      // Bridge data into offline dexie
      try {
        if (newData.cpf && newData.schoolName) {
          dexieDb.users.put({
            localId: newData.cpf,
            userId: auth.currentUser?.uid || 'local',
            email: `${newData.cpf}@tarefaflow.local`,
            displayName: newData.teacherName,
            photoURL: newData.avatarUrl || '',
            role: newData.role || 'teacher',
            isSynced: false,
            syncStatus: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      } catch(e) {
        console.warn('Dexie Bridge error:', e);
      }
      
      if (auth.currentUser) {
        syncToFirestore(newData);
      }
      
      return newData;
    });
  };


  useEffect(() => {
    initGoogleAuthListener((token) => {
      setAccessToken(token);
      setIsLogged(true);
      setActiveScreen('studentsHub');
    });

    const handleWebToken = (e: any) => {
      if (e.detail) {
        setAccessToken(e.detail);
        setIsLogged(true);
        setActiveScreen('studentsHub');
      }
    };
    window.addEventListener('google-access-token-updated', handleWebToken);
    
    // Check if returning from web browser redirect
    if (window.location.hash.includes('access_token')) {
       const params = new URLSearchParams(window.location.hash.substring(1));
       const token = params.get('access_token');
       if (token) {
          localStorage.setItem('google_access_token', token);
          setAccessToken(token);
          setIsLogged(true);
          setActiveScreen('studentsHub');
          window.location.hash = '';
       }
    }

    return () => {
      window.removeEventListener('google-access-token-updated', handleWebToken);
    };
  }, []);

  useEffect(() => {
    if (appData?.role && appData.role !== 'both') {
      setCurrentViewRole(appData.role);
    } else if (appData?.role === 'both') {
      setCurrentViewRole('teacher');
    }
  }, [appData?.role]);

  useEffect(() => {
  }, [isLogged]);

  useEffect(() => {
  }, []);

  const syncToFirestore = async (data: AppState) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}`;
    try {
      const payload = {
        schoolName: data.schoolName,
        teacherName: data.teacherName,
        birthDate: data.birthDate || '',
        cpf: data.cpf || '',
        password: data.password || '',
        googleSynced: data.googleSynced || false,
        avatarUrl: data.avatarUrl || null,
        role: data.role || 'teacher',
        classesStr: JSON.stringify(data.classes || []),
        occurrencesStr: JSON.stringify(data.occurrences || []),
        googleCalendarEventsStr: JSON.stringify(data.googleCalendarEvents || []),
        googleClassroomActivitiesStr: JSON.stringify(data.googleClassroomActivities || []),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', auth.currentUser.uid), payload);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const fetchGoogleWorkspaceData = async (token: string) => {
    try {
      let events: GoogleEvent[] = [];
      let activities: GoogleCourseWork[] = [];

      const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString() + '&maxResults=10&orderBy=startTime&singleEvents=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const calData = await calRes.json();
      
      if (!calRes.ok) {
        if (calRes.status === 401) {
          throw new Error('Sessão expirada. Por favor, conecte-se ao Google novamente.');
        }
        console.error("Calendar API Error:", calData);
        triggerNotification('Agenda: API não ativada no Google Cloud.', 'critical');
      } else {
        events = (calData.items || []).map((item: any) => {
          const startStr = item.start?.dateTime || item.start?.date;
          const date = startStr ? new Date(startStr) : new Date();
          return {
            id: item.id,
            title: item.summary || 'Evento',
            start: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            month: date.toLocaleString('default', { month: 'short' }).substring(0, 3).toUpperCase(),
            day: date.getDate().toString(),
            dateIso: date.toISOString(),
            syncedToGoogle: true
          };
        });
      }

      try {
        const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tasksRes.status === 401) {
          throw new Error('Sessão expirada. Por favor, conecte-se ao Google novamente.');
        }
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasksEvents = (tasksData.items || []).filter((t: any) => t.due).map((item: any) => {
             // O Google Tasks retorna 'due' no formato YYYY-MM-DDT00:00:00.000Z.
             // Para evitar que o fuso horário retorne para o dia anterior, passamos apenas o ano-mês-dia.
             const [year, month, day] = item.due.substring(0, 10).split('-');
             const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0); // Meio dia local
             return {
               id: item.id,
               title: '⏳ Tarefa: ' + (item.title || 'Sem título'),
               start: 'Prazo',
               month: date.toLocaleString('default', { month: 'short' }).substring(0, 3).toUpperCase(),
               day: date.getDate().toString(),
               dateIso: date.toISOString(),
               syncedToGoogle: true
             };
          });
          events = [...events, ...tasksEvents];
        }
      } catch(e: any) {
        if (e?.message !== 'Failed to fetch') {
          console.warn("Tasks API Error", e);
        }
      }

      const [studentCoursesRes, teacherCoursesRes] = await Promise.all([
        fetch('https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (studentCoursesRes.status === 401 || teacherCoursesRes.status === 401) {
        throw new Error('Sessão expirada. Por favor, conecte-se ao Google novamente.');
      }
      
      const studentCoursesData = studentCoursesRes.ok ? await studentCoursesRes.json() : { courses: [] };
      const teacherCoursesData = teacherCoursesRes.ok ? await teacherCoursesRes.json() : { courses: [] };

      const allCourses = [
        ...(studentCoursesData.courses || []).map((c: any) => ({ ...c, role: 'student' })),
        ...(teacherCoursesData.courses || []).map((c: any) => ({ ...c, role: 'teacher' }))
      ];

      if (allCourses.length === 0) {
        console.info("Classroom: No courses found. (Note: Student or Teacher role has no active Google Classroom courses)");
      } else {
        // Remove duplicates if any (though unlikely)
        const uniqueCourses = Array.from(new Map(allCourses.map(c => [c.id, c])).values());
        
        for (const course of uniqueCourses.slice(0, 5)) {
          // Remover orderBy que pode estar causando BadRequest, adicionar as atividades.
          const workRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=15&courseWorkStates=PUBLISHED`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!workRes.ok) continue;
          
          const workData = await workRes.json();
          const works = workData.courseWork || [];

          let subMap = new Map();
          try {
            const subRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/-/studentSubmissions?userId=me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              const submissions = subData.studentSubmissions || [];
              for (const sub of submissions) {
                subMap.set(sub.courseWorkId, sub.state);
              }
            }
          } catch (e: any) {
            if (e?.message !== 'Failed to fetch') {
              console.error("Error fetching submissions", e);
            }
          }
          
          for (const w of works) {
            // Check if the activity is already completed
            const state = subMap.get(w.id);
            if (state === 'TURNED_IN' || state === 'RETURNED') {
              continue;
            }

            // Apenas o que existe, sem simular mensagens fake já que foi pedido "nao invente"
            const realMessages: ClassroomMessage[] = [];

            let dueDateStr = 'Sem prazo';
            let isSoon = false;
            if (w.dueDate) {
              dueDateStr = `${w.dueDate.day}/${w.dueDate.month}`;
              // Considera 'Soon' se vencer hoje ou amanhã
              isSoon = true;
            }

            activities.push({
              id: w.id,
              courseId: course.id,
              courseName: course.name,
              teacherName: course.section || 'Professor',
              title: w.title,
              dueDateStr,
              postDateStr: w.creationTime ? new Date(w.creationTime).toLocaleDateString() : 'Desconhecida',
              isSoon,
              messages: realMessages,
              role: course.role as 'teacher' | 'student'
            });
          }
        }
      }

      return { events, activities: activities.slice(0, 10) };
    } catch (e: any) {
      if (e instanceof Error && e.message.includes('Sessão expirada')) {
        localStorage.removeItem('google_access_token');
        setAccessToken(null);
        updateAppData(prev => ({ ...prev, googleSynced: false }));
        throw e;
      }
      if (e?.message !== 'Failed to fetch') {
        console.error("API Fetch Error", e);
      }
      return { events: [], activities: [] };
    }
  };

  const handleGoogleSync = async () => {
    setShowSyncConsent(true);
  };

  const executeGoogleSync = async (silent = false, isRetry = false) => {
    if (!silent) setShowSyncConsent(false);
    if (!silent) setIsSyncingGoogle(true);
    try {
      let token = isRetry ? null : (localStorage.getItem('google_access_token') || accessToken);

      if (!token) {
        if (silent) return; // Do not interrupt user in background
        // Must authorize to get token without popup
        if (window.Capacitor?.isNativePlatform()) {
          const clientId = '1067272365451-9tkkbb5d9t5a560205856eb2h7v9c30h.apps.googleusercontent.com'; // Placeholder
          const redirectUri = 'br.com.jefson.tarefaflow://auth';
          const scopes = encodeURIComponent('email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/tasks');
          
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=${scopes}&nonce=tarefaflow123`;
          
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: authUrl });
          if (!silent) setIsSyncingGoogle(false);
          return; // Will come back via deep link
        } else {
          const provider = new GoogleAuthProvider();
          provider.addScope('email');
          provider.addScope('profile');
          provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
          provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
          provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
          provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
          provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
          provider.addScope('https://www.googleapis.com/auth/calendar.events');
          provider.addScope('https://www.googleapis.com/auth/tasks.readonly');
          provider.addScope('https://www.googleapis.com/auth/tasks');
          provider.setCustomParameters({ prompt: 'select_account' });
          
          try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            token = credential?.accessToken || null;
            
            if (token) {
              localStorage.setItem('google_access_token', token);
              setAccessToken(token);
              window.dispatchEvent(new CustomEvent('google-access-token-updated', { detail: token }));
            } else {
              if (!silent) setIsSyncingGoogle(false);
              return;
            }
          } catch (error: any) {
            if (error.code === 'auth/internal-error') {
               console.error("Firebase Internal Error during sync. Checking authorized domains or pop-up blockers is recommended.", error);
               if (!silent) triggerNotification('Erro de autenticação (Internal Error). Verifique bloqueadores de pop-up.', 'critical');
            } else if (error.code === 'auth/unauthorized-domain') {
               console.error("Domínio não autorizado no Firebase Auth", error);
               if (!silent) triggerNotification('Erro: Domínio não autorizado no Firebase. Adicione a URL atual no Firebase Console > Authentication > Authorized domains.', 'critical');
            }
            throw error;
          }
        }
      }
      
      let fetchedData = null;
      if (token) {
        if (!silent) triggerNotification('Sincronizando dados com o Google Workspace...', 'info');
        
        let newEventsSynced = 0;
        // Push local unsynced events first
        let currentAppData = null;
        try {
          currentAppData = JSON.parse(localStorage.getItem('horizonte_data') || 'null');
        } catch(e) { }
        if (currentAppData?.googleCalendarEvents) {
          const unsynced = currentAppData.googleCalendarEvents.filter((e: any) => e.isCustom && !e.syncedToGoogle && e.dateIso);
          for (const ev of unsynced) {
            try {
              const startDate = new Date(ev.dateIso!);
              const [hours, minutes] = ev.start.split(':').map(Number);
              startDate.setHours(hours, minutes, 0, 0);
              const endDate = new Date(startDate);
              endDate.setHours(hours + 1);
              
              await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  summary: ev.title,
                  start: { dateTime: startDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
                  end: { dateTime: endDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                })
              });
              ev.syncedToGoogle = true; // Mark as synced locally later
              newEventsSynced++;
            } catch (err) {
              console.error("Error creating event in Google Calendar", err);
            }
          }
          if (newEventsSynced > 0) {
             // We mutated currentAppData inside the loop, need to save it back before we rewrite with fetchedData.
             // Actually `updateAppData` is used down below which will merge. We will merge the synced flag there
             localStorage.setItem('horizonte_data', JSON.stringify(currentAppData));
          }
        }

        fetchedData = await fetchGoogleWorkspaceData(token);
        
        if (newEventsSynced > 0) {
          triggerNotification(`${newEventsSynced} agendamento(s) sincronizado(s) com sucesso.`, 'info');
        }
      }
      
      const currentUser = auth.currentUser;
      let latestAppData = null;
      try {
        latestAppData = JSON.parse(localStorage.getItem('horizonte_data') || 'null');
      } catch (e) {}
      
      if (currentUser || latestAppData) {
        let newData = { 
          ...latestAppData!, 
          googleSynced: true,
          ...(currentUser?.photoURL && { avatarUrl: currentUser.photoURL.replace('s96-c', 's256-c') }),
          ...(fetchedData && {
            googleCalendarEvents: fetchedData.events,
            googleClassroomActivities: fetchedData.activities
          })
        };
        // updateAppData instead of raw setAppData to trigger dexie bridge
        updateAppData(() => newData);
        if (!silent) triggerNotification('Conta sincronizada! Acesse Agenda/Início para ver os dados.', 'info');
      }
    } catch (e: any) {
      if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        console.log("Sincronização cancelada pelo usuário.");
      } else if (e instanceof Error && e.message.includes('Sessão expirada')) {
        console.log("Sessão do Google expirada.");
        if (!silent && !isRetry) {
          await executeGoogleSync(false, true);
          return;
        } else if (!silent) {
          triggerNotification('Sessão expirada. Por favor, conecte-se ao Google novamente.', 'info');
        }
      } else {
        console.error("Google sync error", e);
        if (!silent) {
          const msg = e instanceof Error ? e.message : 'Erro ao sincronizar com Google.';
          triggerNotification(msg.substring(0, 80), 'critical');
        }
      }
    } finally {
      if (!silent) setIsSyncingGoogle(false);
    }
  };

  // Real-time listener for offline->online sync & cross-tab
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists() && !docSnap.metadata.hasPendingWrites) {
        const data = docSnap.data();
        let parsedClasses = [];
        let parsedOccurrences = [];
        let parsedEvents = [];
        let parsedActivities = [];
        try { if(data.classesStr) parsedClasses = JSON.parse(data.classesStr) || []; } catch(e) {}
        try { if(data.occurrencesStr) parsedOccurrences = JSON.parse(data.occurrencesStr) || []; } catch(e) {}
        try { if (data.googleCalendarEventsStr) parsedEvents = JSON.parse(data.googleCalendarEventsStr) || []; } catch(e) {}
        try { if (data.googleClassroomActivitiesStr) parsedActivities = JSON.parse(data.googleClassroomActivitiesStr) || []; } catch(e) {}
        const remoteApp: AppState = {
          schoolName: data.schoolName,
          teacherName: data.teacherName,
          birthDate: data.birthDate,
          cpf: data.cpf,
          password: data.password,
          googleSynced: data.googleSynced,
          avatarUrl: data.avatarUrl,
          role: data.role,
          classes: parsedClasses,
          occurrences: parsedOccurrences,
          googleCalendarEvents: parsedEvents,
          googleClassroomActivities: parsedActivities
        };
        setAppData(remoteApp);
        localStorage.setItem('horizonte_data', JSON.stringify(remoteApp));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  // Handle restoring session if already google synced
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
       // if we have local appData that says googleSynced but user is null, we are disconnected
       // the persistence handle covers it, but Auth might need sign in
    });
    return () => unsubscribe();
  }, []);

  const handleRegistrationComplete = (data: AppState) => {
    setAppData(data);
    localStorage.setItem('horizonte_data', JSON.stringify(data));
    setIsLogged(true);
    setActiveScreen('studentsHub');
    if (auth.currentUser) {
      syncToFirestore(data);
    }
  };

  const triggerNotification = (message: string, type: 'critical' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getScreenTitle = () => {
    switch(activeScreen) {
      case 'dashboard': return 'Dashboard';
      case 'studentsHub': return 'Alunos';
      case 'attendance': return 'Frequência';
      case 'agenda': return 'Agenda';
      case 'reports': return 'Relatórios';
      case 'boletim': return 'Boletim';
      case 'occurrence': return 'Nova Ocorrência';
      case 'settings': return 'Configurações';
      case 'classes': return 'Turmas e Alunos';
      case 'director': return 'Sala da Diretora';
      case 'materials': return 'Preparar Materiais';
      default: return appData?.schoolName || 'Horizonte';
    }
  };

  // Build a flat list of all students for the screens to use
  const allStudents = appData ? (appData.classes || []).flatMap(c => c.students) : [];

  const renderScreen = () => {
    switch(activeScreen) {
      case 'dashboard': return (
        <DashboardScreen 
          onNavigate={setActiveScreen} 
          onNewOccurrence={() => setActiveScreen('occurrence')} 
          appData={appData!} 
          onShowNotification={(msg) => triggerNotification(msg, 'info')} 
          onSyncGoogle={handleGoogleSync} 
          isSyncingGoogle={isSyncingGoogle}
          currentViewRole={currentViewRole} 
          onToggleViewRole={(r) => setCurrentViewRole(r)} 
          onUpdateActivities={(activities) => {
            updateAppData(prev => ({ ...prev, googleClassroomActivities: activities }));
          }}
          onUpdateClasses={(classes) => {
            updateAppData(prev => ({ ...prev, classes }));
          }}
        />
      );
      case 'studentsHub': return (
        <StudentsHubScreen 
          onNavigate={(s) => {
            if (s === 'occurrence') setSelectedStudentId(null);
            setActiveScreen(s);
          }}
          onOpenGrades={() => setShowGradeDialog(true)}
        />
      );
      case 'attendance': return (
        <AttendanceScreen 
          classes={appData?.classes || []} 
          onFinish={() => setActiveScreen('studentsHub')} 
          onSelectStudent={(id) => { setSelectedStudentId(id); setActiveScreen('occurrence'); }}
          onUpdateStatus={(classId, studentId, date, status) => {
            updateAppData(prev => ({
              ...prev,
              classes: prev.classes.map(c => c.id === classId ? {
                ...c,
                students: c.students.map(s => s.id === studentId ? {
                  ...s,
                  status,
                  attendanceHistory: {
                    ...(s.attendanceHistory || {}),
                    [date]: status
                  }
                } : s)
              } : c)
            }));
          }}
        />
      );
      case 'agenda': return (
        <AgendaScreen 
          appData={appData!} 
          onShowNotification={(msg) => triggerNotification(msg, 'info')} 
          onSyncGoogle={handleGoogleSync} 
          isSyncingGoogle={isSyncingGoogle}
          onSaveEvent={(newEvent) => {
            updateAppData(prev => ({
              ...prev,
              googleCalendarEvents: [...(prev.googleCalendarEvents || []), newEvent].sort((a,b) => (a.start || "").localeCompare(b.start || ""))
            }));
            if (navigator.onLine && localStorage.getItem('google_access_token')) {
              // trigger a silent sync slightly after state update
              setTimeout(() => {
                executeGoogleSync(true);
              }, 1000);
            }
          }}
        />
      );
      case 'occurrence': return (
        <OccurrenceScreen 
          student={allStudents.find(s => s.id === selectedStudentId)} 
          occurrences={appData?.occurrences.filter((o: Occurrence) => o.studentId === selectedStudentId) || []}
          classes={appData?.classes || []}
          onSelectStudent={(id) => setSelectedStudentId(id)}
          onSave={async (accData) => {
             const student = allStudents.find(s => s.id === accData.studentId);
             if (accData.status === 'critical') {
               // Try to show a local push notification if permitted
               if ('Notification' in window && Notification.permission === 'granted') {
                 new Notification('Alerta Crítico: ' + (student?.name || 'Aluno'), {
                   body: accData.notes.substring(0, 50) + '...',
                   icon: '/icon-192x192.png'
                 });
               } else if ('Notification' in window && Notification.permission !== 'denied') {
                 Notification.requestPermission().then(permission => {
                   if (permission === 'granted') {
                     new Notification('Alerta Crítico: ' + (student?.name || 'Aluno'), {
                       body: accData.notes.substring(0, 50) + '...',
                       icon: '/icon-192x192.png'
                     });
                   }
                 });
               }
             }

             updateAppData(prev => {
               const newOcc: Occurrence = { id: Date.now().toString(), ...accData };
               if (newOcc.status === 'critical') {
                 setTimeout(() => triggerNotification(`⚠️ ALERTA CRÍTICO: ${student?.name} - Ocorrência Crítica`, 'critical'), 10);
               } else {
                 setTimeout(() => triggerNotification(`Ocorrência registrada com sucesso.`, 'info'), 10);
               }

               let updatedEvents = prev.googleCalendarEvents || [];
               if (newOcc.meetingReminderDate && newOcc.meetingReminderTime) {
                 const meetingDate = new Date(newOcc.meetingReminderDate);
                 const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                 const newEvent = {
                   id: 'meeting-' + Date.now().toString(),
                   title: `Reunião c/ responsável de ${student?.name}`,
                   month: monthNames[meetingDate.getMonth()],
                   day: meetingDate.getDate().toString(),
                   time: newOcc.meetingReminderTime,
                   start: newOcc.meetingReminderTime,
                   dateIso: newOcc.meetingReminderDate,
                   isCustom: true,
                   syncedToGoogle: false
                 };
                 updatedEvents = [...updatedEvents, newEvent];
                 
                 // Se o token existir, tenta sincronizar depois
                 if (localStorage.getItem('google_access_token')) {
                   setTimeout(() => {
                     executeGoogleSync(true);
                   }, 2000);
                 }
               }

               return { ...prev, occurrences: [...prev.occurrences, newOcc], googleCalendarEvents: updatedEvents };
             });
             setActiveScreen('studentsHub');
          }}
          onCancel={() => setActiveScreen('studentsHub')} 
        />
      );
      case 'reports':
      case 'boletim': return (
        <ReportsScreen 
          appData={appData!} 
          onUpdateClasses={(newClasses) => updateAppData(prev => ({ ...prev, classes: newClasses }))}
          onShowNotification={(msg) => triggerNotification(msg, 'info')}
          currentViewRole={currentViewRole}
          initialModule={activeScreen === 'boletim' ? 'evaluations' : undefined}
        />
      );
      case 'classes': return (
        <ClassesScreen 
          appData={appData!} 
          onUpdateClasses={(newClasses) => updateAppData(prev => ({ ...prev, classes: newClasses }))}
        />
      );
      case 'materials': return (
        <MaterialsScreen 
          appData={appData!} 
          onUpdateMaterials={(mats) => updateAppData(prev => ({ ...prev, materials: mats }))}
        />
      );
      case 'director': return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <UserCheck className="w-16 h-16 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sala da Diretora</h2>
          <p className="text-slate-500 max-w-sm">Esta área está em desenvolvimento. Em breve você terá acesso a relatórios gerenciais e controle institucional.</p>
          <button onClick={() => setActiveScreen('studentsHub')} className="mt-8 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Voltar ao Início</button>
        </div>
      );
      case 'settings': return <SettingsScreen 
        appData={appData!} 
        onUpdateField={(field, value) => updateAppData(prev => ({ ...prev, [field]: value }))} 
        onLogout={() => setIsLogged(false)}
        onSyncGoogle={handleGoogleSync}
        isSyncingGoogle={isSyncingGoogle}
        onInstall={handleInstallApp}
        canInstall={!!deferredPrompt}
        isAdmin={isAdminUser()}
        onNavigateAdmin={() => setActiveScreen('admin')}
      />;
      case 'admin': return isAdminUser() ? (
        <AdminScreen 
          appData={appData!} 
          onUpdateField={(field, value) => updateAppData(prev => ({ ...prev, [field]: value }))} 
          onShowNotification={triggerNotification}
        />
      ) : (
        <div className="py-20 text-center">
           <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
           <p className="text-red-500 font-bold">Acesso Negado</p>
           <button onClick={() => setActiveScreen('studentsHub')} className="mt-4 text-primary text-sm font-bold">Voltar</button>
        </div>
      );
      default: return null;
    }
  };

  if (!isLogged) {
    if (authMode === 'register') {
      return <RegistrationScreen 
        onComplete={handleRegistrationComplete} 
        onSwitchToLogin={() => setAuthMode('login')} 
        onShowNotification={triggerNotification}
      />;
    } else {
      return (
        <LoginScreen 
          appData={appData} 
          onLogin={(fetchedData) => {
            if (fetchedData) {
              setAppData(fetchedData);
              localStorage.setItem('horizonte_data', JSON.stringify(fetchedData));
            }
            setIsLogged(true);
          }} 
          onSwitchToRegister={() => setAuthMode('register')} 
          onShowNotification={triggerNotification}
          onWipeData={() => {
            localStorage.removeItem('horizonte_data');
            localStorage.removeItem('google_access_token');
            setAppData(null);
            auth.signOut();
            dexieDb.delete().then(() => {
                setAuthMode('register');
                window.location.reload(); 
            });
          }}
        />
      );
    }
  }

  if (!appData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8ff] dark:bg-slate-900">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold font-manrope">Carregando dados...</p>
        <button 
           onClick={() => { setIsLogged(false); auth.signOut(); }}
           className="mt-6 text-xs text-primary underline"
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  if (appData?.billingStatus === 'overdue' && !isAdminUser()) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
           <AlertTriangle className="w-12 h-12 text-red-500 shadow-sm" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-tight">Aplicativo Suspenso</h2>
        <p className="text-slate-500 dark:text-slate-400 font-manrope text-sm leading-relaxed mb-8 max-w-xs">
          O acesso ao Colégio Horizonte foi temporariamente suspenso devido a pendências na ativação do plano. Entre em contato com o suporte para regularizar.
        </p>
        <div className="w-full space-y-3">
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="block w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase text-xs tracking-widest">
            Falar com Ativação
          </a>
          <button 
            onClick={() => { setIsLogged(false); auth.signOut(); }}
            className="w-full text-slate-400 font-bold py-2 text-xs uppercase tracking-widest hover:text-primary transition-colors"
          >
            Sair da Conta
          </button>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 w-full">
           <p className="text-[10px] text-slate-400 font-bold uppercase">ID do Cliente: {appData.schoolName || 'N/A'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#1a1b21] dark:text-slate-50 selection:bg-primary/10">
      <AnimatePresence>
        {notification && (
          <motion.div 
             initial={{ opacity: 0, y: -50 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -50 }}
             className="fixed top-20 left-0 w-full z-[100] px-4 flex justify-center pointer-events-none"
          >
            <div className={`shadow-xl rounded-2xl p-4 flex items-center gap-3 max-w-sm w-full ${notification.type === 'critical' ? 'bg-red-500 text-white' : 'bg-primary-container text-primary'} pointer-events-auto`}>
              {notification.type === 'critical' ? <AlertOctagon className="w-6 h-6 shrink-0" /> : <Check className="w-6 h-6 shrink-0" />}
              <span className="font-manrope text-sm font-bold flex-1">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header 
        title={getScreenTitle()} 
        avatarUrl={appData?.avatarUrl}
        showBack={activeScreen === 'occurrence' || activeScreen === 'settings' || activeScreen === 'classes' || activeScreen === 'director' || activeScreen === 'materials' || activeScreen === 'boletim' || activeScreen === 'attendance' || activeScreen === 'admin'}
        onBack={() => {
          setActiveScreen('studentsHub');
        }}
        onSettings={activeScreen !== 'settings' ? () => setActiveScreen('settings') : undefined}
        onNavigateDirector={() => setActiveScreen('director')}
      />
      
      <main className="pt-24 px-6 max-w-4xl mx-auto pb-6">
        {appData?.role === 'both' && activeScreen !== 'occurrence' && activeScreen !== 'settings' && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full mx-auto mb-6 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
            <button 
              onClick={() => setCurrentViewRole('teacher')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${currentViewRole === 'teacher' ? 'bg-white dark:bg-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-primary scale-[1.02]' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50 scale-100'}`}
            >
              Visão Professor
            </button>
            <button 
              onClick={() => setCurrentViewRole('student')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${currentViewRole === 'student' ? 'bg-white dark:bg-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-primary scale-[1.02]' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50 scale-100'}`}
            >
              Visão Aluno
            </button>
          </div>
        )}
        
        <SystemNotices notices={appData.adminNotices || []} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {activeScreen !== 'occurrence' && (
        <BottomNav active={activeScreen} onChange={setActiveScreen} role={currentViewRole} isSuperAdmin={isAdminUser()} />
      )}

      {showGradeDialog && (
        <QuickGradeDialog 
          isOpen={showGradeDialog}
          onClose={() => setShowGradeDialog(false)}
          appData={appData!}
          onShowNotification={(msg) => triggerNotification(msg, 'info')}
          onUpdateClasses={(classes) => updateAppData(prev => ({ ...prev, classes }))}
        />
      )}

      {/* Sync Consent Modal */}
      <AnimatePresence>
        {showSyncConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">Permissão de Acesso</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope text-center mb-6 leading-relaxed">
                Para sincronizar sua agenda e atividades do Classroom, o aplicativo solicitará acesso ao seu e-mail e dados do Google Workspace. Apenas as turmas e eventos que você tem acesso serão exibidos.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeGoogleSync}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg active:scale-95"
                >
                  Autorizar Acesso
                </button>
                <button 
                  onClick={() => setShowSyncConsent(false)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
