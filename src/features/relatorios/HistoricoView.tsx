import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData, TIPO_LABEL } from '../../utils/format';
import {
  exportarPlanilhaFechamentoMensal,
  exportarPlanilhaListaCompras,
} from '../../utils/relatoriosExcel';
import type { Categoria, Movimentacao, PaginatedResponse, UnidadeEstoque } from '../../types/estoque';

interface ItemListaCompras {
  uid: string;
  item_id: number | string;
  nome: string;
  categoria: string;
  unidade_medida: string;
  saldo_fisico: number;
  saldo_disponivel: number;
  quantidade_minima: number;
  lead_time_dias: number;
  consumo_medio_diario: number;
  ponto_pedido: number;
  dias_cobertura: number | null;
  sugestao_compra: number;
  status_reposicao: 'critico' | 'alerta' | 'regular';
  manual?: boolean;
}

const STORAGE_KEY_LISTA = 'estoque_ti_lista_compras_v1';

interface CustomListaState {
  removidosIds: number[];
  quantidadesEditadas: Record<string, number>;
  manuais: ItemListaCompras[];
}

function carregarEstadoLista(): CustomListaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTA);
    if (!raw) return { removidosIds: [], quantidadesEditadas: {}, manuais: [] };
    const parsed = JSON.parse(raw);
    return {
      removidosIds: Array.isArray(parsed.removidosIds) ? parsed.removidosIds : [],
      quantidadesEditadas: parsed.quantidadesEditadas ?? {},
      manuais: Array.isArray(parsed.manuais) ? parsed.manuais : [],
    };
  } catch {
    return { removidosIds: [], quantidadesEditadas: {}, manuais: [] };
  }
}

