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
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt="Estoque T.I. - Sistema de Gestão"
            className="w-full max-w-xs h-auto object-contain mb-2"
          />
          <p className="text-xs text-slate-400">Entre para gerenciar os materiais</p>
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
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
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
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
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

        <div className="mt-6 pt-5 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2.5 font-medium">
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
                    ? 'border-sky-400 bg-sky-950/40 text-sky-300 font-bold'
                    : 'border-slate-600 hover:bg-slate-700'
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
