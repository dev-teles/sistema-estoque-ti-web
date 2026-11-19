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

  const abas: { id: Aba; label: string; visivel: boolean }[] = [
    { id: 'inicio', label: 'Início', visivel: true },
    { id: 'estoque', label: 'Estoque e Itens', visivel: true },
    { id: 'reservas', label: 'Retiradas', visivel: true },
    { id: 'historico', label: 'Histórico', visivel: true },
    { id: 'equipe', label: 'Equipe de TI', visivel: ehAdmin },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Esquerda: Logo Estoque TI */}
        <button
          type="button"
          onClick={() => onSelectAba('inicio')}
          className="flex items-center shrink-0 cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="Estoque T.I. - Sistema de Gestão"
            className="h-11 w-auto object-contain"
          />
        </button>

        {/* Centro: Barra de navegação no meio do header */}
        <nav className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-6 flex-1 overflow-x-auto">
          {abas
            .filter((a) => a.visivel)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectAba(item.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  aba === item.id
                    ? 'bg-sky-400 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
        </nav>

        {/* Direita: Usuário e Sair */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-100 leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-sky-400">{user.role_label}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-red-950/60 hover:text-red-400 transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
