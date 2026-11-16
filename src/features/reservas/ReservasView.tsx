import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import type { ItemCatalogo, PaginatedResponse, Reserva } from '../../types/estoque';

export function ReservasView() {
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
