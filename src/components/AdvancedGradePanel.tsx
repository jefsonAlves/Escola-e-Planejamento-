import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type CalculationMode = "sum" | "simple_average" | "weighted_average";
type ScoringType = "numeric" | "check_count";

type StudentEvaluation = {
  id: string;
  assessmentId?: string;
  method: string;
  points: number;
  date: string;
  bimester?: string;
  grade?: string;
  notes?: string;
  category?: string;
  maxPoints?: number;
  weight?: number;
  source?: string;
  targetGrade?: number;
  calculationMode?: CalculationMode;
  scoringType?: ScoringType;
  checkCount?: number;
  pointsPerCheck?: number;
  isBimesterSummary?: boolean;
};

type Student = {
  id: string;
  name: string;
  avatar?: string;
  grade?: string;
  room?: string;
  status?: string;
  evaluations?: StudentEvaluation[];
  [key: string]: unknown;
};

type ClassData = {
  id: string;
  name: string;
  students: Student[];
  [key: string]: unknown;
};

type AssessmentItem = {
  id: string;
  title: string;
  category: string;
  maxPoints: number;
  weight: number;
  scoringType: ScoringType;
  pointsPerCheck: number;
};

type QuickAssessment = {
  label: string;
  scoringType: ScoringType;
  maxPoints?: number;
  pointsPerCheck?: number;
};

const SOURCE = "advanced-grade-panel";
const BIMESTERS = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
const QUICK_ASSESSMENTS: QuickAssessment[] = [
  { label: "Prova", scoringType: "numeric", maxPoints: 10 },
  { label: "Atividade", scoringType: "numeric", maxPoints: 10 },
  { label: "Visto", scoringType: "check_count", maxPoints: 2, pointsPerCheck: 0.25 },
  { label: "Trabalho", scoringType: "numeric", maxPoints: 10 },
  { label: "Participação", scoringType: "numeric", maxPoints: 10 },
  { label: "Projeto", scoringType: "numeric", maxPoints: 10 },
  { label: "Seminário", scoringType: "numeric", maxPoints: 10 },
  { label: "Recuperação", scoringType: "numeric", maxPoints: 10 },
];

const DEFAULT_ASSESSMENTS: AssessmentItem[] = [
  { id: "prova-1", title: "Prova 1", category: "Prova", maxPoints: 10, weight: 1, scoringType: "numeric", pointsPerCheck: 1 },
  { id: "atividade-1", title: "Atividade 1", category: "Atividade", maxPoints: 10, weight: 1, scoringType: "numeric", pointsPerCheck: 1 },
  { id: "visto-1", title: "Vistos de atividades", category: "Visto", maxPoints: 2, weight: 1, scoringType: "check_count", pointsPerCheck: 0.25 },
];

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const parseNumber = (value: string | number | undefined, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundGrade = (value: number) => Math.round(value * 100) / 100;

const formatGrade = (value: number) =>
  roundGrade(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const safeParseClasses = (raw: unknown): ClassData[] => {
  if (Array.isArray(raw)) return raw as ClassData[];
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ClassData[]) : [];
  } catch {
    return [];
  }
};

const isCheckCategory = (category: string) => category.toLowerCase().includes("visto");

const createAssessment = (category: string, index: number, scoringType?: ScoringType): AssessmentItem => {
  const nextScoringType = scoringType || (isCheckCategory(category) ? "check_count" : "numeric");
  const isCheck = nextScoringType === "check_count";

  return {
    id: createId(),
    title: isCheck ? `${category} de atividades` : `${category} ${index}`,
    category,
    maxPoints: isCheck ? 2 : 10,
    weight: 1,
    scoringType: nextScoringType,
    pointsPerCheck: isCheck ? 0.25 : 1,
  };
};

const getAssessmentKey = (evaluation: StudentEvaluation) =>
  evaluation.assessmentId ||
  `${evaluation.method}-${evaluation.category || "Nota"}-${evaluation.maxPoints || 10}-${evaluation.weight || 1}-${evaluation.scoringType || "numeric"}`;

const calculateAssessmentPoints = (assessment: AssessmentItem, rawValue: string | number | undefined) => {
  const value = parseNumber(rawValue, 0);
  if (assessment.scoringType === "check_count") {
    const checks = Math.max(value, 0);
    const converted = checks * Math.max(assessment.pointsPerCheck || 0, 0);
    return roundGrade(Math.min(converted, Math.max(assessment.maxPoints || converted, 0)));
  }

  return roundGrade(Math.min(Math.max(value, 0), Math.max(assessment.maxPoints || value, 0)));
};

