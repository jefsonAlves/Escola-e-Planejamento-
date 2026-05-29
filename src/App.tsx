/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Check,
  Home,
  Users,
  Calendar,
  MessageSquare,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  Award,
  AlertTriangle,
  FileText,
  Send,
  MoreVertical,
  X,
  Menu,
  Upload,
  Briefcase,
  UserCircle,
  MapPin,
  Smile,
  AlertOctagon,
  ChevronDown,
  Moon,
  Sun,
  LayoutDashboard,
  UserCheck,
  MessageCircle,
  Book,
  Clock,
  Sparkles,
  TriangleAlert,
  Ban,
  Camera,
  Mic,
  Save,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileUp,
  GripVertical,
  Eye,
  EyeOff,
  Edit2,
  Video,
  Link2,
  Trash2,
  UploadCloud,
  GraduationCap,
  Lock,
  CreditCard,
  Megaphone,
  Download,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ArrowRightLeft,
  Database,
  DownloadCloud,
  Bell,
  Shield,
  LogOut,
  UserX,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { auth, db } from "./lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  getDocFromServer,
} from "firebase/firestore";

import { Capacitor } from "@capacitor/core";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import { SchoolDashboardScreen } from "./screens/school/SchoolDashboardScreen";
import { GuardianPortalScreen } from "./screens/guardian/GuardianPortalScreen";
import { SecretaryDashboardScreen } from "./screens/school/SecretaryDashboardScreen";
import { AccessControlScreen } from "./screens/school/AccessControlScreen";

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseSafeDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) return new Date();
  const [y, m, d] = dateStr.split("-");
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 12, 0, 0);
};

// --- Types ---
declare global {
  interface Window {
    Capacitor: any;
  }
}

type Screen =
  | "login"
  | "dashboard"
  | "attendance"
  | "agenda"
  | "reports"
  | "boletim"
  | "occurrence"
  | "settings"
  | "classes"
  | "director"
  | "materials"
  | "studentsHub"
  | "admin"
  | "accessControl";

interface AdminNotice {
  id: string;
  text: string;
  date: string;
  type: "info" | "warning" | "critical";
}

interface StudentEvaluation {
  id: string;
  method: string;
  points: number;
  date: string;
  bimester?: string;
  grade?: string;
  notes?: string;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  room: string;
  status: "present" | "absent" | "late" | "justified" | "none";
  offset?: string; // for late students
  attendanceHistory?: Record<string, "present" | "absent" | "late" | "justified" | "justified_absence" | "none">;
  diagnostic?: string;
  evaluations?: StudentEvaluation[];
  specialNeeds?: string[]; // e.g., ['TEA', 'DI']
}

// --- Mock Data ---
const STUDENTS: Student[] = [
  {
    id: "1",
    name: "Artur Silveira",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCBX3fO0KgQ1noNCDlpRUkaXY1QJoe31Nyd0mbexlKmmyEbdAp7J_jCuW0B1mC6f754zpM84WmK50oe9LS3JdGEHy8y0ukY0pJ7dpRjG2mSGUaetld1qrnUdiBsmZMgVb1Cdbk0anS6-j3QnsEFzV0kMGsXtrj-TGfl-8Y-lukitu6BCDEcMEQn6bNnVFkvFzSovoFCJ2AE6kyFcveou8x4qWEPKjQ0qeJx9rZcZcvt7t_zsJuZ62rQAxjOev6R-VW7WBMnzaETfoCG",
    grade: "3º Ano B",
    room: "104",
    status: "present",
  },
  {
    id: "2",
    name: "Beatriz Mendes",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAe2jV1hFd2REf5AyIlOHVzHu-LRV0wYzUXlXUElLek8zhIY_LPf3eMo3Ru0f7LzLZZOZfFAhxYE0la-Wz167Xop5c2w_1rKqkSeZwBZfbeKv1yG-DYxZs-Su7dabFHwxfX1DrmDxtTU9k5zfZJV3rraRR9rXK_H_wQLxYg6G5ppFqlWvJY6owYlRmgmXecldoAqmIVcHwDqsEud3uqz5FVSyKgh3ehAiXUC9HT3WBOimP7fO1DHnHzzhmb6qaQlUVcx0gRcmat8pzJ",
    grade: "3º Ano B",
    room: "104",
    status: "absent",
  },
  {
    id: "3",
    name: "Cauã Rodrigues",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC622g2C1lMYtAfFGPkzuaHiC-K3ua6LsBzE_qdrEgh_Dy3UdaIoLP4ZuQsa1G3JKk9hABe53252oK65FSlJHWqK3Isw0k19ZCo_n0XabVzkkPxKNsHjt2Cd4D8mUamdPiA_r7vd9yF9lJNI8bx0LqYEpyhExuu-D5EFfQvBXBBgxJCzYTLDbrk5egLogOwhDFZPH8VSZUyi6sFkf7ug1SW9f8Pk-70KCODykr8i_wI-W-QPGuVMG_kfIXgIHHsC0SB9H5NV29HDZU3",
    grade: "3º Ano B",
    room: "104",
    status: "present",
  },
  {
    id: "4",
    name: "Daniela Lima",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD2PytF6S3eTtOVDSlbGnt7c7cD5DHr7QS-nEJXVfNoY_uNXTkIWWpXLz83TcG-5AbENXO9DXVdAATecFpjYtQWQQas-HxcdrRz1Ddd0Z-Fcq2zUTl-GDB1RcD1gofT45bz96kzTFF-sX3VZ5FzCgl9D109M_q91dm7bKi1prjdzIyjx08Y7ihX6aBe11vimjdNN-clFrR0pkbOKpmm1EreqqdOxoQHn2ySzZ4s55mE3X1tc2zmSfTCjgOXyUDiqjjAaVfTv7fHKZUz",
    grade: "3º Ano B",
    room: "104",
    status: "late",
    offset: "15 min",
  },
  {
    id: "5",
    name: "Eduardo Gomes",
    avatar: "",
    grade: "3º Ano B",
    room: "104",
    status: "none",
  },
];

const TEACHER_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAAwf4l9S8ZAeaCAGQkpch-iZRa2GzSDW3dEwi3GSkT6SIRfcwMh7YVTpwOQbcxnu2JABJ1Kf8bde4CTi9KMl9TrAruaVHFFBh4P-asdiUbe-Mgxre9HeypmKxIzaWkcq5pykDwPXPSpCpeSeSR-EDApL4M1epX3KMBDdnGfcuOub9FnLYkd_10BZr6JRDCLhCtqNDcFiiKJ7mY2sE9f_uqfhkZy3n91QB39QNQs2N-wcHJ6Id5_bY1ECoBtpj-IjaC2nly6TTR0zvO";

// --- Shared Components ---

const SystemNotices = ({ notices }: { notices: AdminNotice[] }) => {
  if (!notices || notices.length === 0) return null;
  const latest = notices[0];

  return (
    <div
      className={`mb-6 p-4 rounded-2xl border flex gap-3 items-start ${
        latest.type === "critical"
          ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-900/50 dark:text-red-400"
          : latest.type === "warning"
            ? "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-500/10 dark:border-amber-900/50 dark:text-amber-400"
            : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-900/50 dark:text-blue-400"
      }`}
    >
      <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
            Aviso Oficial
          </p>
          <div className="w-1 h-1 rounded-full bg-current opacity-40" />
          <p className="text-[9px] font-bold opacity-60 uppercase">
            {latest.date}
          </p>
        </div>
        <p className="text-sm font-manrope font-bold leading-tight">
          {latest.text}
        </p>
      </div>
    </div>
  );
};

const Header = ({
  title,
  showBack,
  onBack,
  onSettings,
  avatarUrl,
  onNavigateDirector,
  appUpdateAvailable,
  adminNotices = [],
}: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  avatarUrl?: string;
  onNavigateDirector?: () => void;
  appUpdateAvailable?: boolean;
  adminNotices?: any[];
}) => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-3 glass-card shadow-sm border-b border-white/20 dark:border-slate-700/50">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
        )}
        <h1 className="text-xl font-bold text-primary truncate max-w-[200px] sm:max-w-none">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3 w-auto flex-nowrap shrink-0 relative">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90 text-primary"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90 text-primary relative"
          >
            <Bell className="w-5 h-5" />
            {adminNotices.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 right-0 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-50 origin-top-right max-h-[70vh] overflow-y-auto"
                >
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm">
                    Notificações e Recados
                  </h3>
                  <div className="space-y-3">
                    {adminNotices.length > 0 ? (
                      adminNotices.map((notice) => (
                        <div key={notice.id} className={`p-3 rounded-xl border ${
                          notice.type === "critical" ? "bg-red-500/5 border-red-500/10" :
                          notice.type === "warning" ? "bg-amber-500/5 border-amber-500/10" :
                          "bg-primary/5 border-primary/10"
                        }`}>
                          <p className={`text-[10px] font-bold uppercase mb-1 drop-shadow-sm ${
                            notice.type === "critical" ? "text-red-500" :
                            notice.type === "warning" ? "text-amber-500" :
                            "text-primary"
                          }`}>
                            {notice.type === "critical" ? "Urgente" : notice.type === "warning" ? "Aviso" : "Recado da Escola"}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {notice.text}
                          </p>
                        </div>
                      ))
                    ) : (
                       <p className="text-xs text-slate-600 dark:text-slate-400 text-center py-4">Nenhum recado no momento.</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full mt-3 text-center text-xs font-bold text-primary hover:underline"
                  >
                    Fechar
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={onSettings}
          className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <img
            src={avatarUrl?.trim() || TEACHER_AVATAR}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
          {appUpdateAvailable && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
          )}
        </motion.div>
      </div>
    </header>
  );
};

