import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import type { PaginatedResponse, Usuario } from '../../types/estoque';

export function EquipeView() {
  const { data: usuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await api.get<PaginatedResponse<Usuario>>('/usuarios')).data.data,
  });

  return (
    <div className="bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 bg-sky-400 text-slate-950 font-bold">
        Membros da Equipe de TI com acesso ao sistema
      </div>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500">
            <th className="py-3 px-4">Nome</th>
            <th className="py-3 px-4">E-mail</th>
            <th className="py-3 px-4">Função</th>
            <th className="py-3 px-4">Último Acesso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {usuarios?.map((u) => (
            <tr key={u.id}>
              <td className="py-3 px-4 font-semibold">{u.name}</td>
              <td className="py-3 px-4">{u.email}</td>
              <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">{u.role_label}</td>
              <td className="py-3 px-4 text-xs text-slate-500">{formatarData(u.ultimo_login_em)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
