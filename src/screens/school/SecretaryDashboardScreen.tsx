import React from "react";
import { School } from "../../types";
import { UserPlus, Calendar, Mail, FileText, CheckCircle, Clock } from "lucide-react";

export const SecretaryDashboardScreen: React.FC<{
  school: School | null;
  onNavigate: (screen: string) => void;
}> = ({ school, onNavigate }) => {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            Secretaria
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Gerencie matrículas, vinculações e solicitações.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => onNavigate("classes")} className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Matricular Aluno</p>
        </button>

        <button className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center relative">
            <CheckCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
               0
            </div>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Aprovar Vínculos</p>
        </button>

        <button className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95">
           <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Gerar Convites</p>
        </button>

        <button className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Relatórios</p>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Reuniões Solicitadas</h3>
        <div className="flex flex-col items-center justify-center py-6">
           <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
           <p className="text-sm text-slate-500 font-medium">Nenhuma reunião pendente de confirmação.</p>
        </div>
      </div>
    </div>
  );
};
