import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('admin@estoque.local');
  const [password, setPassword] = useState('password');
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } catch {
      setErro('E-mail ou senha incorretos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-900 text-slate-700 dark:text-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-sky-100 dark:border-slate-700 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-400 text-slate-950 font-bold flex items-center justify-center text-xl">
              TI
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-50">Estoque da TI</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Entre para gerenciar os materiais</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Seu E-mail</label>
            <input
              type="email"
              required
              aria-label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sua Senha</label>
            <input
              type="password"
              required
              aria-label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {erro && <p className="text-xs text-red-500 font-medium">{erro}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-950 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 font-medium">
            Acesso rápido para testar (clique em um perfil):
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Admin', email: 'admin@estoque.local' },
              { label: 'Gestor', email: 'gestor.ti@estoque.local' },
              { label: 'Operador', email: 'operador.ti@estoque.local' },
            ].map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => {
                  setEmail(c.email);
                  setPassword('password');
                }}
                className={`text-xs py-2 px-2 rounded-lg border font-medium cursor-pointer transition-colors ${
                  email === c.email
                    ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
