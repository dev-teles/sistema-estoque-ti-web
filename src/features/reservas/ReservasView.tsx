import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import type { ItemCatalogo, PaginatedResponse, Reserva } from '../../types/estoque';

interface AuvoTarefa {
  task_id: number;
  solicitante: string;
  orientacao?: string | null;
  tecnico?: string | null;
  data_tarefa?: string | null;
  modo_demo?: boolean;
}

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
    const idLimpo = taskIdAuvo.replace(/\D/g, '');
    if (!idLimpo) {
      setErro('Digite o número da tarefa do Auvo para buscar.');
      return;
    }
    setErro('');
    setAvisoAuvo('');
    setBuscandoAuvo(true);
    try {
      const res = await api.get<{ data: AuvoTarefa }>(`/auvo/tarefas/${idLimpo}`);
      const tarefa = res.data.data;
      setSolicitante(tarefa.solicitante);
      if (tarefa.orientacao) {
        setObservacao(tarefa.orientacao);
      }
      setAvisoAuvo(
        tarefa.modo_demo
          ? `Tarefa #${tarefa.task_id} importada (modo demonstração Auvo).`
          : `Tarefa #${tarefa.task_id} importada do Auvo!`
      );
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Não foi possível buscar a tarefa no Auvo.');
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
      {/* Formulário com Integração Auvo */}
      <form
        onSubmit={(e) => criarReserva.mutate(e)}
        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-4 h-fit shadow-xs"
      >
        <div>
          <h2 className="text-base font-bold">Separar material para retirada</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Importe direto pelo nº da tarefa do Auvo ou preencha manualmente.
          </p>
        </div>

        {/* Integração Auvo */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="block text-xs font-semibold text-sky-400">
            🔗 Importar Tarefa do Auvo (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nº da tarefa (ex: 395)"
              value={taskIdAuvo}
              onChange={(e) => setTaskIdAuvo(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={buscarNoAuvo}
              disabled={buscandoAuvo}
              className="px-3 py-1.5 rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-950 font-bold text-xs cursor-pointer shrink-0 disabled:opacity-50"
            >
              {buscandoAuvo ? 'Buscando...' : 'Buscar no Auvo'}
            </button>
          </div>
          {avisoAuvo && <p className="text-[11px] text-green-400 font-medium">{avisoAuvo}</p>}
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
            placeholder="Ex: João Silva (Tarefa Auvo #45890)"
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

        <div>
          <label className="block text-xs font-semibold mb-1">Descrição / Orientação da Tarefa</label>
          <input
            type="text"
            placeholder="Preenchido pelo Auvo ou digite uma observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
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
                  {r.observacao && (
                    <p className="text-xs text-sky-400 mt-0.5">{r.observacao}</p>
                  )}
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
