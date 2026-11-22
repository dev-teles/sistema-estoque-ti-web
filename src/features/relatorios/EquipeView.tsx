import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import type { PaginatedResponse, Role, Usuario } from '../../types/estoque';

export function EquipeView() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('operador');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [msgReset, setMsgReset] = useState<{ id: number; texto: string; ok: boolean } | null>(null);

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await api.get<PaginatedResponse<Usuario>>('/usuarios?per_page=100')).data.data,
  });

  const redefinirSenha = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      await api.put(`/usuarios/${id}`, { password });
    },
    onSuccess: (_, { id }) => {
      setEditandoId(null);
      setNovaSenha('');
      setMsgReset({ id, texto: 'Senha atualizada.', ok: true });
    },
    onError: (err: any, { id }) => {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? (Object.values(errors).flat()[0] as string) : null;
      setMsgReset({ id, texto: firstError || 'Erro ao redefinir (mín. 8 caracteres).', ok: false });
    },
  });

  const criarUsuario = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      await api.post('/usuarios', { name, email, password, role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      setName('');
      setEmail('');
      setPassword('');
      setRole('operador');
      setErro('');
      setSucesso('Conta criada com sucesso.');
    },
    onError: (err: any) => {
      setSucesso('');
      const errors = err?.response?.data?.errors;
      const firstError = errors ? (Object.values(errors).flat()[0] as string) : null;
      setErro(firstError || err?.response?.data?.message || 'Erro ao criar conta.');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#f1ede4]">Equipe de TI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={(e) => criarUsuario.mutate(e)}
          className="lg:col-span-4 bg-[#0e1218] p-6 border border-[#1f2633] space-y-4 h-fit"
        >
          <h2 className="text-lg font-bold text-[#f1ede4] border-b border-[#1f2633] pb-3">
            Novo Funcionário
          </h2>

          <div>
            <label className="block text-xs text-[#949ba6] mb-1">Nome completo</label>
            <input
              type="text"
              required
              placeholder="Ex: Lucas Martins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#949ba6] mb-1">E-mail</label>
            <input
              type="email"
              required
              placeholder="lucas.ti@estoque.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#949ba6] mb-1">Senha (mín. 8 caracteres)</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#949ba6] mb-1">Perfil de Acesso</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            >
              <option value="operador">Operador de Suporte</option>
              <option value="gestor">Gestor de TI</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {erro && (
            <div className="border-l-2 border-[#f87171] bg-[#f87171]/10 px-3 py-2 text-xs text-[#f87171]">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="border-l-2 border-[#34d399] bg-[#34d399]/10 px-3 py-2 text-xs text-[#34d399]">
              {sucesso}
            </div>
          )}

          <button
            type="submit"
            disabled={criarUsuario.isPending}
            className="w-full py-2.5 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            {criarUsuario.isPending ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>

        <div className="lg:col-span-8 bg-[#0e1218] border border-[#1f2633] overflow-x-auto h-fit">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#2d3748] bg-[#090b0f] text-xs font-semibold text-[#949ba6]">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Senha</th>
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
                  <td className="py-3.5 px-4 text-right">
                    {editandoId === u.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          redefinirSenha.mutate({ id: u.id, password: novaSenha });
                        }}
                        className="flex items-center justify-end gap-1.5"
                      >
                        <input
                          type="password"
                          required
                          minLength={8}
                          placeholder="Nova senha (mín. 8)"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          className="w-40 border border-[#2d3748] bg-[#090b0f] px-2.5 py-1 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                        />
                        <button
                          type="submit"
                          disabled={redefinirSenha.isPending}
                          className="px-2.5 py-1 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoId(null);
                            setNovaSenha('');
                          }}
                          className="px-2 py-1 border border-[#2d3748] bg-[#090b0f] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {msgReset?.id === u.id && (
                          <span className={`text-xs ${msgReset.ok ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                            {msgReset.texto}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoId(u.id);
                            setNovaSenha('');
                            setMsgReset(null);
                          }}
                          className="px-2.5 py-1 border border-[#2d3748] bg-[#090b0f] hover:border-[#d4a359] hover:text-[#d4a359] text-xs text-[#949ba6] transition-colors cursor-pointer"
                        >
                          Redefinir senha
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
