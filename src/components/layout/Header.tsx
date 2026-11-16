import type { Usuario } from '../../types/estoque';
import type { Aba } from '../../types/navigation';

interface HeaderProps {
  user: Usuario;
  aba: Aba;
  onSelectAba: (aba: Aba) => void;
  dark: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
}

export function Header({
  user,
  aba,
  onSelectAba,
  dark,
  onToggleDark,
  onLogout,
}: HeaderProps) {
  const ehAdmin = user.role === 'admin';

  const abas: { id: Aba; label: string; visivel: boolean }[] = [
    { id: 'inicio', label: '1. Início', visivel: true },
    { id: 'estoque', label: '2. Estoque e Itens', visivel: true },
    { id: 'reservas', label: '3. Retiradas', visivel: true },
    { id: 'historico', label: '4. Histórico', visivel: true },
    { id: 'equipe', label: '5. Equipe de TI', visivel: ehAdmin },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-sky-100 dark:border-slate-700 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-400 text-slate-950 font-bold flex items-center justify-center text-base shadow-xs">
            TI
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-50 leading-tight">
              Estoque da TI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle simples de equipamentos, cabos e peças
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleDark}
            aria-label="Alternar tema claro ou escuro"
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {dark ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
          </button>

          <div className="text-right hidden sm:block border-l border-slate-200 dark:border-slate-700 pl-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
            <p className="text-xs text-sky-600 dark:text-sky-400">{user.role_label}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Menu Principal */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto pb-3">
        {abas
          .filter((a) => a.visivel)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectAba(item.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                aba === item.id
                  ? 'bg-sky-400 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100/80 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
      </nav>
    </header>
  );
}
