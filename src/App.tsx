import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { api } from './services/api';
import { formatarData } from './utils/format';
import type {
  Categoria,
  ItemCatalogo,
  Movimentacao,
  PaginatedResponse,
  Reserva,
  UnidadeEstoque,
  Usuario,
} from './types/estoque';

type Aba = 'inicio' | 'estoque' | 'reservas' | 'historico' | 'equipe';

function StatusBadge({ status }: { status: UnidadeEstoque['status_reposicao'] }) {
  const map = {
    regular: {
      label: 'Estoque OK',
      cls: 'bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-400',
    },
    alerta: {
      label: 'Acabando (Repor)',
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400',
    },
    critico: {
      label: 'Em Falta (Zerado)',
      cls: 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400',
    },
  }[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${map.cls}`}>
      {map.label}
    </span>
  );
}

const TIPO_LABEL: Record<string, { texto: string; cor: string }> = {
  entrada: {
    texto: 'Entrada',
    cor: 'bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-400',
  },
  saida: {
    texto: 'Saída',
    cor: 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400',
  },
  reserva: {
    texto: 'Reservado',
    cor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-400',
  },
  cancelamento_reserva: {
    texto: 'Reserva Cancelada',
    cor: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
  estorno: {
    texto: 'Correção / Ajuste',
    cor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400',
  },
  ajuste_auditoria: {
    texto: 'Ajuste de Contagem',
    cor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400',
  },
};

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('tema_ti') === 'dark');
  const [aba, setAba] = useState<Aba>('inicio');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tema_ti', dark ? 'dark' : 'light');
  }, [dark]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-slate-900 text-slate-700 dark:text-slate-50 flex items-center justify-center">
        <p className="text-base font-medium">Carregando Estoque de TI...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} dark={dark} onToggleDark={() => setDark(!dark)} />;
  }

  const podeGerir = user.role === 'admin' || user.role === 'gestor';
  const ehAdmin = user.role === 'admin';

  const abas: { id: Aba; label: string; visivel: boolean }[] = [
    { id: 'inicio', label: '1. Início', visivel: true },
    { id: 'estoque', label: '2. Estoque e Itens', visivel: true },
    { id: 'reservas', label: '3. Retiradas', visivel: true },
    { id: 'historico', label: '4. Histórico', visivel: true },
    { id: 'equipe', label: '5. Equipe de TI', visivel: ehAdmin },
  ];

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-900 text-slate-700 dark:text-slate-50 flex flex-col">
      {/* Topo Simplificado */}
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
              onClick={() => setDark(!dark)}
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
              onClick={logout}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Menu Principal em 4 Abas */}
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto pb-3">
          {abas
            .filter((a) => a.visivel)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAba(item.id)}
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

      {/* Conteúdo Principal */}
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

/* ============================================================================
 * TELA DE LOGIN
 * ========================================================================== */
function LoginScreen({
  onLogin,
  dark,
  onToggleDark,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  dark: boolean;
  onToggleDark: () => void;
}) {
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
          <button
            type="button"
            onClick={onToggleDark}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {dark ? '☀️' : '🌙'}
          </button>
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

/* ============================================================================
 * 1. INÍCIO (VISÃO GERAL SIMPLIFICADA)
 * ========================================================================== */
function InicioView({ onNavigate }: { onNavigate: (aba: Aba) => void }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<{
        data: {
          kpis: {
            total_itens: number;
            itens_regulares: number;
            itens_alerta: number;
            itens_criticos: number;
            reservas_pendentes: number;
          };
          reservas_pendentes: Reserva[];
          ultimas_movimentacoes: Movimentacao[];
        };
      }>('/dashboard');
      return res.data.data;
    },
  });

  const confirmarEntrega = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/reservas/${id}/confirmar`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });

  if (isLoading || !data) {
    return <p className="text-sm">Carregando resumo do estoque...</p>;
  }

  const { kpis, reservas_pendentes, ultimas_movimentacoes } = data;

  return (
    <div className="space-y-6">
      {/* Resumo em 3 Cartões Fáceis */}
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">
          Como está o estoque hoje?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('estoque')}
            className="text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-green-200 dark:border-green-900/60 hover:border-green-400 transition-colors cursor-pointer shadow-xs"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              Tudo certo
            </span>
            <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
              {kpis.itens_regulares} itens
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Com quantidade suficiente na prateleira
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('estoque')}
            className="text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 hover:border-amber-400 transition-colors cursor-pointer shadow-xs"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              Atenção: Acabando
            </span>
            <p className="text-3xl font-bold mt-2 text-amber-500">{kpis.itens_alerta} itens</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Atingiram o estoque mínimo e precisam de compra
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('estoque')}
            className="text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-red-200 dark:border-red-900/60 hover:border-red-400 transition-colors cursor-pointer shadow-xs"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              Urgente: Em Falta
            </span>
            <p className="text-3xl font-bold mt-2 text-red-500">{kpis.itens_criticos} itens</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sem nenhuma unidade disponível para uso
            </p>
          </button>
        </div>
      </div>

      {/* Duas Colunas: Entregas Pendentes + Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entregas Pendentes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  Aguardando Retirada ({kpis.reservas_pendentes})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Materiais reservados que o solicitante ainda não buscou
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('reservas')}
                className="px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-500 text-slate-950 text-xs font-bold cursor-pointer"
              >
                + Nova Reserva
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {reservas_pendentes.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 text-center">
                  Nenhuma retirada pendente no momento.
                </p>
              ) : (
                reservas_pendentes.map((r) => (
                  <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {r.quantidade}x {r.item?.nome}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Para: {r.solicitante}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmarEntrega.mutate(r.id)}
                      disabled={confirmarEntrega.isPending}
                      className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Confirmar Entrega
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Últimas Atividades */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Últimas Atividades</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O que entrou ou saiu recentemente
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('historico')}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
            >
              Ver tudo →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {ultimas_movimentacoes.slice(0, 5).map((m) => {
              const info = TIPO_LABEL[m.tipo] ?? { texto: m.tipo, cor: 'bg-slate-100 text-slate-700' };
              return (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.cor}`}>
                      {info.texto}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{m.item?.nome}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Por {m.user?.name} • {formatarData(m.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {m.quantidade} un
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. ESTOQUE E ITENS (CONSULTA + ENTRADA + SAÍDA + CADASTRO NO MESMO LUGAR)
 * ========================================================================== */
function EstoqueView({ podeGerir }: { podeGerir: boolean }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [status, setStatus] = useState('');

  // Modal de Entrada / Saída
  const [itemAcao, setItemAcao] = useState<{
    unidade: UnidadeEstoque;
    tipo: 'entrada' | 'saida';
  } | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState<'consumo' | 'transferencia' | 'dano'>('consumo');
  const [destino, setDestino] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [msgErro, setMsgErro] = useState('');

  // Modal de Novo Item (para Gestor/Admin)
  const [modalNovoItem, setModalNovoItem] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaCatId, setNovaCatId] = useState('');
  const [novoMinimo, setNovoMinimo] = useState(5);

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await api.get<{ data: Categoria[] }>('/categorias')).data.data,
  });

  const { data: estoque, isLoading } = useQuery({
    queryKey: ['estoque', search, categoriaId, status],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<UnidadeEstoque>>('/estoque', {
          params: {
            search: search || undefined,
            categoria_id: categoriaId || undefined,
            status: status || undefined,
            per_page: 50,
          },
        })
      ).data,
  });

  const mutacaoMovimento = useMutation({
    mutationFn: async () => {
      if (!itemAcao) return;
      const item_id = itemAcao.unidade.item.id;
      if (itemAcao.tipo === 'entrada') {
        await api.post('/estoque/entrada', {
          item_id,
          quantidade,
          justificativa: justificativa || undefined,
        });
      } else {
        await api.post('/estoque/saida', {
          item_id,
          quantidade,
          motivo,
          destino: destino || undefined,
          justificativa: justificativa || undefined,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['movimentacoes'] });
      setItemAcao(null);
      setQuantidade(1);
      setDestino('');
      setJustificativa('');
      setMsgErro('');
    },
    onError: (err: any) => {
      setMsgErro(err?.response?.data?.message || 'Erro ao registrar movimentação.');
    },
  });

  const criarItem = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      await api.post('/catalogo', {
        nome: novoNome,
        categoria_id: Number(novaCatId),
        quantidade_minima: novoMinimo,
        lead_time_dias: 7,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['catalogo-simples'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setNovoNome('');
      setModalNovoItem(false);
    },
  });

  return (
    <div className="space-y-4">
      {/* Cabeçalho Explicativo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Lista de Materiais da TI
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use os botões <strong>+ Entrada</strong> quando chegar material novo ou{' '}
            <strong>- Saída</strong> quando entregar um item.
          </p>
        </div>

        {podeGerir && (
          <button
            type="button"
            onClick={() => setModalNovoItem(true)}
            className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-950 font-bold text-sm cursor-pointer shadow-xs"
          >
            + Cadastrar Novo Item
          </button>
        )}
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          aria-label="Buscar equipamento pelo nome"
          placeholder="🔍 Digite o nome do item (ex: Mouse, Cabo Cat6, SSD)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm"
        />

        <select
          aria-label="Filtrar por categoria"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por situação"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Qualquer situação</option>
          <option value="regular">Estoque OK</option>
          <option value="alerta">Acabando (Repor)</option>
          <option value="critico">Em Falta (Zerado)</option>
        </select>
      </div>

      {/* Tabela Limpa e Direta */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sky-400 text-slate-950 text-sm font-semibold">
              <th className="py-3.5 px-4">Equipamento / Material</th>
              <th className="py-3.5 px-4">Categoria</th>
              <th className="py-3.5 px-4 text-center">Disponível para Uso</th>
              <th className="py-3.5 px-4 text-center">Aviso Mínimo</th>
              <th className="py-3.5 px-4">Situação</th>
              <th className="py-3.5 px-4 text-right">Registrar Movimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  Carregando itens...
                </td>
              </tr>
            ) : (
              estoque?.data.map((u) => (
                <tr key={u.id} className="hover:bg-sky-50/60 dark:hover:bg-slate-700/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                    {u.item.nome}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {u.item.categoria?.nome}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                      {u.saldo_disponivel}
                    </span>
                    {u.saldo_reservado ? (
                      <span className="block text-[11px] text-slate-400">
                        (+{u.saldo_reservado} reservado)
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500">
                    {u.item.quantidade_minima} un
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={u.status_reposicao} />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setItemAcao({ unidade: u, tipo: 'entrada' });
                        setQuantidade(1);
                        setMsgErro('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      + Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemAcao({ unidade: u, tipo: 'saida' });
                        setQuantidade(1);
                        setMsgErro('');
                      }}
                      disabled={u.saldo_disponivel <= 0}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-xs cursor-pointer disabled:opacity-40"
                    >
                      - Saída
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Entrada ou Saída */}
      {itemAcao && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-sky-100 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold">
              {itemAcao.tipo === 'entrada' ? '📥 Adicionar ao Estoque' : '📤 Retirar do Estoque'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Item: <strong className="text-slate-800 dark:text-slate-100">{itemAcao.unidade.item.nome}</strong>{' '}
              (Disponível atual: {itemAcao.unidade.saldo_disponivel})
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">Quantidade</label>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>

            {itemAcao.tipo === 'saida' && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1">Por que está saindo?</label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <option value="consumo">Uso normal / Entrega para colaborador</option>
                    <option value="transferencia">Instalado em outro setor / sala</option>
                    <option value="dano">Peça com defeito / queimada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Para quem foi entregue? (ou nº do chamado)
                  </label>
                  <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Ex: Maria (Financeiro) - Chamado #1090"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">Observação (opcional)</label>
              <input
                type="text"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder={
                  itemAcao.tipo === 'entrada'
                    ? 'Ex: Compra NF 4510'
                    : 'Ex: Substituição de mouse com defeito'
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>

            {msgErro && <p className="text-xs text-red-500 font-medium">{msgErro}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemAcao(null)}
                className="px-4 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-600 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => mutacaoMovimento.mutate()}
                disabled={mutacaoMovimento.isPending}
                className="px-5 py-2 rounded-xl text-sm bg-sky-400 hover:bg-sky-500 text-slate-950 font-bold cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastrar Novo Item */}
      {modalNovoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => criarItem.mutate(e)}
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-sky-100 dark:border-slate-700 space-y-4"
          >
            <h3 className="text-lg font-bold">Cadastrar Novo Item de TI</h3>

            <div>
              <label className="block text-xs font-semibold mb-1">Nome do Equipamento ou Peça</label>
              <input
                type="text"
                required
                placeholder="Ex: Monitor 24 Pol Full HD"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Categoria</label>
              <select
                required
                value={novaCatId}
                onChange={(e) => setNovaCatId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {categorias?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Avisar quando tiver menos de quantas unidades?
              </label>
              <input
                type="number"
                min={0}
                value={novoMinimo}
                onChange={(e) => setNovoMinimo(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovoItem(false)}
                className="px-4 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={criarItem.isPending}
                className="px-5 py-2 rounded-xl text-sm bg-sky-400 hover:bg-sky-500 text-slate-950 font-bold cursor-pointer"
              >
                Cadastrar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 3. RETIRADAS / RESERVAS (SEPARAR MATERIAL PARA UM COLABORADOR)
 * ========================================================================== */
function ReservasView() {
  const qc = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [solicitante, setSolicitante] = useState('');
  const [erro, setErro] = useState('');

  const { data: catalogo } = useQuery({
    queryKey: ['catalogo-simples'],
    queryFn: async () => (await api.get<PaginatedResponse<ItemCatalogo>>('/catalogo?per_page=100')).data.data,
  });

  const { data: reservas } = useQuery({
    queryKey: ['reservas'],
    queryFn: async () =>
      (await api.get<PaginatedResponse<Reserva>>('/reservas', { params: { status: 'reservado', per_page: 50 } })).data
        .data,
  });

  const criarReserva = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      await api.post('/reservas', {
        item_id: Number(itemId),
        quantidade,
        solicitante,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSolicitante('');
      setQuantidade(1);
      setErro('');
    },
    onError: (err: any) => setErro(err?.response?.data?.message || 'Não foi possível reservar.'),
  });

  const acaoReserva = useMutation({
    mutationFn: async ({ id, acao }: { id: number; acao: 'confirmar' | 'cancelar' }) => {
      await api.post(`/reservas/${id}/${acao}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário Simples */}
      <form
        onSubmit={(e) => criarReserva.mutate(e)}
        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-4 h-fit shadow-xs"
      >
        <div>
          <h2 className="text-base font-bold">Separar Material para Retirada</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reserve um item para quando o colaborador vier buscar no suporte.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Qual item?</label>
          <select
            required
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">Escolha o equipamento...</option>
            {catalogo?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} ({i.saldo_disponivel} disponíveis)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Quem vai retirar?</label>
          <input
            type="text"
            required
            placeholder="Ex: João Silva (RH)"
            value={solicitante}
            onChange={(e) => setSolicitante(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Quantidade</label>
          <input
            type="number"
            min={1}
            required
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </div>

        {erro && <p className="text-xs text-red-500">{erro}</p>}

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-950 font-bold text-sm cursor-pointer"
        >
          Deixar Separado
        </button>
      </form>

      {/* Fila de Retirada */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-sky-400 text-slate-950 font-bold">
          Materiais Separados Aguardando Retirada
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {!reservas || reservas.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Nenhum item separado aguardando retirada.
            </p>
          ) : (
            reservas.map((r) => (
              <div
                key={r.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-sky-50/40 dark:hover:bg-slate-700/30"
              >
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {r.quantidade}x {r.item?.nome}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Solicitante: <strong>{r.solicitante}</strong> • Reservado em {formatarData(r.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => acaoReserva.mutate({ id: r.id, acao: 'confirmar' })}
                    className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    ✓ Já Retirou (Entregar)
                  </button>
                  <button
                    type="button"
                    onClick={() => acaoReserva.mutate({ id: r.id, acao: 'cancelar' })}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-600 text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 4. HISTÓRICO DE ENTRADAS E SAÍDAS (SIMPLES E CLARO)
 * ========================================================================== */
function HistoricoView() {
  const [tipo, setTipo] = useState('');
  const { data } = useQuery({
    queryKey: ['movimentacoes', tipo],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<Movimentacao>>('/movimentacoes', {
          params: { tipo: tipo || undefined, per_page: 50 },
        })
      ).data.data,
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">Histórico de Entradas e Saídas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro completo de tudo o que aconteceu no estoque da TI
          </p>
        </div>

        <select
          aria-label="Filtrar histórico por tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Mostrar tudo</option>
          <option value="entrada">Apenas Entradas</option>
          <option value="saida">Apenas Saídas</option>
          <option value="reserva">Apenas Reservas</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-sky-400 text-slate-950 font-semibold">
              <th className="py-3 px-4">Quando</th>
              <th className="py-3 px-4">O que houve</th>
              <th className="py-3 px-4">Equipamento / Material</th>
              <th className="py-3 px-4 text-center">Quantidade</th>
              <th className="py-3 px-4 text-center">Ficou no Estoque</th>
              <th className="py-3 px-4">Quem registrou</th>
              <th className="py-3 px-4">Para quem / Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {data?.map((m) => {
              const info = TIPO_LABEL[m.tipo] ?? { texto: m.tipo, cor: 'bg-slate-100 text-slate-700' };
              return (
                <tr key={m.id}>
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                    {formatarData(m.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.cor}`}>
                      {info.texto}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold">{m.item?.nome}</td>
                  <td className="py-3 px-4 text-center font-bold">{m.quantidade} un</td>
                  <td className="py-3 px-4 text-center font-medium">{m.saldo_fisico_apos} un</td>
                  <td className="py-3 px-4">{m.user?.name}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {m.destino || m.justificativa || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
 * 5. EQUIPE DE TI (USUÁRIOS)
 * ========================================================================== */
function EquipeView() {
  const { data: usuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await api.get<PaginatedResponse<Usuario>>('/usuarios')).data.data,
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 bg-sky-400 text-slate-950 font-bold">
        Membros da Equipe de TI com Acesso ao Sistema
      </div>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500">
            <th className="py-3 px-4">Nome</th>
            <th className="py-3 px-4">E-mail</th>
            <th className="py-3 px-4">Função</th>
            <th className="py-3 px-4">Último Acesso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {usuarios?.map((u) => (
            <tr key={u.id}>
              <td className="py-3 px-4 font-semibold">{u.name}</td>
              <td className="py-3 px-4">{u.email}</td>
              <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">{u.role_label}</td>
              <td className="py-3 px-4 text-xs text-slate-500">{formatarData(u.ultimo_login_em)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
