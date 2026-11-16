import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Categoria, PaginatedResponse, UnidadeEstoque } from '../../types/estoque';

export function EstoqueView({ podeGerir }: { podeGerir: boolean }) {
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
  const [taskIdAuvo, setTaskIdAuvo] = useState('');
  const [buscandoAuvo, setBuscandoAuvo] = useState(false);
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

  const buscarTarefaAuvo = async () => {
    const idLimpo = taskIdAuvo.replace(/\D/g, '');
    if (!idLimpo) return;
    setBuscandoAuvo(true);
    setMsgErro('');
    try {
      const res = await api.get<{
        data: { solicitante: string; orientacao?: string | null };
      }>(`/auvo/tarefas/${idLimpo}`);
      setDestino(res.data.data.solicitante);
      if (res.data.data.orientacao) {
        setJustificativa(res.data.data.orientacao);
      }
    } catch (err: any) {
      setMsgErro(err?.response?.data?.message || 'Não foi possível buscar a tarefa no Auvo.');
    } finally {
      setBuscandoAuvo(false);
    }
  };

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
      setTaskIdAuvo('');
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
          <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
            Lista de Materiais
          </h2>
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
          placeholder="Digite o nome do item"
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
          <option value="regular">Tudo certo</option>
          <option value="alerta">Poucos itens</option>
          <option value="critico">Em Falta</option>
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
              Item:{' '}
              <strong className="text-slate-800 dark:text-slate-100">
                {itemAcao.unidade.item.nome}
              </strong>{' '}
              (Disponível atual: {itemAcao.unidade.saldo_disponivel})
            </p>

            {itemAcao.tipo === 'saida' && (
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
                    onClick={buscarTarefaAuvo}
                    disabled={buscandoAuvo}
                    className="px-3 py-1.5 rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-950 font-bold text-xs cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {buscandoAuvo ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>
            )}

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
                    <option value="transferencia">Instalado em outro local / sala</option>
                    <option value="dano">Peça com defeito / queimada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Para quem foi entregue? (ou nº da Tarefa Auvo)
                  </label>
                  <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Ex: Maria (Tarefa Auvo #45890)"
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
