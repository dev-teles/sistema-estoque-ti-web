import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import { TIPO_LABEL } from '../../components/ui/StatusBadge';
import type { Movimentacao, Reserva } from '../../types/estoque';
import type { Aba } from '../../types/navigation';

export function InicioView({ onNavigate }: { onNavigate: (aba: Aba) => void }) {
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
        <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-12">
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
          </button>

          <button
            type="button"
            onClick={() => onNavigate('estoque')}
            className="text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 hover:border-amber-400 transition-colors cursor-pointer shadow-xs"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              Poucos itens restantes
            </span>
            <p className="text-3xl font-bold mt-2 text-amber-500">{kpis.itens_alerta} itens</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('estoque')}
            className="text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-red-200 dark:border-red-900/60 hover:border-red-400 transition-colors cursor-pointer shadow-xs"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              Em Falta
            </span>
            <p className="text-3xl font-bold mt-2 text-red-500">{kpis.itens_criticos} itens</p>
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
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Aguardando Retirada ({kpis.reservas_pendentes})
                </h3>
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
                      className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-green-600 text-black text-xs font-semibold cursor-pointer shrink-0"
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
