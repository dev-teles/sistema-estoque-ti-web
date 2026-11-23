import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string, website?: string) => Promise<void>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSubmitting(true);
    try {
      await onLogin(email, password, website);
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-[#f1ede4] flex items-center justify-center p-4 selection:bg-[#d4a359] selection:text-[#090b0f]">
      <div className="w-full max-w-md bg-[#0e1218] border border-[#1f2633] p-8">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Estoque T.I."
            className="h-16 w-auto object-contain mb-3"
          />
          <p className="text-xs text-[#949ba6]">Acesso ao sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#949ba6] mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              aria-label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3.5 py-2.5 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#949ba6] mb-1.5">
              Senha
            </label>
            <input
              type="password"
              required
              aria-label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3.5 py-2.5 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            />
          </div>

          {erro && (
            <div className="border-l-2 border-[#f87171] bg-[#f87171]/10 px-3 py-2 text-xs text-[#f87171]">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