export default function AdvancedGradePanel() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBimester, setSelectedBimester] = useState(BIMESTERS[0]);
  const [calculationMode, setCalculationMode] = useState<CalculationMode>("sum");
  const [targetGrade, setTargetGrade] = useState("10");
  const [customCategory, setCustomCategory] = useState("");
  const [customScoringType, setCustomScoringType] = useState<ScoringType>("numeric");
  const [assessments, setAssessments] = useState<AssessmentItem[]>(
    DEFAULT_ASSESSMENTS.map((item, index) => ({ ...item, id: `${item.id}-${index}` })),
  );
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setClasses([]);
        setSelectedClassId("");
      }
    });
  }, []);

  useEffect(() => {
    if (!open || !user) return;

    const loadData = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? (snap.data() as Record<string, unknown>) : {};
        const classesField = safeParseClasses(data.classes);
        const loadedClasses = classesField.length > 0 ? classesField : safeParseClasses(data.classesStr);
        setClasses(loadedClasses);
        setSelectedClassId((current) => current || loadedClasses[0]?.id || "");
        if (loadedClasses.length === 0) {
          setMessage("Nenhuma turma encontrada. Cadastre turmas e alunos antes de lançar notas avançadas.");
        }
      } catch (error) {
        console.error("Erro ao carregar turmas para notas avançadas", error);
        setMessage("Não foi possível carregar as turmas agora.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, user]);

  const activeClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId),
    [classes, selectedClassId],
  );

  const students = useMemo(
    () => [...(activeClass?.students || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [activeClass],
  );

  useEffect(() => {
    if (!activeClass) return;

    const advancedEvaluations = activeClass.students
      .flatMap((student) => student.evaluations || [])
      .filter(
        (evaluation) =>
          evaluation.source === SOURCE &&
          evaluation.bimester === selectedBimester &&
          !evaluation.isBimesterSummary,
      );

    if (advancedEvaluations.length === 0) {
      setAssessments(DEFAULT_ASSESSMENTS.map((item, index) => ({ ...item, id: createId() || `${item.id}-${index}` })));
      setGradeInputs({});
      return;
    }

    const uniqueAssessments = new Map<string, AssessmentItem>();
    const nextInputs: Record<string, string> = {};

    activeClass.students.forEach((student) => {
      (student.evaluations || [])
        .filter(
          (evaluation) =>
            evaluation.source === SOURCE &&
            evaluation.bimester === selectedBimester &&
            !evaluation.isBimesterSummary,
        )
        .forEach((evaluation) => {
          const key = getAssessmentKey(evaluation);
          const scoringType = evaluation.scoringType || (isCheckCategory(evaluation.category || "") ? "check_count" : "numeric");
          if (!uniqueAssessments.has(key)) {
            uniqueAssessments.set(key, {
              id: key,
              title: evaluation.method,
              category: evaluation.category || "Nota",
              maxPoints: evaluation.maxPoints || 10,
              weight: evaluation.weight || 1,
              scoringType,
              pointsPerCheck: evaluation.pointsPerCheck || (scoringType === "check_count" ? 0.25 : 1),
            });
          }
          nextInputs[`${student.id}:${key}`] = String(scoringType === "check_count" ? evaluation.checkCount ?? "" : evaluation.points ?? "");
        });
    });

    setAssessments(Array.from(uniqueAssessments.values()));
    setGradeInputs(nextInputs);
  }, [activeClass, selectedBimester]);

  const updateAssessment = (id: string, field: keyof AssessmentItem, value: string) => {
    setAssessments((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        if (field === "scoringType") {
          const scoringType = value as ScoringType;
          return {
            ...item,
            scoringType,
            category: scoringType === "check_count" && !isCheckCategory(item.category) ? "Visto" : item.category,
            maxPoints: scoringType === "check_count" && item.maxPoints === 10 ? 2 : item.maxPoints,
            pointsPerCheck: scoringType === "check_count" && item.pointsPerCheck === 1 ? 0.25 : item.pointsPerCheck,
          };
        }

        return {
          ...item,
          [field]: field === "maxPoints" || field === "weight" || field === "pointsPerCheck" ? parseNumber(value, 0) : value,
        };
      }),
    );
  };

  const addAssessment = (category = "Atividade", scoringType?: ScoringType) => {
    setAssessments((current) => [...current, createAssessment(category, current.length + 1, scoringType)]);
  };

  const addCustomAssessment = () => {
    const category = customCategory.trim() || (customScoringType === "check_count" ? "Visto" : "Outro");
    addAssessment(category, customScoringType);
    setCustomCategory("");
  };

  const removeAssessment = (id: string) => {
    setAssessments((current) => current.filter((item) => item.id !== id));
    setGradeInputs((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.endsWith(`:${id}`)) delete next[key];
      });
      return next;
    });
  };

  const getFilledAssessments = (studentId: string) =>
    assessments
      .map((assessment) => {
        const raw = gradeInputs[`${studentId}:${assessment.id}`];
        const hasValue = raw !== undefined && raw !== "";
        return {
          assessment,
          raw,
          hasValue,
          value: calculateAssessmentPoints(assessment, raw),
        };
      })
      .filter((item) => item.hasValue);

  const calculateFinal = (studentId: string) => {
    const finalTarget = Math.max(parseNumber(targetGrade, 10), 0);
    const filledAssessments = getFilledAssessments(studentId);

    if (filledAssessments.length === 0) return 0;

    if (calculationMode === "sum") {
      const total = filledAssessments.reduce((sum, item) => sum + item.value, 0);
      return roundGrade(Math.min(total, finalTarget));
    }

    if (calculationMode === "weighted_average") {
      const totalWeight = filledAssessments.reduce(
        (sum, item) => sum + Math.max(item.assessment.weight || 0, 0),
        0,
      );
      if (totalWeight <= 0) return 0;
      const weightedPercent = filledAssessments.reduce((sum, item) => {
        const maxPoints = Math.max(item.assessment.maxPoints || finalTarget || 10, 0.01);
        const percent = item.value / maxPoints;
        return sum + percent * Math.max(item.assessment.weight || 0, 0);
      }, 0);
      return roundGrade((weightedPercent / totalWeight) * finalTarget);
    }

    const averagePercent =
      filledAssessments.reduce((sum, item) => {
        const maxPoints = Math.max(item.assessment.maxPoints || finalTarget || 10, 0.01);
        return sum + item.value / maxPoints;
      }, 0) / filledAssessments.length;

    return roundGrade(averagePercent * finalTarget);
  };

  const getRawTotal = (studentId: string) =>
    roundGrade(getFilledAssessments(studentId).reduce((sum, item) => sum + item.value, 0));

  const saveGrades = async () => {
    if (!user || !activeClass) return;
    if (assessments.length === 0) {
      setMessage("Adicione pelo menos uma avaliação para lançar notas.");
      return;
    }

    const validAssessments = assessments
      .map((item) => ({
        ...item,
        title: item.title.trim(),
        category: item.category.trim() || "Nota",
        maxPoints: Math.max(item.maxPoints || parseNumber(targetGrade, 10), 0.01),
        weight: Math.max(item.weight || 1, 0),
        pointsPerCheck: Math.max(item.pointsPerCheck || 0, 0),
      }))
      .filter((item) => item.title);

    if (validAssessments.length === 0) {
      setMessage("Informe o nome de pelo menos uma avaliação.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const now = new Date().toISOString();
      const finalTarget = parseNumber(targetGrade, 10);
      const nextClasses = classes.map((classItem) => {
        if (classItem.id !== activeClass.id) return classItem;

        return {
          ...classItem,
          students: classItem.students.map((student) => {
            const previousEvaluations = (student.evaluations || []).filter(
              (evaluation) => !(evaluation.source === SOURCE && evaluation.bimester === selectedBimester),
            );

            const newEvaluations: StudentEvaluation[] = validAssessments.flatMap((assessment) => {
              const raw = gradeInputs[`${student.id}:${assessment.id}`];
              if (raw === undefined || raw === "") return [];
              const points = calculateAssessmentPoints(assessment, raw);
              const checkCount = assessment.scoringType === "check_count" ? parseNumber(raw, 0) : undefined;

              return [
                {
                  id: createId(),
                  assessmentId: assessment.id,
                  method: assessment.title,
                  category: assessment.category,
                  points,
                  maxPoints: assessment.maxPoints,
                  weight: assessment.weight,
                  date: now,
                  bimester: selectedBimester,
                  notes:
                    assessment.scoringType === "check_count"
                      ? `Vistos lançados: ${formatGrade(checkCount || 0)}. Cada visto vale ${formatGrade(assessment.pointsPerCheck)} ponto(s). Cálculo: ${calculationMode}.`
                      : `Lançado no painel Notas+. Cálculo: ${calculationMode}.`,
                  source: SOURCE,
                  targetGrade: finalTarget,
                  calculationMode,
                  scoringType: assessment.scoringType,
                  checkCount,
                  pointsPerCheck: assessment.pointsPerCheck,
                },
              ];
            });

            const finalGrade = calculateFinal(student.id);
            const rawTotal = getRawTotal(student.id);
            const hasAnyGrade = newEvaluations.length > 0;

            const summaryEvaluation: StudentEvaluation | null = hasAnyGrade
              ? {
                  id: createId(),
                  method: `Fechamento - ${selectedBimester}`,
                  category: "Fechamento do Bimestre",
                  points: finalGrade,
                  maxPoints: finalTarget,
                  weight: 1,
                  date: now,
                  bimester: selectedBimester,
                  grade: String(finalGrade),
                  notes:
                    calculationMode === "sum"
                      ? `Nota final calculada pela soma de provas, atividades, trabalhos e vistos. Soma bruta: ${formatGrade(rawTotal)}. Limite do bimestre: ${formatGrade(finalTarget)}.`
                      : calculationMode === "weighted_average"
                        ? `Nota final calculada por média ponderada para o bimestre, incluindo vistos convertidos em pontos. Nota desejada: ${formatGrade(finalTarget)}.`
                        : `Nota final calculada por média simples para o bimestre, incluindo vistos convertidos em pontos. Nota desejada: ${formatGrade(finalTarget)}.`,
                  source: SOURCE,
                  targetGrade: finalTarget,
                  calculationMode,
                  isBimesterSummary: true,
                }
              : null;

            return {
              ...student,
              evaluations: summaryEvaluation
                ? [...previousEvaluations, ...newEvaluations, summaryEvaluation]
                : previousEvaluations,
            };
          }),
        };
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          classes: nextClasses,
          classesStr: JSON.stringify(nextClasses),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setClasses(nextClasses);
      setMessage("Notas, vistos e fechamento bimestral salvos. Os vistos foram convertidos em pontos e somados/médios conforme o cálculo escolhido.");
    } catch (error) {
      console.error("Erro ao salvar notas avançadas", error);
      setMessage("Não foi possível salvar as notas avançadas.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const calculationHelp =
    calculationMode === "sum"
      ? "Soma provas, atividades, trabalhos e vistos convertidos em pontos, limitando o resultado à nota desejada do bimestre."
      : calculationMode === "weighted_average"
        ? "Calcula a média considerando o peso de cada avaliação. Os vistos entram convertidos em pontos antes da média."
        : "Calcula a média simples das avaliações. Os vistos entram como uma avaliação convertida em pontos.";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-4 z-[80] rounded-full bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-2xl active:scale-95"
        title="Abrir notas avançadas"
      >
        Notas+
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Notas+</p>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Avaliações, vistos e fechamento bimestral</h2>
                <p className="text-xs text-slate-500">Some provas, atividades, trabalhos e vistos de caderno/atividade na média do bimestre.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Fechar
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              {loading ? (
                <div className="py-12 text-center text-sm font-bold text-slate-500">Carregando turmas...</div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
                      Turma
                      <select
                        value={selectedClassId}
                        onChange={(event) => setSelectedClassId(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold normal-case text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {classes.map((classItem) => (
                          <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
                      Bimestre
                      <select
                        value={selectedBimester}
                        onChange={(event) => setSelectedBimester(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold normal-case text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {BIMESTERS.map((bimester) => (
                          <option key={bimester} value={bimester}>{bimester}</option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
                      Forma de cálculo
                      <select
                        value={calculationMode}
                        onChange={(event) => setCalculationMode(event.target.value as CalculationMode)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold normal-case text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="sum">Somar avaliações e vistos</option>
                        <option value="simple_average">Média simples</option>
                        <option value="weighted_average">Média ponderada</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
                      Nota desejada do bimestre
                      <input
                        value={targetGrade}
                        onChange={(event) => setTargetGrade(event.target.value)}
                        inputMode="decimal"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold normal-case text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="10"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-3 text-xs font-bold leading-relaxed text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                    {calculationHelp}
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">Instrumentos de avaliação</h3>
                        <p className="text-xs text-slate-500">Crie provas, atividades e uma coluna de vistos. Em vistos, digite a quantidade de vistos do aluno.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_ASSESSMENTS.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => addAssessment(item.label, item.scoringType)}
                            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${item.scoringType === "check_count" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-primary/10 text-primary"}`}
                          >
                            + {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3 grid gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-900 sm:grid-cols-[1fr_0.8fr_auto]">
                      <input
                        value={customCategory}
                        onChange={(event) => setCustomCategory(event.target.value)}
                        placeholder="Criar outro meio: leitura, debate, ginástica, feira..."
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                      <select
                        value={customScoringType}
                        onChange={(event) => setCustomScoringType(event.target.value as ScoringType)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="numeric">Nota direta</option>
                        <option value="check_count">Quantidade de vistos</option>
                      </select>
                      <button
                        type="button"
                        onClick={addCustomAssessment}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black uppercase text-white dark:bg-white dark:text-slate-900"
                      >
                        + Criar meio
                      </button>
                    </div>

                    <div className="space-y-2">
                      {assessments.map((assessment) => (
                        <div key={assessment.id} className="grid gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-900 md:grid-cols-[1.4fr_0.9fr_0.85fr_0.65fr_0.65fr_0.75fr_auto]">
                          <input
                            value={assessment.title}
                            onChange={(event) => updateAssessment(assessment.id, "title", event.target.value)}
                            placeholder="Nome da avaliação"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                          <input
                            value={assessment.category}
                            onChange={(event) => updateAssessment(assessment.id, "category", event.target.value)}
                            placeholder="Tipo"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                          <select
                            value={assessment.scoringType}
                            onChange={(event) => updateAssessment(assessment.id, "scoringType", event.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          >
                            <option value="numeric">Nota</option>
                            <option value="check_count">Vistos</option>
                          </select>
                          <input
                            value={assessment.maxPoints}
                            onChange={(event) => updateAssessment(assessment.id, "maxPoints", event.target.value)}
                            inputMode="decimal"
                            title="Valor máximo desta avaliação"
                            placeholder="Máx."
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                          <input
                            value={assessment.weight}
                            onChange={(event) => updateAssessment(assessment.id, "weight", event.target.value)}
                            inputMode="decimal"
                            title="Peso para média ponderada"
                            placeholder="Peso"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                          <input
                            value={assessment.pointsPerCheck}
                            onChange={(event) => updateAssessment(assessment.id, "pointsPerCheck", event.target.value)}
                            inputMode="decimal"
                            disabled={assessment.scoringType !== "check_count"}
                            title="Quanto vale cada visto"
                            placeholder="Valor/visto"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeAssessment(assessment.id)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600 dark:bg-red-950/30"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-900">
                        <tr>
                          <th className="sticky left-0 z-10 bg-slate-100 p-3 dark:bg-slate-900">Aluno</th>
                          {assessments.map((assessment) => (
                            <th key={assessment.id} className="min-w-36 p-3 text-center">
                              <span className="block text-slate-700 dark:text-slate-200">{assessment.title || "Avaliação"}</span>
                              <span className="block text-[10px] normal-case text-slate-400">
                                {assessment.scoringType === "check_count"
                                  ? `${formatGrade(assessment.pointsPerCheck)} por visto | limite ${formatGrade(assessment.maxPoints)}`
                                  : `máx. ${formatGrade(assessment.maxPoints)} | peso ${formatGrade(assessment.weight)}`}
                              </span>
                            </th>
                          ))}
                          <th className="min-w-28 p-3 text-center text-primary">Soma</th>
                          <th className="min-w-28 p-3 text-center text-primary">Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="sticky left-0 z-10 bg-white p-3 font-bold text-slate-800 dark:bg-slate-950 dark:text-white">{student.name}</td>
                            {assessments.map((assessment) => {
                              const raw = gradeInputs[`${student.id}:${assessment.id}`] || "";
                              const converted = calculateAssessmentPoints(assessment, raw);
                              return (
                                <td key={assessment.id} className="p-2 text-center">
                                  <input
                                    value={raw}
                                    onChange={(event) =>
                                      setGradeInputs((current) => ({
                                        ...current,
                                        [`${student.id}:${assessment.id}`]: event.target.value,
                                      }))
                                    }
                                    inputMode="decimal"
                                    placeholder={assessment.scoringType === "check_count" ? "vistos" : "0"}
                                    className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center font-mono font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                  />
                                  {assessment.scoringType === "check_count" && raw !== "" && (
                                    <div className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                                      = {formatGrade(converted)} pts
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-3 text-center font-mono text-sm font-black text-slate-500">{formatGrade(getRawTotal(student.id))}</td>
                            <td className="p-3 text-center font-mono text-lg font-black text-primary">{formatGrade(calculateFinal(student.id))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {students.length === 0 && (
                      <div className="p-8 text-center text-sm font-bold text-slate-500">Nenhum aluno encontrado nesta turma.</div>
                    )}
                  </div>

                  {message && (
                    <div className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">{message}</div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={saveGrades}
                disabled={saving || loading || !activeClass}
                className="w-full rounded-xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar notas, vistos e fechamento do bimestre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
