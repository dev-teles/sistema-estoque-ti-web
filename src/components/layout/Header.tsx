import { useState } from 'react';
import { api } from '../../services/api';
import type { Usuario } from '../../types/estoque';
import type { Aba } from '../../types/navigation';

interface HeaderProps {
  user: Usuario;
  aba: Aba;
  onSelectAba: (aba: Aba) => void;
  onLogout: () => void;
}

export function Header({
  user,
  aba,
  onSelectAba,
  onLogout,
}: HeaderProps) {
  const ehAdmin = user.role === 'admin';
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      await api.post('/auth/change-password', {
        current_password: senhaAtual,
        password: novaSenha,
      });
      setSenhaAtual('');
      setNovaSenha('');
      setSucesso('Senha alterada com sucesso.');
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? (Object.values(errors).flat()[0] as string) : null;
      setErro(firstError || err?.response?.data?.message || 'Erro ao alterar senha.');
    } finally {
      setSalvando(false);
    }
  };

  const abas: { id: Aba; label: string; visivel: boolean }[] = [
    { id: 'inicio', label: 'Início', visivel: true },
    { id: 'estoque', label: 'Estoque e Itens', visivel: true },
    { id: 'reservas', label: 'Retiradas', visivel: true },
    { id: 'historico', label: 'Histórico', visivel: true },
    { id: 'equipe', label: 'Equipe de TI', visivel: ehAdmin },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#090b0f]/95 backdrop-blur-md border-b border-[#1f2633]">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => onSelectAba('inicio')}
          className="flex items-center shrink-0 cursor-pointer group"
        >
          <img
            src="/logo.png"
            alt="Estoque T.I."
            className="h-10 sm:h-11 w-auto object-contain transition-opacity group-hover:opacity-85"
          />
        </button>

        <nav className="flex items-center h-full overflow-x-auto no-scrollbar border-x border-[#1f2633]/60 px-2 sm:px-4">
          {abas
            .filter((a) => a.visivel)
            .map((item) => {
              const ativo = aba === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectAba(item.id)}
                  className={`relative h-20 px-4 sm:px-5 flex items-center text-sm whitespace-nowrap transition-colors cursor-pointer ${
                    ativo
                      ? 'text-[#f1ede4] font-semibold'
                      : 'text-[#949ba6] hover:text-[#f1ede4]'
                  }`}
                >
                  <span>{item.label}</span>
                  {ativo && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4a359]" />
                  )}
                </button>
              );
            })}
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-[#f1ede4] leading-tight">
              {user.name}
            </p>
            <p className="text-[11px] text-[#d4a359] mt-0.5">
              {user.role_label}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setErro('');
              setSucesso('');
              setSenhaAtual('');
              setNovaSenha('');
              setModalSenha(true);
            }}
            className="px-3 py-2 border border-[#2d3748] bg-[#0e1218] hover:border-[#d4a359] hover:text-[#d4a359] text-xs font-medium text-[#949ba6] transition-colors cursor-pointer"
          >
            Senha
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 border border-[#2d3748] bg-[#0e1218] hover:border-[#f87171]/60 hover:text-[#f87171] text-xs font-medium text-[#949ba6] transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>

      {modalSenha && (
        <div className="fixed inset-0 z-50 bg-[#090b0f]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAlterarSenha}
            className="bg-[#0e1218] max-w-sm w-full p-6 border border-[#2d3748] space-y-4"
          >
            <h3 className="text-lg font-bold text-[#f1ede4] border-b border-[#1f2633] pb-3">
              Alterar Minha Senha
            </h3>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Senha atual</label>
              <input
                type="password"
                required
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Nova senha (mín. 8 caracteres)</label>
              <input
                type="password"
                required
                minLength={8}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
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

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setModalSenha(false)}
                className="px-4 py-2 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-5 py-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
