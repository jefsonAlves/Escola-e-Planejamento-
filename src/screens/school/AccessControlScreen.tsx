import React, { useState, useEffect } from "react";
import { School, SchoolMember, Permission } from "../../types";
import { Users, Shield, UserX, CheckCircle, Clock, Trash2, Settings } from "lucide-react";
import { getSchoolMembers } from "../../services/schoolService";
import { db } from "../../lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

interface Props {
  school: School | null;
  onShowNotification: (msg: string, type: "info" | "critical") => void;
}

export const AccessControlScreen: React.FC<Props> = ({ school, onShowNotification }) => {
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPermissions, setEditingPermissions] = useState<SchoolMember | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!school) return;
      setLoading(true);
      try {
        const data = await getSchoolMembers(school.id);
        setMembers(data);
      } catch (e) {
        console.error("Failed to fetch members", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [school]);

  const handleUpdateStatus = async (memberId: string, status: "approved" | "blocked" | "pending") => {
    if (!school) return;
    try {
      const docRef = doc(db, `schools/${school.id}/members`, memberId);
      await updateDoc(docRef, { status });
      setMembers(members.map(m => m.id === memberId ? { ...m, status } : m));
      onShowNotification(`Status atualizado para ${status}`, "info");
    } catch (e) {
      console.error(e);
      onShowNotification("Erro ao atualizar status", "critical");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
     if (!school || !window.confirm("Remover este membro da instituição?")) return;
     try {
       const docRef = doc(db, `schools/${school.id}/members`, memberId);
       await deleteDoc(docRef);
       setMembers(members.filter(m => m.id !== memberId));
       onShowNotification("Membro removido", "info");
     } catch (e) {
       console.error(e);
       onShowNotification("Erro ao remover membro", "critical");
     }
  };

  const updatePermissions = async (memberUserId: string, newPermissions: Record<Permission, boolean>) => {
    if (!school) return;
    try {
        const docRef = doc(db, `schools/${school.id}/members`, memberUserId);
        await updateDoc(docRef, { permissions: newPermissions });
        setMembers(members.map(m => m.id === memberUserId ? { ...m, permissions: newPermissions } : m));
        onShowNotification("Permissões atualizadas!", "info");
        setEditingPermissions(null);
    } catch (e) {
        console.error(e);
        onShowNotification("Erro ao atualizar permissões", "critical");
    }
  };

  if (!school) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Shield className="w-6 h-6" /> Controle de Acessos
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Gerencie acesso e permissões na escola "{school.name}".
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-bold">Carregando usuários...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Função</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                       <div className="flex items-center gap-3">
                         {member.photoUrl ? (
                            <img src={member.photoUrl} alt="" className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{member.name}</p>
                            <p className="text-[11px] text-slate-500">{member.email}</p>
                            {member.subject && <p className="text-[10px] text-primary/80 font-bold mt-0.5">{member.subject}</p>}
                          </div>
                       </div>
                    </td>
                    <td className="p-4 text-center">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                         {member.role}
                       </span>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          member.status === 'approved' ? 'text-emerald-600 bg-emerald-100' : 
                          member.status === 'blocked' ? 'text-red-600 bg-red-100' : 
                          'text-amber-600 bg-amber-100'
                        }`}>
                          {member.status === 'approved' ? <><CheckCircle className="w-3 h-3"/> Aprovado</> : 
                           member.status === 'blocked' ? <><UserX className="w-3 h-3"/> Bloqueado</> : 
                           <><Clock className="w-3 h-3"/> Pendente</>}
                        </span>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setEditingPermissions(member)} className="text-secondary hover:bg-slate-100 p-2 rounded-xl transition-colors" title="Permissões">
                             <Settings className="w-4 h-4"/>
                          </button>
                          {member.status !== "approved" && (
                            <button onClick={() => handleUpdateStatus(member.id, "approved")} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-colors" title="Aprovar">
                              <CheckCircle className="w-4 h-4"/>
                            </button>
                          )}
                          {member.status !== "blocked" && (
                            <button onClick={() => handleUpdateStatus(member.id, "blocked")} className="text-amber-500 hover:bg-amber-50 p-2 rounded-xl transition-colors" title="Bloquear">
                              <UserX className="w-4 h-4"/>
                            </button>
                          )}
                          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                          <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors" title="Remover">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                   <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-500 font-medium">Nenhum membro vinculado ainda.</td>
                   </tr>
                )}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {editingPermissions && (
        <PermissionsModal
          member={editingPermissions}
          onClose={() => setEditingPermissions(null)}
          onSave={(permissions) => updatePermissions(editingPermissions.id, permissions)}
        />
      )}
    </div>
  );
};

const PermissionsModal: React.FC<{ member: SchoolMember, onClose: () => void, onSave: (p: Record<Permission, boolean>) => void }> = ({ member, onClose, onSave }) => {
    const [perms, setPerms] = useState<Record<Permission, boolean>>(member.permissions || {
        attendance: false,
        grading: false,
        occurrences: false,
        access_control: false,
        settings: false
    });

    const toggle = (p: Permission) => setPerms(prev => ({ ...prev, [p]: !prev[p] }));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Permissões de {member.name}</h3>
                <div className="space-y-3">
                    {(["attendance", "grading", "occurrences", "access_control", "settings"] as Permission[]).map(p => (
                        <label key={p} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={perms[p]} onChange={() => toggle(p)} className="accent-primary w-5 h-5"/>
                            <span className="capitalize">{p.replace('_', ' ')}</span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                    <button onClick={() => onSave(perms)} className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-bold">Salvar</button>
                </div>
            </div>
        </div>
    )
}
