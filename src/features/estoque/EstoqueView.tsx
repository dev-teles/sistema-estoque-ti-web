import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, buscarTarefaAuvo } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Categoria, PaginatedResponse, UnidadeEstoque } from '../../types/estoque';

export function EstoqueView({ podeGerir }: { podeGerir: boolean }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [status, setStatus] = useState('');

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

  const [modalNovoItem, setModalNovoItem] = useState(false);
  const [itemEditando, setItemEditando] = useState<UnidadeEstoque | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novaCatId, setNovaCatId] = useState('');
  const [novoMinimo, setNovoMinimo] = useState(5);
  const [erroNovoItem, setErroNovoItem] = useState('');
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState('');

  const abrirModalMovimento = (unidade: UnidadeEstoque, tipo: 'entrada' | 'saida') => {
    setItemAcao({ unidade, tipo });
    setQuantidade(1);
    setMotivo('consumo');
    setTaskIdAuvo('');
    setDestino('');
    setJustificativa('');
    setMsgErro('');
  };

  const abrirModalItem = (unidade: UnidadeEstoque | null) => {
    setItemEditando(unidade);
    setNovoNome(unidade ? unidade.item.nome : '');
    setNovaCatId(unidade ? String(unidade.item.categoria_id || unidade.item.categoria?.id || '') : '');
    setNovoMinimo(unidade ? unidade.item.quantidade_minima : 5);
    setErroNovoItem('');
    setCriandoCategoria(false);
    setNomeNovaCategoria('');
    setModalNovoItem(true);
  };

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await api.get<{ data: Categoria[] }>('/categorias')).data.data,
  });

  const criarCategoria = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: Categoria }>('/categorias', { nome: nomeNovaCategoria });
      return res.data.data;
    },
    onSuccess: (cat) => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      setNovaCatId(String(cat.id));
      setNomeNovaCategoria('');
      setCriandoCategoria(false);
      setErroNovoItem('');
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? (Object.values(errors).flat()[0] as string) : null;
      setErroNovoItem(firstError || err?.response?.data?.message || 'Erro ao criar categoria.');
    },
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

  const handleBuscarAuvo = async () => {
    if (!taskIdAuvo.replace(/\D/g, '')) return;
    setBuscandoAuvo(true);
    setMsgErro('');
    try {
      const tarefa = await buscarTarefaAuvo(taskIdAuvo);
      setDestino(tarefa.solicitante);
      if (tarefa.orientacao) {
        setJustificativa(tarefa.orientacao);
      }
    } catch (err: any) {
      setMsgErro(err?.response?.data?.message || 'Tarefa não encontrada no Auvo.');
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
      setMsgErro(err?.response?.data?.message || 'Erro ao salvar.');
    },
  });

  const criarItem = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      if (itemEditando) {
        await api.put(`/catalogo/${itemEditando.item.id}`, {
          nome: novoNome,
          categoria_id: Number(novaCatId),
          quantidade_minima: novoMinimo,
        });
      } else {
        await api.post('/catalogo', {
          nome: novoNome,
          categoria_id: Number(novaCatId),
          quantidade_minima: novoMinimo,
          lead_time_dias: 7,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['catalogo-simples'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setNovoNome('');
      setErroNovoItem('');
      setItemEditando(null);
      setModalNovoItem(false);
    },
    onError: (err: any) => {
      setErroNovoItem(err?.response?.data?.message || 'Erro ao salvar item.');
    },
  });

  const inativarItem = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/catalogo/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['catalogo-simples'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setItemEditando(null);
      setModalNovoItem(false);
    },
    onError: (err: any) => {
      setErroNovoItem(err?.response?.data?.message || 'Erro ao inativar item.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#f1ede4]">Estoque e Itens</h1>

        {podeGerir && (
          <button
            type="button"
            onClick={() => abrirModalItem(null)}
            className="px-4 py-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer transition-colors"
          >
            + Novo Item
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-[#0e1218] p-3.5 border border-[#1f2633] grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <input
            type="search"
            aria-label="Buscar item"
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#2d3748] bg-[#090b0f] px-3.5 py-2 text-sm text-[#f1ede4] placeholder:text-[#5e6673] focus:outline-none focus:border-[#d4a359]"
          />
        </div>

        <div className="md:col-span-3">
          <select
            aria-label="Categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
          >
            <option value="">Todas as categorias</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
          >
            <option value="">Todos os status</option>
            <option value="regular">Em dia</option>
            <option value="alerta">Estoque baixo</option>
            <option value="critico">Em falta</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#0e1218] border border-[#1f2633] overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2d3748] bg-[#090b0f] text-xs font-semibold text-[#949ba6]">
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4 text-right">Disponível</th>
              <th className="py-3 px-4 text-right">Mínimo</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2633]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-[#5e6673]">
                  Carregando...
                </td>
              </tr>
            ) : (
              estoque?.data.map((u) => (
                <tr key={u.id} className="hover:bg-[#141922] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#f1ede4]">
                    {u.item.nome}
                  </td>
                  <td className="py-3.5 px-4 text-[#949ba6]">
                    {u.item.categoria?.nome}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-[#f1ede4]">{u.saldo_disponivel}</span>
                    {u.saldo_reservado ? (
                      <span className="block text-[11px] text-[#d4a359]">
                        +{u.saldo_reservado} reservado
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#5e6673]">
                    {u.item.quantidade_minima}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={u.status_reposicao} />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => abrirModalMovimento(u, 'entrada')}
                      className="px-3 py-1.5 border border-[#34d399]/40 bg-[#34d399]/10 hover:bg-[#34d399] hover:text-[#090b0f] text-[#34d399] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      + Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirModalMovimento(u, 'saida')}
                      disabled={u.saldo_disponivel <= 0}
                      className="px-3 py-1.5 border border-[#2d3748] bg-[#090b0f] hover:border-[#f1ede4] text-[#f1ede4] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-30"
                    >
                      − Saída
                    </button>
                    {podeGerir && (
                      <button
                        type="button"
                        onClick={() => abrirModalItem(u)}
                        className="px-2.5 py-1.5 border border-[#2d3748] bg-[#090b0f] hover:border-[#d4a359] hover:text-[#d4a359] text-[#949ba6] text-xs transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Entrada / Saída */}
      {itemAcao && (
        <div className="fixed inset-0 z-50 bg-[#090b0f]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e1218] max-w-md w-full p-6 border border-[#2d3748] space-y-4">
            <div className="border-b border-[#1f2633] pb-3">
              <span className="text-xs font-semibold text-[#d4a359]">
                {itemAcao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
              </span>
              <h3 className="text-xl font-bold text-[#f1ede4] mt-0.5">
                {itemAcao.unidade.item.nome}
              </h3>
              <p className="text-xs text-[#949ba6]">
                Disponível: {itemAcao.unidade.saldo_disponivel}
              </p>
            </div>

            {itemAcao.tipo === 'saida' && (
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
                    onClick={handleBuscarAuvo}
                    disabled={buscandoAuvo}
                    className="px-3 py-1.5 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {buscandoAuvo ? '...' : 'Buscar'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Quantidade</label>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            {itemAcao.tipo === 'saida' && (
              <>
                <div>
                  <label className="block text-xs text-[#949ba6] mb-1">Motivo</label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value as any)}
                    className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                  >
                    <option value="consumo">Uso / Entrega</option>
                    <option value="transferencia">Transferência</option>
                    <option value="dano">Defeito / Descarte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#949ba6] mb-1">
                    Destinatário {motivo === 'transferencia' ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    required={motivo === 'transferencia'}
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder={motivo === 'transferencia' ? 'Obrigatório na transferência' : 'Nome ou setor'}
                    className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">
                Observação {itemAcao.tipo === 'saida' && motivo === 'dano' ? '*' : ''}
              </label>
              <input
                type="text"
                required={itemAcao.tipo === 'saida' && motivo === 'dano'}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder={
                  itemAcao.tipo === 'saida' && motivo === 'dano'
                    ? 'Obrigatório para defeito/descarte'
                    : 'Opcional'
                }
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            {msgErro && (
              <div className="border-l-2 border-[#f87171] bg-[#f87171]/10 px-3 py-2 text-xs text-[#f87171]">
                {msgErro}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setItemAcao(null)}
                className="px-4 py-2 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => mutacaoMovimento.mutate()}
                disabled={mutacaoMovimento.isPending}
                className="px-5 py-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Item */}
      {modalNovoItem && (
        <div className="fixed inset-0 z-50 bg-[#090b0f]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => criarItem.mutate(e)}
            className="bg-[#0e1218] max-w-md w-full p-6 border border-[#2d3748] space-y-4"
          >
            <h3 className="text-xl font-bold text-[#f1ede4] border-b border-[#1f2633] pb-3">
              {itemEditando ? 'Editar Item' : 'Novo Item'}
            </h3>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Nome</label>
              <input
                type="text"
                required
                placeholder="Ex: Monitor 24 Pol"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs text-[#949ba6]">Categoria</label>
                <button
                  type="button"
                  onClick={() => setCriandoCategoria((v) => !v)}
                  className="text-xs font-semibold text-[#d4a359] hover:underline cursor-pointer"
                >
                  {criandoCategoria ? 'Cancelar' : '+ Nova Categoria'}
                </button>
              </div>

              {criandoCategoria ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome da nova categoria"
                    value={nomeNovaCategoria}
                    onChange={(e) => setNomeNovaCategoria(e.target.value)}
                    className="min-w-0 flex-1 border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                  />
                  <button
                    type="button"
                    disabled={!nomeNovaCategoria.trim() || criarCategoria.isPending}
                    onClick={() => criarCategoria.mutate()}
                    className="px-3.5 py-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Criar
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={novaCatId}
                  onChange={(e) => setNovaCatId(e.target.value)}
                  className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                >
                  <option value="">Selecione...</option>
                  {categorias?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#949ba6] mb-1">Estoque mínimo</label>
              <input
                type="number"
                min={0}
                value={novoMinimo}
                onChange={(e) => setNovoMinimo(Number(e.target.value))}
                className="w-full border border-[#2d3748] bg-[#090b0f] px-3 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
              />
            </div>

            {erroNovoItem && (
              <div className="border-l-2 border-[#f87171] bg-[#f87171]/10 px-3 py-2 text-xs text-[#f87171]">
                {erroNovoItem}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1f2633]">
              {itemEditando ? (
                <button
                  type="button"
                  disabled={inativarItem.isPending}
                  onClick={() => inativarItem.mutate(itemEditando.item.id)}
                  className="px-3 py-2 border border-[#f87171]/40 bg-[#f87171]/10 hover:bg-[#f87171] hover:text-[#090b0f] text-xs font-semibold text-[#f87171] cursor-pointer disabled:opacity-50"
                >
                  Inativar item
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setItemEditando(null);
                    setModalNovoItem(false);
                  }}
                  className="px-4 py-2 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarItem.isPending}
                  className="px-5 py-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
