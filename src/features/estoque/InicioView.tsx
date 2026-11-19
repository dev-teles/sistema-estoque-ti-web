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
    return <p className="text-sm text-[#949ba6]">Carregando...</p>;
  }

  const { kpis, reservas_pendentes, ultimas_movimentacoes } = data;

  const indicadores = [
    {
      rotulo: 'Em dia',
      valor: kpis.itens_regulares,
      acento: 'text-[#34d399]',
      barra: 'bg-[#34d399]',
    },
    {
      rotulo: 'Estoque baixo',
      valor: kpis.itens_alerta,
      acento: 'text-[#e5a93c]',
      barra: 'bg-[#e5a93c]',
    },
    {
      rotulo: 'Em falta',
      valor: kpis.itens_criticos,
      acento: 'text-[#f87171]',
      barra: 'bg-[#f87171]',
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[#f1ede4]">Resumo do Estoque</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 border border-[#1f2633] bg-[#0e1218] divide-y md:divide-y-0 md:divide-x divide-[#1f2633]">
        {indicadores.map((item) => (
          <button
            key={item.rotulo}
            type="button"
            onClick={() => onNavigate('estoque')}
            className="p-6 text-left hover:bg-[#141922] transition-colors cursor-pointer"
          >
            <div className={`w-6 h-[2px] ${item.barra} mb-4`} />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium text-[#949ba6]">{item.rotulo}</span>
              <span className={`text-3xl font-bold ${item.acento}`}>{item.valor}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Retiradas Pendentes */}
        <section className="lg:col-span-5 border border-[#1f2633] bg-[#0e1218] flex flex-col">
          <div className="px-5 py-4 border-b border-[#1f2633] flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-[#f1ede4]">
              Retiradas ({kpis.reservas_pendentes})
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('reservas')}
              className="px-3 py-1.5 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] text-xs font-semibold cursor-pointer transition-colors"
            >
              + Nova Reserva
            </button>
          </div>

          <div className="divide-y divide-[#1f2633] flex-1">
            {reservas_pendentes.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#5e6673]">Nenhuma retirada pendente.</p>
            ) : (
              reservas_pendentes.map((r) => (
                <div
                  key={r.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#141922] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f1ede4] truncate">
                      {r.quantidade}x {r.item?.nome}
                    </p>
                    <p className="text-xs text-[#949ba6] truncate">{r.solicitante}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmarEntrega.mutate(r.id)}
                    disabled={confirmarEntrega.isPending}
                    className="px-3 py-1.5 border border-[#2d3748] bg-[#090b0f] hover:border-[#34d399] hover:text-[#34d399] text-xs font-medium text-[#f1ede4] cursor-pointer shrink-0 transition-colors"
                  >
                    Entregar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Últimas Movimentações */}
        <section className="lg:col-span-7 border border-[#1f2633] bg-[#0e1218] flex flex-col">
          <div className="px-5 py-4 border-b border-[#1f2633] flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-[#f1ede4]">Últimas Movimentações</h2>
            <button
              type="button"
              onClick={() => onNavigate('historico')}
              className="text-xs font-semibold text-[#d4a359] hover:underline cursor-pointer"
            >
              Ver tudo →
            </button>
          </div>

          <div className="divide-y divide-[#1f2633]">
            {ultimas_movimentacoes.slice(0, 6).map((m) => {
              const info = TIPO_LABEL[m.tipo] ?? {
                texto: m.tipo,
                cor: 'border-[#2d3748] bg-[#141922] text-[#949ba6]',
                dot: 'bg-[#5e6673]',
              };
              return (
                <div
                  key={m.id}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-[#141922] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-xs font-medium shrink-0 ${info.cor}`}
                    >
                      <span className={`w-1.5 h-1.5 ${info.dot}`} />
                      {info.texto}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#f1ede4] truncate">
                        {m.item?.nome}
                      </p>
                      <p className="text-xs text-[#5e6673]">
                        {m.user?.name} • {formatarData(m.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#f1ede4] shrink-0">
                    {m.quantidade} un
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
