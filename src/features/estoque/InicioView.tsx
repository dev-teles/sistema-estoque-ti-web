import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import { TIPO_LABEL } from '../../components/ui/StatusBadge';
import type { Movimentacao, Reserva } from '../../types/estoque';
import type { Aba } from '../../types/navigation';

interface Dashboard {
  kpis: {
    itens_regulares: number;
    itens_alerta: number;
    itens_criticos: number;
    reservas_pendentes: number;
  };
  reservas_pendentes: Reserva[];
  ultimas_movimentacoes: Movimentacao[];
}

const card = 'text-left bg-slate-800 p-5 rounded-2xl border-2 transition-colors cursor-pointer shadow-xs';
const painel = 'bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xs';
const cabecalho = 'px-5 py-4 border-b border-slate-700 flex items-center justify-between';

export function InicioView({ onNavigate }: { onNavigate: (aba: Aba) => void }) {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<{ data: Dashboard }>('/dashboard')).data.data,
  });

  const confirmarEntrega = useMutation({
    mutationFn: (id: number) => api.post(`/reservas/${id}/confirmar`),
    onSuccess: () => {
      for (const key of ['dashboard', 'estoque', 'reservas', 'movimentacoes']) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  if (!data) {
    return <p className="text-sm">Carregando resumo do estoque...</p>;
  }

  const { kpis, reservas_pendentes, ultimas_movimentacoes } = data;

  const cards = [
    {
      rotulo: 'Itens em dia',
      valor: kpis.itens_regulares,
      borda: 'border-green-900/60 hover:border-green-400',
      badge: 'bg-gray-950 text-white',
      numero: 'text-white',
    },
    {
      rotulo: 'Poucos itens restantes',
      valor: kpis.itens_alerta,
      borda: 'border-amber-900/60 hover:border-amber-400',
      badge: 'bg-amber-950 text-amber-400',
      numero: 'text-amber-500',
    },
    {
      rotulo: 'Em Falta',
      valor: kpis.itens_criticos,
      borda: 'border-red-900/60 hover:border-red-400',
      badge: 'bg-red-950 text-red-400',
      numero: 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold text-slate-100 mb-12">Como está o estoque hoje?</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button key={c.rotulo} type="button" onClick={() => onNavigate('estoque')} className={`${card} ${c.borda}`}>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>{c.rotulo}</span>
            <p className={`text-3xl font-bold mt-2 ${c.numero}`}>{c.valor} itens</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={painel}>
          <div className={cabecalho}>
            <h3 className="text-xl font-bold text-slate-100">
              Aguardando Retirada ({kpis.reservas_pendentes})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('reservas')}
              className="px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-500 text-slate-950 text-xs font-bold cursor-pointer"
            >
              + Nova Reserva
            </button>
          </div>

          <div className="divide-y divide-slate-700">
            {reservas_pendentes.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">Nenhuma retirada pendente no momento.</p>
            ) : (
              reservas_pendentes.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-100">
                      {r.quantidade}x {r.item?.nome}
                    </p>
                    <p className="text-xs text-slate-400">Para: {r.solicitante}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmarEntrega.mutate(r.id)}
                    disabled={confirmarEntrega.isPending}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-green-600 text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Confirmar Entrega
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={painel}>
          <div className={cabecalho}>
            <div>
              <h3 className="font-bold text-slate-100">Últimas Atividades</h3>
              <p className="text-xs text-slate-400">O que entrou ou saiu recentemente</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('historico')}
              className="text-xs text-sky-400 font-semibold hover:underline cursor-pointer"
            >
              Ver tudo →
            </button>
          </div>

          <div className="divide-y divide-slate-700">
            {ultimas_movimentacoes.slice(0, 5).map((m) => {
              const info = TIPO_LABEL[m.tipo] ?? { texto: m.tipo, cor: 'bg-slate-700 text-slate-200' };
              return (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.cor}`}>{info.texto}</span>
                    <div>
                      <p className="font-medium text-slate-100">{m.item?.nome}</p>
                      <p className="text-xs text-slate-400">
                        Por {m.user?.name} • {formatarData(m.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-200">{m.quantidade} un</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
