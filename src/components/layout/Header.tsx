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
            onClick={onLogout}
            className="px-3.5 py-2 border border-[#2d3748] bg-[#0e1218] hover:border-[#f87171]/60 hover:text-[#f87171] text-xs font-medium text-[#949ba6] transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