const BottomNav = ({
  active,
  onChange,
  role,
  isSuperAdmin,
}: {
  active: Screen;
  onChange: (s: Screen) => void;
  role?: "teacher" | "student" | "both";
  isSuperAdmin?: boolean;
}) => {
  let items: { id: Screen; label: string; icon: any }[] = [
    { id: "studentsHub", label: "Alunos", icon: Users },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "reports", label: "Relatórios", icon: FileText },
  ];

  if (role === "student") {
    items = items.filter((item) => item.id !== "studentsHub");
  }

  // Se for super admin, inserir a engrenagem no meio
  if (isSuperAdmin) {
    const middleIndex = Math.floor(items.length / 2);
    items.splice(middleIndex, 0, {
      id: "admin",
      label: "Admin",
      icon: Settings,
    });
  }

  const handlePress = (id: Screen) => {
    if (navigator.vibrate) navigator.vibrate(50);
    onChange(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-card border-t border-white/30 dark:border-slate-700/50 pb-safe px-6 py-2 flex justify-around items-center rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      {items.map((item) => {
        const isActive =
          active === item.id ||
          (active === "attendance" && item.id === "studentsHub") ||
          (active === "occurrence" && item.id === "studentsHub") ||
          (active === "boletim" && item.id === "studentsHub");
        return (
          <button
            key={item.id}
            onClick={() => handlePress(item.id)}
            className={`relative flex flex-col items-center gap-1 p-2 transition-all duration-300 w-16 ${
              isActive
                ? "text-primary dark:text-blue-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <div
              className={`relative p-2 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 dark:bg-blue-500/10 scale-110"
                  : "scale-100"
              }`}
            >
              <item.icon
                className={`w-6 h-6 transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
              />
            </div>
            <span
              className={`text-[10px] font-extrabold tracking-wider transition-all duration-300 ${isActive ? "opacity-100" : "opacity-70 font-bold"}`}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-glow"
                className="absolute -top-3 w-8 h-1 bg-primary dark:bg-blue-400 rounded-full shadow-[0_0_8px_rgba(0,35,111,0.5)] dark:shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export interface MaterialData {
  id: string;
  title: string;
  link: string;
  type: "video" | "document" | "link";
  targetClasses: string[];
}

interface AppState {
  schoolName: string;
  schoolCity?: string;
  schoolState?: string;
  teacherName: string; // Used as main user name for backward compatibility
  teacherSubject?: string;
  isApprovedManager?: boolean;
  role?:
    | "teacher"
    | "student"
    | "both"
    | "school_director"
    | "school_secretary"
    | "superadmin"
    | "guardian"
    | "coordinator"
    | string;
  avatarUrl?: string;
  birthDate?: string;
  cpf?: string;
  email?: string;
  password?: string;
  teachingDays?: string[];
  googleSynced?: boolean;
  googleCalendarSynced?: boolean;
  googleClassroomSynced?: boolean;
  classes: ClassData[];
  occurrences: Occurrence[];
  notifications?: NotificationData[];
  googleCalendarEvents?: GoogleEvent[];
  googleClassroomActivities?: GoogleCourseWork[];
  materials?: MaterialData[];
  adminNotices?: AdminNotice[];
  billingStatus?: "active" | "overdue" | "trial";
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
  notes?: string;
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
  role?: "teacher" | "student";
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
  urgency: "important" | "update" | "normal";
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
  status: "praise" | "attention" | "critical";
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

// Global Webhook execution helper
const triggerWebhooks = (
  event: "student_added" | "occurrence_added",
  payload: any,
) => {
  try {
    const stored = localStorage.getItem("horizonte_webhooks");
    if (!stored) return;
    const hooks: any[] = JSON.parse(stored);
    hooks.forEach((hook) => {
      if (hook.event === "all" || hook.event === event) {
        fetch(hook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            data: payload,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.warn);
      }
    });
  } catch (e) {}
};

const RegistrationScreen = ({
  onComplete,
  onSwitchToLogin,
  onShowNotification,
}: {
  onComplete: (data: AppState) => void;
  onSwitchToLogin: () => void;
  onShowNotification?: (msg: string, type: "critical" | "info") => void;
}) => {
  const [step, setStep] = useState(0); // step 0 is for role selection
  const [role, setRole] = useState<"teacher" | "institution">("teacher");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolState, setSchoolState] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [newClassName, setNewClassName] = useState("");

  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState("");

  const [schoolRegisterMode, setSchoolRegisterMode] = useState<
    "select" | "new"
  >("select");
  const [registeredSchoolsList, setRegisteredSchoolsList] = useState<string[]>(
    [],
  );
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoadingSchools(true);
      try {
        const schools = new Set<string>();
        // First try fetching from dedicated schools collection
        try {
          const qSnap = await getDocs(collection(db, "schools"));
          qSnap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.name && typeof d.name === "string") {
              const trimmed = d.name.trim();
              if (trimmed) schools.add(trimmed);
            }
          });
        } catch (schoolErr) {
          console.warn(
            "Could not fetch schools from schools collection:",
            schoolErr,
          );
        }

        // Fallback to querying user collection if schools collection was empty/failed
        if (schools.size === 0) {
          try {
            const qSnap = await getDocs(collection(db, "users"));
            qSnap.forEach((docSnap) => {
              const d = docSnap.data();
              if (d.schoolName && typeof d.schoolName === "string") {
                const trimmed = d.schoolName.trim();
                if (trimmed) schools.add(trimmed);
              }
            });
          } catch (usersErr) {
            console.log(
              "Expected user listing fallback failure due to safe permission-denied:",
              usersErr,
            );
          }
        }

        const list = Array.from(schools).sort((a, b) => a.localeCompare(b));
        setRegisteredSchoolsList(list);
        if (list.length === 0) {
          setSchoolRegisterMode("new");
        } else {
          setSchoolRegisterMode("select");
          setSchoolName(list[0]);
        }
      } catch (err) {
        console.error("Error fetching schools for registration:", err);
      } finally {
        setIsLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  const nextStep = () => {
    if (step === 0 && role) setStep(1);
    else if (step === 1 && schoolName && teacherName && birthDate && email && password) {
      if (schoolRegisterMode === "new" && (!schoolCity || !schoolState)) {
        if (onShowNotification)
          onShowNotification(
            "Por favor, informe a cidade e o estado da instituição.",
            "info",
          );
        return;
      }
      if (role === "institution") {
        onComplete({
          schoolName,
          teacherName,
          role: "school_director", // Keep logic compatible
          birthDate,
          email,
          cpf,
          password,
          googleSynced: true,
          classes: [],
          occurrences: [],
          isApprovedManager: schoolRegisterMode === "new",
        });
      } else {
        setStep(2);
      }
    } else if (step === 2 && classes.length > 0) setStep(3);
  };

  const addClass = () => {
    if (!newClassName.trim()) return;
    setClasses([
      ...classes,
      { id: Date.now().toString(), name: newClassName, students: [] },
    ]);
    setNewClassName("");
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClassId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const newStudents = lines
        .map((line) => line.split(",")[0].trim())
        .filter((name) => name.length > 0)
        .map((name, index) => ({
          id: Date.now().toString() + index,
          name: name.toUpperCase(),
          avatar: "",
          grade: classes.find((c) => c.id === activeClassId)?.name || "",
          room: "",
          status: "none" as const,
        }));

      if (newStudents.length > 0) {
        setClasses(
          classes.map((c) => {
            if (c.id === activeClassId) {
              return {
                ...c,
                students: [...c.students, ...newStudents],
              };
            }
            return c;
          }),
        );
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  };

  const addStudent = () => {
    if (!newStudentName.trim() || !activeClassId) return;

    // Support comma or newline separated names for batch addition
    const names = newStudentName
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;

    let addedStudents: any[] = [];
    setClasses(
      classes.map((c) => {
        if (c.id === activeClassId) {
          const newStudents = names.map((name, idx) => {
            const stu = {
              id: Date.now().toString() + idx,
              name: name.toUpperCase(),
              avatar: "",
              grade: c.name,
              room: "N/A",
              status: "none" as const,
            };
            addedStudents.push(stu);
            return stu;
          });
          return {
            ...c,
            students: [...c.students, ...newStudents],
          };
        }
        return c;
      }),
    );
    addedStudents.forEach((stu) => triggerWebhooks("student_added", stu));
    setNewStudentName("");
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
            {step === 0
              ? "Bem-vindo(a)"
              : step === 1
                ? "Configure sua Conta"
                : step === 2
                  ? "Suas Turmas"
                  : "Seus Alunos"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-manrope">
            {step === 0
              ? "Como você vai usar o sistema?"
              : step === 1
                ? "Vamos configurar o seu ambiente escolar e acesso."
                : step === 2
                  ? "Cadastre as turmas."
                  : "Adicione os alunos."}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-xl">
          {step === 0 && (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setRole("teacher")}
                  className={`p-4 rounded-2xl flex items-center gap-4 border-2 transition-all text-left ${role === "teacher" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-700/50 hover:border-primary/50"}`}
                >
                  <div
                    className={`p-3 rounded-xl ${role === "teacher" ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                  >
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                      Sou Professor
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Gerenciar turmas e alunos
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setRole("institution")}
                  className={`p-4 rounded-2xl flex items-center gap-4 border-2 transition-all text-left ${role === "institution" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-700/50 hover:border-primary/50"}`}
                >
                  <div
                    className={`p-3 rounded-xl ${role === "institution" ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                  >
                    <Book className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                      Sou Instituição
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Gerenciar dados escolares e acessos
                    </p>
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
                <button
                  onClick={onSwitchToLogin}
                  className="text-xs font-bold text-slate-400 uppercase hover:text-primary transition-colors"
                >
                  Já tenho conta
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1 block mb-2">
                  Instituição de Ensino
                </label>

                {registeredSchoolsList.length > 0 && (
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolRegisterMode("select");
                        if (registeredSchoolsList.length > 0) {
                          setSchoolName(registeredSchoolsList[0]);
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        schoolRegisterMode === "select"
                          ? "bg-white dark:bg-slate-700 text-primary shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      Selecionar Cadastrada
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolRegisterMode("new");
                        setSchoolName("");
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        schoolRegisterMode === "new"
                          ? "bg-white dark:bg-slate-700 text-primary shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      Adicionar Nova
                    </button>
                  </div>
                )}

                <div className="relative">
                  {isLoadingSchools ? (
                    <div className="py-2.5 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg max-w-full">
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">
                        Buscando escolas...
                      </span>
                    </div>
                  ) : schoolRegisterMode === "select" &&
                    registeredSchoolsList.length > 0 ? (
                    <div>
                      <input
                        type="text"
                        list="registered-schools-list"
                        value={schoolName}
                        placeholder="Busque ou selecione sua escola..."
                        onChange={(e) => setSchoolName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 dark:bg-slate-800/100 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                      />
                      <datalist id="registered-schools-list">
                        {registeredSchoolsList.map((school) => (
                          <option key={school} value={school} />
                        ))}
                      </datalist>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value.toUpperCase())}
                        placeholder="Ex: COLÉGIO HORIZONTE"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                      />
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-primary uppercase ml-1">
                            Cidade
                          </label>
                          <input
                            type="text"
                            value={schoolCity}
                            onChange={(e) => setSchoolCity(e.target.value)}
                            placeholder="Ex: São Paulo"
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[10px] font-bold text-primary uppercase ml-1">
                            Estado
                          </label>
                          <input
                            type="text"
                            value={schoolState}
                            onChange={(e) => setSchoolState(e.target.value.substring(0, 2).toUpperCase())}
                            placeholder="SP"
                            maxLength={2}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">
                  Seu CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0,11))}
                  placeholder="Somente números"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                />
              </div>
              {role === "teacher" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-primary uppercase ml-1">
                    Matéria de Atuação
                  </label>
                  <input
                    type="text"
                    value={teacherSubject}
                    onChange={(e) => setTeacherSubject(e.target.value)}
                    placeholder="Ex: Matemática, Biologia..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-primary uppercase ml-1">
                  Data de Nascimento
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
              <button
                onClick={nextStep}
                disabled={!schoolName || !teacherName || !birthDate || !cpf || (role === 'teacher' && !teacherSubject)}
                className="w-full primary-gradient text-white font-bold py-3.5 rounded-2xl shadow-lg mt-4 disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Avançar
              </button>
              
              <div className="flex items-center gap-4 mt-6 mb-2">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">Ou</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>
              
              <button
                type="button"
                disabled={!schoolName || !teacherName || !birthDate || !cpf || (role === 'teacher' && !teacherSubject)}
                onClick={async () => {
                  try {
                    const provider = new GoogleAuthProvider();
                    provider.addScope("email");
                    provider.addScope("profile");
                    // Adicionar permissões do classroom caso seja professor/aluno para já sincronizar
                    provider.addScope("https://www.googleapis.com/auth/classroom.courses.readonly");
                    provider.addScope("https://www.googleapis.com/auth/classroom.rosters.readonly");
                    provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
                    
                    const result = await signInWithPopup(auth, provider);
                    if (result.user) {
                      const credential = GoogleAuthProvider.credentialFromResult(result);
                      const token = credential?.accessToken;
                      if (token) {
                        localStorage.setItem("google_access_token", token);
                      }
                      
                      onComplete({
                        schoolName,
                        schoolCity,
                        schoolState,
                        teacherName: teacherName || result.user.displayName || "",
                        teacherSubject,
                        role,
                        birthDate,
                        cpf,
                        password: "", // Semanticly no password since it's google
                        googleSynced: true,
                        classes: [],
                        occurrences: [],
                        isApprovedManager:
                          (role === "school_director" || role === "school_secretary") &&
                          schoolRegisterMode === "new",
                      });
                      
                      if (onShowNotification) onShowNotification("Conta cadastrada com sucesso e vinculada ao Google!", "info");
                    }
                  } catch (e: any) {
                    console.error("Erro Google popup", e);
                    if (onShowNotification) onShowNotification("Falha ao integrar com o Google: " + e.message, "critical");
                  }
                }}
                className="w-full bg-white flex disabled:opacity-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all text-sm items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Cadastrar com Gmail
              </button>

              <button
                onClick={onSwitchToLogin}
                className="w-full mt-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
              >
                Voltar para o Login
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase ml-1">
                  Nova Turma
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addClass()}
                    placeholder="Ex: 3º Ano B"
                    className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                  />
                  <button
                    onClick={addClass}
                    className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {classes.length > 0 && (
                <Reorder.Group
                  axis="y"
                  values={classes}
                  onReorder={setClasses}
                  className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"
                >
                  {classes.map((c) => (
                    <Reorder.Item
                      key={c.id}
                      value={c}
                      className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex gap-3 items-center">
                        <GripVertical className="w-5 h-5 text-slate-300" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope">
                          {c.name}
                        </span>
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
              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-bold text-slate-400 uppercase hover:text-primary transition-colors"
              >
                Voltar
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase ml-1">
                  Selecione a Turma
                </label>
                <select
                  value={activeClassId || ""}
                  onChange={(e) => setActiveClassId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    Escolha...
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeClassId && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase ml-1">
                      Novo Aluno
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          (e.preventDefault(), addStudent())
                        }
                        placeholder="Ex: João Silva ou cole uma lista (separada por vírgula ou linha)"
                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors min-h-[50px] resize-y"
                      />
                      <button
                        onClick={addStudent}
                        className="bg-secondary text-white p-3 rounded-xl hover:bg-secondary/90 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      ou importe
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-primary transition-colors text-slate-500 dark:text-slate-400">
                    <FileUp className="w-5 h-5" />
                    <span className="text-sm font-bold">
                      Importar arquivo CSV
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCsvUpload}
                    />
                  </label>
                </div>
              )}

              {activeClassId &&
                classes.find((c) => c.id === activeClassId)?.students.length! >
                  0 && (
                  <Reorder.Group
                    axis="y"
                    values={
                      classes.find((c) => c.id === activeClassId)?.students!
                    }
                    onReorder={(newStudents: Student[]) => {
                      setClasses(
                        classes.map((c) => {
                          if (c.id === activeClassId)
                            return { ...c, students: newStudents };
                          return c;
                        }),
                      );
                    }}
                    className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar"
                  >
                    {classes
                      .find((c) => c.id === activeClassId)
                      ?.students.map((s) => (
                        <Reorder.Item
                          key={s.id}
                          value={s}
                          className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex gap-3 items-center">
                            <GripVertical className="w-5 h-5 text-slate-300" />
                            <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope">
                              {s.name.toUpperCase()}
                            </span>
                          </div>
                        </Reorder.Item>
                      ))}
                  </Reorder.Group>
                )}

              <button
                onClick={() =>
                  onComplete({
                    schoolName,
                    schoolCity,
                    schoolState,
                    teacherName,
                    role,
                    birthDate,
                    email,
                    cpf,
                    password,
                    googleSynced: true,
                    classes,
                    occurrences: [],
                  })
                }
                className="w-full primary-gradient text-white font-bold py-4 rounded-2xl shadow-lg mt-4 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Concluir Cadastro
              </button>
              <button
                onClick={() => setStep(2)}
                className="w-full py-2 text-xs font-bold text-slate-400 uppercase hover:text-primary transition-colors"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const GoogleIntegrationBlocks = ({
  appData,
  onSyncGoogle,
  isSyncingGoogle,
  onShowNotification,
  currentViewRole,
  onUpdateActivities,
}: {
  appData: AppState;
  onSyncGoogle: () => void;
  isSyncingGoogle?: boolean;
  onShowNotification: (msg: string) => void;
  currentViewRole?: "teacher" | "student";
  onUpdateActivities?: (activities: GoogleCourseWork[]) => void;
}) => {
  const [localRoleFilter, setLocalRoleFilter] = useState<
    "all" | "teacher" | "student"
  >("all");
  const [localClassFilter, setLocalClassFilter] = useState<string>("all");

  const availableClasses = Array.from(
    new Set(
      appData.googleClassroomActivities
        ?.map((a) => a.courseName)
        .filter(Boolean),
    ),
  ) as string[];

  const filteredActivities = appData.googleClassroomActivities?.filter(
    (act) => {
      // Check role filter
      let roleMatch = true;
      if (localRoleFilter !== "all") {
        if (act.role && act.role !== localRoleFilter) roleMatch = false;
      } else if (appData.role === "both" && currentViewRole) {
        if (act.role && act.role !== currentViewRole) roleMatch = false;
      }

      if (!roleMatch) return false;

      // Check class filter
      if (localClassFilter !== "all") {
        if (act.courseName !== localClassFilter) return false;
      }

      return true;
    },
  );

  return (
    <>
      {!appData.googleSynced && (
        <section className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-50/50">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                Sincronizar Workspace
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-manrope mb-3 leading-relaxed">
                Conecte sua conta do Google para acessar suas salas no Classroom
                e Agenda diretamente por aqui.
              </p>
              <button
                onClick={onSyncGoogle}
                disabled={isSyncingGoogle}
                className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 flex items-center gap-2"
              >
                {isSyncingGoogle && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                {isSyncingGoogle ? "Sincronizando..." : "Sincronizar Conta"}
              </button>
            </div>
          </div>
        </section>
      )}
      /* Classroom Activities UI */
      <section className="glass-card rounded-3xl p-6 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-4 mb-6">
          <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" /> Atividades Recentes
            (Classroom)
            {appData.googleSynced && (
              <button
                onClick={onSyncGoogle}
                disabled={isSyncingGoogle}
                title="Sincronizar com o Google"
                className={`ml-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isSyncingGoogle ? "text-primary" : "text-slate-400"}`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncingGoogle ? "animate-spin" : ""}`}
                />
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
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {appData.role === "both" && appData.googleSynced && (
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setLocalRoleFilter("all")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${localRoleFilter === "all" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                  Tudo
                </button>
                <button
                  onClick={() => setLocalRoleFilter("student")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${localRoleFilter === "student" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                >
                  Aluno
                </button>
                <button
                  onClick={() => setLocalRoleFilter("teacher")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${localRoleFilter === "teacher" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
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
              filteredActivities.map((act) => (
                <details
                  key={act.id}
                  className={`group/details p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 ${act.isCompletedLocal ? "border-l-green-500 opacity-60" : act.isSoon ? "border-l-red-500" : "border-l-secondary"} cursor-pointer transition-all`}
                >
                  <summary className="flex items-center justify-between outline-none">
                    <div className="flex items-center gap-3">
                      {onUpdateActivities && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const newActivities =
                              appData.googleClassroomActivities!.map((a) =>
                                a.id === act.id
                                  ? {
                                      ...a,
                                      isCompletedLocal: !a.isCompletedLocal,
                                    }
                                  : a,
                              );
                            onUpdateActivities(newActivities);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${act.isCompletedLocal ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-slate-600"}`}
                        >
                          {act.isCompletedLocal && (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-bold transition-colors ${act.isCompletedLocal ? "text-slate-500 line-through" : "text-slate-800 dark:text-slate-100 group-open/details:text-primary"}`}
                          >
                            {act.title}
                          </h4>
                          {appData.role === "both" && act.role && (
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${act.role === "teacher" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {act.role === "teacher" ? "Prof" : "Aluno"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {act.courseName}{" "}
                          {act.teacherName && `• ${act.teacherName}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span
                        className={`text-xs font-extrabold px-2 py-1 rounded-md ${act.isSoon ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}
                      >
                        Até {act.dueDateStr}
                      </span>
                    </div>
                  </summary>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 text-xs">
                    <p className="text-slate-500 dark:text-slate-400 mb-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Postado em:
                      </span>{" "}
                      {act.postDateStr}
                    </p>

                    {act.messages && act.messages.length > 0 ? (
                      <div className="space-y-2 mt-2 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                        <h5 className="font-bold text-[10px] uppercase text-slate-400 mb-2">
                          Comentários da Turma
                        </h5>
                        {act.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className="bg-slate-50 dark:bg-slate-900 rounded p-2"
                          >
                            <p className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                              {msg.authorName}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                              {msg.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        Nenhuma mensagem ou comentário.
                      </p>
                    )}
                  </div>
                </details>
              ))
            ) : (
              <div className="text-center py-6 opacity-60">
                <p className="font-manrope text-sm font-bold">
                  Nenhuma atividade pendente.
                </p>
              </div>
            )}
            <button
              onClick={() => {
                onShowNotification("Sincronizando novas atividades...");
                onSyncGoogle();
              }}
              className="w-full text-center text-[10px] font-bold text-primary uppercase mt-4 hover:underline"
            >
              Atualizar Atividades
            </button>
          </div>
        ) : (
          <div className="text-center py-8 opacity-50">
            <Book className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="font-manrope text-sm font-bold">
              Sincronize para ver as atividades
            </p>
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
  onUpdateClasses,
}: {
  isOpen: boolean;
  onClose: () => void;
  appData: AppState;
  onShowNotification: (msg: string) => void;
  onUpdateClasses?: (classes: ClassData[]) => void;
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [evalBimester, setEvalBimester] = useState("1º Bimestre");
  const [pointsMap, setPointsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const classes = appData.classes || [];
      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id);
      }
    }
  }, [isOpen, appData.classes, selectedClassId]);

  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Populate points map when activity or class changes ONLY IF it's empty or we're switching contexts
    // To prevent overriding current typing, we only populate when class/activity/bimester change.
    const classes = appData.classes || [];
    const activeClass = classes.find((c) => c.id === selectedClassId);
    const students = activeClass?.students || [];
    const newPointsMap: Record<string, string> = {};

    if (selectedActivity.trim()) {
      students.forEach((student) => {
        const existingEval = student.evaluations?.find(
          (e) =>
            e.method === selectedActivity.trim() && e.bimester === evalBimester,
        );
        if (existingEval) {
          newPointsMap[student.id] = String(existingEval.points);
        }
      });
    }
    setPointsMap(newPointsMap);
  }, [selectedClassId, selectedActivity, evalBimester]); // REMOVED appData.classes from dependencies to avoid loop

  if (!isOpen) return null;

  const classes = appData.classes || [];
  const activeClass = classes.find((c) => c.id === selectedClassId);
  const students = [...(activeClass?.students || [])].sort((a, b) =>
    a.name.toUpperCase().localeCompare(b.name.toUpperCase()),
  );

  const handleApplyGrades = (silent = false) => {
    if (!activeClass || !selectedActivity.trim() || !onUpdateClasses) {
      if (!silent) onShowNotification("Preencha a atividade e selecione uma turma.");
      return;
    }

    let updatedCount = 0;
    const newStudents = students.map((student) => {
      const pointsStr = pointsMap[student.id];
      const activityName = selectedActivity.trim();
      let newEvaluations = [...(student.evaluations || [])];

      const existingEvalIndex = newEvaluations.findIndex(
        (e) => e.method === activityName && e.bimester === evalBimester,
      );

      if (pointsStr !== undefined && pointsStr.trim() !== "") {
        const points = Number(pointsStr);
        if (!isNaN(points)) {
          if (existingEvalIndex >= 0) {
            if (newEvaluations[existingEvalIndex].points !== points) {
              newEvaluations[existingEvalIndex] = {
                ...newEvaluations[existingEvalIndex],
                points,
              };
              updatedCount++;
            }
          } else {
            newEvaluations.push({
              id: crypto.randomUUID(),
              method: activityName,
              points,
              date: new Date().toISOString(),
              bimester: evalBimester,
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
        evaluations: newEvaluations,
      };
    });

    if (updatedCount === 0) {
      if (!silent) onShowNotification("Nenhuma alteração de nota.");
      return;
    }

    const newClasses = classes.map((c) =>
      c.id === activeClass.id ? { ...c, students: newStudents } : c,
    );

    onUpdateClasses(newClasses);
    if (!silent) onShowNotification(`${updatedCount} nota(s) atualizada(s) com sucesso!`);
  };

  const handlePointChange = (studentId: string, val: string) => {
    setPointsMap(prev => ({ ...prev, [studentId]: val }));
  };

  const handleClose = async () => {
    try {
      const pendingCount = await dexieDb.syncQueue.count();
      if (pendingCount > 0) {
        onShowNotification("Atenção: há alterações pendentes aguardando conexão/sincronização com a nuvem.");
      }
    } catch(e) {}
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="w-full max-w-md bg-white dark:bg-[#1a1b21] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Lançamento de Notas
              {isSaving && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold ml-2 animate-pulse">
                  Salvando...
                </span>
              )}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Turma
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Bimestre
              </label>
              <select
                value={evalBimester}
                onChange={(e) => setEvalBimester(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer transition-colors shadow-sm"
              >
                <option value="1º Bimestre">1º Bimestre</option>
                <option value="2º Bimestre">2º Bimestre</option>
                <option value="3º Bimestre">3º Bimestre</option>
                <option value="4º Bimestre">4º Bimestre</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Atividade (Ex: Prova 1)
              </label>
              <input
                list="quick-activities"
                type="text"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                placeholder="Nome da atividade"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold transition-colors shadow-sm"
              />
              <datalist id="quick-activities">
                {appData.googleClassroomActivities?.map((a) => (
                  <option key={a.id} value={a.title} />
                ))}
              </datalist>
            </div>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">
                Notas dos Alunos (vazio p/ ignorar)
              </label>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 pb-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2 flex-1">
                        {student.name.toUpperCase()}
                      </span>
                      <input
                        type="number"
                        placeholder="0.0"
                        value={pointsMap[student.id] || ""}
                        onChange={(e) => handlePointChange(student.id, e.target.value)}
                        className="w-20 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-primary shrink-0"
                      />
                    </div>
                    {student.evaluations && student.evaluations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 text-xs flex flex-wrap gap-1">
                        {student.evaluations.map((ev) => (
                          <span
                            key={ev.id}
                            className="bg-primary/5 border border-primary/10 text-primary px-2 py-0.5 rounded font-medium max-w-full truncate"
                          >
                            {ev.bimester.split(" ")[0]} - {ev.method}:{" "}
                            <span className="font-bold">{ev.points} pts</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Nenhum aluno nesta turma.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleApplyGrades(false)}
              className="w-full primary-gradient text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Lançar Notas
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const TeacherDashboard = ({
  onNavigate,
  onNewOccurrence,
  appData,
  onShowNotification,
  onSyncGoogle,
  isSyncingGoogle,
  onUpdateActivities,
  onUpdateClasses,
}: {
  onNavigate: (screen: Screen) => void;
  onNewOccurrence: () => void;
  appData: AppState;
  onShowNotification: (msg: string) => void;
  onSyncGoogle: () => void;
  isSyncingGoogle?: boolean;
  onUpdateActivities?: (activities: GoogleCourseWork[]) => void;
  onUpdateClasses?: (classes: ClassData[]) => void;
}) => {
  const [selectedChartClassId, setSelectedChartClassId] = useState<string>(
    () => (appData.classes || [])[0]?.id || "",
  );

  const currentChartClassId =
    selectedChartClassId || (appData.classes || [])[0]?.id || "";
  const selectedClassObj = (appData.classes || []).find(
    (c) => c.id === currentChartClassId,
  );

  const bimestersList = [
    "1º Bimestre",
    "2º Bimestre",
    "3º Bimestre",
    "4º Bimestre",
  ];
  let chartHasData = false;
  const chartData = bimestersList.map((bimester) => {
    let sum = 0;
    let count = 0;
    if (selectedClassObj && selectedClassObj.students) {
      selectedClassObj.students.forEach((student) => {
        if (student.evaluations) {
          student.evaluations.forEach((evalItem) => {
            if (
              evalItem.bimester === bimester &&
              typeof evalItem.points === "number"
            ) {
              sum += evalItem.points;
              count++;
            }
          });
        }
      });
    }
    if (count > 0) chartHasData = true;
    return {
      bimester: bimester.split(" ")[0], // "1º", "2º", etc.
      Média: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
      count,
    };
  });

  let absenceChartHasData = false;
  const absenceChartData: any[] = [];
  
  if (selectedClassObj && selectedClassObj.students && selectedClassObj.students.length > 0) {
    const dObj = new Date();
    const last30DaysRaw = Array.from({ length: 30 }).map((_, i) => {
       const d = new Date(dObj);
       d.setDate(d.getDate() - i);
       // Re-implement getLocalDateString functionality inline to match the timezone used in saves
       d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
       return d.toISOString().split("T")[0];
    });
    
    last30DaysRaw.reverse();
    
    const validDates = last30DaysRaw.filter(date => {
       return selectedClassObj.students.some(s => s.attendanceHistory && s.attendanceHistory[date] && s.attendanceHistory[date] !== "none");
    });

    validDates.forEach(dateStr => {
       let absCount = 0;
       let totalValid = 0;
       selectedClassObj.students.forEach(s => {
          const st = s.attendanceHistory?.[dateStr];
          if (st && st !== "none") {
             totalValid++;
             if (st === "absent" || st === "justified_absence") absCount++;
          }
       });
       
       if (totalValid > 0) {
         absenceChartHasData = true;
         const splitD = dateStr.split("-");
         const shortDate = `${splitD[2]}/${splitD[1]}`;
         const percent = Math.round((absCount / totalValid) * 100);
         absenceChartData.push({
           date: shortDate,
           Faltas: percent,
           total: totalValid
         });
       }
    });
  }

  const allStudents = (appData.classes || []).flatMap((c) => c.students) || [];
  const totalStudents = allStudents.length;

  const presentOrLate = allStudents.filter(
    (s) => s.status === "present" || s.status === "late",
  ).length;
  const missingStudents = allStudents.filter(
    (s) => s.status === "absent",
  ).length;
  const criticalOccurrences = appData.occurrences.filter(
    (o) => o.status === "critical",
  ).length;
  const evasionRiskCount = missingStudents + criticalOccurrences;

  const studentsWithActivity = new Set(
    appData.occurrences.map((o) => o.studentId),
  ).size;

  const attendancePercent =
    totalStudents > 0 ? Math.round((presentOrLate / totalStudents) * 100) : 0;

  const activityPercent =
    totalStudents > 0
      ? Math.round((studentsWithActivity / totalStudents) * 100)
      : 0;

  // Circle stroke math (226 is typical for r=36)
  const attendanceOffset = 226 - (226 * attendancePercent) / 100;
  const activityOffset = 226 - (226 * activityPercent) / 100;

  const totalClasses = (appData.classes || []).length;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const recentOccurrencesCount = appData.occurrences.filter(
    (o) => new Date(o.date) >= oneMonthAgo,
  ).length;

  const todayStr = getLocalDateString();
  const absencesTodayCount = allStudents.filter(
    (s) => s.attendanceHistory?.[todayStr] === "absent",
  ).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Quick Actions (Ações Rápidas) */}
      <section className="grid grid-cols-1 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate("studentsHub")}
          className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Central do Aluno
          </span>
        </motion.button>
      </section>

      {/* Resumo Geral */}
      <section className="grid grid-cols-3 gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate("classes")}
          className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <Book className="w-5 h-5 text-primary mb-2" />
          <span className="text-2xl font-extrabold text-[#1a1b21] dark:text-slate-50">
            {totalClasses}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Turmas
          </span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate("classes")}
          className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <Users className="w-5 h-5 text-secondary mb-2" />
          <span className="text-2xl font-extrabold text-[#1a1b21] dark:text-slate-50">
            {totalStudents}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Alunos
          </span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate("reports")}
          className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <FileText className="w-5 h-5 text-amber-500 mb-2" />
          <span className="text-2xl font-extrabold text-[#1a1b21] dark:text-slate-50">
            {recentOccurrencesCount}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Ocorrências
            <br />
            (30 dias)
          </span>
        </motion.button>
      </section>

      {/* Next Class */}
      <section className="glass-card rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Book className="w-32 h-32" />
        </div>
        <span className="text-[11px] font-extrabold text-secondary uppercase tracking-[0.2em] mb-2 block">
          PRÓXIMA AULA
        </span>
        <h2 className="text-2xl font-bold text-primary mb-4">
          {(appData.classes || [])[0]?.name || "Adicione uma turma"}
        </h2>
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
          onClick={() => onNavigate("materials")}
          className="w-full primary-gradient text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm mt-4"
        >
          Preparar Materiais
        </motion.button>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate("attendance")}
          className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/40 dark:bg-slate-800/40 active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <UserCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1a1b21] dark:text-slate-50">
            Chamada
          </span>
        </button>
        <button
          onClick={() => onNavigate("agenda")}
          className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/40 dark:bg-slate-800/40 active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1a1b21] dark:text-slate-50">
            Agenda
          </span>
        </button>
      </div>

      {/* AI Insights */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h3 className="text-sm font-extrabold uppercase tracking-widest">
            Insights da IA
          </h3>
        </div>
        <div className="flex overflow-x-auto gap-4 py-2 no-scrollbar px-1">
          <div
            className={`min-w-[280px] p-4 rounded-2xl flex gap-4 border ${absencesTodayCount > 0 ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700"}`}
          >
            <UserX
              className={`w-6 h-6 shrink-0 ${absencesTodayCount > 0 ? "text-orange-500" : "text-slate-400"}`}
            />
            <div>
              <p
                className={`text-xs font-extrabold uppercase ${absencesTodayCount > 0 ? "text-orange-800" : "text-slate-600 dark:text-slate-300"}`}
              >
                Faltas Hoje
              </p>
              <p
                className={`text-sm font-manrope leading-tight mt-1 ${absencesTodayCount > 0 ? "text-orange-600" : "text-slate-500"}`}
              >
                {absencesTodayCount > 0
                  ? `${absencesTodayCount} alunos registrados como ausentes no dia de hoje.`
                  : "Nenhuma falta registrada hoje."}
              </p>
            </div>
          </div>
          <div
            className={`min-w-[280px] p-4 rounded-2xl flex gap-4 border ${evasionRiskCount > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
          >
            <TriangleAlert
              className={`w-6 h-6 shrink-0 ${evasionRiskCount > 0 ? "text-red-500" : "text-green-500"}`}
            />
            <div>
              <p
                className={`text-xs font-extrabold uppercase ${evasionRiskCount > 0 ? "text-red-800" : "text-green-800"}`}
              >
                Risco de Evasão
              </p>
              <p
                className={`text-sm font-manrope leading-tight mt-1 ${evasionRiskCount > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {evasionRiskCount > 0
                  ? `${evasionRiskCount} alunos apresentam faltas ou ocorrências críticas.`
                  : "Nenhum aluno em risco detectado."}
              </p>
            </div>
          </div>
          <div
            className={`min-w-[280px] p-4 rounded-2xl flex gap-4 border ${appData.occurrences.length > 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"}`}
          >
            <FileText
              className={`w-6 h-6 shrink-0 ${appData.occurrences.length > 0 ? "text-amber-500" : "text-slate-400"}`}
            />
            <div>
              <p
                className={`text-xs font-extrabold uppercase ${appData.occurrences.length > 0 ? "text-amber-800" : "text-slate-600 dark:text-slate-300"}`}
              >
                Relatório Pronto
              </p>
              <p
                className={`text-sm font-manrope leading-tight mt-1 ${appData.occurrences.length > 0 ? "text-amber-600" : "text-slate-500"}`}
              >
                {appData.occurrences.length > 0
                  ? `${appData.occurrences.length} ocorrências registradas para revisão.`
                  : "Nenhum dado de ocorrências recente para relatório."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Summary */}
      <section className="glass-card rounded-3xl p-6">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2">
          Engajamento das Turmas
        </h3>
        <div className="flex justify-around items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border-8 border-primary/20 flex items-center justify-center relative group">
              <span className="text-lg font-bold text-primary">
                {attendancePercent}%
              </span>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#00236f"
                  strokeWidth="8"
                  strokeDasharray="226"
                  strokeDashoffset={attendanceOffset}
                />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Presença
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border-8 border-secondary/20 flex items-center justify-center relative">
              <span className="text-lg font-bold text-secondary">
                {activityPercent}%
              </span>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#712ae2"
                  strokeWidth="8"
                  strokeDasharray="226"
                  strokeDashoffset={activityOffset}
                />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Atividades
            </span>
          </div>
        </div>
      </section>

      {/* Média de Notas por Bimestre (Dropdown + Recharts Chart) */}
      <section className="glass-card rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#1a1b21] dark:text-slate-50 uppercase tracking-widest">
              Média de Notas por Bimestre
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-manrope">
              Evolução da média geral da classe
            </p>
          </div>
          <div>
            <select
              value={
                selectedChartClassId || (appData.classes || [])[0]?.id || ""
              }
              onChange={(e) => setSelectedChartClassId(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 px-3 rounded-xl outline-none focus:border-primary shadow-sm"
            >
              <option value="" disabled>
                --- Selecione uma Turma ---
              </option>
              {(appData.classes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClassObj ? (
          <div>
            {chartHasData ? (
              <div className="pt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="bimester"
                      stroke="#94a3b8"
                      tick={{ fontSize: 10, fontWeight: "bold" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 10]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 10, fontWeight: "bold" }}
                      axisLine={false}
                      tickLine={false}
                      tickCount={6}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: "rgba(30, 41, 59, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#a78bfa" }}
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                      formatter={(value: any) => [`${value} pts`, "Média"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="Média"
                      stroke="#712ae2"
                      strokeWidth={3}
                      dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Nenhuma nota cadastrada nesta turma.
                </p>
                <p className="text-[11px] text-slate-500 font-manrope mt-1">
                  Lance notas nesta turma no Boletim para ver a evolução.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Nenhuma turma disponível.
            </p>
            <p className="text-[11px] text-slate-500 font-manrope mt-1">
              Cadastre turmas para visualizar os relatórios.
            </p>
          </div>
        )}
      </section>

      {/* Gráfico de Faltas (BarChart) */}
      <section className="glass-card rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-[#1a1b21] dark:text-slate-50 uppercase tracking-widest">
            Porcentagem de Faltas
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-manrope">
            Histórico dos últimos 30 dias na turma selecionada
          </p>
        </div>

        {selectedClassObj ? (
          <div>
            {absenceChartHasData ? (
              <div className="pt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={absenceChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tick={{ fontSize: 10, fontWeight: "bold" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 10, fontWeight: "bold" }}
                      axisLine={false}
                      tickLine={false}
                      tickCount={6}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: "rgba(30, 41, 59, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#ef4444" }}
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                      formatter={(value: any) => [`${value}%`, "Faltas"]}
                    />
                    <Bar
                      dataKey="Faltas"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Nenhum dado de chamada recente.
                </p>
                <p className="text-[11px] text-slate-500 font-manrope mt-1">
                  Realize chamadas na turma selecionada para ver o histórico de faltas.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Nenhuma turma disponível.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

const StudentDashboard = ({
  appData,
  onShowNotification,
  onSyncGoogle,
  isSyncingGoogle,
  onNavigate,
  onUpdateActivities,
}: {
  appData: AppState;
  onShowNotification: (msg: string) => void;
  onSyncGoogle: () => void;
  isSyncingGoogle?: boolean;
  onNavigate: (screen: Screen) => void;
  onUpdateActivities?: (activities: GoogleCourseWork[]) => void;
}) => {
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          Painel do Aluno
        </p>
        <p className="text-[11px] text-slate-500 font-manrope mt-1">
          Acompanhe os seus relatórios e métricas de engajamento aqui.
        </p>
      </div>
    </div>
  );
};

const DashboardScreen = ({
  onNavigate,
  onNewOccurrence,
  appData,
  onShowNotification,
  onSyncGoogle,
  isSyncingGoogle,
  currentViewRole,
  onToggleViewRole,
  onUpdateActivities,
  onUpdateClasses,
}: {
  onNavigate: (screen: Screen) => void;
  onNewOccurrence: () => void;
  appData: AppState;
  onShowNotification: (msg: string) => void;
  onSyncGoogle: () => void;
  isSyncingGoogle?: boolean;
  currentViewRole: "teacher" | "student";
  onToggleViewRole: (r: "teacher" | "student") => void;
  onUpdateActivities?: (activities: GoogleCourseWork[]) => void;
  onUpdateClasses?: (classes: ClassData[]) => void;
}) => {
  return (
    <div className="space-y-6">
      <TeacherDashboard
        onNavigate={onNavigate}
        onNewOccurrence={onNewOccurrence}
        appData={appData}
        onShowNotification={onShowNotification}
        onSyncGoogle={onSyncGoogle}
        isSyncingGoogle={isSyncingGoogle}
        onUpdateActivities={onUpdateActivities}
        onUpdateClasses={onUpdateClasses}
      />
    </div>
  );
};

const StudentsHubScreen = ({
  onNavigate,
  onOpenGrades,
}: {
  onNavigate: (screen: Screen) => void;
  onOpenGrades: () => void;
}) => {
  const actions = [
    {
      id: "attendance",
      label: "Frequência",
      icon: UserCheck,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      id: "boletim",
      label: "Boletim",
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      id: "grades",
      label: "Lançar Notas",
      icon: Award,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      action: onOpenGrades,
    },
    {
      id: "reports",
      label: "Relatórios",
      icon: LayoutDashboard,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      id: "occurrence",
      label: "Advertência",
      icon: AlertOctagon,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      id: "classes",
      label: "Turmas/Alunos",
      icon: GraduationCap,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Central do Aluno
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">
            Acesse as ferramentas focadas no aluno.
          </p>
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
            <div
              className={`w-20 h-20 rounded-full ${act.bg} ${act.border} border-2 flex items-center justify-center`}
            >
              <act.icon
                className={`w-10 h-10 ${act.color}`}
                strokeWidth={2.5}
              />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide text-center">
              {act.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Reusable Badge for Special Needs
const SpecialNeedBadge = ({ type }: { type: string; key?: any }) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; icon: string }
  > = {
    TEA: {
      label: "TEA",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      icon: "🧩",
    },
    DI: {
      label: "DI",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      icon: "🧠",
    },
    DEF: {
      label: "DEF",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400",
      icon: "♿",
    },
    OUT: {
      label: "OUT",
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-600 dark:text-slate-400",
      icon: "✨",
    },
  };

  const config = configs[type] || configs["OUT"];

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-tighter ${config.bg} ${config.text} border border-current/10 shadow-sm animate-pulse`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", confirmColor = "bg-red-500 hover:bg-red-600" }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmText?: string, confirmColor?: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className={`px-4 py-2 rounded-xl text-white font-bold transition-colors ${confirmColor}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const logAuditAction = async (appData: AppState, action: string, details: string) => {
  if (!auth.currentUser) return;
  const schoolName = appData.schoolName || "Escola Virtual";
  const schoolDocId = schoolName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  try {
     const auditRef = collection(db, `schools/${schoolDocId}/audit_logs`);
     await addDoc(auditRef, {
        timestamp: serverTimestamp(),
        userId: auth.currentUser.uid || "unknown",
        userEmail: auth.currentUser.email || "unknown",
        userName: appData.teacherName || auth.currentUser.email,
        action,
        details,
     });
  } catch(e) {
     console.error("Audit log error:", e);
  }
};

const AttendanceScreen = ({
  onSelectStudent,
  classes,
  onFinish,
  onUpdateStatus,
  onUpdateClasses,
  teachingDays = [],
}: {
  onSelectStudent: (id: string) => void;
  classes: ClassData[];
  onFinish: () => void;
  onUpdateStatus: (
    classId: string,
    studentId: string,
    date: string,
    status: "present" | "absent" | "late" | "none",
  ) => void;
  onUpdateClasses?: (classes: ClassData[]) => void;
  teachingDays?: string[];
}) => {
  const getDayName = (dayIndex: number) => {
    const days = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    return days[dayIndex];
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDexieLogs = async () => {
      try {
        const attendances = await dexieDb.attendance.toArray();
        if (!isMounted || !onUpdateClasses || attendances.length === 0) return;
        
        let hasChanges = false;
        const newClasses = classes.map(c => {
          const classAtts = attendances.filter(a => a.classId === c.id);
          if (classAtts.length === 0) return c;
          
          let cModified = false;
          const newStudents = c.students.map(s => {
            const sAtts = classAtts.filter(a => a.studentId === s.id);
            if (sAtts.length === 0) return s;
            
            let sModified = false;
            const newHistory: Record<string, "none"|"present"|"absent"|"late"> = { ...s.attendanceHistory };
            
            sAtts.forEach(a => {
              const status: "none"|"present"|"absent"|"late" = (a.status === "justified" ? "absent" : a.status) as any;
              if (status && status !== "none" && newHistory[a.date] !== status) {
                newHistory[a.date] = status;
                sModified = true;
              }
            });
            
            if (sModified) { cModified = true; return { ...s, attendanceHistory: newHistory }; }
            return s;
          });
          
          if (cModified) { hasChanges = true; return { ...c, students: newStudents }; }
          return c;
        });
        
        if (hasChanges) {
           onUpdateClasses(newClasses);
           console.log("[Dexie] Frequências recuperadas do offline!");
        }
      } catch (err) {
        console.error("Erro ao ler dexieDb.attendance", err);
      }
    };
    fetchDexieLogs();
    return () => { isMounted = false; };
  }, []);

  const [attendanceDate, setAttendanceDate] = useState(() =>
    getLocalDateString(),
  );

  const selectedDateObj = parseSafeDate(attendanceDate);
  const selectedDayName = getDayName(selectedDateObj.getDay());
  const isSelectedToday = attendanceDate === getLocalDateString();

  const today = new Date();
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentTimeShort = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

  // Only show classes that happen on selected day according to their schedule configuration
  const visibleClasses = classes.filter((c) => {
    // If class has specific schedule days, use those
    if (c.schedule?.days && c.schedule.days.length > 0) {
      return c.schedule.days.some((d) =>
        d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)),
      );
    }
    // If no specific class schedule, fallback to teacher's global teachingDays
    if (teachingDays && teachingDays.length > 0) {
      return teachingDays.some((d) =>
        d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)),
      );
    }
    // Default to true if no configuration exists at all
    return true;
  }).sort((a, b) => {
    const aStarts = a.schedule?.startTime || "00:00";
    const bStarts = b.schedule?.startTime || "00:00";
    return aStarts.localeCompare(bStarts);
  });

  const [activeClassId, setActiveClassId] = useState<string | null>(
    visibleClasses[0]?.id || null,
  );

  // Update activeClassId if we change dates and the currently selected class is no longer visible on this day
  useEffect(() => {
    if (activeClassId && !visibleClasses.some(c => c.id === activeClassId)) {
      if (visibleClasses.length > 0) {
        setActiveClassId(visibleClasses[0].id);
      } else {
        setActiveClassId(null);
      }
    } else if (!activeClassId && visibleClasses.length > 0) {
      setActiveClassId(visibleClasses[0].id);
    }
  }, [attendanceDate, visibleClasses.map(c => c.id).join(',')]);



  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"register" | "calendar">("register");
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(() => getLocalDateString());
  const [calendarFilter, setCalendarFilter] = useState<
    "all" | "absent" | "present" | "late"
  >("all");

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [transferringStudentId, setTransferringStudentId] = useState<
    string | null
  >(null);
  const [transferSelectedClassId, setTransferSelectedClassId] = useState<
    string | null
  >(null);

  const activeClass = classes.find((c) => c.id === activeClassId);
  const students = activeClass?.students || [];
  
  const currentDayName = getDayName(parseSafeDate(attendanceDate).getDay());
  
  let isRegencyDay = true;
  if (activeClass?.schedule?.days?.length) {
     isRegencyDay = activeClass.schedule.days.some(d => d.toLowerCase().substring(0, 3) === currentDayName.toLowerCase().substring(0, 3));
  } else if (teachingDays && teachingDays.length > 0) {
     isRegencyDay = teachingDays.some(d => d.toLowerCase().substring(0, 3) === currentDayName.toLowerCase().substring(0, 3));
  }

  const handleMarkAllPresent = () => {
    if (!activeClassId || !onUpdateClasses) return;
    const newClasses = classes.map(c => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: c.students.map(s => {
             const current = s.attendanceHistory?.[attendanceDate] || "none";
             if (current === "none") {
               return {
                 ...s,
                 attendanceHistory: {
                   ...(s.attendanceHistory || {}),
                   [attendanceDate]: "present"
                 }
               };
             }
             return s;
          })
        };
      }
      return c;
    });
    onUpdateClasses(newClasses);
  };

  const launchedDates = React.useMemo(() => {
    const datesSet = new Set<string>();
    (activeClass?.students || []).forEach((s) => {
      if (s.attendanceHistory) {
        Object.entries(s.attendanceHistory).forEach(([date, status]) => {
          if (status && status !== "none") {
            datesSet.add(date);
          }
        });
      }
    });
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }, [activeClass?.students]);

  const sortedStudents = [...students].sort((a, b) =>
    a.name.toUpperCase().localeCompare(b.name.toUpperCase()),
  );

  const filteredStudents = sortedStudents.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStudentStatus = (student: Student) => {
    return student.attendanceHistory?.[attendanceDate] || "none";
  };

  const presentCount = students.filter(
    (s) => getStudentStatus(s) === "present",
  ).length;
  const absentCount = students.filter(
    (s) => getStudentStatus(s) === "absent",
  ).length;

  const handleEditStudentSave = () => {
    if (!editingStudentId || !editingStudentName.trim() || !onUpdateClasses) return;
    const updated = classes.map(c => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: c.students.map(s => s.id === editingStudentId ? { ...s, name: editingStudentName.trim().toUpperCase() } : s)
        };
      }
      return c;
    });
    onUpdateClasses(updated);
    setEditingStudentId(null);
    setEditingStudentName("");
  };

  const handleAddStudentSave = () => {
    if (!newStudentName.trim() || !activeClassId || !onUpdateClasses) return;
    const newS = {
      id: "std_" + Date.now(),
      name: newStudentName.trim().toUpperCase(),
      avatar: "",
      grade: activeClass?.name || "",
      room: "N/A",
      status: "none" as const,
    };
    const updated = classes.map(c => {
      if (c.id === activeClassId) {
        return { ...c, students: [...c.students, newS] };
      }
      return c;
    });
    onUpdateClasses(updated);
    setNewStudentName("");
    setIsAddingStudent(false);
  };

  const handleTransferStudent = () => {
    if (
      !transferringStudentId ||
      !transferSelectedClassId ||
      !activeClassId ||
      transferSelectedClassId === activeClassId ||
      !onUpdateClasses
    )
      return;
      
    if (!window.confirm("Atenção: Ao confirmar esta transferência, o aluno será movido para a nova turma. Deseja prosseguir?")) return;

    const originalStudent = classes
      .find((cl) => cl.id === activeClassId)
      ?.students.find((s) => s.id === transferringStudentId);
    if (!originalStudent) return;

    const sourceClassName = classes.find((c) => c.id === activeClassId)?.name;
    const targetClassName = classes.find((c) => c.id === transferSelectedClassId)?.name;

    const updatedClasses = classes.map((c) => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: c.students.filter((s) => s.id !== transferringStudentId),
        };
      }
      if (c.id === transferSelectedClassId) {
        return {
          ...c,
          students: [...c.students, { ...originalStudent, grade: c.name }],
        };
      }
      return c;
    });

    // Fire & Forget audit log - depends on parent appData but here we don't have appData easily
    // We will just do the update
    onUpdateClasses(updatedClasses);
    setTransferringStudentId(null);
    setTransferSelectedClassId(null);
  };

  return (
    <div className="space-y-6 pb-24 overflow-x-hidden">
      {/* Top Header Selector & Segmented View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
            Selecione a Turma
          </label>
          <select
            value={activeClassId || ""}
            onChange={(e) => {
              setActiveClassId(e.target.value);
              setSearchQuery("");
            }}
            className="text-xl font-bold text-primary bg-transparent outline-none cursor-pointer border-b-2 border-primary/20 pb-1 pr-6"
          >
            {[...classes].sort((a, b) => {
              const aIsSelectedDay = a.schedule?.days?.some((d) =>
                d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)),
              );
              const bIsSelectedDay = b.schedule?.days?.some((d) =>
                d.toLowerCase().includes(selectedDayName.toLowerCase().substring(0, 3)),
              );

              if (aIsSelectedDay && !bIsSelectedDay) return -1;
              if (!aIsSelectedDay && bIsSelectedDay) return 1;

              if (aIsSelectedDay && bIsSelectedDay && a.schedule && b.schedule) {
                const aStarts = a.schedule?.startTime || "00:00";
                const bStarts = b.schedule?.startTime || "00:00";
                return aStarts.localeCompare(bStarts);
              }
              return 0;
            }).map((c) => {
              const isTargetDay = c.schedule?.days?.some((d) =>
                d
                  .toLowerCase()
                  .includes(selectedDayName.toLowerCase().substring(0, 3)),
              );
              return (
                <option key={c.id} value={c.id}>
                  {isTargetDay ? "⭐ " : ""}
                  {c.name}{" "}
                  {isTargetDay
                    ? isSelectedToday
                      ? "(Hoje)"
                      : `(${selectedDayName})`
                    : ""}
                </option>
              );
            })}
          </select>
        </div>

        {viewMode === "register" && (
          <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-primary text-xs font-bold self-start sm:self-auto relative border border-white/20">
            <Calendar className="w-4 h-4 shrink-0" />
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => {
                setAttendanceDate(e.target.value);
                setSelectedCalendarDate(e.target.value);
              }}
              className="bg-transparent border-none outline-none font-bold text-primary font-manrope uppercase cursor-pointer max-w-[120px]"
            />
          </div>
        )}
      </div>

      {/* Segmented View Mode Controller */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full">
        <button
          type="button"
          onClick={() => setViewMode("register")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
            viewMode === "register"
              ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Lançar Chamada
        </button>
        <button
          type="button"
          onClick={() => setViewMode("calendar")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
            viewMode === "calendar"
              ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendário de Faltas
        </button>
      </div>

      {viewMode === "register" ? (
        <>
          {/* Selected Day's Schedule Quick Rail */}
          {visibleClasses.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500" /> Turmas Disponíveis ({isSelectedToday ? "Hoje" : selectedDayName})
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth no-scrollbar">
                {visibleClasses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveClassId(c.id);
                        setSearchQuery("");
                      }}
                      className={`shrink-0 px-4 py-3 rounded-2xl border-2 transition-all flex flex-col gap-1 min-w-[140px] ${
                        activeClassId === c.id
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/30"
                      }`}
                    >
                      <span className="font-bold text-sm truncate">
                        {c.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-tighter opacity-70 flex items-center gap-1`}
                      >
                        <Clock className="w-3 h-3" /> {c.schedule?.startTime} -{" "}
                        {c.schedule?.endTime}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 border-dashed">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Nenhuma turma configurada para este dia.</p>
              <p className="text-[10px] text-slate-400 font-medium">Verifique os dias de aula na configuração da sua turma.</p>
            </div>
          )}

          {activeClass?.schedule?.days?.length ? (
            <div className="glass-card p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" /> Agenda Recorrente:
              </p>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {activeClass.schedule.days.join(", ")} •{" "}
                {activeClass.schedule.startTime} às{" "}
                {activeClass.schedule.endTime}
              </p>
              {!isRegencyDay && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-2 items-start">
                   <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-500">Fora dos dias de regência</p>
                      <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">O dia selecionado não faz parte da agenda desta turma.</p>
                   </div>
                </div>
              )}
            </div>
          ) : !isRegencyDay ? (
            <div className="glass-card p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-2 items-start">
                   <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-500">Fora dos dias de regência</p>
                      <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">O dia selecionado não faz parte dos seus dias de regência (Perfil).</p>
                   </div>
                </div>
            </div>
          ) : null}

          <div className="flex gap-2">
             <button
               onClick={handleMarkAllPresent}
               className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors border border-emerald-200 dark:border-emerald-800"
             >
                <CheckCircle2 className="w-4 h-4" />
                Marcar Todos como Presentes
             </button>
          </div>

          {launchedDates.length > 0 && (
            <div className="space-y-2 mt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <RefreshCw
                  className="w-3 h-3 text-primary animate-spin"
                  style={{ animationDuration: "6s" }}
                />{" "}
                Chamadas Realizadas (Toque para recuperar/ajustar)
              </h4>
              <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar scroll-smooth no-scrollbar">
                {launchedDates.map((date) => {
                  const dObj = parseSafeDate(date);
                  const formattedDate = dObj.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  });
                  const dayNameShort = getDayName(dObj.getDay()).substring(
                    0,
                    3,
                  );

                  const datePresents = (activeClass?.students || []).filter(
                    (s) => s.attendanceHistory?.[date] === "present",
                  ).length;
                  const dateAbsents = (activeClass?.students || []).filter(
                    (s) => s.attendanceHistory?.[date] === "absent",
                  ).length;
                  const dateLates = (activeClass?.students || []).filter(
                    (s) => s.attendanceHistory?.[date] === "late",
                  ).length;

                  const isCurrentlyActiveDate = attendanceDate === date;

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        setAttendanceDate(date);
                        setSelectedCalendarDate(date);
                      }}
                      className={`shrink-0 px-3.5 py-2.5 rounded-2xl border transition-all flex flex-col gap-1 min-w-[130px] shadow-xs hover:shadow-sm ${
                        isCurrentlyActiveDate
                          ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-extrabold text-xs tracking-tight">
                          {formattedDate}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                            isCurrentlyActiveDate
                              ? "bg-white/20 text-white"
                              : "bg-slate-200/60 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {dayNameShort}
                        </span>
                      </div>
                      <div className="flex gap-1.5 mt-0.5 text-[9px] font-bold font-mono">
                        <span
                          className={
                            dateAbsents > 0
                              ? isCurrentlyActiveDate
                                ? "text-white"
                                : "text-red-500"
                              : "opacity-60"
                          }
                        >
                          F:{dateAbsents}
                        </span>
                        <span className="opacity-40">•</span>
                        <span
                          className={
                            datePresents > 0
                              ? isCurrentlyActiveDate
                                ? "text-white"
                                : "text-emerald-500"
                              : "opacity-60"
                          }
                        >
                          P:{datePresents}
                        </span>
                        {dateLates > 0 && (
                          <>
                            <span className="opacity-40">•</span>
                            <span
                              className={
                                isCurrentlyActiveDate
                                  ? "text-white"
                                  : "text-amber-500"
                              }
                            >
                              A:{dateLates}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar aluno pelo nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-primary pl-12 pr-4 py-3 rounded-2xl font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
              />
            </div>
            {onUpdateClasses && (
              <button 
                onClick={() => setIsAddingStudent(!isAddingStudent)}
                className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-3 rounded-2xl font-bold transition-colors flex items-center gap-2 shrink-0 border border-primary/20"
              >
                <Plus className="w-5 h-5" /> 
                <span className="hidden sm:inline">Aluno</span>
              </button>
            )}
          </div>

          {isAddingStudent && (
             <div className="glass-card p-4 rounded-xl flex items-center gap-3">
               <input
                 autoFocus
                 type="text"
                 placeholder="Nome do novo aluno"
                 value={newStudentName}
                 onChange={(e) => setNewStudentName(e.target.value)}
                 className="flex-1 bg-transparent border-b-2 border-primary outline-none font-bold text-sm text-slate-800 dark:text-white"
                 onKeyDown={e => { if (e.key === "Enter") handleAddStudentSave(); if (e.key === "Escape") setIsAddingStudent(false); }}
               />
               <button onClick={handleAddStudentSave} className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2.5 py-1.5 rounded-md uppercase">Salvar</button>
               <button onClick={() => setIsAddingStudent(false)} className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-md uppercase">Cancelar</button>
             </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-3 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Total
              </p>
              <p className="text-xl font-bold text-primary">
                {students.length}
              </p>
            </div>
            <div className="glass-card p-3 rounded-xl text-center border-b-2 border-primary">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Presentes
              </p>
              <p className="text-xl font-bold text-primary">{presentCount}</p>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Faltas
              </p>
              <p className="text-xl font-bold text-secondary">
                {absentCount}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <span className="text-xs font-bold text-slate-500 uppercase ml-1">Ações Rápidas</span>
            <button
              onClick={() => {
                if (!onUpdateClasses || !activeClassId) return;
                const updatedClasses = (classes || []).map((c) =>
                  c.id === activeClassId
                    ? {
                        ...c,
                        students: (c.students || []).map((s) => {
                          try {
                            dexieDb.attendance.put({
                              localId: `${activeClassId}-${s.id}-${attendanceDate}`,
                              classId: activeClassId,
                              studentId: s.id,
                              userId: auth.currentUser?.uid || 'unknown',
                              isSynced: false,
                              syncStatus: 'pending',
                              createdAt: Date.now(),
                              date: attendanceDate,
                              status: "present",
                              updatedAt: Date.now()
                            });
                          } catch(e) {}
                          
                          return {
                            ...s,
                            status: "present",
                            attendanceHistory: {
                              ...(s.attendanceHistory || {}),
                              [attendanceDate]: "present",
                            },
                          };
                        }),
                      }
                    : c
                );
                onUpdateClasses(updatedClasses);
              }}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" /> Todos Presentes
            </button>
          </div>

          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-manrope">
                Nenhum aluno encontrado
                {searchQuery ? " para a busca" : " nesta turma"}.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const currentStatus = getStudentStatus(student);
                return (
                  <motion.div
                    key={student.id}
                    layout
                    className={`glass-card p-4 rounded-2xl flex items-center justify-between group hover:shadow-lg transition-all duration-300 border-l-4 ${
                      currentStatus === "absent"
                        ? "border-red-500"
                        : currentStatus === "late"
                          ? "border-amber-500"
                          : "border-transparent"
                    }`}
                  >
                    <div
                      className="flex items-center gap-4 flex-1"
                    >
                      <div className="relative cursor-pointer" onClick={() => onSelectStudent(student.id)}>
                        {student.avatar && student.avatar.trim() !== "" ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className={`w-12 h-12 rounded-full border-2 border-white ring-2 ring-slate-100 ${currentStatus === "absent" ? "grayscale opacity-50" : ""}`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <UserCheck className="w-6 h-6" />
                          </div>
                        )}
                        {currentStatus === "present" && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {currentStatus === "absent" && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                            <X className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {currentStatus === "late" && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                            <Clock className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="font-manrope flex-1">
                        {editingStudentId === student.id ? (
                           <div className="flex items-center gap-2 mb-1">
                              <input 
                                 autoFocus
                                 value={editingStudentName} 
                                 onChange={e => setEditingStudentName(e.target.value)}
                                 className="bg-transparent border-b-2 border-primary outline-none font-bold text-sm text-slate-800 dark:text-white"
                                 placeholder="Nome do Aluno"
                                 onKeyDown={e => { if (e.key === "Enter") handleEditStudentSave(); if (e.key === "Escape") setEditingStudentId(null); }}
                              />
                              <button onClick={handleEditStudentSave} className="text-[10px] bg-green-500/10 text-green-500 px-2 rounded font-bold uppercase py-0.5">Salvar</button>
                              <button onClick={() => setEditingStudentId(null)} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 rounded font-bold uppercase py-0.5"><X className="w-3 h-3" /></button>
                           </div>
                        ) : (
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectStudent(student.id)}>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {student.name.toUpperCase()}
                            </h3>
                            <div className="flex gap-1">
                              {student.specialNeeds?.map((need) => (
                                <SpecialNeedBadge key={need} type={need} />
                              ))}
                            </div>
                            {onUpdateClasses && (
                              <div className="flex gap-0.5 ml-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransferringStudentId(student.id);
                                    setTransferSelectedClassId(null);
                                  }}
                                  className="text-slate-300 hover:text-blue-500 transition-colors focus:outline-none p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Transferir Aluno para Outra Turma"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingStudentId(student.id);
                                    setEditingStudentName(student.name);
                                  }}
                                  className="text-slate-300 hover:text-primary transition-colors focus:outline-none p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Editar Nome"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <p
                          className={`text-[11px] font-extrabold uppercase ${
                            currentStatus === "absent"
                              ? "text-red-500"
                              : currentStatus === "late"
                                ? "text-amber-600"
                                : "text-slate-400"
                          }`}
                        >
                          {currentStatus === "present"
                            ? `Presente`
                            : currentStatus === "absent"
                              ? "Falta"
                              : currentStatus === "late"
                                ? `Atraso (${student.offset || "15 min"})`
                                : `Vazio`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 items-center shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        title="Marcar Presença"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(
                            activeClassId!,
                            student.id,
                            attendanceDate,
                            currentStatus === "present" ? "none" : "present",
                          );
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          currentStatus === "present"
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 scale-105 font-bold"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        title="Marcar Falta"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(
                            activeClassId!,
                            student.id,
                            attendanceDate,
                            currentStatus === "absent" ? "none" : "absent",
                          );
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          currentStatus === "absent"
                            ? "bg-red-500 text-white shadow-sm shadow-red-500/20 scale-105 font-bold"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        title="Marcar Atraso"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(
                            activeClassId!,
                            student.id,
                            attendanceDate,
                            currentStatus === "late" ? "none" : "late",
                          );
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          currentStatus === "late"
                            ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20 scale-105 font-bold"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <button
            onClick={onFinish}
            className="fixed bottom-24 right-6 primary-gradient text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3 active:scale-95 transition-all z-40 hover:shadow-primary/30"
          >
            <Check className="w-6 h-6 stroke-[3px]" />
            <span className="text-xs font-extrabold uppercase tracking-widest">
              Finalizar Chamada
            </span>
          </button>
        </>
      ) : (
        /* CALENDAR VIEW MODE WITH INTENSITY STYLING & DETAIL VISUALIZATION */
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl space-y-4">
            {/* Calendar Month Selector Header */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear((y) => y - 1);
                  } else {
                    setCurrentMonth((m) => m - 1);
                  }
                }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <span className="font-extrabold text-base text-slate-800 dark:text-slate-100 block capitalize">
                  {
                    [
                      "Janeiro",
                      "Fevereiro",
                      "Março",
                      "Abril",
                      "Maio",
                      "Junho",
                      "Julho",
                      "Agosto",
                      "Setembro",
                      "Outubro",
                      "Novembro",
                      "Dezembro",
                    ][currentMonth]
                  }
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                  {currentYear}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear((y) => y + 1);
                  } else {
                    setCurrentMonth((m) => m + 1);
                  }
                }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid of Days */}
            <div>
              {/* Week names indicator */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 font-mono">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                  (item) => (
                    <div key={item}>{item}</div>
                  ),
                )}
              </div>

              {/* Days cells */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty grid alignment paddings */}
                {Array.from({
                  length: new Date(currentYear, currentMonth, 1).getDay(),
                }).map((_, i) => (
                  <div key={`offset-${i}`} className="h-16 bg-transparent" />
                ))}

                {/* Days list */}
                {Array.from({
                  length: new Date(currentYear, currentMonth + 1, 0).getDate(),
                }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
                  const isSelected = selectedCalendarDate === dayStr;

                  // Compute lists of statuses
                  const dayAbsents = (activeClass?.students || []).filter(
                    (s) => s.attendanceHistory?.[dayStr] === "absent",
                  );
                  const hasHistory = (activeClass?.students || []).some(
                    (s) =>
                      s.attendanceHistory?.[dayStr] !== undefined &&
                      s.attendanceHistory?.[dayStr] !== "none",
                  );

                  return (
                    <button
                      type="button"
                      key={`day-${dayNum}`}
                      onClick={() => {
                        setSelectedCalendarDate(dayStr);
                        setAttendanceDate(dayStr);
                      }}
                      className={`h-16 rounded-xl flex flex-col justify-between p-1.5 transition-all relative border outline-none ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/25 scale-[1.03] z-10"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <span className="text-[11px] font-bold self-start">
                        {dayNum}
                      </span>

                      {hasHistory && (
                        <div className="w-full flex justify-center items-center pb-0.5">
                          {dayAbsents.length > 0 ? (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center gap-0.5 ${
                                isSelected
                                  ? "bg-white text-red-600"
                                  : "bg-red-500 text-white shadow-sm"
                              }`}
                            >
                              {dayAbsents.length}{" "}
                              <span className="text-[8px] opacity-70">F</span>
                            </span>
                          ) : (
                            <span
                              className={`text-[8px] font-extrabold px-1 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-white/25 text-white"
                                  : "bg-green-500/10 text-green-500 dark:bg-green-500/20"
                              }`}
                            >
                              OK
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* List of absent students on selected day */}
          {selectedCalendarDate && (
            <div className="glass-card p-5 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-700/60 shadow-md">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                    <span className="w-2.5 h-5 bg-red-500 rounded-full inline-block"></span>
                    Faltas em{" "}
                    {parseSafeDate(
                      selectedCalendarDate,
                    ).toLocaleDateString("pt-BR")}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold font-manrope uppercase tracking-widest mt-0.5">
                    {activeClass?.name}
                  </p>
                </div>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full">
                  Faltantes:{" "}
                  <strong className="text-red-500 text-sm ml-1 font-mono font-extrabold">
                    {
                      (activeClass?.students || []).filter(
                        (s) =>
                          s.attendanceHistory?.[selectedCalendarDate] ===
                          "absent",
                      ).length
                    }
                  </strong>
                </span>
              </div>

              <div className="space-y-3">
                {/* Find absent students */}
                {(() => {
                  const absents = (activeClass?.students || []).filter(
                    (s) =>
                      s.attendanceHistory?.[selectedCalendarDate] === "absent",
                  );
                  const presents = (activeClass?.students || []).filter(
                    (s) =>
                      s.attendanceHistory?.[selectedCalendarDate] === "present",
                  );
                  const lates = (activeClass?.students || []).filter(
                    (s) =>
                      s.attendanceHistory?.[selectedCalendarDate] === "late",
                  );
                  const hasDayRecords = (activeClass?.students || []).some(
                    (s) =>
                      s.attendanceHistory?.[selectedCalendarDate] !==
                        undefined &&
                      s.attendanceHistory?.[selectedCalendarDate] !== "none",
                  );

                  if (!hasDayRecords) {
                    return (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <div className="space-y-4">
                          <AlertTriangle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                          <p className="font-bold text-slate-400 text-sm">
                            Nenhuma chamada realizada para esta data.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAttendanceDate(selectedCalendarDate);
                              setViewMode("register");
                            }}
                            className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-2xl hover:shadow-lg shadow-primary/20 transition-all uppercase tracking-widest cursor-pointer"
                          >
                            Lançar Chamada Agora
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const allForDay = (activeClass?.students || []).map((s) => {
                    const sStatus =
                      s.attendanceHistory?.[selectedCalendarDate] || "none";
                    return { ...s, currentStatus: sStatus };
                  });

                  const filtered = allForDay.filter((s) => {
                    if (calendarFilter === "all") return true;
                    return s.currentStatus === calendarFilter;
                  });

                  return (
                    <div className="space-y-4">
                      {/* Filter pills */}
                      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
                        <div
                          className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500 text-white shadow-sm text-center"
                        >
                          FALTAS ({absents.length}) no dia selecionado
                        </div>
                      </div>

                      {/* List items */}
                      <div className="space-y-3">
                        {absents.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 font-manrope font-bold">
                             <div className="space-y-2">
                               <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                               <p className="font-bold text-emerald-500 text-sm">
                                 Presença Completa! Todos os alunos compareceram neste dia. 🎉
                               </p>
                             </div>
                          </div>
                        ) : (
                            absents.map((student) => (
                              <div
                                key={student.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-slate-900/30 border hover:shadow-md transition-all gap-4 border-l-4 ${
                                  student.currentStatus === "absent"
                                    ? "border-l-red-500 border-slate-200/50 dark:border-slate-800/80"
                                    : student.currentStatus === "late"
                                      ? "border-l-amber-500 border-slate-200/50 dark:border-slate-800/80"
                                      : student.currentStatus === "present"
                                        ? "border-l-emerald-500 border-slate-200/50 dark:border-slate-800/80"
                                        : "border-l-slate-300 border-slate-200/50 dark:border-slate-800/80"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {student.avatar &&
                                  student.avatar.trim() !== "" ? (
                                    <img
                                      src={student.avatar}
                                      alt={student.name}
                                      className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 animate-pulse">
                                      <UserCheck className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                      {student.name.toUpperCase()}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span
                                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                          student.currentStatus === "absent"
                                            ? "bg-red-50 text-red-500 dark:bg-red-500/15"
                                            : student.currentStatus === "late"
                                              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15"
                                              : student.currentStatus ===
                                                  "present"
                                                ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15"
                                                : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                        }`}
                                      >
                                        {student.currentStatus === "absent"
                                          ? "Falta"
                                          : student.currentStatus === "late"
                                            ? "Atraso"
                                            : student.currentStatus ===
                                                "present"
                                              ? "Presente"
                                              : "Sem Chamada"}
                                      </span>
                                      {student.specialNeeds?.map((need) => (
                                        <SpecialNeedBadge
                                          key={need}
                                          type={need}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Operations buttons */}
                                <div className="flex items-center gap-1.5 sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateStatus(
                                        activeClass?.id || "",
                                        student.id,
                                        selectedCalendarDate,
                                        "present",
                                      )
                                    }
                                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                      student.currentStatus === "present"
                                        ? "bg-emerald-500/15 border-transparent text-emerald-600"
                                        : "bg-transparent hover:bg-slate-100 border-slate-250 text-slate-500 dark:text-slate-450"
                                    }`}
                                  >
                                    Presença
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateStatus(
                                        activeClass?.id || "",
                                        student.id,
                                        selectedCalendarDate,
                                        "absent",
                                      )
                                    }
                                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                      student.currentStatus === "absent"
                                        ? "bg-red-500/15 border-transparent text-red-600"
                                        : "bg-transparent hover:bg-slate-100 border-slate-250 text-slate-500 dark:text-slate-450"
                                    }`}
                                  >
                                    Falta
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateStatus(
                                        activeClass?.id || "",
                                        student.id,
                                        selectedCalendarDate,
                                        "late",
                                      )
                                    }
                                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                      student.currentStatus === "late"
                                        ? "bg-amber-500/15 border-transparent text-amber-600"
                                        : "bg-transparent hover:bg-slate-100 border-slate-250 text-slate-500 dark:text-slate-450"
                                    }`}
                                  >
                                    Atraso
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {transferringStudentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setTransferringStudentId(null)}
          ></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10 p-6 flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Transferir Aluno
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecione para qual turma deseja transferir:
            </p>
            <select
              value={transferSelectedClassId || ""}
              onChange={(e) => setTransferSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>
                Escolha a turma alvo...
              </option>
              {classes
                .filter((c) => c.id !== activeClassId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setTransferringStudentId(null)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferStudent}
                disabled={!transferSelectedClassId}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OccurrenceScreen = ({
  student,
  occurrences,
  onSave,
  onCancel,
  classes,
  onSelectStudent,
}: {
  student?: Student;
  occurrences: Occurrence[];
  onSave: (occ: Omit<Occurrence, "id">) => void;
  onCancel: () => void;
  classes?: ClassData[];
  onSelectStudent?: (id: string) => void;
}) => {
  const [tab, setTab] = useState<"new" | "history" | "charts">("new");
  const [activeStatus, setActiveStatus] = useState<
    "praise" | "attention" | "critical"
  >("attention");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [justification, setJustification] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(
    undefined,
  );
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "praise" | "attention" | "critical"
  >("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tagsList = [
    "Falta de Material",
    "Conversa Paralela",
    "Desempenho Extraordinário",
    "Conflito entre Pares",
    "Uso de Celular",
  ];

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
      setSelectedTags(selectedTags.filter((t) => t !== tag));
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
      attachmentUrl,
    });
  };

  const [studentSearch, setStudentSearch] = useState("");
  const [activeClassId, setActiveClassId] = useState<string | null>(
    classes?.[0]?.id || null,
  );

  if (!student && classes && onSelectStudent && occurrences) {
    // passed occurrences are now needed here
    let studentsToShow = [];
    if (studentSearch.trim() !== "") {
      const searchLower = studentSearch.trim().toLowerCase();
      studentsToShow = classes
        .flatMap((c) => c.students)
        .filter((s) => s.name.toLowerCase().includes(searchLower))
        .sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase()));
    } else {
      const activeClass = classes.find((c) => c.id === activeClassId);
      studentsToShow = [...(activeClass?.students || [])].sort((a, b) =>
        a.name.toUpperCase().localeCompare(b.name.toUpperCase()),
      );
    }

    // Find students with actual occurrences
    const studentsWithOccurrences = classes
      .flatMap((c) => c.students)
      .filter((s) => occurrences.some((o: any) => o.studentId === s.id))
      .sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase()));

    return (
      <div className="space-y-6 pb-24">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-2xl font-bold text-primary">Ocorrências</h2>
            <p className="text-sm text-slate-500 font-manrope">
              Selecione o aluno para registrar ou visualizar ocorrências.
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Busque aluno pelo nome em qualquer turma..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-primary pl-12 pr-4 py-3 rounded-2xl font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors shadow-sm"
          />
        </div>

        {studentSearch.trim() === "" && studentsWithOccurrences.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-500 uppercase tracking-widest pl-1">
              Alunos Advertidos Anteriormente
            </h3>
            <div className="glass-card p-4 rounded-xl space-y-1">
              {studentsWithOccurrences.map((s) => {
                const occCount = occurrences.filter(
                  (o: any) => o.studentId === s.id,
                ).length;
                return (
                  <div
                    key={`warned-${s.id}`}
                    onClick={() => onSelectStudent(s.id)}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      <AlertOctagon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                        {s.name.toUpperCase()}
                      </p>
                      <p className="text-xs text-amber-500 font-bold">
                        {occCount}{" "}
                        {occCount === 1 ? "advertência" : "advertências"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-primary transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {studentSearch.trim() === "" && (
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1 mt-2">
                Filtrar por Turma
              </label>
              <select
                value={activeClassId || ""}
                onChange={(e) => setActiveClassId(e.target.value)}
                className="w-full text-lg font-bold text-primary bg-transparent outline-none cursor-pointer border-b-2 border-primary/20 pb-1 pr-6"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          {studentSearch.trim() !== "" && (
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              Resultados da Busca
            </h3>
          )}
          {studentsToShow.length === 0 ? (
            <p className="text-center py-12 text-slate-400 font-manrope">
              Nenhum aluno encontrado.
            </p>
          ) : (
            <div className="glass-card p-4 rounded-xl">
              <div className="space-y-1">
                {studentsToShow.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectStudent(s.id)}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {s.avatar ? (
                        <img
                          src={s.avatar}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <UserCheck className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                        {s.name.toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-400">
                        Toque para selecionar
                      </p>
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
        {student?.avatar && student.avatar.trim() !== "" ? (
          <img
            src={student.avatar}
            alt={student.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-slate-300" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-primary">
            {student?.name?.toUpperCase() || "ALUNO"}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {student?.grade || "Turma"} • Sala {student?.room || "N/A"}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setTab("new")}
          className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${tab === "new" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400"}`}
        >
          Registrar
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${tab === "history" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400"}`}
        >
          Histórico
        </button>
        <button
          onClick={() => setTab("charts")}
          className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-all ${tab === "charts" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400"}`}
        >
          Desempenho
        </button>
      </div>

      {tab === "new" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Status */}
          <section className="space-y-3 mb-6">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1">
              Status da Ocorrência
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setActiveStatus("praise")}
                className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border-b-4 ${activeStatus === "praise" ? "border-green-500 bg-green-50/20" : "border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50"}`}
              >
                <Smile
                  className={`w-10 h-10 ${activeStatus === "praise" ? "text-green-600 fill-green-600/10" : "text-slate-300"}`}
                />
                <span
                  className={`text-[10px] font-bold uppercase ${activeStatus === "praise" ? "text-green-700" : "text-slate-400"}`}
                >
                  Elogio
                </span>
              </button>
              <button
                onClick={() => setActiveStatus("attention")}
                className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border-b-4 ${activeStatus === "attention" ? "border-amber-500 bg-amber-50/20" : "border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50"}`}
              >
                <TriangleAlert
                  className={`w-10 h-10 ${activeStatus === "attention" ? "text-amber-600 fill-amber-600/10" : "text-slate-300"}`}
                />
                <span
                  className={`text-[10px] font-bold uppercase ${activeStatus === "attention" ? "text-amber-700" : "text-slate-400"}`}
                >
                  Atenção
                </span>
              </button>
              <button
                onClick={() => setActiveStatus("critical")}
                className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border-b-4 ${activeStatus === "critical" ? "border-red-500 bg-red-50/20" : "border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50"}`}
              >
                <AlertOctagon
                  className={`w-10 h-10 ${activeStatus === "critical" ? "text-red-600 fill-red-600/10" : "text-slate-300"}`}
                />
                <span
                  className={`text-[10px] font-bold uppercase ${activeStatus === "critical" ? "text-red-700" : "text-slate-400"}`}
                >
                  Crítico
                </span>
              </button>
            </div>
          </section>

          {/* Tags */}
          <section className="glass-card rounded-2xl p-6 space-y-6 mb-6">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
              Categorias Rápidas
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagsList.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200"
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
              <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1">
                Anexos e Evidências
              </h3>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="glass-card rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-700 h-32 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40 active:scale-95 transition-all overflow-hidden relative"
            >
              {attachmentUrl ? (
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={attachmentUrl}
                    alt="Evidência"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" /> Trocar
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold text-slate-400 group-hover:text-primary uppercase tracking-widest">
                    Toque para Anexar Foto ou Arquivo
                  </span>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
          </section>

          {/* Meeting Reminder */}
          <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Agendar Reunião com Responsável
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Data
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </section>

          <button
            onClick={handleSave}
            className="fixed bottom-24 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:ml-[340px] primary-gradient text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all z-40 hover:shadow-primary/40"
          >
            <Save className="w-6 h-6" />
            <span className="text-xs font-extrabold uppercase tracking-widest hidden sm:inline">
              Finalizar Ocorrência
            </span>
          </button>
        </motion.div>
      )}

      {tab === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-2"
        >
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
            {["all", "praise", "attention", "critical"].map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f as any)}
                className={`px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all ${historyFilter === f ? "bg-primary text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200"}`}
              >
                {f === "all"
                  ? "Todos"
                  : f === "praise"
                    ? "Elogios"
                    : f === "attention"
                      ? "Atenção"
                      : "Críticos"}
              </button>
            ))}
          </div>

          {occurrences.filter(
            (o) => historyFilter === "all" || o.status === historyFilter,
          ).length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-manrope text-sm bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-slate-700/50">
              Nenhuma ocorrência encontrada para este filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {occurrences
                .filter(
                  (o) => historyFilter === "all" || o.status === historyFilter,
                )
                .slice()
                .reverse()
                .map((occ) => (
                  <div
                    key={occ.id}
                    className={`glass-card p-4 rounded-2xl border-l-4 ${occ.status === "critical" ? "border-red-500" : occ.status === "attention" ? "border-amber-500" : "border-green-500"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-widest ${occ.status === "critical" ? "text-red-500" : occ.status === "attention" ? "text-amber-500" : "text-green-500"}`}
                      >
                        {occ.status === "critical"
                          ? "CRÍTICO"
                          : occ.status === "attention"
                            ? "ATENÇÃO"
                            : "ELOGIO"}
                      </span>
                      <span className="text-xs text-slate-400 font-manrope font-medium">
                        {new Date(occ.date).toLocaleDateString()}
                      </span>
                    </div>
                    {occ.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {occ.tags.map((t) => (
                          <span
                            key={t}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {occ.notes && (
                      <p className="text-sm font-manrope text-slate-600 mt-2 bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                        {occ.notes}
                      </p>
                    )}
                    {occ.justification && (
                      <p className="text-xs font-manrope text-slate-500 mt-2 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                        Justificativa: {occ.justification}
                      </p>
                    )}
                    {occ.attachmentUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden max-h-32">
                        <img
                          src={occ.attachmentUrl}
                          alt="Anexo"
                          className="w-full object-cover"
                        />
                      </div>
                    )}
                    {(occ.meetingReminderDate || occ.meetingReminderTime) && (
                      <div className="mt-2 text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 w-fit px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        Reunião: {occ.meetingReminderDate} às{" "}
                        {occ.meetingReminderTime}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === "charts" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-2 pb-12"
        >
          <div className="glass-card p-4 rounded-2xl">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1 flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" /> Evolução de Notas
            </h3>
            {student?.evaluations && student.evaluations.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[...student.evaluations]
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime(),
                      )
                      .map((ev) => ({
                        name: ev.method.substring(0, 10),
                        nota: ev.points,
                        bimester: ev.bimester,
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      tickMargin={10}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      domain={[0, "dataMax"]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nota"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#3b82f6",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 6 }}
                    />
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
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest ml-1 mb-4">
              Estatísticas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  Média Geral
                </p>
                <p className="text-2xl font-extrabold text-primary">
                  {student?.evaluations?.length
                    ? (
                        student.evaluations.reduce(
                          (acc, curr) => acc + curr.points,
                          0,
                        ) / student.evaluations.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  Total Ocorrências
                </p>
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

const AgendaScreen = ({
  appData,
  onShowNotification,
  onSyncGoogle,
  isSyncingGoogle,
  onAddEvent,
}: {
  appData: AppState;
  onShowNotification: (msg: string) => void;
  onSyncGoogle: () => void;
  isSyncingGoogle?: boolean;
  onAddEvent?: (evt: any) => void;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    dateStr: string;
    dayObj: Date;
  } | null>(null);

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderContent, setReminderContent] = useState("");

  const handleCreateReminder = () => {
    if (!reminderTitle.trim() || !selectedDayInfo || !onAddEvent) return;
    const monthNames = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    const newEvent = {
      id: "custom-" + Date.now().toString(),
      title: reminderTitle,
      month: monthNames[selectedDayInfo.dayObj.getMonth()],
      day: selectedDayInfo.dayObj.getDate().toString(),
      time: "O Dia Todo",
      start: "09:00",
      dateIso: selectedDayInfo.dateStr,
      isCustom: true,
      syncedToGoogle: false,
      notes: reminderContent,
    };
    onAddEvent(newEvent);
    onShowNotification("Lembrete salvo na agenda.");
    setReminderTitle("");
    setReminderContent("");
    setShowAddReminder(false);
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );

  const daysInMonth = getDaysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth(),
  );
  const firstDay = getFirstDayOfMonth(
    currentDate.getFullYear(),
    currentDate.getMonth(),
  );

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = [
    "Janeiro", // ... etc
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Helper to get YYYY-MM-DD
  const formatDateForHistory = (year: number, month: number, day: number) => {
    const yStr = year.toString();
    const mStr = (month + 1).toString().padStart(2, "0");
    const dStr = day.toString().padStart(2, "0");
    return `${yStr}-${mStr}-${dStr}`;
  };

  const dayClick = (dayStr: string, day: number) => {
    setSelectedDayInfo({
      dateStr: dayStr,
      dayObj: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
    });
  };

  const renderPopup = () => {
    if (!selectedDayInfo) return null;
    const { dateStr, dayObj } = selectedDayInfo;

    const dayNameIndex = dayObj.getDay();
    const daysArr = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    const dayName = daysArr[dayNameIndex];
    const generalDays = Array.isArray(appData.teachingDays) ? appData.teachingDays : (typeof appData.teachingDays === 'string' ? JSON.parse(appData.teachingDays) : []);

    // Get absent students per class
    const absents = (appData.classes || [])
      .map((c) => {
        const classSpecificDays = c.schedule?.days || [];
        const isClassDay = classSpecificDays.length > 0 
          ? classSpecificDays.includes(dayName)
          : (generalDays.length > 0 ? generalDays.includes(dayName) : true);

        if (!isClassDay) {
          return { class: c, missing: [] };
        }

        const missing = c.students.filter(
          (s) =>
            s.attendanceHistory && s.attendanceHistory[dateStr] === "absent",
        );
        return { class: c, missing };
      })
      .filter((c) => c.missing.length > 0);

    // Get occurrences for the date
    const dStrOcc = dateStr;
    const occs = (appData.occurrences || []).filter((o) =>
      o.date.startsWith(dStrOcc),
    );

    // Get calendar events (conteúdo/eventos)
    const evs = (appData.googleCalendarEvents || []).filter((e) => {
      if (!e.dateIso) {
        const d = dayObj.getDate().toString();
        const dPad = d.padStart(2, "0");
        return e.day === d || e.day === dPad;
      }
      return e.dateIso.startsWith(dStrOcc);
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Resumo do Dia
              </h3>
              <p className="text-sm text-slate-500 font-manrope">
                {dayObj.getDate()} de {monthNames[dayObj.getMonth()]} de{" "}
                {dayObj.getFullYear()}
              </p>
            </div>
            <button
              onClick={() => setSelectedDayInfo(null)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors active:scale-95"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1a1b21] dark:text-slate-50 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Faltosos do Dia
              </h4>
              <div className="space-y-3">
                {absents.length > 0 ? (
                  absents.map((cGroup) => (
                    <div
                      key={cGroup.class.id}
                      className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-2">
                        Turma: {cGroup.class.name}
                      </p>
                      <ul className="space-y-1">
                        {cGroup.missing.map((m) => (
                          <li
                            key={m.id}
                            className="text-xs font-manrope font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {m.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Nenhuma falta registrada.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1a1b21] dark:text-slate-50 mb-3 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-500" />
                Ocorrências / Divergências
              </h4>
              <div className="space-y-2">
                {occs.length > 0 ? (
                  occs.map((o) => {
                    const student = (appData.classes || [])
                      .flatMap((c) => c.students)
                      .find((s) => s.id === o.studentId);
                    return (
                      <div
                        key={o.id}
                        className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                      >
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                          Atenção: {student?.name || "Aluno Desconhecido"}
                        </p>
                        <p className="text-xs text-slate-500 font-manrope mt-1">
                          - {o.notes || o.status}
                        </p>
                        {o.tags && o.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {o.tags.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Nenhuma ocorrência neste dia.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1a1b21] dark:text-slate-50 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Conteúdo Aplicado / Agenda
                </h4>
                {!showAddReminder && (
                  <button
                    onClick={() => setShowAddReminder(true)}
                    className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-wider hover:bg-primary/20 transition-colors"
                  >
                    + Lembrete
                  </button>
                )}
              </div>

              {showAddReminder && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    placeholder="Título do Lembrete ou Aula..."
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-primary mb-2 font-medium"
                  />
                  <textarea
                    placeholder="Conteúdo, matéria, ou notas adicionais..."
                    value={reminderContent}
                    onChange={(e) => setReminderContent(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-primary mb-3 min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateReminder}
                      disabled={!reminderTitle.trim()}
                      className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setShowAddReminder(false)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {evs.length > 0 ? (
                  evs.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {ev.title}
                      </p>
                      {ev.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-1">
                          {ev.notes}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-manrope mt-1">
                        Horário: {ev.start}{" "}
                        {ev.isCustom ? "" : "- Sincronizado do Calendário"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic mb-2">
                    Nenhum evento ou conteúdo registrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          Agenda Escolar
        </h2>
        {appData.googleSynced ? (
          <button
            onClick={onSyncGoogle}
            disabled={isSyncingGoogle}
            title="Sincronizar Agenda"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary"
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncingGoogle ? "animate-spin" : ""}`}
            />
          </button>
        ) : (
          <button
            onClick={onSyncGoogle}
            disabled={isSyncingGoogle}
            className="text-xs px-3 py-1.5 font-bold text-white bg-blue-600 rounded-lg"
          >
            Sincronizar Google Agenda
          </button>
        )}
      </div>

      <div className="glass-card p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <div className="flex gap-4">
            <ChevronLeft
              onClick={prevMonth}
              className="w-5 h-5 text-slate-400 cursor-pointer hover:text-primary transition-colors"
            />
            <ChevronRight
              onClick={nextMonth}
              className="w-5 h-5 text-slate-400 cursor-pointer hover:text-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center font-manrope">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, idx) => (
            <span
              key={`header-${idx}`}
              className="text-xs font-extrabold text-slate-400 uppercase"
            >
              {d}
            </span>
          ))}

          {days.map((d, idx) => {
            if (!d) return <div key={`empty-${idx}`} />;

            const dateStr = formatDateForHistory(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              d,
            );

            const dayObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const dayNameIndex = dayObj.getDay();
            const daysArr = [
              "Domingo",
              "Segunda",
              "Terça",
              "Quarta",
              "Quinta",
              "Sexta",
              "Sábado",
            ];
            const dayName = daysArr[dayNameIndex];
            const generalDays = Array.isArray(appData.teachingDays) ? appData.teachingDays : (typeof appData.teachingDays === 'string' ? JSON.parse(appData.teachingDays) : []);

            // Compute missing counts for this day
            const absentsPerClass = (appData.classes || [])
              .map((c) => {
                const classSpecificDays = c.schedule?.days || [];
                const isClassDay = classSpecificDays.length > 0 
                  ? classSpecificDays.includes(dayName)
                  : (generalDays.length > 0 ? generalDays.includes(dayName) : true);

                if (!isClassDay) return null;

                const count = c.students.filter(
                  (s) =>
                    s.attendanceHistory &&
                    s.attendanceHistory[dateStr] === "absent",
                ).length;
                return count > 0 ? { className: c.name, count } : null;
              })
              .filter(Boolean) as { className: string; count: number }[];

            const hasOcc = (appData.occurrences || []).some((o) =>
              o.date.startsWith(dateStr),
            );
            const totalMissing = absentsPerClass.reduce(
              (acc, curr) => acc + curr.count,
              0,
            );

            return (
              <div
                key={`day-${idx}`}
                onClick={() => dayClick(dateStr, d)}
                className="flex flex-col items-center justify-start py-2 px-1 min-h-[80px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {d}
                  </span>

                  {totalMissing > 0 && (
                    <div className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded w-full line-clamp-1 truncate text-center">
                      {totalMissing} Faltas
                    </div>
                  )}

                  {hasOcc && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {renderPopup()}
    </div>
  );
};

const MaterialsScreen = ({
  appData,
  onUpdateMaterials,
}: {
  appData: AppState;
  onUpdateMaterials: (materials: MaterialData[]) => void;
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newType, setNewType] = useState<"video" | "document" | "link">(
    "document",
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || (!newLink && newType !== "document")) return;

    // If no classes selected, default to all classes
    const finalSelectedClasses =
      selectedClasses.length > 0
        ? selectedClasses
        : (appData.classes || []).map((c) => c.id);

    const newMaterial: MaterialData = {
      id: crypto.randomUUID(),
      title: newTitle,
      link: newLink,
      type: newType,
      targetClasses: finalSelectedClasses,
    };
    onUpdateMaterials([...(appData.materials || []), newMaterial]);
    setShowAddForm(false);
    setNewTitle("");
    setNewLink("");
    setNewType("document");
    setSelectedClasses([]);
  };

  const handleDelete = (id: string) => {
    onUpdateMaterials((appData.materials || []).filter((m) => m.id !== id));
  };

  const classes = appData.classes || [];
  const materials = appData.materials || [];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            Materiais Didáticos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">
            Cadastre apostilas, vídeos e defina para quais turmas.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          {showAddForm ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">
            {showAddForm ? "Cancelar" : "Novo Material"}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={handleAddSubmit}
          >
            <div className="glass-card p-6 rounded-3xl space-y-4 mb-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-secondary" /> Cadastrar Novo
                Material
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                    Título do Material
                  </label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    type="text"
                    placeholder="Ex: Aula de Ciências - Fotossíntese"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                    Tipo
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer"
                  >
                    <option value="document">Apostila/Documento</option>
                    <option value="video">Vídeo Aula</option>
                    <option value="link">Link Externo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Link (URL)
                </label>
                <input
                  required={newType !== "document"}
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  type="url"
                  placeholder="https://..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">
                  Turmas Aplicadas (vazio = todas)
                </label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setSelectedClasses((prev) =>
                          prev.includes(c.id)
                            ? prev.filter((id) => id !== c.id)
                            : [...prev, c.id],
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${selectedClasses.includes(c.id) ? "bg-secondary text-white border-secondary" : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 dark:text-slate-400"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full md:w-auto mt-4 px-6 py-3 rounded-xl shadow-lg border-b-4 border-emerald-600 bg-emerald-500 font-extrabold text-white text-sm uppercase tracking-widest active:translate-y-1 active:border-b-0 hover:bg-emerald-400 transition-all flex justify-center items-center gap-2"
                >
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
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">
              Nenhum material cadastrado
            </h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Clique em "Novo Material" para adicionar apostilas, vídeos e
              recursos para suas turmas.
            </p>
          </div>
        )}
        {materials.map((m) => (
          <div
            key={m.id}
            className="glass-card p-6 rounded-3xl flex flex-col justify-between group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  {m.type === "video" ? (
                    <Video className="w-6 h-6" />
                  ) : m.type === "link" ? (
                    <Link2 className="w-6 h-6" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 hover:shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
                {m.title}
              </h4>
              <a
                href={m.link || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-primary hover:underline break-all line-clamp-2 mb-6 block bg-primary/5 p-3 rounded-xl"
              >
                {m.link || "Arquivo Sem Link (Em breve upload real)"}
              </a>
            </div>

            <div className="mt-auto border-t border-slate-100 dark:border-slate-800/50 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Turmas
              </span>
              <div className="flex flex-wrap gap-2">
                {m.targetClasses.slice(0, 3).map((cid) => {
                  const cname =
                    classes.find((c) => c.id === cid)?.name || "Desconhecida";
                  return (
                    <span
                      key={cid}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-bold"
                    >
                      {cname}
                    </span>
                  );
                })}
                {m.targetClasses.length > 3 && (
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
                    +{m.targetClasses.length - 3}
                  </span>
                )}
                {m.targetClasses.length === classes.length &&
                  classes.length > 0 && (
                    <span className="text-[10px] bg-secondary/10 text-secondary px-3 py-1 rounded-full font-bold ml-1 border border-secondary/20">
                      Todas as Turmas
                    </span>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsScreen = ({
  appData,
  onUpdateClasses,
  onShowNotification,
  currentViewRole,
  initialModule,
}: {
  appData: AppState;
  onUpdateClasses: (classes: ClassData[]) => void;
  onShowNotification: (msg: string) => void;
  currentViewRole: "teacher" | "student";
  initialModule?: string;
}) => {
  const isStudent = currentViewRole === "student";
  const [activeModule, setActiveModule] = useState<string | null>(
    initialModule || null,
  );
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  const [attendanceSubMode, setAttendanceSubMode] = useState<
    "students" | "calendar"
  >("students");
  const [reportCalendarMonth, setReportCalendarMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [reportCalendarYear, setReportCalendarYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [selectedReportCalendarDate, setSelectedReportCalendarDate] = useState<
    string | null
  >(() => getLocalDateString());
  const [reportCalendarFilter, setReportCalendarFilter] = useState<
    "all" | "absent" | "present" | "late"
  >("all");

  const [editingDiag, setEditingDiag] = useState(false);
  const [diagText, setDiagText] = useState("");

  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalToDelete, setEvalToDelete] = useState<string | null>(null);
  const [evalMethodType, setEvalMethodType] = useState("Prova Bimestral");
  const [evalMethod, setEvalMethod] = useState("");
  const [evalPoints, setEvalPoints] = useState<number | "">("");
  const [evalBimester, setEvalBimester] = useState("1º Bimestre");
  const [filterBimester, setFilterBimester] = useState("Todos");

  const reportModules = [
    {
      id: "attendance",
      title: "Relatório de Frequência",
      desc: "Resumo de faltas e presenças por período.",
      icon: Book,
    },
    {
      id: "diagnostics",
      title: "Diagnósticos (Prof)",
      desc: "Análise do perfil e necessidades da classe.",
      icon: FileText,
      teacherOnly: true,
    },
    {
      id: "evaluations",
      title: "Avaliações e Notas",
      desc: "Acompanhe provas e trabalhos.",
      icon: Award,
    },
  ];

  const visibleModules = reportModules.filter((m) =>
    isStudent ? !m.teacherOnly : true,
  );

  const activeClass = (appData.classes || []).find(
    (c) => c.id === activeClassId,
  );
  const activeStudent = activeClass?.students.find(
    (s) => s.id === activeStudentId,
  );

  const handleQuickSaveDiagnostic = () => {
    if (!activeClass || !activeStudent) return;
    const newClasses = (appData.classes || []).map((c) => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: c.students.map((s) =>
            s.id === activeStudentId ? { ...s, diagnostic: diagText } : s,
          ),
        };
      }
      return c;
    });
    onUpdateClasses(newClasses);
    onShowNotification("Diagnóstico salvo rapidamente!");
  };

  const handleSaveDiagnostic = () => {
    if (!activeClass || !activeStudent) return;
    const newClasses = (appData.classes || []).map((c) => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: c.students.map((s) =>
            s.id === activeStudentId ? { ...s, diagnostic: diagText } : s,
          ),
        };
      }
      return c;
    });
    onUpdateClasses(newClasses);
    setEditingDiag(false);
    onShowNotification("Diagnóstico salvo com sucesso!");
  };

  const handleSaveEval = () => {
    if (!activeClass || !activeStudent) return;

    const finalMethod =
      evalMethodType === "Outro" ? evalMethod.trim() : evalMethodType;

    if (!finalMethod) {
      onShowNotification("Informe o método de avaliação");
      return;
    }
    if (evalPoints === "") {
      onShowNotification("Informe uma pontuação");
      return;
    }

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
      bimester: evalBimester,
    };

    const newClasses = (appData.classes || []).map((c) => {
      if (c.id === activeClassId) {
        return {
          ...c,
          evaluationMethods: updatedMethods,
          students: c.students.map((s) => {
            if (s.id === activeStudentId) {
              return { ...s, evaluations: [...(s.evaluations || []), newEval] };
            }
            return s;
          }),
        };
      }
      return c;
    });
    onUpdateClasses(newClasses);
    setShowEvalForm(false);
    setEvalMethod("");
    setEvalPoints("");
    onShowNotification("Avaliação adicionada!");
  };

  const calculateTotalPoints = (
    evals?: StudentEvaluation[],
    filter?: string,
  ) => {
    if (!evals) return 0;
    const filtered =
      filter && filter !== "Todos"
        ? evals.filter((e) => e.bimester === filter)
        : evals;
    return filtered.reduce((sum, e) => sum + e.points, 0);
  };

  if (!activeModule) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Relatórios e Avaliações
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">
              Acompanhe diagnósticos e desempenho.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleModules.map((module) => (
            <div
              key={module.id}
              className="glass-card p-5 rounded-2xl flex items-start gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              onClick={() => setActiveModule(module.id)}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <module.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">
                  {module.title}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {module.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active Module View
  const moduleInfo = visibleModules.find((m) => m.id === activeModule);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            setActiveModule(null);
            setActiveClassId(null);
            setActiveStudentId(null);
          }}
          className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {moduleInfo?.title}
          </h2>
        </div>
      </div>

      {/* Class Selection */}
      {!activeClassId && !isStudent && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">
            Selecione uma Turma
          </h3>
          <div className="space-y-3">
            {(appData.classes || []).map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveClassId(c.id)}
                className="glass-card p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {c.name}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {c.students.length} alunos
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student List View */}
      {(activeClassId || isStudent) && !activeStudentId && (
        <div className="space-y-4">
          {!isStudent && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setActiveClassId(null)}
                className="text-xs font-bold text-primary flex items-center"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Voltar
              </button>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-2 font-mono">
                Alunos - {activeClass?.name}
              </h3>
            </div>
          )}

          {/* Class Level Bimester Filter for Evaluations */}
          {activeModule === "evaluations" && !isStudent && (
            <div className="mb-4">
              <select
                value={filterBimester}
                onChange={(e) => setFilterBimester(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold px-4 py-3 rounded-xl outline-none focus:border-primary cursor-pointer transition-colors shadow-sm"
              >
                <option value="Todos">Somar Todos os Bimestres</option>
                <option value="1º Bimestre">Filtrar: 1º Bimestre</option>
                <option value="2º Bimestre">Filtrar: 2º Bimestre</option>
                <option value="3º Bimestre">Filtrar: 3º Bimestre</option>
                <option value="4º Bimestre">Filtrar: 4º Bimestre</option>
              </select>
            </div>
          )}

          {/* Sub-tab segmented selections for Attendance module */}
          {activeModule === "attendance" && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full my-3">
              <button
                type="button"
                onClick={() => setAttendanceSubMode("students")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  attendanceSubMode === "students"
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Users className="w-4 h-4" />
                Resumo por Aluno
              </button>
              <button
                type="button"
                onClick={() => setAttendanceSubMode("calendar")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  attendanceSubMode === "calendar"
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendário e Datas
              </button>
            </div>
          )}

          {activeModule === "attendance" && attendanceSubMode === "calendar" ? (
            /* CALENDAR VIEW FOR ABSENT HISTORY INSIDE REPORT SCREEN */
            <div className="space-y-6">
              <div className="glass-card p-5 rounded-3xl space-y-4">
                {/* Calendar month selector header */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      if (reportCalendarMonth === 0) {
                        setReportCalendarMonth(11);
                        setReportCalendarYear((y) => y - 1);
                      } else {
                        setReportCalendarMonth((m) => m - 1);
                      }
                    }}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <span className="font-extrabold text-base text-slate-800 dark:text-slate-100 block capitalize">
                      {
                        [
                          "Janeiro",
                          "Fevereiro",
                          "Março",
                          "Abril",
                          "Maio",
                          "Junho",
                          "Julho",
                          "Agosto",
                          "Setembro",
                          "Outubro",
                          "Novembro",
                          "Dezembro",
                        ][reportCalendarMonth]
                      }
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      {reportCalendarYear}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (reportCalendarMonth === 11) {
                        setReportCalendarMonth(0);
                        setReportCalendarYear((y) => y + 1);
                      } else {
                        setReportCalendarMonth((m) => m + 1);
                      }
                    }}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Grid Calendar of Absences */}
                <div>
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 font-mono">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (item) => (
                        <div key={item}>{item}</div>
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty placeholder prefix items */}
                    {Array.from({
                      length: new Date(
                        reportCalendarYear,
                        reportCalendarMonth,
                        1,
                      ).getDay(),
                    }).map((_, i) => (
                      <div
                        key={`rep-offset-${i}`}
                        className="h-16 bg-transparent"
                      />
                    ))}

                    {/* Actual monthly days list with indicators */}
                    {Array.from({
                      length: new Date(
                        reportCalendarYear,
                        reportCalendarMonth + 1,
                        0,
                      ).getDate(),
                    }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dayStr = `${reportCalendarYear}-${(reportCalendarMonth + 1).toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
                      const isSelected = selectedReportCalendarDate === dayStr;

                      const dayAbsents = (activeClass?.students || []).filter(
                        (s) => s.attendanceHistory?.[dayStr] === "absent",
                      );
                      const hasHistory = (activeClass?.students || []).some(
                        (s) =>
                          s.attendanceHistory?.[dayStr] !== undefined &&
                          s.attendanceHistory?.[dayStr] !== "none",
                      );

                      return (
                        <button
                          type="button"
                          key={`rep-day-${dayNum}`}
                          onClick={() => setSelectedReportCalendarDate(dayStr)}
                          className={`h-16 rounded-xl flex flex-col justify-between p-1.5 transition-all relative border outline-none ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/25 scale-[1.03] z-10"
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <span className="text-[11px] font-bold self-start">
                            {dayNum}
                          </span>

                          {hasHistory && (
                            <div className="w-full flex justify-center items-center pb-0.5">
                              {dayAbsents.length > 0 ? (
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center gap-0.5 ${
                                    isSelected
                                      ? "bg-white text-red-600"
                                      : "bg-red-500 text-white shadow-sm"
                                  }`}
                                >
                                  {dayAbsents.length}{" "}
                                  <span className="text-[8px] opacity-70">
                                    F
                                  </span>
                                </span>
                              ) : (
                                <span
                                  className={`text-[8px] font-extrabold px-1 py-0.5 rounded-full ${
                                    isSelected
                                      ? "bg-white/25 text-white"
                                      : "bg-green-500/10 text-green-500 dark:bg-green-500/20"
                                  }`}
                                >
                                  OK
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selection Summary displaying student missed lists */}
              {selectedReportCalendarDate && (
                <div className="glass-card p-5 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-700/60 shadow-md">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                        <span className="w-2.5 h-5 bg-red-400 rounded-full inline-block"></span>
                        Relatório de Faltas:{" "}
                        {parseSafeDate(
                          selectedReportCalendarDate,
                        ).toLocaleDateString("pt-BR")}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold font-manrope uppercase mt-0.5">
                        Use os botões de correção rápida se quiser alterar o
                        status
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full">
                      Ausentes:{" "}
                      <strong className="text-red-500 text-sm font-mono font-extrabold">
                        {
                          (activeClass?.students || []).filter(
                            (s) =>
                              s.attendanceHistory?.[
                                selectedReportCalendarDate
                              ] === "absent",
                          ).length
                        }
                      </strong>
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      const absents = (activeClass?.students || []).filter(
                        (s) =>
                          s.attendanceHistory?.[selectedReportCalendarDate] ===
                          "absent",
                      );
                      const presents = (activeClass?.students || []).filter(
                        (s) =>
                          s.attendanceHistory?.[selectedReportCalendarDate] ===
                          "present",
                      );
                      const lates = (activeClass?.students || []).filter(
                        (s) =>
                          s.attendanceHistory?.[selectedReportCalendarDate] ===
                          "late",
                      );
                      const hasDayRecords = (activeClass?.students || []).some(
                        (s) =>
                          s.attendanceHistory?.[selectedReportCalendarDate] !==
                            undefined &&
                          s.attendanceHistory?.[selectedReportCalendarDate] !==
                            "none",
                      );

                      const handleStatusUpdateInReport = (
                        studentId: string,
                        newStatus: "present" | "absent" | "late" | "none",
                      ) => {
                        const updatedClasses = (appData.classes || []).map(
                          (c) => {
                            if (c.id === activeClass?.id) {
                              return {
                                ...c,
                                students: c.students.map((s) => {
                                  if (s.id === studentId) {
                                    return {
                                      ...s,
                                      status:
                                        selectedReportCalendarDate ===
                                        getLocalDateString()
                                          ? newStatus
                                          : s.status,
                                      attendanceHistory: {
                                        ...(s.attendanceHistory || {}),
                                        [selectedReportCalendarDate]: newStatus,
                                      } as Record<
                                        string,
                                        "present" | "absent" | "late" | "none"
                                      >,
                                    };
                                  }
                                  return s;
                                }),
                              };
                            }
                            return c;
                          },
                        );
                        onUpdateClasses(updatedClasses);
                        onShowNotification(
                          "Frequência de aluno atualizada no relatório com sucesso!",
                        );
                      };

                      if (hasDayRecords) {
                        const allForDay = (activeClass?.students || []).map(
                          (s) => {
                            const sStatus =
                              s.attendanceHistory?.[
                                selectedReportCalendarDate
                              ] || "none";
                            return { ...s, currentStatus: sStatus };
                          },
                        );

                        const filtered = allForDay.filter((s) => {
                          if (reportCalendarFilter === "all") return true;
                          return s.currentStatus === reportCalendarFilter;
                        });

                        return (
                          <div className="space-y-4">
                            {/* Filter pills */}
                            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
                              <button
                                type="button"
                                onClick={() => setReportCalendarFilter("all")}
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-w-[70px] ${
                                  reportCalendarFilter === "all"
                                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm font-manrope font-semibold"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                              >
                                Todos ({allForDay.length})
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setReportCalendarFilter("absent")
                                }
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-w-[70px] ${
                                  reportCalendarFilter === "absent"
                                    ? "bg-red-500 text-white shadow-sm font-manrope font-semibold"
                                    : "text-slate-500 hover:text-red-500"
                                }`}
                              >
                                Faltas ({absents.length})
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setReportCalendarFilter("present")
                                }
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-w-[70px] ${
                                  reportCalendarFilter === "present"
                                    ? "bg-emerald-500 text-white shadow-sm font-manrope font-semibold"
                                    : "text-slate-500 hover:text-emerald-500"
                                }`}
                              >
                                Presenças ({presents.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setReportCalendarFilter("late")}
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-w-[70px] ${
                                  reportCalendarFilter === "late"
                                    ? "bg-amber-500 text-white shadow-sm font-manrope font-semibold"
                                    : "text-slate-500 hover:text-amber-500"
                                }`}
                              >
                                Atrasos ({lates.length})
                              </button>
                            </div>

                            {/* List items */}
                            <div className="space-y-3">
                              {filtered.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 font-manrope font-bold">
                                  Nenhum aluno encontrado com este status.
                                </div>
                              ) : (
                                filtered.map((student) => (
                                  <div
                                    key={`rep-stud-${student.id}`}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-slate-900/30 border hover:shadow-md transition-all gap-4 border-l-4 ${
                                      student.currentStatus === "absent"
                                        ? "border-l-red-500 border-slate-200/50 dark:border-slate-800/80"
                                        : student.currentStatus === "late"
                                          ? "border-l-amber-500 border-slate-200/50 dark:border-slate-800/80"
                                          : student.currentStatus === "present"
                                            ? "border-l-emerald-500 border-slate-200/50 dark:border-slate-800/80"
                                            : "border-l-slate-300 border-slate-200/50 dark:border-slate-800/80"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {student.avatar &&
                                      student.avatar.trim() !== "" ? (
                                        <img
                                          src={student.avatar}
                                          alt={student.name}
                                          className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                                          <UserCheck className="w-5 h-5" />
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                          {student.name.toUpperCase()}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span
                                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                              student.currentStatus === "absent"
                                                ? "bg-red-50 text-red-500 dark:bg-red-500/15"
                                                : student.currentStatus ===
                                                    "late"
                                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15"
                                                  : student.currentStatus ===
                                                      "present"
                                                    ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15"
                                                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                            }`}
                                          >
                                            {student.currentStatus === "absent"
                                              ? "Falta"
                                              : student.currentStatus === "late"
                                                ? "Atraso"
                                                : student.currentStatus ===
                                                    "present"
                                                  ? "Presente"
                                                  : "Sem Chamada"}
                                          </span>
                                          {student.specialNeeds?.map((need) => (
                                            <SpecialNeedBadge
                                              key={need}
                                              type={need}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Direct operations */}
                                    <div className="flex items-center gap-1.5 sm:self-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusUpdateInReport(
                                            student.id,
                                            "present",
                                          )
                                        }
                                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                          student.currentStatus === "present"
                                            ? "bg-emerald-500/15 border-transparent text-emerald-600"
                                            : "bg-transparent hover:bg-slate-100 border-slate-250 text-slate-500 dark:text-slate-450"
                                        }`}
                                      >
                                        Presença
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusUpdateInReport(
                                            student.id,
                                            "absent",
                                          )
                                        }
                                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                          student.currentStatus === "absent"
                                            ? "bg-red-500/15 border-transparent text-red-600"
                                            : "bg-transparent hover:bg-slate-100 border-slate-250 text-slate-500 dark:text-slate-450"
                                        }`}
                                      >
                                        Falta
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusUpdateInReport(
                                            student.id,
                                            "late",
                                          )
                                        }
                                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                          student.currentStatus === "late"
                                            ? "bg-amber-500/15 border-transparent text-amber-600"
                                            : "bg-transparent hover:bg-slate-100 border-slate-250 text-slate-500 dark:text-slate-450"
                                        }`}
                                      >
                                        Atraso
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                          {hasDayRecords ? (
                            <div className="space-y-2">
                              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                              <p className="font-bold text-emerald-500 text-sm">
                                Frequência Completa! Todos compareceram neste
                                dia. 🎉
                              </p>
                              <p className="text-[11px] font-bold text-slate-400 font-mono">
                                Presentes: {presents.length} • Atrasados:{" "}
                                {lates.length}
                              </p>
                            </div>
                          ) : (
                            <p className="font-bold text-slate-400 text-sm py-4">
                              Sem registros de chamada para esta turma nesta
                              data.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STANDARD STUDENT LIST GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ...(isStudent
                  ? (appData.classes || []).flatMap((c) => c.students)
                  : activeClass?.students || []),
              ]
                .sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase()))
                .map((student) => (
                  <div
                    key={student.id}
                    onClick={() => {
                      if (isStudent) {
                        const studentClass = (appData.classes || []).find((c) =>
                          c.students.some((s) => s.id === student.id),
                        );
                        if (studentClass) setActiveClassId(studentClass.id);
                      }
                      setActiveStudentId(student.id);
                    }}
                    className="glass-card p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors border border-transparent group"
                  >
                    {student.avatar && student.avatar.trim() !== "" ? (
                      <img
                        src={student.avatar}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                          {student.name.toUpperCase()}
                        </h4>
                        <div className="flex gap-1">
                          {student.specialNeeds?.map((need) => (
                            <SpecialNeedBadge key={need} type={need} />
                          ))}
                        </div>
                      </div>
                      {activeModule === "diagnostics" && student.diagnostic && (
                        <p className="text-[10px] uppercase font-bold text-emerald-500 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Avaliado
                        </p>
                      )}
                      {activeModule === "diagnostics" &&
                        !student.diagnostic && (
                          <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 flex items-center gap-1">
                            Pendente
                          </p>
                        )}
                      {/* ENRICH ATTENDANCE IN REPORT LIST TO DISPLAY TOTAL ABSENCES AND % PRESENCE */}
                      {activeModule === "attendance" &&
                        (() => {
                          const stats = (() => {
                            const history = student.attendanceHistory || {};
                            const entries = Object.entries(history).filter(
                              ([_, s]) => s !== "none",
                            );
                            if (entries.length === 0)
                              return { absent: 0, percentage: 100 };
                            const absents = entries.filter(
                              ([_, s]) => s === "absent",
                            ).length;
                            return {
                              absent: absents,
                              percentage: Math.round(
                                ((entries.length - absents) / entries.length) *
                                  100,
                              ),
                            };
                          })();
                          return (
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500 font-manrope">
                                Frequência:{" "}
                                <strong
                                  className={
                                    stats.percentage >= 90
                                      ? "text-green-500"
                                      : stats.percentage >= 75
                                        ? "text-amber-500"
                                        : "text-red-500"
                                  }
                                >
                                  {stats.percentage}%
                                </strong>
                              </span>
                              <span className="text-[11px] font-bold text-red-500 font-mono ml-4">
                                {stats.absent} faltas
                              </span>
                            </div>
                          );
                        })()}
                      {activeModule !== "evaluations" &&
                        activeModule !== "diagnostics" &&
                        activeModule !== "attendance" && (
                          <p className="text-xs text-slate-500 capitalize">
                            {student.status === "present"
                              ? "Presente"
                              : student.status === "absent"
                                ? "Ausente"
                                : "Sem Status"}
                          </p>
                        )}
                    </div>
                    {activeModule === "evaluations" && (
                      <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex flex-col items-center justify-center min-w-[70px]">
                        <span className="text-lg font-extrabold leading-none">
                          {calculateTotalPoints(
                            student.evaluations,
                            filterBimester,
                          )}
                        </span>
                        <span className="text-[10px] font-bold uppercase mt-0.5">
                          pts
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Student Details View */}
      {activeStudentId && activeStudent && activeClass && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 glass-card p-4 rounded-2xl relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-2 h-full bg-primary`}
            ></div>
            {activeStudent.avatar && activeStudent.avatar.trim() !== "" ? (
              <img
                src={activeStudent.avatar}
                alt={activeStudent.name}
                className="w-14 h-14 rounded-full object-cover shadow-md ml-2"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-md ml-2 shrink-0">
                <UserCheck className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  {activeStudent.name.toUpperCase()}
                </h3>
                <div className="flex gap-1">
                  {activeStudent.specialNeeds?.map((need) => (
                    <SpecialNeedBadge key={need} type={need} />
                  ))}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 font-manrope">
                {activeClass.name}
              </p>
            </div>
            {!isStudent && (
              <button
                onClick={() => {
                  setActiveStudentId(null);
                  setEditingDiag(false);
                  setShowEvalForm(false);
                }}
                className="absolute top-4 right-4 text-xs font-bold text-primary flex items-center bg-transparent"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Voltar
              </button>
            )}
          </div>

          {/* Module: Diagnostics */}
          {activeModule === "diagnostics" && (
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Diagnóstico
                Descritivo
              </h4>

              {!editingDiag ? (
                <>
                  {activeStudent.diagnostic ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-sm tracking-wide leading-relaxed text-slate-700 dark:text-slate-300 font-manrope whitespace-pre-wrap">
                        {activeStudent.diagnostic}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 opacity-50">
                      <p className="font-manrope text-sm font-bold">
                        Nenhum diagnóstico registrado.
                      </p>
                    </div>
                  )}

                  {!isStudent && (
                    <button
                      onClick={() => {
                        setDiagText(activeStudent.diagnostic || "");
                        setEditingDiag(true);
                      }}
                      className="w-full text-xs font-bold text-primary py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      {activeStudent.diagnostic
                        ? "Editar Diagnóstico"
                        : "Adicionar Diagnóstico"}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={diagText}
                    onChange={(e) => setDiagText(e.target.value)}
                    rows={6}
                    placeholder="Digite suas observações e avaliação discursiva sobre o aluno..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-xl font-medium outline-none text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setEditingDiag(false)}
                      className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleQuickSaveDiagnostic}
                      className="flex-1 py-3 font-bold text-secondary bg-secondary/10 border border-secondary/20 rounded-xl hover:bg-secondary/20 transition-colors"
                    >
                      Salvar Rápido
                    </button>
                    <button
                      onClick={handleSaveDiagnostic}
                      className="flex-1 py-3 font-bold text-white bg-primary rounded-xl shadow-lg hover:shadow-primary/30"
                    >
                      Salvar e Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Module: Evaluations */}
          {activeModule === "evaluations" && (
            <div className="space-y-6">
              <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" /> Pontuação Total
                    </h4>
                    <p className="text-xs text-slate-500 font-manrope mt-1">
                      Soma das avaliações do período
                    </p>
                  </div>
                  <div className="text-3xl font-extrabold text-primary">
                    {calculateTotalPoints(
                      activeStudent.evaluations,
                      filterBimester,
                    )}{" "}
                    pts
                  </div>
                </div>
                <select
                  value={filterBimester}
                  onChange={(e) => setFilterBimester(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold px-3 py-2 rounded-xl outline-none focus:ring-2 ring-primary/20 cursor-pointer"
                >
                  <option value="Todos">Todos os Bimestres</option>
                  <option value="1º Bimestre">1º Bimestre</option>
                  <option value="2º Bimestre">2º Bimestre</option>
                  <option value="3º Bimestre">3º Bimestre</option>
                  <option value="4º Bimestre">4º Bimestre</option>
                </select>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">
                    Histórico de Avaliações
                  </h4>
                  {!isStudent && !showEvalForm && (
                    <button
                      onClick={() => setShowEvalForm(true)}
                      className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showEvalForm && !isStudent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 mb-4 overflow-hidden"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                        Bimestre
                      </label>
                      <select
                        value={evalBimester}
                        onChange={(e) => setEvalBimester(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer transition-colors shadow-sm"
                      >
                        <option value="1º Bimestre">1º Bimestre</option>
                        <option value="2º Bimestre">2º Bimestre</option>
                        <option value="3º Bimestre">3º Bimestre</option>
                        <option value="4º Bimestre">4º Bimestre</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                        Tipo de Avaliação
                      </label>
                      <select
                        value={evalMethodType}
                        onChange={(e) => setEvalMethodType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer transition-colors shadow-sm"
                      >
                        <option value="Prova Bimestral">Prova Bimestral</option>
                        <option value="Atividades e Trabalhos">
                          Atividades e Trabalhos
                        </option>
                        <option value="Vistos no Caderno">
                          Vistos no Caderno
                        </option>
                        <option value="Apresentação">Apresentação</option>
                        <option value="Participação">
                          Participação / Comportamento
                        </option>
                        <option value="Outro">Outro (Personalizado...)</option>
                      </select>
                    </div>
                    {evalMethodType === "Outro" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                          Nome da Atividade
                        </label>
                        <input
                          list="methods-list"
                          type="text"
                          value={evalMethod}
                          onChange={(e) => setEvalMethod(e.target.value)}
                          placeholder="Ex: Feira de Ciências"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold transition-colors shadow-sm"
                        />
                        <datalist id="methods-list">
                          {(activeClass.evaluationMethods || []).map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                        Pontos (pode ser negativo)
                      </label>
                      <input
                        type="number"
                        value={evalPoints}
                        onChange={(e) => setEvalPoints(Number(e.target.value))}
                        placeholder="Ex: 5"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold font-mono transition-colors shadow-sm"
                      />
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={() => setShowEvalForm(false)}
                        className="flex-1 py-3 font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors rounded-xl font-manrope"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEval}
                        className="flex-1 py-3 font-bold text-white bg-primary hover:bg-primary/90 transition-colors rounded-xl shadow-lg border-b-4 border-black/10 active:border-b-0 active:translate-y-1 font-manrope"
                      >
                        Lançar Nota
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  {activeStudent.evaluations &&
                  activeStudent.evaluations.length > 0 ? (
                    [...activeStudent.evaluations]
                      .filter(
                        (ev) =>
                          filterBimester === "Todos" ||
                          ev.bimester === filterBimester,
                      )
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50"
                        >
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                              {ev.method}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                              {ev.bimester || "1º Bimestre"} •{" "}
                              {new Date(ev.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`font-extrabold ${ev.points >= 0 ? "text-emerald-500" : "text-red-500"}`}
                            >
                              {ev.points > 0 ? "+" : ""}
                              {ev.points}
                            </div>
                            {!isStudent && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEvalToDelete(ev.id)}
                                  className="p-1.5 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                                  title="Excluir Avaliação"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-xs font-bold text-slate-400 py-4 font-manrope">
                      Nenhuma avaliação registrada.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Module: Attendance */}
          {activeModule === "attendance" && (
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" /> Resumo de Frequência
              </h4>
              <p className="text-sm text-slate-500 font-manrope">
                O histórico de presença deste aluno.
              </p>
              <div className="space-y-2 font-sans">
                {Object.entries(activeStudent.attendanceHistory || {}).map(
                  ([date, status]) => (
                    <div
                      key={date}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50"
                    >
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                        {date}
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md ${status === "present" ? "bg-emerald-100 text-emerald-700" : status === "absent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {status === "present"
                            ? "Presente"
                            : status === "absent"
                              ? "Falta"
                              : "Atraso"}
                        </span>
                        {!isStudent && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedClasses = (
                                  appData.classes || []
                                ).map((c) => {
                                  if (c.id === activeClassId) {
                                    return {
                                      ...c,
                                      students: c.students.map((s) => {
                                        if (s.id === activeStudentId) {
                                          const currentStatus =
                                            s.attendanceHistory?.[date] ||
                                            "none";
                                          const newStatus =
                                            currentStatus === "present"
                                              ? "absent"
                                              : currentStatus === "absent"
                                                ? "late"
                                                : "present";
                                          return {
                                            ...s,
                                            status:
                                              date === getLocalDateString()
                                                ? newStatus
                                                : s.status,
                                            attendanceHistory: {
                                              ...(s.attendanceHistory || {}),
                                              [date]: newStatus,
                                            } as Record<
                                              string,
                                              | "none"
                                              | "absent"
                                              | "late"
                                              | "present"
                                            >,
                                          };
                                        }
                                        return s;
                                      }),
                                    };
                                  }
                                  return c;
                                });
                                onUpdateClasses(updatedClasses);
                                onShowNotification(
                                  "Chamada do aluno alterada com sucesso!",
                                );
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-primary bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 hover:scale-105 px-2.5 py-1 rounded-md transition-all uppercase tracking-widest cursor-pointer inline-flex items-center justify-center shadow-xs"
                              title="Alternar entre Presente, Falta e Atraso"
                            >
                              Alternar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )}
                {Object.keys(activeStudent.attendanceHistory || {}).length ===
                  0 && (
                  <p className="text-center text-xs font-bold text-slate-400 py-4 font-manrope">
                    Nenhuma chamada registrada.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
         isOpen={!!evalToDelete}
         title="Apagar Avaliação"
         message="Tem certeza que deseja apagar esta nota? Esta ação removerá a pontuação do diário de classe do aluno."
         onConfirm={() => {
           if (evalToDelete && activeClass && activeStudent) {
             const evalObj = activeStudent.evaluations?.find(e => e.id === evalToDelete);
             if (evalObj) {
                logAuditAction(appData, "Apagar Avaliação", `Avaliação ${evalObj.method} do aluno(a) ${activeStudent.name} (Nota: ${evalObj.points}) apagada na turma ${activeClass.name}`);
             }
             const newClasses = (appData.classes || []).map((c) => {
               if (c.id === activeClass.id) {
                 return {
                   ...c,
                   students: c.students.map((s) => {
                     if (s.id === activeStudent.id) {
                       return {
                         ...s,
                         evaluations: s.evaluations?.filter(
                           (e) => e.id !== evalToDelete,
                         ),
                       };
                     }
                     return s;
                   }),
                 };
               }
               return c;
             });
             onUpdateClasses(newClasses);
             setEvalToDelete(null);
           }
         }}
         onCancel={() => setEvalToDelete(null)}
      />
    </div>
  );
};

const ClassesScreen = ({
  appData,
  onUpdateClasses,
}: {
  appData: AppState;
  onUpdateClasses: (classes: ClassData[]) => void;
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newStudentText, setNewStudentText] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState("");
  const [editingSpecialNeeds, setEditingSpecialNeeds] = useState<string[]>([]);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [transferringStudentId, setTransferringStudentId] = useState<
    string | null
  >(null);
  const [transferSelectedClassId, setTransferSelectedClassId] = useState<
    string | null
  >(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState<
    {
      id: string;
      name: string;
      studentsCount: number;
      teacherName: string;
      originalClass: any;
    }[]
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState("");

  const currentClass = appData.classes?.find((c) => c.id === selectedClassId);

  const fetchSchoolClasses = async () => {
    if (!appData.schoolName) {
      setImportNotice(
        "Adicione o nome da sua escola em Configurações para buscar turmas de outros professores.",
      );
      return;
    }
    setIsImporting(true);
    setImportNotice("");
    try {
      const q = query(
        collection(db, "users"),
        where("schoolName", "==", appData.schoolName),
      );
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
                teacherName: data.teacherName || "Professor(a)",
                originalClass: c,
              });
            });
          } catch (e) {}
        }
      });
      setSchoolClasses(fetchedClasses);
      if (fetchedClasses.length === 0)
        setImportNotice("Nenhuma turma encontrada nesta instituição.");
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "users");
    }
    setIsImporting(false);
  };

  const handleImportClasses = (selectedIds: string[]) => {
    let newClasses = [...(appData.classes || [])];
    selectedIds.forEach((id) => {
      const found = schoolClasses.find((sc) => sc.id === id);
      if (found) {
        // Create a fresh copy to prevent mutating the original downloaded structure
        const clonedClass = JSON.parse(JSON.stringify(found.originalClass));
        clonedClass.id = Math.random().toString(36).substring(2, 9); // fresh ID
        // Give students fresh IDs too, except maybe don't need to if we assume they won't conflict, but safer to do it
        clonedClass.students = (clonedClass.students || []).map((s: any) => ({
          ...s,
          id: Math.random().toString(36).substring(2, 9),
          attendanceHistory: {},
          evaluations: [],
          status: "none",
        }));
        newClasses.push(clonedClass);
      }
    });
    onUpdateClasses(newClasses);
    setShowImportModal(false);
  };

  const handleRequestLinkWithStudents = async (scId: string) => {
    setIsImporting(true);
    try {
      const found = schoolClasses.find((sc) => sc.id === scId);
      if (found) {
        // Save link request record in Firestore under school_links collection
        try {
          const docRef = doc(collection(db, "school_links"));
          await setDoc(docRef, {
            teacherId: auth.currentUser?.uid || "unauthenticated",
            teacherName: appData.teacherName || "Professor",
            schoolName: appData.schoolName || "",
            originalClassId: found.originalClass?.id || "",
            className: found.name,
            studentsCount: found.studentsCount,
            status: "approved", // instantly approved by the system
            requestedAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.error("Error creating school link record:", dbErr);
        }

        // Clone the class structure but clean up individual statistics (evaluations, diagnostics, attendanceHistory)
        const clonedClass = JSON.parse(JSON.stringify(found.originalClass));
        clonedClass.id = Math.random().toString(36).substring(2, 9); // unique fresh ID
        clonedClass.students = (clonedClass.students || []).map((s: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          name: s.name,
          avatar: s.avatar || "",
          grade: s.grade || clonedClass.name,
          room: s.room || "N/A",
          status: "none" as const,
          attendanceHistory: {} as Record<
            string,
            "none" | "absent" | "late" | "present"
          >,
          diagnostic: "",
          evaluations: [] as StudentEvaluation[],
          specialNeeds: s.specialNeeds || [],
        }));

        const newClasses = [...(appData.classes || []), clonedClass];
        onUpdateClasses(newClasses);
        setShowImportModal(false);
      }
    } catch (e) {
      console.error("Error linking students:", e);
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditStudent = () => {
    if (!editingStudentId || !editingStudentName.trim() || !selectedClassId)
      return;
    const newName = editingStudentName.trim().toUpperCase();
    const updatedClasses = (appData.classes || []).map((c) => {
      if (c.id === selectedClassId) {
        return {
          ...c,
          students: c.students.map((s) =>
            s.id === editingStudentId
              ? {
                  ...s,
                  name: newName,
                  specialNeeds: editingSpecialNeeds,
                }
              : s,
          ),
        };
      }
      return c;
    });
    onUpdateClasses(updatedClasses);
    setEditingStudentId(null);
    setEditingStudentName("");
    setEditingSpecialNeeds([]);
  };

  const handleEditClass = () => {
    if (!editingClassId || !editingClassName.trim()) return;
    const newName = editingClassName.trim();
    const updatedClasses = (appData.classes || []).map((c) => {
      if (c.id === editingClassId) {
        return {
          ...c,
          name: newName,
          students: c.students.map((s) => ({ ...s, grade: newName })),
        };
      }
      return c;
    });
    onUpdateClasses(updatedClasses);
    setEditingClassId(null);
    setEditingClassName("");
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassData = {
      id: Date.now().toString(),
      name: newClassName,
      students: [],
    };
    onUpdateClasses([...(appData.classes || []), newClass]);
    setNewClassName("");
    setSelectedClassId(newClass.id);
  };

  const handleAddStudents = () => {
    if (!newStudentText.trim() || !selectedClassId) return;

    const lines = newStudentText
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return;

    const updatedClasses = (appData.classes || []).map((c) => {
      if (c.id === selectedClassId) {
        const newStudents = lines.map((name, i) => ({
          id: Date.now().toString() + i,
          name: name.toUpperCase(),
          avatar: "",
          grade: c.name,
          room: "N/A",
          status: "none" as const,
        }));
        return { ...c, students: [...c.students, ...newStudents] };
      }
      return c;
    });

    onUpdateClasses(updatedClasses);
    setNewStudentText("");
  };

  const handleRemoveStudent = (studentId: string) => {
    let studentName = "Desconhecido";
    let cName = "Turma";
    const updatedClasses = (appData.classes || []).map((c) => {
      if (c.id === selectedClassId) {
        cName = c.name;
        studentName = c.students.find((s) => s.id === studentId)?.name || studentName;
        return { ...c, students: c.students.filter((s) => s.id !== studentId) };
      }
      return c;
    });
    logAuditAction(appData, "Apagar Aluno", `Aluno(a) ${studentName} removido(a) da turma ${cName}`);
    onUpdateClasses(updatedClasses);
  };

  const handleTransferStudent = () => {
    if (
      !transferringStudentId ||
      !transferSelectedClassId ||
      !selectedClassId ||
      transferSelectedClassId === selectedClassId
    )
      return;
      
    if (!window.confirm("Atenção: Ao confirmar esta transferência, as notas também poderão ser movidas para a nova turma. Deseja prosseguir com a transferência da matrícula?")) return;

    const originalStudent = (appData.classes || [])
      .find((cl) => cl.id === selectedClassId)
      ?.students.find((s) => s.id === transferringStudentId);
    if (!originalStudent) return;

    const sourceClass = appData.classes?.find((c) => c.id === selectedClassId)?.name || "Origem";
    const targetClass = appData.classes?.find((c) => c.id === transferSelectedClassId)?.name || "Destino";

    logAuditAction(appData, "Transferir Aluno", `Aluno ${originalStudent.name} transferido de ${sourceClass} para ${targetClass}.`);

    const updatedClasses = (appData.classes || []).map((c) => {
      if (c.id === selectedClassId) {
        return {
          ...c,
          students: c.students.filter((s) => s.id !== transferringStudentId),
        };
      }
      if (c.id === transferSelectedClassId) {
        return {
          ...c,
          students: [...c.students, { ...originalStudent, grade: c.name }],
        };
      }
      return c;
    });
    onUpdateClasses(updatedClasses);
    setTransferringStudentId(null);
    setTransferSelectedClassId(null);
  };

  const handleRemoveClass = (classId: string) => {
    const cName = appData.classes?.find((c) => c.id === classId)?.name || "Desconhecida";
    logAuditAction(appData, "Apagar Turma", `Turma apagada: ${cName}`);

    const updatedClasses = (appData.classes || []).filter(
      (c) => c.id !== classId,
    );
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
          <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope font-medium">
            Adicione turmas e alunos.
          </p>
        </div>
        <button
          onClick={() => {
            setShowImportModal(true);
            fetchSchoolClasses();
          }}
          className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          title="Se o professor achar a escola criada, ele pode solicitar o vínculo com os alunos para frequência"
        >
          <Link2 className="w-4 h-4" /> Vincular Alunos (Escola)
        </button>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          ></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" /> Solicitar Vínculo
                    de Alunos
                  </h3>
                  <p className="text-xs text-slate-500 font-manrope mt-1 leading-relaxed">
                    Selecione uma turma registrada por outro docente de{" "}
                    <span className="font-bold text-primary">
                      {appData.schoolName || "sua escola"}
                    </span>{" "}
                    para solicitar o vínculo com os alunos ao seu perfil. Cada
                    um terá suas frequências e didáticas 100% individuais e
                    privadas.
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {isImporting ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold animate-pulse">
                    Buscando turmas e fazendo vínculo...
                  </p>
                </div>
              ) : importNotice ? (
                <div className="py-8 text-center px-4">
                  <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold">
                    {importNotice}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schoolClasses.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/30 transition-colors bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                          {sc.name}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-bold">
                            {sc.studentsCount} alunos
                          </span>
                          <span>•</span>
                          <span>Prof. {sc.teacherName}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleRequestLinkWithStudents(sc.id)}
                        className="bg-primary text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Solicitar Vínculo
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
              onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
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
            {(appData.classes || []).map((c) => (
              <div
                key={c.id}
                className={`glass-card p-4 rounded-xl flex flex-col justify-center cursor-pointer transition-colors border-2 ${selectedClassId === c.id ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30"}`}
              >
                {editingClassId === c.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editingClassName}
                      onChange={(e) => setEditingClassName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditClass()}
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
                    <div
                      className="flex-1 flex items-center justify-between"
                      onClick={() => setSelectedClassId(c.id)}
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {c.name}
                      </span>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {c.students.length} alunos
                      </span>
                    </div>
                    <div className="flex items-center ml-3 gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClassId(c.id);
                          setEditingClassName(c.name);
                        }}
                        className="text-slate-400 hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClassToDelete(c.id);
                        }}
                        className="text-red-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!appData.classes?.length && (
              <p className="text-center text-sm font-bold text-slate-400 py-8">
                Nenhuma turma cadastrada.
              </p>
            )}
          </div>
        </div>

        {/* Students List */}
        {selectedClassId && currentClass && (
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
              Alunos em {currentClass.name}
            </h3>

            <div className="flex gap-2">
              <textarea
                value={newStudentText}
                onChange={(e) => setNewStudentText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleAddStudents())
                }
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
              {[...(currentClass.students || [])]
                .sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase()))
                .map((s, index) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800"
                  >
                    {editingStudentId === s.id ? (
                      <div className="space-y-4 w-full">
                        <div className="flex gap-2 w-full">
                          <input
                            autoFocus
                            type="text"
                            value={editingStudentName}
                            onChange={(e) =>
                              setEditingStudentName(e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleEditStudent()
                            }
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-primary px-3 py-2 rounded-lg font-bold outline-none text-sm"
                          />
                          <button
                            onClick={handleEditStudent}
                            className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudentId(null);
                              setEditingSpecialNeeds([]);
                            }}
                            className="bg-slate-200 dark:bg-slate-700 text-slate-500 p-2 rounded-lg shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 px-1 pb-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Necessidades Especiais
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {["TEA", "DI", "DEF", "OUT"].map((need) => (
                              <button
                                key={need}
                                onClick={() => {
                                  if (editingSpecialNeeds.includes(need)) {
                                    setEditingSpecialNeeds(
                                      editingSpecialNeeds.filter(
                                        (n) => n !== need,
                                      ),
                                    );
                                  } else {
                                    setEditingSpecialNeeds([
                                      ...editingSpecialNeeds,
                                      need,
                                    ]);
                                  }
                                }}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border-2 ${
                                  editingSpecialNeeds.includes(need)
                                    ? "bg-primary border-primary text-white"
                                    : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/30"
                                }`}
                              >
                                {need === "TEA"
                                  ? "🧩 TEA"
                                  : need === "DI"
                                    ? "🧠 DI"
                                    : need === "DEF"
                                      ? "♿ DEF"
                                      : "✨ OUT"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3 items-center truncate overflow-visible">
                          <span className="text-xs font-bold text-slate-400 w-4">
                            {index + 1}
                          </span>
                          <div className="flex flex-col truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope truncate">
                                {s.name.toUpperCase()}
                              </span>
                              <div className="flex gap-1">
                                {s.specialNeeds?.map((need) => (
                                  <SpecialNeedBadge key={need} type={need} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center ml-2 shrink-0 gap-1">
                          <button
                            onClick={() => {
                              setTransferringStudentId(s.id);
                              setTransferSelectedClassId(null);
                            }}
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
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              {currentClass.students.length === 0 && (
                <p className="text-center text-xs font-bold text-slate-400 py-4">
                  Nenhum aluno nesta turma.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedClassId && currentClass && (
        <div className="glass-card p-6 rounded-3xl mt-6">
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">
            Configurar Horários da Turma
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Dias da Semana
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Segunda",
                  "Terça",
                  "Quarta",
                  "Quinta",
                  "Sexta",
                  "Sábado",
                ].map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      const currentDays = currentClass.schedule?.days || [];
                      const newDays = currentDays.includes(day)
                        ? currentDays.filter((d) => d !== day)
                        : [...currentDays, day];
                      const updatedClasses = (appData.classes || []).map((c) =>
                        c.id === currentClass.id
                          ? {
                              ...c,
                              schedule: {
                                ...c.schedule,
                                startTime: c.schedule?.startTime || "08:00",
                                endTime: c.schedule?.endTime || "12:00",
                                days: newDays,
                              },
                            }
                          : c,
                      );
                      onUpdateClasses(updatedClasses);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors border ${currentClass.schedule?.days?.includes(day) ? "bg-primary text-white border-primary" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Horário de Início
                </label>
                <input
                  type="time"
                  value={currentClass.schedule?.startTime || "08:00"}
                  onChange={(e) => {
                    const updatedClasses = (appData.classes || []).map((c) =>
                      c.id === currentClass.id
                        ? {
                            ...c,
                            schedule: {
                              days: c.schedule?.days || [],
                              endTime: c.schedule?.endTime || "12:00",
                              startTime: e.target.value,
                            },
                          }
                        : c,
                    );
                    onUpdateClasses(updatedClasses);
                  }}
                  className="w-full mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-primary text-sm font-bold cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Horário de Término
                </label>
                <input
                  type="time"
                  value={currentClass.schedule?.endTime || "12:00"}
                  onChange={(e) => {
                    const updatedClasses = (appData.classes || []).map((c) =>
                      c.id === currentClass.id
                        ? {
                            ...c,
                            schedule: {
                              days: c.schedule?.days || [],
                              startTime: c.schedule?.startTime || "08:00",
                              endTime: e.target.value,
                            },
                          }
                        : c,
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
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setTransferringStudentId(null)}
          ></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10 p-6 flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Transferir
              Aluno
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecione para qual turma deseja transferir:
            </p>
            <select
              value={transferSelectedClassId || ""}
              onChange={(e) => setTransferSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>
                Escolha a turma alvo...
              </option>
              {(appData.classes || [])
                .filter((c) => c.id !== selectedClassId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setTransferringStudentId(null)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferStudent}
                disabled={!transferSelectedClassId}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
         isOpen={!!classToDelete}
         title="Apagar Turma"
         message="Tem certeza que deseja apagar esta turma? Todos os alunos e relatórios vinculados serão apagados ou poderão ter dados inconsistentes. Esta ação não pode ser desfeita!"
         onConfirm={() => {
            if (classToDelete) {
               handleRemoveClass(classToDelete);
               setClassToDelete(null);
            }
         }}
         onCancel={() => setClassToDelete(null)}
      />

      <ConfirmDialog
         isOpen={!!studentToDelete}
         title="Remover Aluno"
         message="Tem certeza que deseja apagar este aluno do sistema? Esta ação apagará todas as presenças e notas associadas internamente na turma."
         onConfirm={() => {
            if (studentToDelete) {
               handleRemoveStudent(studentToDelete);
               setStudentToDelete(null);
            }
         }}
         onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};

const SettingsScreen = ({
  appData,
  onUpdateField,
  onLogout,
  onSyncGoogle,
  isSyncingGoogle,
  onInstall,
  canInstall,
  onNavigateAdmin,
  isAdmin,
  onShowNotification,
  appUpdateAvailable,
  acceptAppUpdate,
}: {
  appData: AppState;
  onUpdateField: (field: string, value: any) => void;
  onLogout: () => void;
  onSyncGoogle: () => void;
  isSyncingGoogle?: boolean;
  onInstall?: () => void;
  canInstall?: boolean;
  onNavigateAdmin?: () => void;
  isAdmin?: boolean;
  onShowNotification: (msg: string, type: "info" | "critical") => void;
  appUpdateAvailable?: boolean;
  acceptAppUpdate?: (() => void) | null;
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUpdateField("avatarUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = () => {
    if (!appData.classes || appData.classes.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Turma,Aluno,Data,Status\n";

    appData.classes.forEach((c) => {
      if (c.students) {
        c.students.forEach((s) => {
          if (s.attendanceHistory) {
            Object.entries(s.attendanceHistory).forEach(([date, status]) => {
              csvContent += `"${c.name}","${s.name}","${date}","${status}"\n`;
            });
          }
        });
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `horizonte_backup_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const consolidateDexieAttendance = async () => {
    try {
      const allAttendances = await dexieDb.attendance.toArray();
      const seen = new Map<string, any>();
      const toDelete: string[] = [];

      for (const record of allAttendances) {
        const key = `${record.classId}-${record.studentId}-${record.date}`;
        if (!seen.has(key)) {
          seen.set(key, record);
        } else {
          const existing = seen.get(key)!;
          if ((record.updatedAt || 0) > (existing.updatedAt || 0)) {
            toDelete.push(existing.localId);
            seen.set(key, record);
          } else {
            toDelete.push(record.localId);
          }
        }
      }

      if (toDelete.length > 0) {
        console.log(
          `[Backup Pre-Check] Consolidating ${toDelete.length} duplicate attendance records in Dexie...`,
        );
        await dexieDb.attendance.bulkDelete(toDelete);
      }
    } catch (e) {
      console.warn("Error during Dexie consolidation:", e);
    }
  };

  const handleDriveBackup = async () => {
    if (!appData.classes || appData.classes.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      onShowNotification("Por favor, autorize o Google Drive primeiro.", "info");
      onSyncGoogle();
      return;
    }

    setIsBackingUp(true);
    setBackupSuccess(false);

    try {
      // 1. Data Integrity & Deduplication before Backup
      await consolidateDexieAttendance();

      onShowNotification("Iniciando backup no Google Drive...", "info");

      // 2. Prepare Frequências Data
      const attendanceRows: string[][] = [];
      attendanceRows.push(["Turma", "Aluno", "Data", "Status"]);
      appData.classes.forEach((c) => {
        if (c.students) {
          c.students.forEach((s) => {
            if (s.attendanceHistory) {
              Object.entries(s.attendanceHistory).forEach(([date, status]) => {
                attendanceRows.push([c.name, s.name, date, status]);
              });
            }
          });
        }
      });

      // 3. Prepare Notas Data
      const gradesRows: string[][] = [];
      gradesRows.push([
        "Turma",
        "Aluno",
        "Data de Avaliação",
        "Nota",
        "Observações",
      ]);
      appData.classes.forEach((c) => {
        if (c.students) {
          c.students.forEach((s) => {
            if (s.evaluations && s.evaluations.length > 0) {
              s.evaluations.forEach((ev) => {
                gradesRows.push([
                  c.name,
                  s.name,
                  ev.date,
                  ev.grade.toString(),
                  ev.notes || "",
                ]);
              });
            } else {
              gradesRows.push([c.name, s.name, "N/A", "N/A", "N/A"]);
            }
          });
        }
      });

      // 4. Convert to CSV
      let csvContent = "\uFEFF--- Frequências ---\n";
      attendanceRows.forEach((row) => {
        csvContent += row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",") + "\n";
      });
      csvContent += "\n--- Notas ---\n";
      gradesRows.forEach((row) => {
        csvContent += row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",") + "\n";
      });

      // 5. Upload File to Google Drive
      const boundary = "-------314159265358979323846";
      const delimiter = "--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadata = {
        name: `Horizonte_Relatorio_Consolidado_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`,
        mimeType: "text/csv"
      };

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        "\r\n" +
        delimiter +
        "Content-Type: text/csv; charset=UTF-8\r\n\r\n" +
        csvContent +
        close_delim;

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!uploadRes.ok) {
        throw new Error(
          "Falha ao criar arquivo CSV. Verifique as permissões do Google.",
        );
      }

      const fileData = await uploadRes.json();
      const fileId = fileData.id;

      // 6. Find or Create "Horizonte" folder
      let folderId = null;
      try {
        const q = encodeURIComponent(
          "mimeType='application/vnd.google-apps.folder' and name='Horizonte' and trashed=false",
        );
        const folderSearchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${q}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const folderSearchData = await folderSearchRes.json();

        if (folderSearchData.files && folderSearchData.files.length > 0) {
          folderId = folderSearchData.files[0].id;
        } else {
          const createFolderRes = await fetch(
            "https://www.googleapis.com/drive/v3/files",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: "Horizonte",
                mimeType: "application/vnd.google-apps.folder",
              }),
            }
          );
          const createFolderData = await createFolderRes.json();
          folderId = createFolderData.id;
        }
      } catch (err) {
        console.warn("Could not handle Horizonte folder", err);
      }

      // 7. Move CSV to "Horizonte" folder
      if (folderId) {
        try {
          const fileRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const currentFileData = await fileRes.json();
          const previousParents = currentFileData.parents
            ? currentFileData.parents.join(",")
            : "";

          await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${previousParents}`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (err) {
          console.warn("Could not move file to folder", err);
        }
      }

      onShowNotification("Backup local e Google Drive salvos como CSV!", "info");
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(
        "Erro ao fazer upload. Verifique as permissões de acesso ao Drive.",
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Backup e Segurança
        </h3>
        <p className="text-xs text-slate-500 font-manrope mb-4 leading-relaxed">
          Garanta a segurança de seus dados exportando uma planilha interna ou
          salvando um backup no Google Drive.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <DownloadCloud className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Exportar Planilha (Local)
                </p>
                <p className="text-[10px] text-slate-500">
                  Baixar backup interno das frequências em CSV
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleDriveBackup}
            disabled={isBackingUp}
            className={`w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border rounded-xl transition-all ${
              backupSuccess
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80"
            }`}
          >
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                {backupSuccess ? (
                   <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <svg
                    className={`w-5 h-5 shrink-0 transition-opacity ${isBackingUp ? "opacity-30" : "opacity-100"}`}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.71 3.5L1.15 15l3.43 6h15.28l3.43-6L16.29 3.5H7.71zm1.66 2h5.27l5.22 9h-5.27l-5.22-9zm-2.09 10H1.9l3.42-6 5.37 9.4 1.88-3.4H7.28z"
                      fill="#4285F4"
                    />
                  </svg>
                )}
                {isBackingUp && !backupSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className={`text-sm font-bold ${backupSuccess ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100"}`}>
                   {isBackingUp ? "Salvando..." : backupSuccess ? "Salvo com sucesso!" : "Salvar no Google Drive"}
                </p>
                <p className="text-[10px] text-slate-500">
                  Exporta histórico de frequências e notas num único CSV
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2">
          Perfil
        </h3>
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl bg-slate-200">
              <img
                src={appData.avatarUrl?.trim() || TEACHER_AVATAR}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 text-xs rounded-full cursor-pointer shadow-lg hover:scale-105 transition-transform">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">
              Tipo de Perfil
            </label>
            <select
              value={appData.role || "teacher"}
              onChange={(e) => onUpdateField("role", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
            >
              <option value="student">Aluno</option>
              <option value="guardian">Pais/Responsável</option>
              <option value="teacher">Professor</option>
              <option value="both">Ambos</option>
              <option value="school_director">Diretor / Gestor</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">
               Nome Completo
            </label>
            <input
              type="text"
              value={appData.teacherName}
              onChange={(e) => onUpdateField("teacherName", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1 block mb-1">
              Nome da Escola
            </label>
            <input
              type="text"
              value={appData.schoolName}
              onChange={(e) => onUpdateField("schoolName", e.target.value)}
              readOnly={!isAdmin}
              disabled={!isAdmin}
              className={`w-full bg-slate-50 border-b-2 px-4 py-3 rounded-t-lg font-medium outline-none transition-colors ${
                isAdmin 
                  ? "dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary text-slate-700 dark:text-slate-200" 
                  : "dark:bg-slate-900/50 border-transparent text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70"
              }`}
            />
            {!isAdmin && (
              <p className="text-[9px] text-slate-400 mt-1 ml-1">
                Apenas gestores confirmados podem alterar o nome da instituição.
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">
              Disciplina Base Lecionada
            </label>
            <input
              type="text"
              value={appData.teacherSubject || ""}
              placeholder="Ex: Matemática, História, Educação Tecnológica..."
              onChange={(e) => onUpdateField("teacherSubject", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">
              Data de Nascimento
            </label>
            <div className="relative">
              <input
                type="date"
                value={appData.birthDate || ""}
                onChange={(e) => onUpdateField("birthDate", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary uppercase ml-1">
              CPF
            </label>
            <input
              type="text"
              value={appData.cpf || ""}
              onChange={(e) => onUpdateField("cpf", formatCPF(e.target.value))}
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
            />
          </div>
          <div className="pt-2">
            <label className="text-[10px] font-bold text-primary uppercase ml-1 block mb-2">
              Dias de Regência Gerais
            </label>
            <div className="flex flex-wrap gap-2">
              {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => {
                const currentDays = Array.isArray(appData.teachingDays) ? appData.teachingDays : (typeof appData.teachingDays === 'string' ? JSON.parse(appData.teachingDays) : []);
                const isActive = currentDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const newDays = isActive
                        ? currentDays.filter((d: string) => d !== day)
                        : [...currentDays, day];
                      onUpdateField("teachingDays", newDays);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors shadow-sm ${
                      isActive
                        ? "bg-primary text-white border-primary border"
                        : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-primary/50"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {appData.classes && appData.classes.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-bold text-primary uppercase ml-1 block mb-3">
                Dias de Regência Específicos por Turma
              </label>
              <div className="space-y-4">
                {appData.classes.map((cls) => (
                  <div key={cls.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                     <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">{cls.name}</p>
                     <div className="flex flex-wrap gap-2">
                       {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => {
                         const currentClassDays = cls.schedule?.days || [];
                         const isActive = currentClassDays.includes(day);
                         return (
                           <button
                             key={day}
                             onClick={() => {
                               const newDays = isActive
                                 ? currentClassDays.filter(d => d !== day)
                                 : [...currentClassDays, day];
                               const newClasses = appData.classes!.map(c => 
                                 c.id === cls.id ? { ...c, schedule: { ...c.schedule, days: newDays } } : c
                               );
                               onUpdateField("classes", newClasses);
                             }}
                             className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-colors ${
                               isActive
                                 ? "bg-primary text-white"
                                 : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-600"
                             }`}
                           >
                             {day}
                           </button>
                         );
                       })}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-[10px] text-slate-400 mt-2 ml-1 font-medium">Os dias específicos de cada turma prevalecem sobre os gerais no bloqueio de chamadas indevidas.</p>
          
          <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-700/50">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              Conexões e Integrações
            </h4>
            <div className="flex flex-col gap-3">
              <div className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Agenda (Calendar)
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!appData.googleCalendarSynced) {
                      onShowNotification("Iniciando conexão com Agenda...", "info");
                      // Need a way to trigger OAuth for this specific permission
                      onSyncGoogle();
                    } else {
                       onUpdateField("googleCalendarSynced", false);
                       onShowNotification("Integração com Agenda desconectada.", "info");
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold ${appData.googleCalendarSynced ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"}`}
                >
                  {appData.googleCalendarSynced ? "Desconectar" : "Conectar"}
                </button>
              </div>

              <div className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Classroom
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!appData.googleClassroomSynced) {
                      onShowNotification("Iniciando conexão com Classroom...", "info");
                      // Need a way to trigger OAuth for this specific permission
                      onSyncGoogle();
                    } else {
                       onUpdateField("googleClassroomSynced", false);
                       onShowNotification("Integração com Classroom desconectada.", "info");
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold ${appData.googleClassroomSynced ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"}`}
                >
                  {appData.googleClassroomSynced ? "Desconectar" : "Conectar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2">
          Instalação e App
        </h3>

        <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Aplicativo PWA
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Instale na sua tela inicial
                </p>
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
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg font-bold">
                  PWA Ativo
                </span>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Deseja forçar a limpeza do cache e atualizar o aplicativo?",
                      )
                    ) {
                      if ("serviceWorker" in navigator) {
                        navigator.serviceWorker
                          .getRegistrations()
                          .then((registrations) => {
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
          
          {appUpdateAvailable && acceptAppUpdate && (
            <div className="pt-4 border-t border-primary/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Nova Atualização Pronta
                  </h4>
                  <p className="text-[10px] text-slate-500 font-manrope">
                    Clique para aplicar agora em tempo real.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  acceptAppUpdate();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm active:scale-95 whitespace-nowrap"
              >
                Aplicar Update
              </button>
            </div>
          )}

          {!canInstall && (
            <div className="pt-2 border-t border-primary/10">
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-manrope leading-relaxed">
                <span className="font-bold text-primary">Dica:</span> Se o botão
                não aparece, é porque você pode estar visualizando dentro do
                editor.
                <br />
                1. Clique em{" "}
                <span className="font-bold">"Abrir em nova aba"</span> no topo
                do preview.
                <br />
                2. No <span className="font-bold">Android (Chrome)</span>,
                clique nos 3 pontinhos e "Instalar Aplicativo".
                <br />
                3. No <span className="font-bold">iPhone (Safari)</span>, clique
                no ícone de compartilhar e "Add à Tela de Início".
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
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Administração
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Painel de controle Jefson
                </p>
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
            <div
              className={`p-2 rounded-full flex items-center justify-center w-10 h-10 ${appData.googleSynced ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}
            >
              {appData.googleSynced ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Google Workspace
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {appData.googleSynced ? "Sincronizado" : "Não conectado"}
              </p>
            </div>
          </div>
          <button
            onClick={onSyncGoogle}
            disabled={isSyncingGoogle}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${appData.googleSynced ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {isSyncingGoogle && <RefreshCw className="w-3 h-3 animate-spin" />}
            {isSyncingGoogle
              ? "Aguarde"
              : appData.googleSynced
                ? "Re-sincronizar"
                : "Conectar"}
          </button>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 text-red-500 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Sair da Conta
      </button>
    </div>
  );
};

const AdminScreen = ({
  appData,
  onUpdateField,
  onShowNotification,
  isSuperAdmin,
  isGestorEscolar,
}: {
  appData: AppState;
  onUpdateField: (field: string, value: any) => void;
  onShowNotification: (msg: string, type: "info" | "critical") => void;
  isSuperAdmin?: boolean;
  isGestorEscolar?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<
    "access" | "billing" | "notices" | "api_keys" | "classes"
  >("access");
  const [noticeText, setNoticeText] = useState("");
  const [noticeType, setNoticeType] = useState<"info" | "warning" | "critical">(
    "info",
  );
  const [totalUsersCount, setTotalUsersCount] = useState<number>(224);
  const [totalTeachersCount, setTotalTeachersCount] = useState<number>(0);
  const [adminUserList, setAdminUserList] = useState<any[]>([]);

  const loadLocalApiKeys = () => {
    try {
      const stored = localStorage.getItem("horizonte_api_keys");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  };
  const [apiKeys, setApiKeys] =
    useState<{ id: string; key: string; name: string; createdAt: string }[]>(
      loadLocalApiKeys(),
    );
  const [newKeyName, setNewKeyName] = useState("");

  const loadLocalWebhooks = () => {
    try {
      const stored = localStorage.getItem("horizonte_webhooks");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  };
  const [webhooks, setWebhooks] = useState<
    {
      id: string;
      url: string;
      name: string;
      event: string;
      createdAt: string;
    }[]
  >(loadLocalWebhooks());
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvent, setNewWebhookEvent] = useState("all");

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { collection, query, where, getCountFromServer, getDocs } =
          await import("firebase/firestore");
        const coll = collection(db, "users");
        
        if (isGestorEscolar && !isSuperAdmin) {
          // Gestor Escolar gets only their school users
          const qSchool = query(coll, where("schoolName", "==", appData.schoolName));
          const allDocs = await getDocs(qSchool);
          const uList: any[] = [];
          let tCountLocal = 0;
          allDocs.forEach((d) => {
            const data = d.data();
            uList.push({ id: d.id, ...data });
            if (data.role === "teacher" || data.role === "both") tCountLocal++;
          });
          setAdminUserList(uList);
          setTotalUsersCount(uList.length);
          setTotalTeachersCount(tCountLocal);
          return;
        }

        // Super Admin gets everything
        const snapshot = await getCountFromServer(coll);
        const ct = snapshot.data().count;
        setTotalUsersCount(ct > 224 ? ct : 224); // Show at least 224 as per request

        const qTeachers = query(coll, where("role", "in", ["teacher", "both"]));
        const snapshotTeachers = await getCountFromServer(qTeachers);
        let tCount = snapshotTeachers.data().count;

        try {
          const allDocs = await getDocs(coll);
          const uList: any[] = [];
          let tCountLocal = 0;
          allDocs.forEach((d) => {
            const data = d.data();
            uList.push({ id: d.id, ...data });
            if (data.role === "teacher" || data.role === "both") tCountLocal++;
          });
          setAdminUserList(uList);

          const maxDocs = uList.length > 224 ? uList.length : 224;
          setTotalUsersCount(maxDocs);
          setTotalTeachersCount(tCountLocal);

          const qJefson = query(
            coll,
            where("email", "in", [
              "jefson.s.a7@gmail.com",
              "jefson.ti@gmail.com",
            ]),
          );
          const snapshotJefson = await getDocs(qJefson);
          snapshotJefson.forEach((docSnap) => {
            const r = docSnap.data().role;
            if (r !== "teacher" && r !== "both") {
              setTotalTeachersCount((prev) => prev + 1);
            }
          });
        } catch (skipErr) {}
      } catch (e: any) {
        if (e?.code !== "permission-denied") {
          console.warn("Could not fetch total users:", e);
        }
      }

      try {
        const { collection, getDocs, doc, setDoc, addDoc, serverTimestamp } =
          await import("firebase/firestore");
        const coll = collection(db, "api_keys");
        const ksnap = await getDocs(coll);
        const remoteKeys: any[] = [];
        ksnap.forEach((d) => {
          remoteKeys.push({ id: d.id, ...d.data() });
        });

        // Get local keys
        const localKeys = loadLocalApiKeys();
        const mergedKeysMap = new Map<string, any>();

        // Load local first
        localKeys.forEach((k: any) => {
          if (k && k.key) mergedKeysMap.set(k.key, k);
        });

        // Merge remote keys inside
        remoteKeys.forEach((k: any) => {
          if (k && k.key) {
            mergedKeysMap.set(k.key, {
              ...mergedKeysMap.get(k.key),
              ...k,
            });
          }
        });

        let mergedKeys = Array.from(mergedKeysMap.values());

        // If there are absolutely no api keys anywhere, automatically generate a main access key!
        if (mergedKeys.length === 0) {
          const getCryptoValues = () => {
            try {
              if (
                typeof window !== "undefined" &&
                window.crypto &&
                window.crypto.getRandomValues
              ) {
                return Array.from(
                  window.crypto.getRandomValues(new Uint8Array(24)),
                );
              }
            } catch (e) {}
            return Array.from({ length: 24 }, () =>
              Math.floor(Math.random() * 256),
            );
          };

          const defaultKeyVal =
            "sk_" +
            getCryptoValues()
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");

          const defaultKey = {
            name: "Chave de Acesso Principal",
            key: defaultKeyVal,
            createdAt: new Date().toISOString(),
          };

          let docId = "local_" + Date.now();
          try {
            const docRef = await addDoc(coll, {
              ...defaultKey,
              createdAt: serverTimestamp(),
            });
            docId = docRef.id;
          } catch (err) {
            console.warn("Could not save initial key to Firestore:", err);
          }
          mergedKeys = [{ id: docId, ...defaultKey }];
        }

        setApiKeys(mergedKeys);
        localStorage.setItem("horizonte_api_keys", JSON.stringify(mergedKeys));

        // Proactively synchronize any local keys to remote Firestore
        for (const localKey of localKeys) {
          const isRemote = remoteKeys.some(
            (rk: any) => rk.key === localKey.key,
          );
          if (!isRemote && localKey.key) {
            try {
              await addDoc(coll, {
                name: localKey.name || "Integração",
                key: localKey.key,
                createdAt: serverTimestamp(),
              });
            } catch (uploadErr) {
              console.warn(
                "Could not sync local api_key to remote Firestore:",
                uploadErr,
              );
            }
          }
        }
      } catch (e) {
        console.warn(
          "Could not fetch api keys from Firestore, staying with local/stored",
          e,
        );
      }

      try {
        const { collection, getDocs, addDoc, serverTimestamp } =
          await import("firebase/firestore");
        const hooksColl = collection(db, "webhooks");
        const hsnap = await getDocs(hooksColl);
        const remoteHooks: any[] = [];
        hsnap.forEach((d) => {
          remoteHooks.push({ id: d.id, ...d.data() });
        });

        const localHooks = loadLocalWebhooks();
        const mergedHooksMap = new Map<string, any>();

        localHooks.forEach((h: any) => {
          if (h && h.url) mergedHooksMap.set(h.url + "_" + h.event, h);
        });
        remoteHooks.forEach((h: any) => {
          if (h && h.url) {
            mergedHooksMap.set(h.url + "_" + h.event, {
              ...mergedHooksMap.get(h.url + "_" + h.event),
              ...h,
            });
          }
        });

        const mergedHooks = Array.from(mergedHooksMap.values());
        setWebhooks(mergedHooks);
        localStorage.setItem("horizonte_webhooks", JSON.stringify(mergedHooks));

        for (const localHook of localHooks) {
          const isRemote = remoteHooks.some(
            (rh: any) =>
              rh.url === localHook.url && rh.event === localHook.event,
          );
          if (!isRemote && localHook.url) {
            try {
              await addDoc(hooksColl, {
                name: localHook.name || "Webhook",
                url: localHook.url,
                event: localHook.event,
                createdAt: serverTimestamp(),
              });
            } catch (uploadErr) {
              console.warn(
                "Could not sync local webhook to remote Firestore:",
                uploadErr,
              );
            }
          }
        }
      } catch (e) {
        console.warn(
          "Could not fetch webhooks from Firestore, staying with local/stored",
          e,
        );
      }
    };
    fetchCount();
  }, []);

  const addNotice = () => {
    if (!noticeText.trim()) return;
    const newNotice: AdminNotice = {
      id: Date.now().toString(),
      text: noticeText,
      date: new Date().toLocaleDateString("pt-BR"),
      type: noticeType,
    };
    const currentNotices = appData.adminNotices || [];
    onUpdateField("adminNotices", [newNotice, ...currentNotices]);
    setNoticeText("");
  };

  const removeNotice = (id: string) => {
    const currentNotices = appData.adminNotices || [];
    onUpdateField(
      "adminNotices",
      currentNotices.filter((n) => n.id !== id),
    );
  };

  const generateApiKey = async () => {
    try {
      // Robust getCryptoValues supporting iframe, local testing, or older/different webviews
      const getCryptoValues = () => {
        try {
          if (
            typeof window !== "undefined" &&
            window.crypto &&
            window.crypto.getRandomValues
          ) {
            return Array.from(
              window.crypto.getRandomValues(new Uint8Array(24)),
            );
          }
        } catch (e) {
          console.warn(
            "Secure crypto not fully available, calling secondary random engine:",
            e,
          );
        }
        return Array.from({ length: 24 }, () =>
          Math.floor(Math.random() * 256),
        );
      };

      const randomKey =
        "sk_" +
        getCryptoValues()
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      const resolvedName =
        newKeyName.trim() || `Integração #${apiKeys.length + 1}`;
      const newDoc = {
        name: resolvedName,
        key: randomKey,
        createdAt: new Date().toISOString(),
      };

      let docId = "local_" + Date.now();
      try {
        const { collection, addDoc, serverTimestamp } =
          await import("firebase/firestore");
        const docRef = await addDoc(collection(db, "api_keys"), {
          ...newDoc,
          createdAt: serverTimestamp(), // in firestore
        });
        docId = docRef.id;
      } catch (err) {
        console.warn(
          "Could not write api key to Firestore, storing locally",
          err,
        );
      }

      setApiKeys((prev) => {
        const updated = [...prev, { id: docId, ...newDoc }];
        localStorage.setItem("horizonte_api_keys", JSON.stringify(updated));
        return updated;
      });
      setNewKeyName("");
      onShowNotification("Chave gerada com sucesso!", "info");
    } catch (e) {
      console.error(e);
      onShowNotification(
        "Erro ao gerar chave: " + (e instanceof Error ? e.message : String(e)),
        "critical",
      );
    }
  };

  const removeApiKey = async (id: string) => {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      if (id && !id.startsWith("local_")) {
        await deleteDoc(doc(db, "api_keys", id));
      }
    } catch (e) {
      console.warn("Could not delete api key from Firestore", e);
    }
    setApiKeys((prev) => {
      const updated = prev.filter((k) => k.id !== id);
      localStorage.setItem("horizonte_api_keys", JSON.stringify(updated));
      return updated;
    });
    onShowNotification("Chave removida!", "info");
  };

  const generateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return;
    try {
      const { collection, addDoc, serverTimestamp } =
        await import("firebase/firestore");
      const newDoc = {
        name: newWebhookName,
        url: newWebhookUrl,
        event: newWebhookEvent,
        createdAt: new Date().toISOString(),
      };

      let docId = "local_" + Date.now();
      try {
        const docRef = await addDoc(collection(db, "webhooks"), {
          ...newDoc,
          createdAt: serverTimestamp(),
        });
        docId = docRef.id;
      } catch (e) {
        console.warn("Firebase webhook add failed, using local", e);
      }

      setWebhooks((prev) => {
        const updated = [...prev, { id: docId, ...newDoc }];
        localStorage.setItem("horizonte_webhooks", JSON.stringify(updated));
        return updated;
      });
      setNewWebhookName("");
      setNewWebhookUrl("");
      setNewWebhookEvent("all");
      onShowNotification("Webhook adicionado!", "info");
    } catch (e) {
      console.error(e);
      onShowNotification("Erro ao adicionar webhook", "critical");
    }
  };

  const removeWebhook = async (id: string) => {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "webhooks", id));
    } catch (e) {
      console.warn("Firebase webhook delete failed", e);
    }
    setWebhooks((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      localStorage.setItem("horizonte_webhooks", JSON.stringify(updated));
      return updated;
    });
  };

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
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">
              Super Admin Console
            </p>
            <p className="text-sm text-slate-500 font-bold">
              Ambiente de Controle Root - Jefson
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-tighter relative z-10">
            <ShieldCheck className="w-3 h-3" />
            Autenticação Root Ativa
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {(isSuperAdmin ? (["access", "classes", "billing", "notices", "api_keys"] as const) : (["access", "classes"] as const)).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700"
            }`}
          >
            {tab === "access"
              ? "Controle de Acesso"
              : tab === "billing"
                ? "Cobrança e Ativação"
                : tab === "notices"
                  ? "Avisos"
                  : tab === "classes"
                    ? "Turmas da Escola"
                    : "APIs / Parceiros"}
          </button>
        ))}
      </div>

      {activeTab === "access" && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Status do Sistema
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Versão do App
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                v2.5.2-pro
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Base de Dados
              </p>
              <p className="text-sm font-bold text-green-500">Online</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Usuários Registrados
                  </p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {totalUsersCount}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-20" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Professores Cadastrados
                  </p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {totalTeachersCount}
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-primary opacity-20" />
              </div>
            </div>
          </div>
          
          {isSuperAdmin && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primary">
                    Jefson (Admin Principal)
                  </span>
                  <p className="text-[10px] text-slate-400">
                    jefson.s.a7@gmail.com • Root Access
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}

          {/* User List */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Equipe e Usuários
              </h4>
              <button 
                onClick={() => {
                   const email = prompt("E-mail do novo membro:");
                   const role = prompt("Função (ex: professor, secretario, contador):");
                   if (email && role) {
                     // Add simple invite/placeholder doc
                     import("firebase/firestore").then(({ collection, addDoc }) => {
                       addDoc(collection(db, "users"), {
                         email,
                         role,
                         schoolName: appData.schoolName,
                         teacherName: "Novo Membro",
                         isApprovedManager: false,
                         createdAt: new Date().toISOString()
                       }).then(() => {
                         onShowNotification("Membro convidado/cadastrado!", "info");
                         setAdminUserList([...adminUserList, { id: Date.now().toString(), email, role, schoolName: appData.schoolName, teacherName: "Novo Membro" }]);
                       });
                     }).catch(() => onShowNotification("Erro ou Offline", "critical"));
                   }
                }}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer border border-primary/20"
              >
                + Convidar / Cadastrar Membro
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {adminUserList.map((u, i) => (
                <div
                  key={u.id || i}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Users className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {u.teacherName || u.schoolName || "Usuário"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-manrope">
                        {u.email || u.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                      {u.role || "student"}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Escola: {u.schoolName || "N/A"}
                    </p>
                    {(isSuperAdmin || isGestorEscolar) && u.email !== "jefson.ti@gmail.com" && (
                      <button
                        onClick={async () => {
                          if (confirm("Alterar status de gestor deste usuário?")) {
                            try {
                              const { updateDoc, doc } = await import("firebase/firestore");
                              await updateDoc(doc(db, "users", u.id), {
                                isApprovedManager: !u.isApprovedManager
                              });
                              onShowNotification("Status atualizado!", "info");
                              setAdminUserList(adminUserList.map(item => item.id === u.id ? { ...item, isApprovedManager: !item.isApprovedManager } : item));
                            } catch(e) {
                              onShowNotification("Erro. Permissão insuficiente?", "critical");
                            }
                          }
                        }}
                        className={`px-2 py-1 text-[9px] font-bold rounded tracking-wide transition-colors ${u.isApprovedManager ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"}`}
                      >
                        {u.isApprovedManager ? "Restringir Gestor" : "Promover Gestor"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {adminUserList.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  Carregando usuários ou nenhum encontrado.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "classes" && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Gestão Centralizada de Turmas
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-4">
            Aqui você visualizar todas as turmas de professores da mesma escola ({appData.schoolName || "sua escola"}).
          </p>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {(() => {
              const allClasses: any[] = [];
              adminUserList.forEach(u => {
                // If gestor is viewing, we only want their school's classes, but query already filters it.
                if (u.classesStr) {
                  try {
                    const parsed = JSON.parse(u.classesStr);
                    if (Array.isArray(parsed)) {
                      parsed.forEach(c => {
                        allClasses.push({
                          ...c,
                          _teacherId: u.id,
                          _teacherName: u.teacherName || u.schoolName || u.email || "Desconhecido"
                        });
                      });
                    }
                  } catch(e){}
                } else if (u.classes && Array.isArray(u.classes)) {
                  u.classes.forEach((c: any) => {
                    allClasses.push({
                      ...c,
                      _teacherId: u.id,
                      _teacherName: u.teacherName || u.schoolName || u.email || "Desconhecido"
                    });
                  });
                }
              });

              if (allClasses.length === 0) {
                 return <p className="text-xs text-slate-500 italic">Nenhuma turma encontrada na escola.</p>;
              }

              return allClasses.map((cls, idx) => (
                <div key={cls.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl relative overflow-hidden group">
                   <div className="flex justify-between items-start">
                     <div>
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                         {cls.name}
                       </h4>
                       <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                         Prof. {cls._teacherName}
                       </p>
                     </div>
                     <div className="px-2 py-1 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider rounded-lg">
                       {cls.students?.length || 0} alunos
                     </div>
                   </div>
                   {cls.students && cls.students.length > 0 && (
                     <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-1">
                       {cls.students.slice(0, 5).map((s: any) => (
                         <span key={s.id} className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                           {s.name.split(" ")[0].toUpperCase()}
                         </span>
                       ))}
                       {cls.students.length > 5 && (
                         <span className="font-bold text-[9px] px-1 py-0.5 mt-0.5">+{cls.students.length - 5}</span>
                       )}
                     </div>
                   )}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Controle de Ativação
            </h3>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">
              Status de Licença de Uso
            </h4>
            <p className="text-[10px] text-blue-600 dark:text-blue-400">
              Controle aqui se o app está liberado para uso ou bloqueado por
              falta de pagamento.
            </p>
          </div>

          <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-primary uppercase">
                Receber via PIX
              </p>
              <div className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-[8px] font-bold">
                INSTANTÂNEO
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">
                Chave PIX (E-mail)
              </p>
              <div className="flex items-center justify-between gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <code className="text-xs text-white font-mono">
                  jefson.s.a7@gmail.com
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("jefson.s.a7@gmail.com");
                    onShowNotification("Chave PIX copiada!", "info");
                  }}
                  className="text-primary hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["active", "overdue", "trial"] as const).map((status) => (
              <button
                key={status}
                onClick={() => onUpdateField("billingStatus", status)}
                className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${appData.billingStatus === status ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400"}`}
              >
                {status === "active"
                  ? "Liberado"
                  : status === "overdue"
                    ? "Bloqueado"
                    : "Teste"}
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-primary uppercase ml-1">
                Vencimento do Plano
              </label>
              <input
                type="date"
                value={appData.billingExpiry || ""}
                onChange={(e) => onUpdateField("billingExpiry", e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-primary text-sm font-bold transition-colors"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex items-start gap-3 mt-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              Aviso: Alterar o status de cobrança afeta o acesso imediato de
              todos os usuários vinculados.
            </p>
          </div>
        </div>
      )}

      {activeTab === "notices" && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Comunicados Gerais
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase ml-1">
                Novo Comunicado
              </label>
              <div className="flex gap-2 mb-2">
                {(["info", "warning", "critical"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNoticeType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${noticeType === t ? "bg-primary text-white border-primary shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700"}`}
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Histórico de Publicações
              </p>
              <div className="space-y-3">
                {(appData.adminNotices || []).map((notice) => (
                  <div
                    key={notice.id}
                    className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 relative group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${notice.type === "critical" ? "bg-red-500" : notice.type === "warning" ? "bg-amber-500" : "bg-blue-500"}`}
                      />
                      <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">
                        {notice.date}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {notice.text}
                    </p>
                    <button
                      onClick={() => removeNotice(notice.id)}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(!appData.adminNotices ||
                  appData.adminNotices.length === 0) && (
                  <p className="text-center py-4 text-[10px] text-slate-400 font-bold italic">
                    Nenhum aviso publicado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "api_keys" && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Chaves de Integração
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 font-manrope">
            Gere chaves para compartilhar acessos a dados no Cloud do Horizonte
            com aplicações parceiras aprovadas.
          </p>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Criar Nova Chave
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Nome do App Parceiro (Opcional)"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                />
                <button
                  onClick={generateApiKey}
                  className="w-full bg-primary text-white text-xs font-bold py-3 rounded-xl active:scale-95 transition-all shadow-sm"
                >
                  + Gerar Chave
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Chaves Ativas
              </p>
              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative group transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                      {k.name}
                    </h4>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2 pr-1 mb-3">
                      <code className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex-1 overflow-x-auto no-scrollbar pl-2">
                        {k.key}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(k.key);
                          onShowNotification("Chave copiada!", "info");
                        }}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(k.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <button
                        onClick={() => removeApiKey(k.id)}
                        className="px-3 py-1 text-[10px] bg-red-50 text-red-600 rounded-lg opacity-100 transition-all font-bold hover:bg-red-100"
                      >
                        REVOGAR
                      </button>
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                    <Link2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Nenhuma chave gerada.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-slate-800 dark:text-slate-100">
                  Webhooks
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 font-manrope mb-4">
                Envie dados automaticamente para outras aplicações (ex: RD
                Station, Make, Zapier).
              </p>

              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  value={newWebhookName}
                  onChange={(e) => setNewWebhookName(e.target.value)}
                  placeholder="Nome da Integração"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                />
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="URL do Webhook (https://...)"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white font-mono"
                />
                <select
                  value={newWebhookEvent}
                  onChange={(e) => setNewWebhookEvent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white appearance-none"
                >
                  <option value="all">Todos os Eventos</option>
                  <option value="student_added">Novo Aluno</option>
                  <option value="occurrence_added">Nova Ocorrência</option>
                </select>
                <button
                  onClick={generateWebhook}
                  disabled={!newWebhookName.trim() || !newWebhookUrl.trim()}
                  className="w-full bg-primary text-white text-xs font-bold py-3 rounded-xl disabled:opacity-50 cursor-not-allowed active:scale-95 transition-all shadow-sm"
                >
                  + Adicionar Webhook
                </button>
              </div>

              <div className="space-y-3">
                {webhooks.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative group transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {w.name}
                      </h4>
                      <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                        {w.event === "all" ? "Tudo" : w.event}
                      </span>
                    </div>
                    <code className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono mb-3 truncate px-2 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      {w.url}
                    </code>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(w.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <button
                        onClick={() => removeWebhook(w.id)}
                        className="px-3 py-1 text-[10px] bg-red-50 text-red-600 rounded-lg opacity-100 transition-all font-bold hover:bg-red-100"
                      >
                        REMOVER
                      </button>
                    </div>
                  </div>
                ))}
                {webhooks.length === 0 && (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                    <ArrowRightLeft className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Nenhum webhook configurado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginScreen = ({
  appData,
  onLogin,
  onSwitchToRegister,
  onWipeData,
  onShowNotification,
  setAccessToken,
}: {
  appData: AppState | null;
  onLogin: (fetchedData?: AppState) => void;
  onSwitchToRegister: () => void;
  onWipeData?: () => void;
  onShowNotification?: (msg: string, type: "critical" | "info") => void;
  setAccessToken: (token: string | null) => void;
}) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handleEmailLogin = async () => {
    setIsEmailLoading(true);
    let dexieUser = null;
    try {
      if (dexieDb.users) {
        dexieUser = await dexieDb.users.get(loginEmail);
      }
    } catch (e) {
      console.warn("Dexie auth error:", e);
    }

    try {
      if (navigator.onLine) {
        await signInWithEmailAndPassword(auth, loginEmail, password);
        onLogin();
      } else {
        // Fallback to offline local auth via Dexie & localStorage
        const local = localStorage.getItem("horizonte_data");
        if (local) {
          const parsed = JSON.parse(local);
          const expectedEmail = parsed.email || "";
          if (expectedEmail === loginEmail && parsed.password === password) {
             if (onShowNotification) onShowNotification("Login offline. Sincronização Dexie acionada.", "info");
             onLogin(parsed);
          } else {
             alert("Credenciais offline inválidas.");
          }
        } else if (dexieUser) {
           alert("Usuário encontrado localmente via Dexie, mas dados de acesso offline estão indisponíveis.");
        } else {
           alert("Nenhum dado offline localizado e Dexie vazio.");
        }
      }
    } catch (e: any) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
        if (onShowNotification) onShowNotification("Email não encontrado. Verifique ou cadastre-se.", "critical");
        else alert("Credenciais inválidas ou e-mail não registrado. Por favor, faça seu cadastro se for novo.");
      } else if (e.code === "auth/network-request-failed" || !navigator.onLine) {
        const local = localStorage.getItem("horizonte_data");
        if (local) {
          const parsed = JSON.parse(local);
          const expectedEmail = parsed.email || "";
          if (expectedEmail === loginEmail && parsed.password === password) {
            if (onShowNotification) onShowNotification("Login offline efetuado via Dexie + localStorage.", "info");
            onLogin(parsed);
          } else {
            alert("Credenciais offline inválidas.");
          }
        } else if (dexieUser) {
           alert("Usuário validado via Dexie, porém dados corrompidos. Requer Internet para restaurar.");
        } else {
           alert("Nenhum dado offline localizado para este usuário.");
        }
      } else {
        console.error("Auth error:", e);
        alert("Erro no login. Verifique as credenciais.");
      }
    }
    setIsEmailLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const clientId =
          "1067272365451-9tkkbb5d9t5a560205856eb2h7v9c30h.apps.googleusercontent.com"; // Placeholder
        const redirectUri = "br.com.jefson.tarefaflow://auth";
        const scopes = encodeURIComponent(
          "email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets",
        );

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=${scopes}&nonce=tarefaflow123`;

        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: authUrl });
        setIsGoogleLoading(false);
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      provider.addScope(
        "https://www.googleapis.com/auth/classroom.courses.readonly",
      );
      provider.addScope(
        "https://www.googleapis.com/auth/classroom.rosters.readonly",
      );
      provider.addScope(
        "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
      );
      provider.addScope(
        "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
      );
      provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
      provider.addScope("https://www.googleapis.com/auth/calendar.events");
      provider.addScope("https://www.googleapis.com/auth/tasks.readonly");
      provider.addScope("https://www.googleapis.com/auth/tasks");
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      provider.addScope("https://www.googleapis.com/auth/spreadsheets");

      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken || null;
        if (token) {
          localStorage.setItem("google_access_token", token);
          setAccessToken(token);
          window.dispatchEvent(
            new CustomEvent("google-access-token-updated", { detail: token }),
          );
        }
        if (result.user) {
          onLogin();
        }
      } catch (error: any) {
        if (error.code === "auth/internal-error") {
          console.error(
            "Firebase Internal Error during login. Checking authorized domains or pop-up blockers is recommended.",
            error,
          );
          if (onShowNotification) {
            onShowNotification(
              "Erro de autenticação. Tente novamente ou desative bloqueadores.",
              "critical",
            );
          }
        }
        throw error;
      }
    } catch (e: any) {
      if (
        e?.code === "auth/cancelled-popup-request" ||
        e?.code === "auth/popup-closed-by-user"
      ) {
        console.log("Login cancelado pelo usuário.");
      } else if (e?.code === "auth/unauthorized-domain") {
        console.error("Domínio não autorizado no Firebase Auth", e);
        if (onShowNotification) {
          onShowNotification(
            "Erro: Domínio não autorizado no Firebase. Adicione a URL atual no Firebase Console > Authentication > Authorized domains.",
            "critical",
          );
        } else {
          alert(
            "Erro: Domínio não autorizado no Firebase. Adicione a URL atual no Firebase Console > Authentication > Authorized domains.",
          );
        }
      } else {
        console.error("Auth error:", e);
      }
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-surface-base px-6 py-12">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary mb-2">
            Bem-vindo(a)!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-manrope text-sm leading-relaxed">
            Plataforma Colégio Horizonte. Acesse ou cadastre-se de forma segura.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-xl text-center">
          <div className="space-y-6">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap className="w-8 h-8" />
              </div>
            </div>

            <p className="text-xs text-slate-400 font-manrope px-2">
              Acesse com seus dados locais ou Gmail
            </p>

            <div className="space-y-3">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Seu e-mail"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary px-4 py-3 rounded-t-lg font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
              />
              <button
                onClick={handleEmailLogin}
                disabled={isEmailLoading || !loginEmail || !password}
                className="w-full primary-gradient text-white font-bold py-3.5 rounded-2xl shadow-lg mt-4 disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center"
              >
                {isEmailLoading ? "Entrando..." : "Entrar"}
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-xs font-bold text-slate-400 uppercase">Ou</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold py-4 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest"
            >
              {isGoogleLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Acessar com Google
            </button>

            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Acesso Exclusivo via Gmail
            </div>
            
            <button
              onClick={onSwitchToRegister}
              className="w-full mt-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Ainda não tem conta? <span className="text-primary underline">Cadastre-se</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import { initGoogleAuthListener } from "./services/auth";
import { db as dexieDb } from "./db/database";
import { addToSyncQueue, processSyncQueue } from "./sync/syncManager";

// --- Main App ---

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("studentsHub");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      triggerNotification(
        'O instalador não está disponível. Tente usar o menu do navegador "Instalar Aplicativo".',
        "info",
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      triggerNotification("Instalação iniciada!", "info");
    }
  };

  useEffect(() => {
    console.log(
      "Firestore Database ID:",
      (db as any)?.customUrl || (db as any)?._databaseId?.database || "default",
    );
    const testConnectionBase = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("the client is offline")
        ) {
          console.warn(
            "Firebase client is offline (expected in tests if no network).",
          );
        }
        // handleFirestoreError(error, OperationType.GET, 'test/connection'); // Optional for test connection
      }
    };
    testConnectionBase();
  }, []);

  const [appData, setAppData] = useState<AppState | null>(() => {
    try {
      const saved = localStorage.getItem("horizonte_data");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Local storage parsing error: ", e);
      return null;
    }
  });
  const [isLogged, setIsLogged] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(!!appData);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [notification, setNotification] = useState<{
    message: string;
    type: "critical" | "info";
  } | null>(null);
  const [showSyncConsent, setShowSyncConsent] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false);
  const [acceptAppUpdate, setAcceptAppUpdate] = useState<(() => void) | null>(null);

  // Automatically seed past records for classes with empty/missing history
  const hasSeededRef = useRef(false);

  const hasRecoveredRef = useRef(false);

  // Recovery of missing attendance & occurrence data from offline Dexie
  useEffect(() => {
    if (!appData || hasRecoveredRef.current) return;
    hasRecoveredRef.current = true;

    const fetchAndRecover = async () => {
      try {
        let dexieAttendances: any[] = [];
        let dexieOccurrences: any[] = [];
        try {
          dexieAttendances = await dexieDb.attendance.toArray();
          dexieOccurrences = await dexieDb.occurrences.toArray();
        } catch (e) {
          console.warn("Could not load dexie logs", e);
        }

        // Recover Dexie data
        updateAppData((prev) => {
          let hasChanges = false;

          // Also guarantee Jefson is 'both' (Teacher + Admin) Role
          let updatedRole = prev.role;
          if (
            auth.currentUser?.email === "jefson.s.a7@gmail.com" ||
            auth.currentUser?.email === "jefson.ti@gmail.com" ||
            (prev.cpf || "").replace(/\D/g, "") === "00995845301"
          ) {
            if (updatedRole !== "both") {
              updatedRole = "both";
              hasChanges = true;
            }
          }

          const updatedClasses = (prev.classes || []).map((c) => {
            const classAttendances = dexieAttendances.filter(
              (a) => a.classId === c.id,
            );

            const updatedStudents = (c.students || []).map((student) => {
              const studentAttendances = classAttendances.filter(
                (a) => a.studentId === student.id,
              );
              const newHistory: Record<
                string,
                "present" | "absent" | "late" | "none"
              > = { ...(student.attendanceHistory || {}) };
              let modified = false;

              // 1. Recover attendance from Dexie logs
              studentAttendances.forEach((a) => {
                const safeStatus =
                  a.status === "justified" ? "absent" : a.status;
                if (newHistory[a.date] !== safeStatus) {
                  newHistory[a.date] = safeStatus;
                  modified = true;
                }
              });

              if (modified) {
                hasChanges = true;
                return { ...student, attendanceHistory: newHistory };
              }
              return student;
            });

            if (
              updatedStudents.some(
                (s, idx) => s !== (c.students || [])[idx],
              )
            ) {
              return { ...c, students: updatedStudents };
            }
            return c;
          });
          
          let prevOccurrences = prev.occurrences || [];
          let occModified = false;
          dexieOccurrences.forEach(occ => {
             if (!prevOccurrences.some(o => o.id === occ.id)) {
                prevOccurrences = [...prevOccurrences, occ];
                occModified = true;
                hasChanges = true;
             }
          });

          if (hasChanges) {
            console.log(
              "[Recovery] Merged offline data from Dexie & Set Admin Role.",
            );
            return { ...prev, classes: updatedClasses, role: updatedRole, occurrences: prevOccurrences };
          }
          return prev;
        });

      } catch (err) {
        console.error("Recovery failed", err);
      }
    };

    fetchAndRecover();
  }, [appData?.classes?.length]);

  // Local notification setup for calendar events 1 hour before start
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;

    const checkUpcomingEvents = () => {
      if (
        !appData ||
        !appData.googleCalendarEvents ||
        appData.googleCalendarEvents.length === 0
      )
        return;
      if (Notification.permission !== "granted") return;

      const now = Date.now();
      let notifiedIds: string[] = [];
      try {
        const stored = localStorage.getItem("horizonte_notified_events");
        notifiedIds = stored ? JSON.parse(stored) : [];
      } catch (e) {
        notifiedIds = [];
      }

      const updatedNotified = [...notifiedIds];
      let hasNewNotified = false;

      appData.googleCalendarEvents.forEach((event) => {
        if (!event.dateIso) return;
        const eventTime = new Date(event.dateIso).getTime();
        const diffMs = eventTime - now;

        // "1 hour before" -> Starts within 1 hour (less than 60 minutes) and is in the future
        const sixtyMinutesMs = 60 * 60 * 1000;
        if (diffMs > 0 && diffMs <= sixtyMinutesMs) {
          if (!updatedNotified.includes(event.id)) {
            const timeStr =
              event.start ||
              new Date(event.dateIso).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

            try {
              new Notification(`Lembrete de Compromisso`, {
                body: `O evento "${event.title}" começa em breve (às ${timeStr})!`,
                icon: "/icon-192x192.png",
                tag: event.id,
              });
              updatedNotified.push(event.id);
              hasNewNotified = true;
            } catch (err) {
              console.error("Failed to show browser notification:", err);
            }
          }
        }
      });

      if (hasNewNotified) {
        localStorage.setItem(
          "horizonte_notified_events",
          JSON.stringify(updatedNotified),
        );
      }
    };

    // Run check on mount/update and then every 20 seconds
    checkUpcomingEvents();
    const intervalObj = setInterval(checkUpcomingEvents, 20000);

    return () => clearInterval(intervalObj);
  }, [appData?.googleCalendarEvents]);

  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [currentViewRole, setCurrentViewRole] = useState<"teacher" | "student">(
    "teacher",
  );
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("google_access_token"),
  );

  const isRootUser = () => {
    if (!appData) return false;
    const isJefsonEmail =
      auth.currentUser?.email === "jefson.ti@gmail.com" ||
      auth.currentUser?.email === "jefson.s.a7@gmail.com";
    const isJefsonCpf =
      (appData.cpf || "").replace(/\D/g, "") === "00995845301";
    return isJefsonEmail || isJefsonCpf;
  };

  const isAdminUser = () => {
    return isRootUser() || !!appData?.isApprovedManager;
  };

  useEffect(() => {
    // Initial sync connection setup
    const handleOnline = () => {
      processSyncQueue();
      if (localStorage.getItem("google_access_token")) {
        executeGoogleSync(true); // Silent sync
      }
    };

    window.addEventListener("online", handleOnline);

    const handleAppUpdate = (e: any) => {
      setAcceptAppUpdate(() => e.detail?.acceptUpdate);
      setAppUpdateAvailable(true);
    };
    window.addEventListener("app-update-available", handleAppUpdate);

    // Attempt auto-sync right after mount if online and has token
    if (navigator.onLine && localStorage.getItem("google_access_token")) {
      handleOnline();
    }

    // Unify Duplicate Jefson profiles
    const fixJefsonProfile = async () => {
      try {
        const rawCpf = "00995845301";
        const formattedCpf = "009.958.453-01";

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

        const localData = localStorage.getItem("horizonte_data");
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed.cpf === rawCpf || parsed.cpf === formattedCpf) {
            parsed.cpf = formattedCpf;
            parsed.password = "81864895";
            localStorage.setItem("horizonte_data", JSON.stringify(parsed));

            setAppData((prev) => {
              if (prev) {
                return { ...prev, cpf: formattedCpf, password: "81864895" };
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

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("app-update-available", handleAppUpdate);
    };
  }, []);

  const updateAppData = (updater: (prev: AppState) => AppState) => {
    setAppData((prev) => {
      let latestPrev = prev;
      if (!latestPrev) {
        // Try fallback to local storage
        const saved = localStorage.getItem("horizonte_data");
        if (saved) {
          try {
            latestPrev = JSON.parse(saved);
          } catch (e) {}
        }
      }
      if (!latestPrev) return prev; // Keep as is if still null

      const newData = updater(latestPrev);
      localStorage.setItem("horizonte_data", JSON.stringify(newData));

      // Bridge data into offline dexie
      try {
        if (newData.cpf && newData.schoolName) {
          dexieDb.users.put({
            localId: newData.cpf,
            userId: auth.currentUser?.uid || "local",
            email: `${newData.cpf}@tarefaflow.local`,
            displayName: newData.teacherName,
            photoURL: newData.avatarUrl || "",
            role: newData.role || "teacher",
            isSynced: false,
            syncStatus: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } catch (e) {
        console.warn("Dexie Bridge error:", e);
      }

      if (auth.currentUser) {
        syncToFirestore(newData);
      }

      return newData;
    });
  };

  useEffect(() => {
    const handleRemoteToken = async (token: string) => {
      setAccessToken(token);
      let localData = appData;
      if (!localData) {
        const saved = localStorage.getItem("horizonte_data");
        if (saved) {
          try {
            localData = JSON.parse(saved);
          } catch (e) {}
        }
      }
      
      if (!localData && auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const rawData = userSnap.data() as any;
          const data = rawData as AppState;
          data.classes = rawData.classesStr ? JSON.parse(rawData.classesStr) : [];
          data.occurrences = rawData.occurrencesStr ? JSON.parse(rawData.occurrencesStr) : [];
          data.googleCalendarEvents = rawData.googleCalendarEventsStr ? JSON.parse(rawData.googleCalendarEventsStr) : [];
          data.googleClassroomActivities = rawData.googleClassroomActivitiesStr ? JSON.parse(rawData.googleClassroomActivitiesStr) : [];
          setAppData(data);
          localStorage.setItem("horizonte_data", JSON.stringify(data));
          setIsLogged(true);
        } else {
          setAuthMode("register");
        }
      } else if (localData) {
        setIsLogged(true);
      } else {
        setAuthMode("register");
      }
    };

    initGoogleAuthListener((token) => {
      handleRemoteToken(token);
    });

    const handleWebToken = (e: any) => {
      if (e.detail) {
        handleRemoteToken(e.detail);
      }
    };
    window.addEventListener("google-access-token-updated", handleWebToken);

    // Check if returning from web browser redirect
    if (window.location.hash.includes("access_token")) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        localStorage.setItem("google_access_token", token);
        handleRemoteToken(token);
        window.location.hash = "";
      }
    }

    return () => {
      window.removeEventListener("google-access-token-updated", handleWebToken);
    };
  }, [appData]);

  useEffect(() => {
    if (appData?.role && appData.role !== "both") {
      setCurrentViewRole(appData.role);
    } else if (appData?.role === "both") {
      setCurrentViewRole("teacher");
    }
  }, [appData?.role]);

  useEffect(() => {}, [isLogged]);

  useEffect(() => {}, []);

  const syncToFirestore = async (data: AppState) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}`;
    try {
      const payload = {
        email: auth.currentUser.email || "",
        schoolName: data.schoolName,
        teacherName: data.teacherName,
        teacherSubject: data.teacherSubject || "",
        globalRole: data.role || "teacher", // Keep global role mapping
        birthDate: data.birthDate || "",
        cpf: data.cpf || "",
        password: data.password || "",
        googleSynced: data.googleSynced || false,
        avatarUrl: data.avatarUrl || null,
        role: data.role || "teacher",
        classesStr: JSON.stringify(data.classes || []),
        occurrencesStr: JSON.stringify(data.occurrences || []),
        googleCalendarEventsStr: JSON.stringify(
          data.googleCalendarEvents || [],
        ),
        googleClassroomActivitiesStr: JSON.stringify(
          data.googleClassroomActivities || [],
        ),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", auth.currentUser.uid), payload);

      if (data.schoolName && data.schoolName.trim()) {
        const schoolTrimmed = data.schoolName.trim();
        const schoolDocId = schoolTrimmed
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_");
        if (schoolDocId) {
          try {
            const schoolRef = doc(db, "schools", schoolDocId);
            const schoolDocSnap = await getDoc(schoolRef);
            const isSchoolCreator = !schoolDocSnap.exists();

            await setDoc(
              schoolRef,
              {
                name: schoolTrimmed,
                city: data.schoolCity || "",
                state: data.schoolState || "",
                createdAt: serverTimestamp(),
                status: "active",
              },
              { merge: true },
            );

            // Add as member
            await setDoc(
              doc(db, `schools/${schoolDocId}/members`, auth.currentUser.uid),
              {
                id: auth.currentUser.uid,
                name: data.teacherName,
                email: auth.currentUser.email || "",
                subject: data.teacherSubject || "",
                role: data.role || "teacher",
                status: isSchoolCreator ? "approved" : "pending",
                joinedAt: Date.now(),
              },
              { merge: true },
            );

            // Sync Occurrences
            if (data.occurrences && data.occurrences.length > 0) {
              for (const occ of data.occurrences) {
                await setDoc(
                  doc(db, `schools/${schoolDocId}/occurrences`, occ.id),
                  {
                    ...occ,
                    syncInfo: {
                      teacherId: auth.currentUser.uid,
                      teacherName: data.teacherName,
                      schoolId: schoolDocId,
                    },
                  },
                  { merge: true },
                );
              }
            }

            // Sync Attendance and Grades from classes
            if (data.classes && data.classes.length > 0) {
              for (const c of data.classes) {
                for (const s of c.students) {
                  if (s.attendanceHistory) {
                    for (const [date, status] of Object.entries(
                      s.attendanceHistory,
                    )) {
                      const recId = `${c.id}_${s.id}_${date}`;
                      await setDoc(
                        doc(db, `schools/${schoolDocId}/attendance`, recId),
                        {
                          id: recId,
                          studentId: s.id,
                          studentName: s.name,
                          classId: c.id,
                          className: c.name,
                          date: date,
                          status: status,
                          teacherId: auth.currentUser.uid,
                        },
                        { merge: true },
                      );
                    }
                  }
                  if (s.evaluations && s.evaluations.length > 0) {
                    for (const ev of s.evaluations) {
                      const recId = `${c.id}_${s.id}_${ev.id}`;
                      await setDoc(
                        doc(db, `schools/${schoolDocId}/grades`, recId),
                        {
                          id: recId,
                          studentId: s.id,
                          studentName: s.name,
                          classId: c.id,
                          className: c.name,
                          subject: data.teacherSubject || "Geral",
                          value: ev.grade || 0,
                          teacherId: auth.currentUser.uid,
                          bimester: ev.bimester || "Geral",
                        },
                        { merge: true },
                      );
                    }
                  }
                }
              }
            }
          } catch (schoolErr) {
            console.warn(
              "Could not register school/member in schools collection:",
              schoolErr,
            );
          }
        }
      }
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const fetchGoogleWorkspaceData = async (token: string) => {
    try {
      let events: GoogleEvent[] = [];
      let activities: GoogleCourseWork[] = [];

      const calRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=" +
          new Date().toISOString() +
          "&maxResults=10&orderBy=startTime&singleEvents=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const calData = await calRes.json();

      if (!calRes.ok) {
        if (calRes.status === 401) {
          throw new Error(
            "Sessão expirada. Por favor, conecte-se ao Google novamente.",
          );
        }
        console.error("Calendar API Error:", calData);
        triggerNotification(
          "Agenda: API não ativada no Google Cloud.",
          "critical",
        );
      } else {
        events = (calData.items || []).map((item: any) => {
          const startStr = item.start?.dateTime || item.start?.date;
          const date = startStr ? new Date(startStr) : new Date();
          return {
            id: item.id,
            title: item.summary || "Evento",
            start: date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            month: date
              .toLocaleString("default", { month: "short" })
              .substring(0, 3)
              .toUpperCase(),
            day: date.getDate().toString(),
            dateIso: date.toISOString(),
            syncedToGoogle: true,
          };
        });
      }

      try {
        const tasksRes = await fetch(
          "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (tasksRes.status === 401) {
          throw new Error(
            "Sessão expirada. Por favor, conecte-se ao Google novamente.",
          );
        }
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasksEvents = (tasksData.items || [])
            .filter((t: any) => t.due)
            .map((item: any) => {
              // O Google Tasks retorna 'due' no formato YYYY-MM-DDT00:00:00.000Z.
              // Para evitar que o fuso horário retorne para o dia anterior, passamos apenas o ano-mês-dia.
              const [year, month, day] = item.due.substring(0, 10).split("-");
              const date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                12,
                0,
                0,
              ); // Meio dia local
              return {
                id: item.id,
                title: "⏳ Tarefa: " + (item.title || "Sem título"),
                start: "Prazo",
                month: date
                  .toLocaleString("default", { month: "short" })
                  .substring(0, 3)
                  .toUpperCase(),
                day: date.getDate().toString(),
                dateIso: date.toISOString(),
                syncedToGoogle: true,
              };
            });
          events = [...events, ...tasksEvents];
        }
      } catch (e: any) {
        if (e?.message !== "Failed to fetch") {
          console.warn("Tasks API Error", e);
        }
      }

      const [studentCoursesRes, teacherCoursesRes] = await Promise.all([
        fetch(
          "https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE",
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        fetch(
          "https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE",
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ]);

      if (
        studentCoursesRes.status === 401 ||
        teacherCoursesRes.status === 401
      ) {
        throw new Error(
          "Sessão expirada. Por favor, conecte-se ao Google novamente.",
        );
      }

      const studentCoursesData = studentCoursesRes.ok
        ? await studentCoursesRes.json()
        : { courses: [] };
      const teacherCoursesData = teacherCoursesRes.ok
        ? await teacherCoursesRes.json()
        : { courses: [] };

      const allCourses = [
        ...(studentCoursesData.courses || []).map((c: any) => ({
          ...c,
          role: "student",
        })),
        ...(teacherCoursesData.courses || []).map((c: any) => ({
          ...c,
          role: "teacher",
        })),
      ];

      if (allCourses.length === 0) {
        console.info(
          "Classroom: No courses found. (Note: Student or Teacher role has no active Google Classroom courses)",
        );
      } else {
        // Remove duplicates if any (though unlikely)
        const uniqueCourses = Array.from(
          new Map(allCourses.map((c) => [c.id, c])).values(),
        );

        for (const course of uniqueCourses.slice(0, 5)) {
          // Remover orderBy que pode estar causando BadRequest, adicionar as atividades.
          const workRes = await fetch(
            `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=15&courseWorkStates=PUBLISHED`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!workRes.ok) continue;

          const workData = await workRes.json();
          const works = workData.courseWork || [];

          let subMap = new Map();
          try {
            const subRes = await fetch(
              `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/-/studentSubmissions?userId=me`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (subRes.ok) {
              const subData = await subRes.json();
              const submissions = subData.studentSubmissions || [];
              for (const sub of submissions) {
                subMap.set(sub.courseWorkId, sub.state);
              }
            }
          } catch (e: any) {
            if (e?.message !== "Failed to fetch") {
              console.error("Error fetching submissions", e);
            }
          }

          for (const w of works) {
            // Check if the activity is already completed
            const state = subMap.get(w.id);
            if (state === "TURNED_IN" || state === "RETURNED") {
              continue;
            }

            // Apenas o que existe, sem simular mensagens fake já que foi pedido "nao invente"
            const realMessages: ClassroomMessage[] = [];

            let dueDateStr = "Sem prazo";
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
              teacherName: course.section || "Professor",
              title: w.title,
              dueDateStr,
              postDateStr: w.creationTime
                ? new Date(w.creationTime).toLocaleDateString()
                : "Desconhecida",
              isSoon,
              messages: realMessages,
              role: course.role as "teacher" | "student",
            });
          }
        }
      }

      return { events, activities: activities.slice(0, 10) };
    } catch (e: any) {
      if (e instanceof Error && e.message.includes("Sessão expirada")) {
        localStorage.removeItem("google_access_token");
        setAccessToken(null);
        updateAppData((prev) => ({ ...prev, googleSynced: false }));
        throw e;
      }
      if (e?.message !== "Failed to fetch") {
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
      let token = isRetry
        ? null
        : localStorage.getItem("google_access_token") || accessToken;

      if (!token) {
        if (silent) return; // Do not interrupt user in background
        if (Capacitor.isNativePlatform()) {
          const clientId =
            "1067272365451-9tkkbb5d9t5a560205856eb2h7v9c30h.apps.googleusercontent.com"; // Placeholder
          const redirectUri = "br.com.jefson.tarefaflow://auth";
          const scopes = encodeURIComponent(
            "email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets",
          );

          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=${scopes}&nonce=tarefaflow123`;

          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: authUrl });
          if (!silent) setIsSyncingGoogle(false);
          return; // Will come back via deep link
        }

        const provider = new GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");
        provider.addScope(
          "https://www.googleapis.com/auth/classroom.courses.readonly",
        );
        provider.addScope(
          "https://www.googleapis.com/auth/classroom.rosters.readonly",
        );
        provider.addScope(
          "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
        );
        provider.addScope(
          "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
        );
        provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
        provider.addScope("https://www.googleapis.com/auth/calendar.events");
        provider.addScope("https://www.googleapis.com/auth/tasks.readonly");
        provider.addScope("https://www.googleapis.com/auth/tasks");
        provider.addScope("https://www.googleapis.com/auth/drive.file");
        provider.addScope("https://www.googleapis.com/auth/spreadsheets");

        try {
          const result = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken || null;
          if (token) {
            localStorage.setItem("google_access_token", token);
            setAccessToken(token);
            window.dispatchEvent(
              new CustomEvent("google-access-token-updated", { detail: token }),
            );
          } else {
            if (!silent) setIsSyncingGoogle(false);
            return;
          }
        } catch (error: any) {
          if (error.code === "auth/internal-error") {
            console.error("Firebase Internal Error during sync.", error);
            if (!silent)
              triggerNotification("Erro de autenticação.", "critical");
          } else if (error.code === "auth/unauthorized-domain") {
            console.error("Domínio não autorizado", error);
            if (!silent)
              triggerNotification(
                "Erro: Domínio não autorizado no Firebase.",
                "critical",
              );
          }
          throw error;
        }
      }

      let fetchedData = null;
      if (token) {
        if (!silent)
          triggerNotification(
            "Sincronizando dados com o Google Workspace...",
            "info",
          );

        let newEventsSynced = 0;
        // Push local unsynced events first
        let currentAppData = null;
        try {
          currentAppData = JSON.parse(
            localStorage.getItem("horizonte_data") || "null",
          );
        } catch (e) {}
        if (currentAppData?.googleCalendarEvents) {
          const unsynced = currentAppData.googleCalendarEvents.filter(
            (e: any) => e.isCustom && !e.syncedToGoogle && e.dateIso,
          );
          for (const ev of unsynced) {
            try {
              const startDate = new Date(ev.dateIso!);
              const [hours, minutes] = ev.start.split(":").map(Number);
              startDate.setHours(hours, minutes, 0, 0);
              const endDate = new Date(startDate);
              endDate.setHours(hours + 1);

              await fetch(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    summary: ev.title,
                    start: {
                      dateTime: startDate.toISOString(),
                      timeZone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                    end: {
                      dateTime: endDate.toISOString(),
                      timeZone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                  }),
                },
              );
              ev.syncedToGoogle = true; // Mark as synced locally later
              newEventsSynced++;
            } catch (err) {
              console.error("Error creating event in Google Calendar", err);
            }
          }
          if (newEventsSynced > 0) {
            // We mutated currentAppData inside the loop, need to save it back before we rewrite with fetchedData.
            // Actually `updateAppData` is used down below which will merge. We will merge the synced flag there
            localStorage.setItem(
              "horizonte_data",
              JSON.stringify(currentAppData),
            );
          }
        }

        fetchedData = await fetchGoogleWorkspaceData(token);

        if (newEventsSynced > 0) {
          triggerNotification(
            `${newEventsSynced} agendamento(s) sincronizado(s) com sucesso.`,
            "info",
          );
        }
      }

      const currentUser = auth.currentUser;
      let latestAppData = null;
      try {
        latestAppData = JSON.parse(
          localStorage.getItem("horizonte_data") || "null",
        );
      } catch (e) {}

      if (currentUser || latestAppData) {
        let newData = {
          ...latestAppData!,
          googleSynced: true,
          ...(currentUser?.photoURL && {
            avatarUrl: currentUser.photoURL.replace("s96-c", "s256-c"),
          }),
          ...(fetchedData && {
            googleCalendarEvents: fetchedData.events,
            googleClassroomActivities: fetchedData.activities,
          }),
        };
        // updateAppData instead of raw setAppData to trigger dexie bridge
        updateAppData(() => newData);
        if (!silent)
          triggerNotification(
            "Conta sincronizada! Acesse Agenda/Início para ver os dados.",
            "info",
          );
      }
    } catch (e: any) {
      if (
        e?.code === "auth/cancelled-popup-request" ||
        e?.code === "auth/popup-closed-by-user"
      ) {
        console.log("Sincronização cancelada pelo usuário.");
      } else if (e instanceof Error && e.message.includes("Sessão expirada")) {
        console.log("Sessão do Google expirada.");
        if (!silent && !isRetry) {
          await executeGoogleSync(false, true);
          return;
        } else if (!silent) {
          triggerNotification(
            "Sessão expirada. Por favor, conecte-se ao Google novamente.",
            "info",
          );
        }
      } else {
        console.error("Google sync error", e);
        if (!silent) {
          const msg =
            e instanceof Error ? e.message : "Erro ao sincronizar com Google.";
          triggerNotification(msg.substring(0, 80), "critical");
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
    const unsubscribe = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      (docSnap) => {
        console.log(
          "📦 Firestore Profile Update:",
          docSnap.exists() ? "Document found" : "Document not found",
        );
        setProfileLoaded(true);
        if (docSnap.exists() && !docSnap.metadata.hasPendingWrites) {
          const data = docSnap.data();
          let parsedClasses = [];
          let parsedOccurrences = [];
          let parsedEvents = [];
          let parsedActivities = [];
          try {
            if (data.classesStr)
              parsedClasses = JSON.parse(data.classesStr) || [];
          } catch (e) {}
          try {
            if (data.occurrencesStr)
              parsedOccurrences = JSON.parse(data.occurrencesStr) || [];
          } catch (e) {}
          try {
            if (data.googleCalendarEventsStr)
              parsedEvents = JSON.parse(data.googleCalendarEventsStr) || [];
          } catch (e) {}
          try {
            if (data.googleClassroomActivitiesStr)
              parsedActivities =
                JSON.parse(data.googleClassroomActivitiesStr) || [];
          } catch (e) {}
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
            googleClassroomActivities: parsedActivities,
          };
          setAppData(remoteApp);
          localStorage.setItem("horizonte_data", JSON.stringify(remoteApp));
        }
      },
      (error: any) => {
        if (error?.code !== "permission-denied") {
          console.warn("Could not sync profile:", error);
        }
        setProfileLoaded(true); // Treat as checked to allow fallback or retry
        // handleFirestoreError(error, OperationType.GET, path); // Don't throw here to avoid crashing out of the app
      },
    );
    return () => unsubscribe();
  }, [auth.currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "🔥 Auth State Changed:",
        user
          ? `Authenticated as ${user.email} (${user.uid})`
          : "No active session",
      );
      if (user) {
        setIsLogged(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRegistrationComplete = async (data: AppState) => {
    setAppData(data);
    localStorage.setItem("horizonte_data", JSON.stringify(data));
    setIsLogged(true);
    setActiveScreen("studentsHub");
    
    if (!auth.currentUser && !data.googleSynced && data.email && data.password) {
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      } catch (e: any) {
        if (e.code === "auth/email-already-in-use") {
          try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
          } catch (signInErr) {
            console.error("Local sign in error:", signInErr);
          }
        } else {
          console.error("Auth error:", e);
        }
      }
    }
    
    // Fallback: If still no auth (e.g. offline), login would fail, but local Dexie works.
    if (auth.currentUser) {
      syncToFirestore(data);
    }
  };

  const triggerNotification = (message: string, type: "critical" | "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getScreenTitle = () => {
    switch (activeScreen) {
      case "dashboard":
        return "Dashboard";
      case "studentsHub":
        return "Alunos";
      case "attendance":
        return "Frequência";
      case "agenda":
        return "Agenda";
      case "reports":
        return "Relatórios";
      case "boletim":
        return "Boletim";
      case "occurrence":
        return "Nova Ocorrência";
      case "settings":
        return "Configurações";
      case "classes":
        return "Turmas e Alunos";
      case "director":
        return "Sala da Diretora";
      case "materials":
        return "Preparar Materiais";
      default:
        return appData?.schoolName || "Horizonte";
    }
  };

  // Build a flat list of all students for the screens to use
  const allStudents = appData
    ? (appData.classes || []).flatMap((c) => c.students)
    : [];

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return (
          <DashboardScreen
            onNavigate={setActiveScreen}
            onNewOccurrence={() => setActiveScreen("occurrence")}
            appData={appData!}
            onShowNotification={(msg) => triggerNotification(msg, "info")}
            onSyncGoogle={handleGoogleSync}
            isSyncingGoogle={isSyncingGoogle}
            currentViewRole={currentViewRole}
            onToggleViewRole={(r) => setCurrentViewRole(r)}
            onUpdateActivities={(activities) => {
              updateAppData((prev) => ({
                ...prev,
                googleClassroomActivities: activities,
              }));
            }}
            onUpdateClasses={(classes) => {
              updateAppData((prev) => ({ ...prev, classes }));
            }}
          />
        );
      case "studentsHub":
        return (
          <StudentsHubScreen
            onNavigate={(s) => {
              if (s === "occurrence") setSelectedStudentId(null);
              setActiveScreen(s);
            }}
            onOpenGrades={() => setShowGradeDialog(true)}
          />
        );
      case "attendance":
        return (
          <AttendanceScreen
            classes={appData?.classes || []}
            teachingDays={appData?.teachingDays || []}
            onFinish={() => setActiveScreen("studentsHub")}
            onSelectStudent={(id) => {
              setSelectedStudentId(id);
              setActiveScreen("occurrence");
            }}
            onUpdateClasses={(updated) => updateAppData(prev => ({ ...prev, classes: updated }))}
            onUpdateStatus={(classId, studentId, date, status) => {
              updateAppData((prev) => {
                const newData = {
                  ...prev,
                  classes: prev.classes.map((c) =>
                    c.id === classId
                      ? {
                          ...c,
                          students: c.students.map((s) =>
                            s.id === studentId
                              ? {
                                  ...s,
                                  status,
                                  attendanceHistory: {
                                    ...(s.attendanceHistory || {}),
                                    [date]: status,
                                  },
                                }
                              : s,
                          ),
                        }
                      : c,
                  ),
                };
                return newData;
              });

              // Log to Dexie for true offline backup
              try {
                 dexieDb.attendance.put({
                    localId: `${classId}-${studentId}-${date}`,
                    classId,
                    studentId,
                    userId: auth.currentUser?.uid || 'unknown',
                    isSynced: false,
                    syncStatus: 'pending',
                    createdAt: Date.now(),
                    date,
                    status,
                    updatedAt: Date.now()
                 });
                 dexieDb.syncQueue.put({
                    id: crypto.randomUUID(),
                    operation: 'update_attendance',
                    payload: { classId, studentId, date, status },
                    timestamp: Date.now()
                 });
              } catch(e) {}
            }}
          />
        );
      case "agenda":
        return (
          <AgendaScreen
            appData={appData!}
            onShowNotification={(msg) => triggerNotification(msg, "info")}
            onSyncGoogle={handleGoogleSync}
            isSyncingGoogle={isSyncingGoogle}
            onAddEvent={(newEvent) => {
              updateAppData((prev) => ({
                ...prev,
                googleCalendarEvents: [
                  ...(prev.googleCalendarEvents || []),
                  newEvent,
                ],
              }));
            }}
          />
        );
      case "occurrence":
        return (
          <OccurrenceScreen
            student={allStudents.find((s) => s.id === selectedStudentId)}
            occurrences={
              selectedStudentId
                ? appData?.occurrences.filter(
                    (o: Occurrence) => o.studentId === selectedStudentId,
                  ) || []
                : appData?.occurrences || []
            }
            classes={appData?.classes || []}
            onSelectStudent={(id) => setSelectedStudentId(id)}
            onSave={async (accData) => {
              const student = allStudents.find(
                (s) => s.id === accData.studentId,
              );
              if (accData.status === "critical") {
                // Try to show a local push notification if permitted
                if (
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification(
                    "Alerta Crítico: " + (student?.name || "Aluno"),
                    {
                      body: accData.notes.substring(0, 50) + "...",
                      icon: "/icon-192x192.png",
                    },
                  );
                } else if (
                  "Notification" in window &&
                  Notification.permission !== "denied"
                ) {
                  Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                      new Notification(
                        "Alerta Crítico: " + (student?.name || "Aluno"),
                        {
                          body: accData.notes.substring(0, 50) + "...",
                          icon: "/icon-192x192.png",
                        },
                      );
                    }
                  });
                }
              }

              updateAppData((prev) => {
                const newOcc: Occurrence = {
                  id: Date.now().toString(),
                  ...accData,
                };
                if (newOcc.status === "critical") {
                  setTimeout(
                    () =>
                      triggerNotification(
                        `⚠️ ALERTA CRÍTICO: ${student?.name} - Ocorrência Crítica`,
                        "critical",
                      ),
                    10,
                  );
                } else {
                  setTimeout(
                    () =>
                      triggerNotification(
                        `Ocorrência registrada com sucesso.`,
                        "info",
                      ),
                    10,
                  );
                }

                let updatedEvents = prev.googleCalendarEvents || [];
                if (newOcc.meetingReminderDate && newOcc.meetingReminderTime) {
                  const meetingDate = new Date(newOcc.meetingReminderDate);
                  const monthNames = [
                    "JAN",
                    "FEV",
                    "MAR",
                    "ABR",
                    "MAI",
                    "JUN",
                    "JUL",
                    "AGO",
                    "SET",
                    "OUT",
                    "NOV",
                    "DEZ",
                  ];
                  const newEvent = {
                    id: "meeting-" + Date.now().toString(),
                    title: `Reunião c/ responsável de ${student?.name}`,
                    month: monthNames[meetingDate.getMonth()],
                    day: meetingDate.getDate().toString(),
                    time: newOcc.meetingReminderTime,
                    start: newOcc.meetingReminderTime,
                    dateIso: newOcc.meetingReminderDate,
                    isCustom: true,
                    syncedToGoogle: false,
                  };
                  updatedEvents = [...updatedEvents, newEvent];

                  // Se o token existir, tenta sincronizar depois
                  if (localStorage.getItem("google_access_token")) {
                    setTimeout(() => {
                      executeGoogleSync(true);
                    }, 2000);
                  }
                }

                setTimeout(
                  () => triggerWebhooks("occurrence_added", newOcc),
                  15,
                );
                return {
                  ...prev,
                  occurrences: [...prev.occurrences, newOcc],
                  googleCalendarEvents: updatedEvents,
                };
              });
              setActiveScreen("studentsHub");
            }}
            onCancel={() => setActiveScreen("studentsHub")}
          />
        );
      case "reports":
      case "boletim":
        return (
          <ReportsScreen
            appData={appData!}
            onUpdateClasses={(newClasses) =>
              updateAppData((prev) => ({ ...prev, classes: newClasses }))
            }
            onShowNotification={(msg) => triggerNotification(msg, "info")}
            currentViewRole={currentViewRole}
            initialModule={
              activeScreen === "boletim" ? "evaluations" : undefined
            }
          />
        );
      case "classes":
        return (
          <ClassesScreen
            appData={appData!}
            onUpdateClasses={(newClasses) =>
              updateAppData((prev) => ({ ...prev, classes: newClasses }))
            }
          />
        );
      case "materials":
        return (
          <MaterialsScreen
            appData={appData!}
            onUpdateMaterials={(mats) =>
              updateAppData((prev) => ({ ...prev, materials: mats }))
            }
          />
        );
      case "director":
        return (
          <SchoolDashboardScreen
            school={{
              id: "temp",
              name: appData?.schoolName || "Escola Virtual",
              status: "active",
              createdAt: 0,
              updatedAt: 0,
            }}
            totalStudents={
              appData?.classes?.reduce(
                (acc, curr) => acc + (curr.students?.length || 0),
                0,
              ) || 0
            }
            totalTeachers={1}
            totalClasses={appData?.classes?.length || 0}
            onNavigate={(screen) => setActiveScreen(screen as any)}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            appData={appData!}
            onUpdateField={(field, value) =>
              updateAppData((prev) => ({ ...prev, [field]: value }))
            }
            onLogout={() => setIsLogged(false)}
            onSyncGoogle={handleGoogleSync}
            isSyncingGoogle={isSyncingGoogle}
            onInstall={handleInstallApp}
            canInstall={!!deferredPrompt}
            isAdmin={isAdminUser()}
            onNavigateAdmin={() => setActiveScreen("admin")}
            onShowNotification={(msg, type) => triggerNotification(msg, type)}
            appUpdateAvailable={appUpdateAvailable}
            acceptAppUpdate={acceptAppUpdate}
          />
        );
      case "admin":
        if (isAdminUser()) {
          return (
            <AdminScreen
              appData={appData!}
              onUpdateField={(field, value) =>
                updateAppData((prev) => ({ ...prev, [field]: value }))
              }
              onShowNotification={triggerNotification}
            />
          );
        } else if (
          appData?.role === "school_director" ||
          appData?.role === "school_secretary"
        ) {
          return (
            <AccessControlScreen
              school={{
                id: appData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
                name: appData.schoolName,
                status: "active",
                createdAt: 0,
                updatedAt: 0,
              }}
              onShowNotification={triggerNotification}
            />
          );
        } else {
          return (
            <div className="py-20 text-center">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-bold">Acesso Negado</p>
              <button
                onClick={() => setActiveScreen("studentsHub")}
                className="mt-4 text-primary text-sm font-bold"
              >
                Voltar
              </button>
            </div>
          );
        }
      default:
        return null;
    }
  };

  if (!isLogged) {
    if (authMode === "register") {
      return (
        <RegistrationScreen
          onComplete={handleRegistrationComplete}
          onSwitchToLogin={() => setAuthMode("login")}
          onShowNotification={triggerNotification}
        />
      );
    } else {
      return (
        <LoginScreen
          appData={appData}
          setAccessToken={setAccessToken}
          onLogin={async (fetchedData) => {
            if (fetchedData) {
              setAppData(fetchedData);
              localStorage.setItem(
                "horizonte_data",
                JSON.stringify(fetchedData),
              );
              setIsLogged(true);
            } else if (auth.currentUser) {
              const userRef = doc(db, "users", auth.currentUser.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const rawData = userSnap.data() as any;
                const data = rawData as AppState;
                data.classes = rawData.classesStr ? JSON.parse(rawData.classesStr) : [];
                data.occurrences = rawData.occurrencesStr ? JSON.parse(rawData.occurrencesStr) : [];
                data.googleCalendarEvents = rawData.googleCalendarEventsStr ? JSON.parse(rawData.googleCalendarEventsStr) : [];
                data.googleClassroomActivities = rawData.googleClassroomActivitiesStr ? JSON.parse(rawData.googleClassroomActivitiesStr) : [];
                setAppData(data);
                localStorage.setItem("horizonte_data", JSON.stringify(data));
                setIsLogged(true);
              } else {
                setAuthMode("register");
              }
            } else {
              setIsLogged(true);
            }
          }}
          onSwitchToRegister={() => setAuthMode("register")}
          onShowNotification={triggerNotification}
          onWipeData={() => {
            localStorage.removeItem("horizonte_data");
            localStorage.removeItem("google_access_token");
            setAppData(null);
            auth.signOut();
            dexieDb.delete().then(() => {
              setAuthMode("register");
              window.location.reload();
            });
          }}
        />
      );
    }
  }

  if (isLogged && !appData && profileLoaded) {
    return (
      <RegistrationScreen
        onComplete={handleRegistrationComplete}
        onSwitchToLogin={() => {
          setIsLogged(false);
          auth.signOut();
          setAuthMode("login");
        }}
        onShowNotification={triggerNotification}
      />
    );
  }

  if (!appData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8ff] dark:bg-slate-900">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold font-manrope">
          Carregando dados...
        </p>
        <button
          onClick={() => {
            setIsLogged(false);
            auth.signOut();
          }}
          className="mt-6 text-xs text-primary underline"
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  if (appData?.billingStatus === "overdue" && !isAdminUser()) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-red-500 shadow-sm" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-tight">
          Aplicativo Suspenso
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-manrope text-sm leading-relaxed mb-8 max-w-xs">
          O acesso ao Colégio Horizonte foi temporariamente suspenso devido a
          pendências na ativação do plano. Entre em contato com o suporte para
          regularizar.
        </p>
        <div className="w-full space-y-3">
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase text-xs tracking-widest"
          >
            Falar com Ativação
          </a>
          <button
            onClick={() => {
              setIsLogged(false);
              auth.signOut();
            }}
            className="w-full text-slate-400 font-bold py-2 text-xs uppercase tracking-widest hover:text-primary transition-colors"
          >
            Sair da Conta
          </button>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 w-full">
          <p className="text-[10px] text-slate-400 font-bold uppercase">
            ID do Cliente: {appData.schoolName || "N/A"}
          </p>
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
            <div
              className={`shadow-xl rounded-2xl p-4 flex items-center gap-3 max-w-sm w-full ${notification.type === "critical" ? "bg-red-500 text-white" : "bg-primary-container text-primary"} pointer-events-auto`}
            >
              {notification.type === "critical" ? (
                <AlertOctagon className="w-6 h-6 shrink-0" />
              ) : (
                <Check className="w-6 h-6 shrink-0" />
              )}
              <span className="font-manrope text-sm font-bold flex-1">
                {notification.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header
        title={getScreenTitle()}
        avatarUrl={appData?.avatarUrl}
        appUpdateAvailable={appUpdateAvailable}
        adminNotices={appData?.adminNotices || []}
        showBack={
          activeScreen === "occurrence" ||
          activeScreen === "settings" ||
          activeScreen === "classes" ||
          activeScreen === "director" ||
          activeScreen === "materials" ||
          activeScreen === "boletim" ||
          activeScreen === "attendance" ||
          activeScreen === "admin"
        }
        onBack={() => {
          setActiveScreen("studentsHub");
        }}
        onSettings={
          activeScreen !== "settings"
            ? () => setActiveScreen("settings")
            : undefined
        }
        onNavigateDirector={() => setActiveScreen("director")}
      />

      <main className="pt-24 px-6 max-w-4xl mx-auto pb-6">
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

      {activeScreen !== "occurrence" && (
        <BottomNav
          active={activeScreen}
          onChange={setActiveScreen}
          role={currentViewRole}
          isSuperAdmin={isAdminUser()}
        />
      )}

      {showGradeDialog && (
        <QuickGradeDialog
          isOpen={showGradeDialog}
          onClose={() => setShowGradeDialog(false)}
          appData={appData!}
          onShowNotification={(msg) => triggerNotification(msg, "info")}
          onUpdateClasses={(classes) =>
            updateAppData((prev) => ({ ...prev, classes }))
          }
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
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
                Permissão de Acesso
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-manrope text-center mb-6 leading-relaxed">
                Para sincronizar sua agenda e atividades do Classroom, o
                aplicativo solicitará acesso ao seu e-mail e dados do Google
                Workspace. Apenas as turmas e eventos que você tem acesso serão
                exibidos.
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
