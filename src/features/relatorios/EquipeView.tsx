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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#f1ede4]">Equipe de TI</h1>

      <div className="bg-[#0e1218] border border-[#1f2633] overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2d3748] bg-[#090b0f] text-xs font-semibold text-[#949ba6]">
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">E-mail</th>
              <th className="py-3 px-4">Perfil</th>
              <th className="py-3 px-4">Último Acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2633]">
            {usuarios?.map((u) => (
              <tr key={u.id} className="hover:bg-[#141922] transition-colors">
                <td className="py-3.5 px-4 font-semibold text-[#f1ede4]">{u.name}</td>
                <td className="py-3.5 px-4 text-xs text-[#949ba6]">{u.email}</td>
                <td className="py-3.5 px-4">
                  <span className="inline-block px-2.5 py-0.5 border border-[#d4a359]/40 bg-[#d4a359]/10 text-xs font-medium text-[#d4a359]">
                    {u.role_label}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-[#949ba6]">
                  {formatarData(u.ultimo_login_em)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
