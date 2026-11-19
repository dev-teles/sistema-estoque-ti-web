import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { LoginScreen } from './features/auth/LoginScreen';
import { InicioView } from './features/estoque/InicioView';
import { EstoqueView } from './features/estoque/EstoqueView';
import { ReservasView } from './features/reservas/ReservasView';
import { HistoricoView } from './features/relatorios/HistoricoView';
import { EquipeView } from './features/relatorios/EquipeView';
import type { Aba } from './types/navigation';

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [aba, setAba] = useState<Aba>('inicio');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <p className="text-base font-medium">Carregando Estoque de TI...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  const podeGerir = user.role === 'admin' || user.role === 'gestor';
  const ehAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <Header
        user={user}
        aba={aba}
        onSelectAba={setAba}
        onLogout={logout}
      />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {aba === 'inicio' && <InicioView onNavigate={setAba} />}
        {aba === 'estoque' && <EstoqueView podeGerir={podeGerir} />}
        {aba === 'reservas' && <ReservasView />}
        {aba === 'historico' && <HistoricoView />}
        {aba === 'equipe' && ehAdmin && <EquipeView />}
      </main>
    </div>
  );
}
