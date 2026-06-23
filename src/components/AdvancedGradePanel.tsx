import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type CalculationMode = "sum" | "simple_average" | "weighted_average";

type StudentEvaluation = {
  id: string;
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
  calculationMode?: CalculationMode;
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
};

const SOURCE = "advanced-grade-panel";
const BIMESTERS = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
const DEFAULT_ASSESSMENTS: AssessmentItem[] = [
  { id: "prova-1", title: "Prova 1", category: "Prova", maxPoints: 10, weight: 1 },
  { id: "atividade-1", title: "Atividade 1", category: "Atividade", maxPoints: 10, weight: 1 },
];

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const parseNumber = (value: string | number | undefined, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (!value) return fallback;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundGrade = (value: number) => Math.round(value * 100) / 100;

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
  const [assessments, setAssessments] = useState<AssessmentItem[]>(DEFAULT_ASSESSMENTS);
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
        const data = snap.exists() ? snap.data() : {};
        const loadedClasses = safeParseClasses(data.classes) || safeParseClasses(data.classesStr);
        setClasses(loadedClasses);
        setSelectedClassId((current) => current || loadedClasses[0]?.id || "");
        if (loadedClasses.length === 0) {
          setMessage("Nenhuma turma encontrada. Cadastre turmas e alunos antes de usar as notas avançadas.");
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
      setAssessments(DEFAULT_ASSESSMENTS.map((item) => ({ ...item, id: createId() })));
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
          const key = `${evaluation.method}-${evaluation.category || "Nota"}`;
          if (!uniqueAssessments.has(key)) {
            uniqueAssessments.set(key, {
              id: key,
              title: evaluation.method,
              category: evaluation.category || "Nota",
              maxPoints: evaluation.maxPoints || 10,
              weight: evaluation.weight || 1,
            });
          }
          nextInputs[`${student.id}:${key}`] = String(evaluation.points ?? "");
        });
    });

    setAssessments(Array.from(uniqueAssessments.values()));
    setGradeInputs(nextInputs);
  }, [activeClass?.id, selectedBimester]);

  const updateAssessment = (id: string, field: keyof AssessmentItem, value: string) => {
    setAssessments((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "maxPoints" || field === "weight" ? parseNumber(value, 0) : value,
            }
          : item,
      ),
    );
  };

  const addAssessment = (category = "Atividade") => {
    setAssessments((current) => [
      ...current,
      {
        id: createId(),
        title: `${category} ${current.length + 1}`,
        category,
        maxPoints: 10,
        weight: 1,
      },
    ]);
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

  const calculateFinal = (studentId: string) => {
    const finalTarget = Math.max(parseNumber(targetGrade, 10), 0);
    const filledAssessments = assessments
      .map((assessment) => {
        const raw = gradeInputs[`${studentId}:${assessment.id}`];
        const hasValue = raw !== undefined && raw !== "";
        return {
          assessment,
          hasValue,
          value: parseNumber(raw, 0),
        };
      })
      .filter((item) => item.hasValue);

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

  const saveGrades = async () => {
    if (!user || !activeClass) return;
    if (assessments.length === 0) {
      setMessage("Adicione pelo menos uma avaliação para lançar notas.");
      return;
    }

    const validAssessments = assessments.filter((item) => item.title.trim());
    if (validAssessments.length === 0) {
      setMessage("Informe o nome de pelo menos uma avaliação.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const now = new Date().toISOString();
      const nextClasses = classes.map((classItem) => {
        if (classItem.id !== activeClass.id) return classItem;

        return {
          ...classItem,
          students: classItem.students.map((student) => {
            const previousEvaluations = (student.evaluations || []).filter(
              (evaluation) =>
                !(evaluation.source === SOURCE && evaluation.bimester === selectedBimester),
            );

            const newEvaluations: StudentEvaluation[] = validAssessments.flatMap((assessment) => {
              const raw = gradeInputs[`${student.id}:${assessment.id}`];
              if (raw === undefined || raw === "") return [];
              const points = parseNumber(raw, 0);
              return [
                {
                  id: createId(),
                  method: assessment.title.trim(),
                  category: assessment.category.trim() || "Nota",
                  points,
                  maxPoints: assessment.maxPoints || parseNumber(targetGrade, 10),
                  weight: assessment.weight || 1,
                  date: now,
                  bimester: selectedBimester,
                  notes: `Lançado no painel avançado. Cálculo: ${calculationMode}.`,
                  source: SOURCE,
                  calculationMode,
                },
              ];
            });

            const finalGrade = calculateFinal(student.id);
            const hasAnyGrade = newEvaluations.length > 0;

            const summaryEvaluation: StudentEvaluation | null = hasAnyGrade
              ? {
                  id: createId(),
                  method: `Fechamento - ${selectedBimester}`,
                  category: "Fechamento do Bimestre",
                  points: finalGrade,
                  maxPoints: parseNumber(targetGrade, 10),
                  weight: 1,
                  date: now,
                  bimester: selectedBimester,
                  grade: String(finalGrade),
                  notes:
                    calculationMode === "sum"
                      ? "Nota final calculada pela soma das avaliações, limitada à nota desejada do bimestre."
                      : calculationMode === "weighted_average"
                        ? "Nota final calculada por média ponderada."
                        : "Nota final calculada por média simples.",
                  source: SOURCE,
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
      setMessage("Notas avançadas e fechamento do bimestre salvos com sucesso. Recarregue a tela se o painel antigo ainda não refletir as mudanças.");
    } catch (error) {
      console.error("Erro ao salvar notas avançadas", error);
      setMessage("Não foi possível salvar as notas avançadas.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

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
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Notas Avançadas</p>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Avaliações e fechamento bimestral</h2>
                <p className="text-xs text-slate-500">Crie várias notas, some provas e atividades ou gere média ponderada do bimestre.</p>
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
                      Cálculo
                      <select
                        value={calculationMode}
                        onChange={(event) => setCalculationMode(event.target.value as CalculationMode)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold normal-case text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="sum">Somar avaliações</option>
                        <option value="simple_average">Média simples</option>
                        <option value="weighted_average">Média ponderada</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
                      Nota desejada
                      <input
                        value={targetGrade}
                        onChange={(event) => setTargetGrade(event.target.value)}
                        inputMode="decimal"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold normal-case text-slate-800 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="10"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white">Avaliações do bimestre</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Prova', 'Atividade', 'Trabalho', 'Participação'].map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => addAssessment(category)}
                            className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase text-primary"
                          >
                            + {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {assessments.map((assessment) => (
                        <div key={assessment.id} className="grid gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-900 md:grid-cols-[1.5fr_1fr_0.7fr_0.7fr_auto]">
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
                          <input
                            value={assessment.maxPoints}
                            onChange={(event) => updateAssessment(assessment.id, "maxPoints", event.target.value)}
                            inputMode="decimal"
                            title="Valor máximo desta avaliação"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                          <input
                            value={assessment.weight}
                            onChange={(event) => updateAssessment(assessment.id, "weight", event.target.value)}
                            inputMode="decimal"
                            title="Peso para média ponderada"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                            <th key={assessment.id} className="min-w-28 p-3 text-center">{assessment.title || 'Avaliação'}</th>
                          ))}
                          <th className="min-w-28 p-3 text-center text-primary">Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="sticky left-0 z-10 bg-white p-3 font-bold text-slate-800 dark:bg-slate-950 dark:text-white">{student.name}</td>
                            {assessments.map((assessment) => (
                              <td key={assessment.id} className="p-2 text-center">
                                <input
                                  value={gradeInputs[`${student.id}:${assessment.id}`] || ""}
                                  onChange={(event) =>
                                    setGradeInputs((current) => ({
                                      ...current,
                                      [`${student.id}:${assessment.id}`]: event.target.value,
                                    }))
                                  }
                                  inputMode="decimal"
                                  placeholder="0"
                                  className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center font-mono font-bold outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                              </td>
                            ))}
                            <td className="p-3 text-center text-base font-black text-primary">{calculateFinal(student.id)}</td>
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
                {saving ? "Salvando..." : "Salvar notas e fechamento do bimestre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
