import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Shield,
  TrendingUp,
  Users,
  BookOpen,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface AttendanceRecord {
  date: string;
  className: string;
  status: "present" | "absent" | "late" | "justified";
}

interface GradeRecord {
  bimester: string;
  value: number;
  className: string;
  subject: string;
}

interface School {
  id?: string;
  name?: string;
}

interface Props {
  school: School | null;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  onNavigate: (screen: string) => void;
}

export const SchoolDashboardScreen: React.FC<Props> = ({
  school,
  totalStudents,
  totalTeachers,
  totalClasses,
  onNavigate,
}) => {
  const [rawAttendance, setRawAttendance] = useState<AttendanceRecord[]>([]);
  const [rawGrades, setRawGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const fetchData = async () => {
      if (!school || school.id === "temp") {
        setLoading(false);
        setRawAttendance([]);
        setRawGrades([]);
        return;
      }

      setLoading(true);
      try {
        const attendanceSnap = await getDocs(
          query(collection(db, `schools/${school.id}/attendance`)),
        );
        const attendanceRecords = attendanceSnap.docs.map(
          (doc) => doc.data() as AttendanceRecord,
        );
        setRawAttendance(attendanceRecords);

        // Fetch Grades
        const gradesSnap = await getDocs(
          query(collection(db, `schools/${school.id}/grades`)),
        );
        const gradeRecords = gradesSnap.docs.map(
          (doc) => doc.data() as GradeRecord,
        );
        setRawGrades(gradeRecords);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [school]);

  const attendanceData = useMemo(() => {
    if (!rawAttendance.length) return [];
    const now = new Date();
    const startDate = new Date();
    if (period === "monthly") {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    const dateStrThreshold = startDate.toISOString().split("T")[0];

    const attendanceMap: Record<string, { presence: number; absence: number }> =
      {};

    rawAttendance.forEach((data) => {
      if (data.date >= dateStrThreshold) {
        let key = "";
        if (period === "monthly") {
          key = new Date(data.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });
        } else {
          key = new Date(data.date).toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
          });
        }

        if (!attendanceMap[key])
          attendanceMap[key] = { presence: 0, absence: 0 };
        if (data.status === "present") attendanceMap[key].presence++;
        else attendanceMap[key].absence++;
      }
    });

    return Object.keys(attendanceMap).map((key) => ({
      date: key,
      presence: attendanceMap[key].presence,
      absence: attendanceMap[key].absence,
    }));
  }, [rawAttendance, period]);

  const gradesData = useMemo(() => {
    if (!rawGrades.length) return [];

    // Gráfico de notas poderia usar o período se as notas tivessem data, mas vamos apenas recalcular se necessário ou agrupar
    const subjectMap: Record<string, { total: number; count: number }> = {};

    rawGrades.forEach((data) => {
      if (!subjectMap[data.subject])
        subjectMap[data.subject] = { total: 0, count: 0 };
      subjectMap[data.subject].total += data.value;
      subjectMap[data.subject].count++;
    });

    return Object.keys(subjectMap).map((subject) => ({
      subject,
      average: Number(
        (subjectMap[subject].total / subjectMap[subject].count).toFixed(1),
      ),
    }));
  }, [rawGrades]);

  if (!school) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Shield className="w-6 h-6" /> Sala da Diretora
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Visão gerencial do {school.name}
          </p>
        </div>

        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${period === "monthly" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
          >
            <CalendarIcon className="w-4 h-4" /> Mensal
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${period === "yearly" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
          >
            <Filter className="w-4 h-4" /> Anual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {totalStudents}
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">
            Alunos
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {totalTeachers}
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">
            Professores
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {totalClasses}
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase mt-1">
            Turmas
          </p>
        </div>
        <button
          onClick={() => onNavigate("admin")}
          className="p-5 bg-primary/5 hover:bg-primary/10 rounded-3xl border border-primary/20 shadow-sm flex flex-col items-center justify-center cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-primary">Controle de</p>
          <p className="text-sm font-bold text-primary">Acessos</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Frequência {period === "monthly" ? "Mensal" : "Anual"}
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Carregando gráfico...
              </div>
            ) : attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.1}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                    itemStyle={{ fontWeight: "bold" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  />
                  <Line
                    type="monotone"
                    name="Presenças"
                    dataKey="presence"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    name="Faltas"
                    dataKey="absence"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm font-medium">
                  Nenhum registro encontrado
                </span>
                <span className="text-xs">Faça chamadas para gerar dados</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Média de Notas por Disciplina (
            {period === "monthly" ? "Mensal" : "Anual"})
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Carregando gráfico...
              </div>
            ) : gradesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gradesData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.1}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis type="number" domain={[0, 10]} hide />
                  <YAxis
                    dataKey="subject"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar
                    dataKey="average"
                    name="Média"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BookOpen className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm font-medium">
                  Nenhuma nota registrada
                </span>
                <span className="text-xs">
                  Registre avaliações para visualizar
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
