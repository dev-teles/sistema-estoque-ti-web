import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData, TIPO_LABEL } from '../../utils/format';
import type { Movimentacao, PaginatedResponse } from '../../types/estoque';

function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number)[][]) {
  const escapar = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const conteudo = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhas.map((l) => l.map(escapar).join(';'))].join('\r\n');
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function HistoricoView({ podeGerir = false }: { podeGerir?: boolean }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState('');
  const [estornandoId, setEstornandoId] = useState<number | null>(null);
  const [justificativaEstorno, setJustificativaEstorno] = useState('');
  const [erro, setErro] = useState('');
  const [exportando, setExportando] = useState(false);

  const { data } = useQuery({
    queryKey: ['movimentacoes', tipo],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<Movimentacao>>('/movimentacoes', {
          params: { tipo: tipo || undefined, per_page: 50 },
        })
      ).data.data,
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

  const exportarMensal = async () => {
    setExportando(true);
    setErro('');
    try {
      const res = await api.get<{ data: { mes: string; itens: any[] } }>('/relatorios/mensal');
      const { mes, itens } = res.data.data;
      baixarCsv(
        `fechamento_estoque_${mes}.csv`,
        ['Item', 'Categoria', 'Unidade', 'Saldo Inicial', 'Entradas', 'Consumo', 'Baixas Dano', 'Ajustes', 'Saldo Final'],
        itens.map((i) => [
          i.nome,
          i.categoria ?? '',
          i.unidade_medida,
          i.saldo_inicial,
          i.entradas,
          i.consumo,
          i.baixas_dano,
          i.ajustes,
          i.saldo_final,
        ]),
      );
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao exportar relatório mensal.');
    } finally {
      setExportando(false);
    }
  };

  const exportarCriticos = async () => {
    setExportando(true);
    setErro('');
    try {
      const res = await api.get<{ data: any[] }>('/relatorios/criticos');
      const itens = res.data.data;
      const hoje = new Date().toISOString().slice(0, 10);
      baixarCsv(
        `lista_compras_criticos_${hoje}.csv`,
        ['Item', 'Categoria', 'Disponível', 'Mínimo', 'Consumo Médio/Dia', 'Ponto de Pedido', 'Sugestão de Compra', 'Status'],
        itens.map((i) => [
          i.nome,
          i.categoria ?? '',
          i.saldo_disponivel,
          i.quantidade_minima,
          i.consumo_medio_diario,
          i.ponto_pedido,
          i.sugestao_compra,
          i.status_reposicao,
        ]),
      );
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao exportar lista de compras.');
    } finally {
      setExportando(false);
    }
  };

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
                onClick={exportarCriticos}
                className="px-3.5 py-2 border border-[#d4a359]/50 bg-[#d4a359]/10 hover:bg-[#d4a359] hover:text-[#090b0f] text-[#d4a359] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                ⬇ Lista de Compras (CSV)
              </button>
              <button
                type="button"
                disabled={exportando}
                onClick={exportarMensal}
                className="px-3.5 py-2 border border-[#2d3748] bg-[#0e1218] hover:border-[#d4a359] text-[#f1ede4] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                ⬇ Fechamento Mensal (CSV)
              </button>
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
    </div>
  );
}
