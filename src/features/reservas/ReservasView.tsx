import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, buscarTarefaAuvo } from '../../services/api';
import { formatarData } from '../../utils/format';
import type { ItemCatalogo, PaginatedResponse, Reserva } from '../../types/estoque';

export function ReservasView() {
  const qc = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [taskIdAuvo, setTaskIdAuvo] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [observacao, setObservacao] = useState('');
  const [buscandoAuvo, setBuscandoAuvo] = useState(false);
  const [avisoAuvo, setAvisoAuvo] = useState('');
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

  const buscarNoAuvo = async () => {
    setErro('');
    setAvisoAuvo('');
    setBuscandoAuvo(true);
    try {
      const tarefa = await buscarTarefaAuvo(taskIdAuvo);
      setSolicitante(tarefa.solicitante);
      if (tarefa.orientacao) {
        setObservacao(tarefa.orientacao);
      }
      setAvisoAuvo(`Tarefa #${tarefa.task_id} importada.`);
    } catch (err: any) {
      setErro(err?.response?.data?.message || err?.message || 'Tarefa não encontrada.');
    } finally {
      setBuscandoAuvo(false);
    }
  };

  const criarReserva = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      await api.post('/reservas', {
        item_id: Number(itemId),
        quantidade,
        solicitante,
        observacao: observacao || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSolicitante('');
      setObservacao('');
      setTaskIdAuvo('');
      setAvisoAuvo('');
      setQuantidade(1);
      setErro('');
    },
    onError: (err: any) => setErro(err?.response?.data?.message || 'Erro ao reservar.'),
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
      setErro('');
    },
    onError: (err: any) => setErro(err?.response?.data?.message || 'Erro ao processar reserva.'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#f1ede4]">Retiradas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={(e) => criarReserva.mutate(e)}
          className="lg:col-span-5 bg-[#0e1218] p-6 border border-[#1f2633] space-y-4 h-fit"
        >
          <h2 className="text-lg font-bold text-[#f1ede4] border-b border-[#1f2633] pb-3">
            Nova Reserva
          </h2>

          <div className="p-3 bg-[#090b0f] border border-[#1f2633] space-y-2">
            <label className="block text-xs font-medium text-[#d4a359]">
              Tarefa Auvo (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nº da tarefa"
                value={taskIdAuvo}
                onChange={(e) => setTaskIdAuvo(e.target.value)}
                className="min-w-0 flex-1 border border-[#2d3748] bg-[#0e1218] px-3 py-1.5 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
              <button
                type="button"
                onClick={buscarNoAuvo}
                disabled={buscandoAuvo}
                className="px-3.5 py-1.5 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer shrink-0 disabled:opacity-50"
              >
                {buscandoAuvo ? '...' : 'Buscar'}
              </button>
            </div>
            {avisoAuvo && <p className="text-xs text-[#34d399]">{avisoAuvo}</p>}
          </div>

          <div>
            <label className="block text-xs text-[#949ba6] mb-1">Item</label>
            <select
              required
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            >
              <option value="">Selecione...</option>
              {catalogo?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome} ({i.saldo_disponivel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-[#949ba6] mb-1">Solicitante</label>
              <input
                type="text"
                required
                placeholder="Nome"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Qtd.</label>
              <input
                type="number"
                min={1}
                required
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#949ba6] mb-1">Observação</label>
            <input
              type="text"
              placeholder="Opcional"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
            />
          </div>

          {erro && (
            <div className="border-l-2 border-[#f87171] bg-[#f87171]/10 px-3 py-2 text-xs text-[#f87171]">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer transition-colors"
          >
            Reservar
          </button>
        </form>

        {/* Lista de Reservas */}
        <div className="lg:col-span-7 bg-[#0e1218] border border-[#1f2633] flex flex-col">
          <div className="px-5 py-4 border-b border-[#1f2633] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#f1ede4]">Aguardando Retirada</h2>
            <span className="text-xs text-[#949ba6]">{reservas?.length ?? 0}</span>
          </div>

          <div className="divide-y divide-[#1f2633]">
            {!reservas || reservas.length === 0 ? (
              <p className="p-10 text-center text-xs text-[#5e6673]">Nenhuma reserva pendente.</p>
            ) : (
              reservas.map((r) => (
                <div
                  key={r.id}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#141922] transition-colors"
                >
                  <div className="space-y-0.5 max-w-lg">
                    <p className="font-semibold text-sm text-[#f1ede4]">
                      <span className="text-[#d4a359] mr-1.5">{r.quantidade}x</span>
                      {r.item?.nome}
                    </p>
                    <p className="text-xs text-[#949ba6]">
                      {r.solicitante} • {formatarData(r.created_at)}
                    </p>
                    {r.observacao && (
                      <p className="text-xs text-[#d4a359]/90">{r.observacao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={acaoReserva.isPending}
                      onClick={() => acaoReserva.mutate({ id: r.id, acao: 'confirmar' })}
                      className="px-3.5 py-1.5 border border-[#34d399]/40 bg-[#34d399]/10 hover:bg-[#34d399] hover:text-[#090b0f] text-[#34d399] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Entregar
                    </button>
                    <button
                      type="button"
                      disabled={acaoReserva.isPending}
                      onClick={() => acaoReserva.mutate({ id: r.id, acao: 'cancelar' })}
                      className="px-3 py-1.5 border border-[#2d3748] bg-[#090b0f] hover:border-[#f87171] hover:text-[#f87171] text-xs text-[#949ba6] transition-colors cursor-pointer disabled:opacity-50"
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
    </div>
  );
}