function salvarEstadoLista(state: CustomListaState) {
  try {
    localStorage.setItem(STORAGE_KEY_LISTA, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function HistoricoView({
  podeGerir = false,
  ehAdmin = false,
}: {
  podeGerir?: boolean;
  ehAdmin?: boolean;
}) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState('');
  const [mesFechamento, setMesFechamento] = useState(() => new Date().toISOString().slice(0, 7));
  const [estornandoId, setEstornandoId] = useState<number | null>(null);
  const [justificativaEstorno, setJustificativaEstorno] = useState('');
  const [erro, setErro] = useState('');
  const [exportando, setExportando] = useState(false);

  // Modal de gerenciamento da Lista de Compras
  const [modalLista, setModalLista] = useState(false);
  const [janelaDias, setJanelaDias] = useState(30);
  const [itensAutomaticos, setItensAutomaticos] = useState<ItemListaCompras[]>([]);
  const [customState, setCustomState] = useState<CustomListaState>(carregarEstadoLista);

  // Formulário para adicionar item à lista
  const [modoAdicao, setModoAdicao] = useState<'catalogo' | 'avulso'>('catalogo');
  const [itemCatalogoId, setItemCatalogoId] = useState('');
  const [qtdAdicao, setQtdAdicao] = useState(1);
  const [nomeAvulso, setNomeAvulso] = useState('');
  const [categoriaAvulsa, setCategoriaAvulsa] = useState('');
  const [unidadeAvulsa, setUnidadeAvulsa] = useState('un');
  const [prioridadeAvulsa, setPrioridadeAvulsa] = useState<'critico' | 'alerta' | 'regular'>('alerta');

  const { data } = useQuery({
    queryKey: ['movimentacoes', tipo],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<Movimentacao>>('/movimentacoes', {
          params: { tipo: tipo || undefined, per_page: 50 },
        })
      ).data.data,
  });

  const { data: estoqueCatalogo } = useQuery({
    queryKey: ['estoque-lista-compras'],
    enabled: modalLista && ehAdmin,
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<UnidadeEstoque>>('/estoque', {
          params: { per_page: 200 },
        })
      ).data.data,
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    enabled: modalLista && ehAdmin,
    queryFn: async () => (await api.get<{ data: Categoria[] }>('/categorias')).data.data,
  });

  const estornar = useMutation({
    mutationFn: async ({ movimentacao_id, justificativa }: { movimentacao_id: number; justificativa: string }) => {
      await api.post('/estoque/estorno', { movimentacao_id, justificativa });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimentacoes'] });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setEstornandoId(null);
      setJustificativaEstorno('');
      setErro('');
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? (Object.values(errors).flat()[0] as string) : null;
      setErro(firstError || err?.response?.data?.message || 'Erro ao estornar lançamento.');
    },
  });

  const atualizarCustomState = (updater: (prev: CustomListaState) => CustomListaState) => {
    setCustomState((prev) => {
      const next = updater(prev);
      salvarEstadoLista(next);
      return next;
    });
  };

  // Monta a lista final combinando os itens automáticos (não removidos) + itens adicionados manualmente
  const itensListaFinal: ItemListaCompras[] = [
    ...itensAutomaticos
      .filter((i) => !customState.removidosIds.includes(Number(i.item_id)))
      .map((i) => ({
        ...i,
        sugestao_compra:
          customState.quantidadesEditadas[i.uid] !== undefined
            ? customState.quantidadesEditadas[i.uid]
            : i.sugestao_compra,
      })),
    ...customState.manuais.map((m) => ({
      ...m,
      sugestao_compra:
        customState.quantidadesEditadas[m.uid] !== undefined
          ? customState.quantidadesEditadas[m.uid]
          : m.sugestao_compra,
    })),
  ];

  const exportarMensal = async () => {
    setExportando(true);
    setErro('');
    try {
      const res = await api.get<{
        data: {
          mes: string;
          periodo?: { inicio: string; fim: string };
          totais?: any;
          itens: any[];
        };
      }>('/relatorios/mensal', {
        params: { mes: mesFechamento || undefined },
      });
      exportarPlanilhaFechamentoMensal(res.data.data);
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao exportar relatório mensal.');
    } finally {
      setExportando(false);
    }
  };

  const abrirOuExportarListaCompras = async () => {
    setExportando(true);
    setErro('');
    try {
      const res = await api.get<{ data: any[]; janela_consumo_dias?: number }>('/relatorios/criticos');
      const janela = res.data.janela_consumo_dias ?? 30;
      const mapeados: ItemListaCompras[] = (res.data.data ?? []).map((i: any) => ({
        uid: `auto-${i.item_id}`,
        item_id: i.item_id,
        nome: i.nome ?? '',
        categoria: i.categoria ?? 'Sem categoria',
        unidade_medida: i.unidade_medida ?? 'un',
        saldo_fisico: Number(i.saldo_fisico ?? i.saldo_disponivel ?? 0),
        saldo_disponivel: Number(i.saldo_disponivel ?? 0),
        quantidade_minima: Number(i.quantidade_minima ?? 0),
        lead_time_dias: Number(i.lead_time_dias ?? 0),
        consumo_medio_diario: Number(i.consumo_medio_diario ?? 0),
        ponto_pedido: Number(i.ponto_pedido ?? 0),
        dias_cobertura: i.dias_cobertura ?? null,
        sugestao_compra: Math.max(1, Number(i.sugestao_compra ?? 1)),
        status_reposicao: i.status_reposicao ?? 'critico',
      }));

      setJanelaDias(janela);
      setItensAutomaticos(mapeados);

      if (ehAdmin) {
        setModalLista(true);
      } else {
        exportarPlanilhaListaCompras(mapeados, janela);
      }
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao carregar lista de compras.');
    } finally {
      setExportando(false);
    }
  };

  const handleRemoverDaLista = (item: ItemListaCompras) => {
    if (item.manual) {
      atualizarCustomState((prev) => {
        const novasQtds = { ...prev.quantidadesEditadas };
        delete novasQtds[item.uid];
        return {
          ...prev,
          manuais: prev.manuais.filter((m) => m.uid !== item.uid),
          quantidadesEditadas: novasQtds,
        };
      });
    } else {
      atualizarCustomState((prev) => ({
        ...prev,
        removidosIds: [...new Set([...prev.removidosIds, Number(item.item_id)])],
      }));
    }
  };

  const handleAlterarQtdLista = (uid: string, novaQtd: number) => {
    const qtdValida = Math.max(1, Math.floor(Number(novaQtd) || 1));
    atualizarCustomState((prev) => ({
      ...prev,
      quantidadesEditadas: {
        ...prev.quantidadesEditadas,
        [uid]: qtdValida,
      },
    }));
  };

  const handleAdicionarItemLista = (e: React.FormEvent) => {
    e.preventDefault();
    const qtd = Math.max(1, Math.floor(Number(qtdAdicao) || 1));

    if (modoAdicao === 'catalogo') {
      const idNum = Number(itemCatalogoId);
      if (!idNum) return;

      // Se o item era automático e estava removido, restaura com a nova quantidade
      const autoExistente = itensAutomaticos.find((a) => Number(a.item_id) === idNum);
      if (autoExistente) {
        atualizarCustomState((prev) => ({
          ...prev,
          removidosIds: prev.removidosIds.filter((id) => id !== idNum),
          quantidadesEditadas: {
            ...prev.quantidadesEditadas,
            [autoExistente.uid]: qtd,
          },
        }));
        setItemCatalogoId('');
        setQtdAdicao(1);
        return;
      }

      const unidadeCat = estoqueCatalogo?.find((u) => u.item.id === idNum);
      if (!unidadeCat) return;

      const novoItem: ItemListaCompras = {
        uid: `cat-${unidadeCat.item.id}`,
        item_id: unidadeCat.item.id,
        nome: unidadeCat.item.nome,
        categoria: unidadeCat.item.categoria?.nome ?? 'Sem categoria',
        unidade_medida: unidadeCat.item.unidade_medida ?? 'un',
        saldo_fisico: unidadeCat.saldo_fisico,
        saldo_disponivel: unidadeCat.saldo_disponivel,
        quantidade_minima: unidadeCat.item.quantidade_minima,
        lead_time_dias: unidadeCat.item.lead_time_dias ?? 7,
        consumo_medio_diario: 0,
        ponto_pedido: unidadeCat.item.quantidade_minima,
        dias_cobertura: null,
        sugestao_compra: qtd,
        status_reposicao:
          unidadeCat.saldo_disponivel <= 0
            ? 'critico'
            : unidadeCat.saldo_disponivel <= unidadeCat.item.quantidade_minima
              ? 'alerta'
              : 'regular',
        manual: true,
      };

      atualizarCustomState((prev) => ({
        ...prev,
        manuais: [...prev.manuais.filter((m) => m.uid !== novoItem.uid), novoItem],
        quantidadesEditadas: {
          ...prev.quantidadesEditadas,
          [novoItem.uid]: qtd,
        },
      }));
      setItemCatalogoId('');
      setQtdAdicao(1);
    } else {
      const nomeLimpo = nomeAvulso.trim();
      if (!nomeLimpo) return;
      const uid = `avulso-${Date.now()}`;
      const novoAvulso: ItemListaCompras = {
        uid,
        item_id: 'NOVO',
        nome: nomeLimpo,
        categoria: categoriaAvulsa.trim() || 'Geral TI',
        unidade_medida: unidadeAvulsa || 'un',
        saldo_fisico: 0,
        saldo_disponivel: 0,
        quantidade_minima: 0,
        lead_time_dias: 7,
        consumo_medio_diario: 0,
        ponto_pedido: qtd,
        dias_cobertura: null,
        sugestao_compra: qtd,
        status_reposicao: prioridadeAvulsa,
        manual: true,
      };

      atualizarCustomState((prev) => ({
        ...prev,
        manuais: [...prev.manuais, novoAvulso],
      }));
      setNomeAvulso('');
      setQtdAdicao(1);
    }
  };

  const handleRestaurarListaAutomatica = () => {
    const limpo: CustomListaState = { removidosIds: [], quantidadesEditadas: {}, manuais: [] };
    setCustomState(limpo);
    salvarEstadoLista(limpo);
  };

  const idsNaLista = new Set(itensListaFinal.map((i) => Number(i.item_id)).filter((n) => Number.isFinite(n)));
  const opcoesCatalogoDisponiveis = (estoqueCatalogo ?? []).filter((u) => !idsNaLista.has(u.item.id));
  const temCustomizacao =
    customState.removidosIds.length > 0 ||
    customState.manuais.length > 0 ||
    Object.keys(customState.quantidadesEditadas).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#f1ede4]">Histórico</h1>

        <div className="flex flex-wrap items-center gap-2.5">
          {podeGerir && (
            <>
              <button
                type="button"
                disabled={exportando}
                onClick={abrirOuExportarListaCompras}
                className="px-3.5 py-2 border border-[#d4a359]/50 bg-[#d4a359]/10 hover:bg-[#d4a359] hover:text-[#090b0f] text-[#d4a359] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {ehAdmin ? '🛒 Lista de Compras (.xlsx)' : '⬇ Lista de Compras (.xlsx)'}
              </button>
              <div className="flex items-center border border-[#2d3748] bg-[#0e1218]">
                <input
                  type="month"
                  aria-label="Mês do fechamento"
                  value={mesFechamento}
                  onChange={(e) => setMesFechamento(e.target.value)}
                  className="bg-transparent px-2.5 py-1.5 text-xs text-[#f1ede4] focus:outline-none border-r border-[#2d3748]"
                />
                <button
                  type="button"
                  disabled={exportando}
                  onClick={exportarMensal}
                  className="px-3.5 py-2 hover:bg-[#141922] hover:text-[#d4a359] text-[#f1ede4] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  ⬇ Fechamento Mensal (.xlsx)
                </button>
              </div>
            </>
          )}

          <select
            aria-label="Filtrar por tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-[#2d3748] bg-[#0e1218] px-3.5 py-2 text-sm text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
          >
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
            <option value="reserva">Reservas</option>
            <option value="cancelamento_reserva">Canceladas</option>
            <option value="estorno">Ajustes / Estornos</option>
            <option value="ajuste_auditoria">Auditorias</option>
          </select>
        </div>
      </div>

      {erro && (
        <div className="border-l-2 border-[#f87171] bg-[#f87171]/10 px-3 py-2 text-xs text-[#f87171]">
          {erro}
        </div>
      )}

      <div className="bg-[#0e1218] border border-[#1f2633] overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2d3748] bg-[#090b0f] text-xs font-semibold text-[#949ba6]">
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4 text-right">Qtd.</th>
              <th className="py-3 px-4 text-right">Saldo</th>
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4">Destino / Obs.</th>
              {podeGerir && <th className="py-3 px-4 text-right">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2633]">
            {data?.map((m) => {
              const info = TIPO_LABEL[m.tipo] ?? {
                texto: m.tipo,
                cor: 'border-[#2d3748] bg-[#141922] text-[#949ba6]',
                dot: 'bg-[#5e6673]',
              };
              const podeEstornarLinha =
                podeGerir && (m.tipo === 'entrada' || m.tipo === 'saida') && !m.estornada;

              return (
                <tr key={m.id} className="hover:bg-[#141922] transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-[#949ba6]">
                    {formatarData(m.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-xs font-medium ${info.cor}`}
                    >
                      <span className={`w-1.5 h-1.5 ${info.dot}`} />
                      {info.texto}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#f1ede4]">{m.item?.nome}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#f1ede4]">
                    {m.quantidade}
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-[#949ba6]">
                    {m.saldo_fisico_apos}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#f1ede4]">{m.user?.name}</td>
                  <td className="py-3 px-4 text-xs text-[#949ba6]">
                    {m.destino || m.justificativa || '—'}
                  </td>
                  {podeGerir && (
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {m.estornada ? (
                        <span className="text-[11px] text-[#5e6673]">Estornado</span>
                      ) : podeEstornarLinha ? (
                        estornandoId === m.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              estornar.mutate({
                                movimentacao_id: m.id,
                                justificativa: justificativaEstorno,
                              });
                            }}
                            className="flex items-center justify-end gap-1.5"
                          >
                            <input
                              type="text"
                              required
                              minLength={10}
                              placeholder="Motivo do estorno (mín. 10 letras)"
                              value={justificativaEstorno}
                              onChange={(e) => setJustificativaEstorno(e.target.value)}
                              className="w-56 border border-[#2d3748] bg-[#090b0f] px-2.5 py-1 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                            />
                            <button
                              type="submit"
                              disabled={estornar.isPending}
                              className="px-2.5 py-1 bg-[#f87171] hover:bg-[#ef4444] text-[#090b0f] font-semibold text-xs cursor-pointer disabled:opacity-50"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEstornandoId(null);
                                setJustificativaEstorno('');
                              }}
                              className="px-2 py-1 border border-[#2d3748] bg-[#090b0f] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
                            >
                              ✕
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEstornandoId(m.id);
                              setJustificativaEstorno('');
                              setErro('');
                            }}
                            className="px-2.5 py-1 border border-[#2d3748] bg-[#090b0f] hover:border-[#f87171] hover:text-[#f87171] text-xs text-[#949ba6] transition-colors cursor-pointer"
                          >
                            Estornar
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-[#5e6673]">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Admin: Gerenciar Lista de Compras (adicionar, editar quantidades e remover itens) */}
      {modalLista && ehAdmin && (
        <div className="fixed inset-0 z-50 bg-[#090b0f]/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e1218] border border-[#2d3748] w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-[#1f2633] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#f1ede4]">
                  Gerenciar Lista de Compras
                </h2>
                <p className="text-xs text-[#949ba6] mt-0.5">
                  Adicione itens do catálogo ou itens novos, ajuste as quantidades ou remova itens antes de gerar a planilha (.xlsx).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalLista(false)}
                className="px-2.5 py-1 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulário de Adição */}
            <form
              onSubmit={handleAdicionarItemLista}
              className="px-6 py-4 bg-[#090b0f] border-b border-[#1f2633] space-y-3"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#d4a359] uppercase tracking-wider">
                    + Adicionar à lista:
                  </span>
                  <button
                    type="button"
                    onClick={() => setModoAdicao('catalogo')}
                    className={`px-2.5 py-1 text-xs border cursor-pointer transition-colors ${
                      modoAdicao === 'catalogo'
                        ? 'border-[#d4a359] bg-[#d4a359]/15 text-[#f1ede4] font-semibold'
                        : 'border-[#2d3748] text-[#949ba6] hover:text-[#f1ede4]'
                    }`}
                  >
                    Item do Catálogo
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoAdicao('avulso')}
                    className={`px-2.5 py-1 text-xs border cursor-pointer transition-colors ${
                      modoAdicao === 'avulso'
                        ? 'border-[#d4a359] bg-[#d4a359]/15 text-[#f1ede4] font-semibold'
                        : 'border-[#2d3748] text-[#949ba6] hover:text-[#f1ede4]'
                    }`}
                  >
                    Item Avulso / Novo
                  </button>
                </div>

                {temCustomizacao && (
                  <button
                    type="button"
                    onClick={handleRestaurarListaAutomatica}
                    className="text-xs text-[#949ba6] hover:text-[#d4a359] underline cursor-pointer"
                  >
                    ↺ Restaurar lista automática
                  </button>
                )}
              </div>

              {modoAdicao === 'catalogo' ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] text-[#949ba6] mb-1">
                      Selecionar item cadastrado no estoque
                    </label>
                    <select
                      value={itemCatalogoId}
                      onChange={(e) => setItemCatalogoId(e.target.value)}
                      required
                      className="w-full border border-[#2d3748] bg-[#0e1218] px-3 py-2 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                    >
                      <option value="">Selecione um item...</option>
                      {opcoesCatalogoDisponiveis.map((u) => (
                        <option key={u.item.id} value={u.item.id}>
                          {u.item.nome} ({u.item.categoria?.nome ?? 'Sem categoria'}) — Disp.: {u.saldo_disponivel} {u.item.unidade_medida}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-[#949ba6] mb-1">
                      Qtd. p/ Compra
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={qtdAdicao}
                      onChange={(e) => setQtdAdicao(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-[#2d3748] bg-[#0e1218] px-3 py-2 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer transition-colors"
                    >
                      + Incluir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-[#949ba6] mb-1">
                      Nome / Descrição do Item
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex.: Switch Gerenciável 24p PoE"
                      value={nomeAvulso}
                      onChange={(e) => setNomeAvulso(e.target.value)}
                      className="w-full border border-[#2d3748] bg-[#0e1218] px-3 py-2 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-[#949ba6] mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      list="categorias-sugestao"
                      placeholder="Ex.: Redes e Infra"
                      value={categoriaAvulsa}
                      onChange={(e) => setCategoriaAvulsa(e.target.value)}
                      className="w-full border border-[#2d3748] bg-[#0e1218] px-3 py-2 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                    />
                    <datalist id="categorias-sugestao">
                      {categorias?.map((c) => (
                        <option key={c.id} value={c.nome} />
                      ))}
                    </datalist>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] text-[#949ba6] mb-1">
                      Unid.
                    </label>
                    <input
                      type="text"
                      value={unidadeAvulsa}
                      onChange={(e) => setUnidadeAvulsa(e.target.value)}
                      className="w-full border border-[#2d3748] bg-[#0e1218] px-2.5 py-2 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-[#949ba6] mb-1">
                      Prioridade
                    </label>
                    <select
                      value={prioridadeAvulsa}
                      onChange={(e) => setPrioridadeAvulsa(e.target.value as any)}
                      className="w-full border border-[#2d3748] bg-[#0e1218] px-2.5 py-2 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                    >
                      <option value="critico">Crítico</option>
                      <option value="alerta">Alerta</option>
                      <option value="regular">Ponto de Pedido</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] text-[#949ba6] mb-1">
                      Qtd.
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={qtdAdicao}
                      onChange={(e) => setQtdAdicao(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-[#2d3748] bg-[#0e1218] px-2.5 py-2 text-xs text-[#f1ede4] focus:outline-none focus:border-[#d4a359]"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="submit"
                      className="w-full py-2 px-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer transition-colors"
                    >
                      + Incluir
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Tabela de Itens na Lista de Compras */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#090b0f] border-b border-[#2d3748] text-[#949ba6]">
                  <tr>
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3 text-right">Disponível</th>
                    <th className="py-2.5 px-3 text-right">Mínimo</th>
                    <th className="py-2.5 px-3 text-center">Origem</th>
                    <th className="py-2.5 px-3 text-right">Qtd. p/ Compra</th>
                    <th className="py-2.5 px-4 text-right">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2633]">
                  {itensListaFinal.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-[#5e6673]">
                        A lista de compras está vazia. Use o formulário acima para adicionar itens do catálogo ou itens avulsos.
                      </td>
                    </tr>
                  ) : (
                    itensListaFinal.map((item) => (
                      <tr key={item.uid} className="hover:bg-[#141922] transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-[#f1ede4]">
                          {item.nome}
                        </td>
                        <td className="py-2.5 px-3 text-[#949ba6]">{item.categoria}</td>
                        <td className="py-2.5 px-3 text-right text-[#949ba6]">
                          {item.saldo_disponivel} {item.unidade_medida}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#949ba6]">
                          {item.quantidade_minima} {item.unidade_medida}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 border text-[11px] ${
                              item.manual
                                ? 'border-[#d4a359]/40 bg-[#d4a359]/10 text-[#d4a359]'
                                : 'border-[#2d3748] bg-[#141922] text-[#949ba6]'
                            }`}
                          >
                            {item.manual ? 'Adicionado pelo Admin' : 'Automático (Estoque)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min={1}
                            aria-label={`Quantidade para compra de ${item.nome}`}
                            value={item.sugestao_compra}
                            onChange={(e) => handleAlterarQtdLista(item.uid, Number(e.target.value))}
                            className="w-20 border border-[#2d3748] bg-[#090b0f] px-2 py-1 text-right font-bold text-[#d4a359] focus:outline-none focus:border-[#d4a359]"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoverDaLista(item)}
                            className="px-2.5 py-1 border border-[#2d3748] bg-[#090b0f] hover:border-[#f87171] hover:text-[#f87171] text-[#949ba6] cursor-pointer transition-colors"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé do Modal */}
            <div className="px-6 py-4 border-t border-[#1f2633] bg-[#090b0f] flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-[#949ba6]">
                Total na lista:{' '}
                <strong className="text-[#f1ede4]">{itensListaFinal.length} item(ns)</strong> •{' '}
                Unidades p/ compra:{' '}
                <strong className="text-[#d4a359]">
                  {itensListaFinal.reduce((acc, i) => acc + Number(i.sugestao_compra || 0), 0)}
                </strong>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalLista(false)}
                  className="px-4 py-2 border border-[#2d3748] text-xs text-[#949ba6] hover:text-[#f1ede4] cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => exportarPlanilhaListaCompras(itensListaFinal, janelaDias)}
                  className="px-5 py-2 bg-[#d4a359] hover:bg-[#e0b26b] text-[#090b0f] font-semibold text-xs cursor-pointer transition-colors"
                >
                  ⬇ Baixar Planilha (.xlsx)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
