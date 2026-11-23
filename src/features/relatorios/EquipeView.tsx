import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import type { PaginatedResponse, Role, Usuario } from '../../types/estoque';

export function EquipeView({ currentUserId }: { currentUserId?: number }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('operador');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [msgReset, setMsgReset] = useState<{ id: number; texto: string; ok: boolean } | null>(null);

  // Modal de Edição de Usuário
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Role>('operador');
  const [editPassword, setEditPassword] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');

  // Modal de Confirmação Ativo / Inativo
  const [usuarioConfirmandoStatus, setUsuarioConfirmandoStatus] = useState<Usuario | null>(null);

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await api.get<PaginatedResponse<Usuario>>('/usuarios?per_page=100')).data.data,
  });

  const { data: logsAcesso } = useQuery({
    queryKey: ['logs-acesso'],
    queryFn: async () =>
      (
        await api.get<
          PaginatedResponse<{
            id: number;
            evento: 'login' | 'login_falhou' | 'logout' | 'acesso_negado';
            email?: string | null;
            rota?: string | null;
            ip?: string | null;
            user?: { id: number; name: string } | null;
            created_at: string;
          }>
        >('/logs-acesso?per_page=30')
      ).data.data,
  });

  const atualizarConta = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<{ name: string; email: string; password: string; role: Role; ativo: boolean }>;
    }) => {
      await api.put(`/usuarios/${id}`, payload);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      setUsuarioConfirmandoStatus(null);
      setMsgReset({ id, texto: 'Atualizado.', ok: true });
    },
    onError: (err: any, { id }) => {
      setUsuarioConfirmandoStatus(null);
      const errors = err?.response?.data?.errors;
      const firstError = errors ? (Object.values(errors).flat()[0] as string) : null;
      setMsgReset({
        id,
        texto: firstError || err?.response?.data?.message || 'Erro ao atualizar.',
        ok: false,
      });
    },
  });

  const salvarEdicaoUsuario = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      if (!usuarioEditando) return;
      const payload: Record<string, any> = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
      };
      if (editPassword.trim() !== '') {
        payload.password = editPassword;
      }
      await api.put(`/usuarios/${usuarioEditando.id}`, payload);
    },
    onSuccess: () => {
      const id = usuarioEditando?.id ?? 0;
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      setUsuarioEditando(null);
      setEditPassword('');
      setErroEdicao('');
      setMsgReset({ id, texto: 'Dados salvos.', ok: true });
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? (Object.values(errors).flat()[0] as string) : null;
      setErroEdicao(firstError || err?.response?.data?.message || 'Erro ao salvar alterações.');
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

  const abrirModalEdicao = (u: Usuario) => {
    setUsuarioEditando(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword('');
    setErroEdicao('');
    setMsgReset(null);
  };

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
              placeholder="usuario@gruporiomais.com.br"
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
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2633]">
              {usuarios?.map((u) => {
                const ehProprio = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-[#141922] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#f1ede4]">
                      <span className={u.ativo ? '' : 'line-through text-[#5e6673]'}>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#949ba6]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Perfil de ${u.name}`}
                        disabled={ehProprio || atualizarConta.isPending}
                        value={u.role}
                        onChange={(e) =>
                          atualizarConta.mutate({ id: u.id, payload: { role: e.target.value as Role } })
                        }
                        className="border border-[#d4a359]/40 bg-[#d4a359]/10 px-2 py-1 text-xs font-medium text-[#d4a359] focus:outline-none focus:border-[#d4a359] disabled:opacity-60"
                      >
                        <option value="operador" className="bg-[#090b0f] text-[#f1ede4]">
                          Operador de TI
                        </option>
                        <option value="gestor" className="bg-[#090b0f] text-[#f1ede4]">
                          Gestor de TI
                        </option>
                        <option value="admin" className="bg-[#090b0f] text-[#f1ede4]">
                          Admin TI
                        </option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        disabled={ehProprio || atualizarConta.isPending}
                        onClick={() => setUsuarioConfirmandoStatus(u)}
                        className={`px-2.5 py-0.5 border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          u.ativo
                            ? 'border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399] hover:border-[#f87171] hover:text-[#f87171]'
                            : 'border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171] hover:border-[#34d399] hover:text-[#34d399]'
                        }`}
                      >
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#949ba6]">
                      {formatarData(u.ultimo_login_em)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {msgReset?.id === u.id && (
                          <span className={`text-xs ${msgReset.ok ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                            {msgReset.texto}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => abrirModalEdicao(u)}
                          className="px-2.5 py-1 border border-[#2d3748] bg-[#090b0f] hover:border-[#d4a359] hover:text-[#d4a359] text-xs text-[#f1ede4] transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs de Segurança e Acesso */}
      <div className="bg-[#0e1218] border border-[#1f2633] overflow-x-auto">
        <div className="px-5 py-4 border-b border-[#1f2633] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#f1ede4]">Logs Recentes de Segurança e Acesso</h2>
          <span className="text-xs text-[#949ba6]">{logsAcesso?.length ?? 0} registros</span>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2d3748] bg-[#090b0f] text-xs font-semibold text-[#949ba6]">
              <th className="py-3 px-4">Data / Hora</th>
              <th className="py-3 px-4">Evento</th>
              <th className="py-3 px-4">Usuário / E-mail</th>
              <th className="py-3 px-4">Rota</th>
              <th className="py-3 px-4">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2633]">
            {logsAcesso?.map((log) => {
              const badge = {
                login: 'border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]',
                logout: 'border-[#2d3748] bg-[#141922] text-[#949ba6]',
                login_falhou: 'border-[#e5a93c]/40 bg-[#e5a93c]/10 text-[#e5a93c]',
                acesso_negado: 'border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171]',
              }[log.evento];
              return (
                <tr key={log.id} className="hover:bg-[#141922] transition-colors">
                  <td className="py-3 px-4 text-xs text-[#949ba6] whitespace-nowrap">
                    {formatarData(log.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 border text-xs font-medium ${badge}`}>
                      {log.evento}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#f1ede4]">
                    {log.user?.name || log.email || '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#949ba6] font-mono">
                    {log.rota || '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#949ba6] font-mono">
                    {log.ip || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Editar Usuário da Equipe */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 bg-[#090b0f]/85 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => salvarEdicaoUsuario.mutate(e)}
            className="bg-[#0e1218] max-w-md w-full p-6 border border-[#2d3748] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-3">
              <h3 className="text-lg font-bold text-[#f1ede4]">
                Editar Usuário da Equipe
              </h3>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="px-2 py-0.5 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Nome completo</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">E-mail</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Perfil de Acesso</label>
              <select
                value={editRole}
                disabled={usuarioEditando.id === currentUserId}
                onChange={(e) => setEditRole(e.target.value as Role)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359] disabled:opacity-60"
              >
                <option value="operador">Operador de Suporte</option>
                <option value="gestor">Gestor de TI</option>
                <option value="admin">Administrador</option>
              </select>
              {usuarioEditando.id === currentUserId && (
                <p className="text-[11px] text-[#5e6673] mt-1">
                  O seu próprio perfil de Administrador não pode ser rebaixado.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">
                Nova senha <span className="text-[#5e6673]">(opcional — deixe em branco para manter a atual)</span>
              </label>
              <input
                type="password"
                minLength={8}
                placeholder="Mínimo de 8 caracteres"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            {erroEdicao && (
              <div className="border-l-2 border-[#f87171] bg-[#f87171]/10 px-3 py-2 text-xs text-[#f87171]">
                {erroEdicao}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="px-4 py-2 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvarEdicaoUsuario.isPending}
                className="px-5 py-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {salvarEdicaoUsuario.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Confirmação para Ativar / Desativar Usuário */}
      {usuarioConfirmandoStatus && (
        <div className="fixed inset-0 z-50 bg-[#090b0f]/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e1218] max-w-md w-full p-6 border border-[#2d3748] space-y-4">
            <h3 className="text-lg font-bold text-[#f1ede4] border-b border-[#1f2633] pb-3">
              {usuarioConfirmandoStatus.ativo
                ? 'Confirmar Desativação de Usuário'
                : 'Confirmar Reativação de Usuário'}
            </h3>

            <p className="text-sm text-[#949ba6] leading-relaxed">
              {usuarioConfirmandoStatus.ativo ? (
                <>
                  Tem certeza que deseja <strong className="text-[#f87171]">desativar</strong> a conta de{' '}
                  <strong className="text-[#f1ede4]">{usuarioConfirmandoStatus.name}</strong> (
                  {usuarioConfirmandoStatus.email})?
                  <br />
                  <span className="block mt-2 text-xs text-[#5e6673]">
                    O usuário terá a sessão encerrada imediatamente e não poderá acessar o sistema até ser reativado.
                  </span>
                </>
              ) : (
                <>
                  Tem certeza que deseja <strong className="text-[#34d399]">reativar</strong> o acesso de{' '}
                  <strong className="text-[#f1ede4]">{usuarioConfirmandoStatus.name}</strong> (
                  {usuarioConfirmandoStatus.email}) ao sistema?
                </>
              )}
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#1f2633]">
              <button
                type="button"
                disabled={atualizarConta.isPending}
                onClick={() => setUsuarioConfirmandoStatus(null)}
                className="px-4 py-2 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={atualizarConta.isPending}
                onClick={() =>
                  atualizarConta.mutate({
                    id: usuarioConfirmandoStatus.id,
                    payload: { ativo: !usuarioConfirmandoStatus.ativo },
                  })
                }
                className={`px-5 py-2 font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50 ${
                  usuarioConfirmandoStatus.ativo
                    ? 'bg-[#f87171] hover:bg-[#ef4444] text-[#090b0f]'
                    : 'bg-[#34d399] hover:bg-[#10b981] text-[#090b0f]'
                }`}
              >
                {atualizarConta.isPending
                  ? 'Processando...'
                  : usuarioConfirmandoStatus.ativo
                    ? 'Sim, Desativar'
                    : 'Sim, Reativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
