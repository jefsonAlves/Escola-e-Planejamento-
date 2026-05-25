import React from "react";
import { Student } from "../../types";
import { GraduationCap, Calendar, Clock, AlertCircle, FileText, ChevronRight } from "lucide-react";

interface Props {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const GuardianPortalScreen: React.FC<Props> = ({ students, onSelectStudent }) => {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mt-6">
        <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2 text-center">Nenhum aluno vinculado</h3>
        <p className="text-sm text-slate-500 text-center max-w-md">
          Você ainda não possui filhos vinculados ou a escola ainda não aprovou seu acesso.
          Entre em contato com a secretaria da escola.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          Meu Portal
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Acompanhe a vida acadêmica dos seus filhos.
        </p>
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => onSelectStudent(student)}
            className="w-full text-left bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-center z-10 relative">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xl uppercase">
                     {student.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                    <GraduationCap className="w-3.5 h-3.5" /> 
                    Turma não especificada
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Stats Banner inside the card */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
               <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> Presença</p>
                 <span className="text-sm font-black text-emerald-600">--%</span>
               </div>
               <div className="text-center border-l border-r border-slate-100 dark:border-slate-700/50">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-center gap-1"><FileText className="w-3 h-3"/> Média</p>
                 <span className="text-sm font-black text-blue-600">--</span>
               </div>
               <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3"/> Alertas</p>
                 <span className="text-sm font-black text-amber-500">0</span>
               </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
