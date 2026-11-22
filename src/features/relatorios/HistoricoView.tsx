import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData, TIPO_LABEL } from '../../utils/format';
import type { Movimentacao, PaginatedResponse } from '../../types/estoque';

export function HistoricoView() {
  const [tipo, setTipo] = useState('');
  const { data } = useQuery({
    queryKey: ['movimentacoes', tipo],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<Movimentacao>>('/movimentacoes', {
          params: { tipo: tipo || undefined, per_page: 50 },
        })
      ).data.data,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#f1ede4]">Histórico</h1>

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
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2633]">
            {data?.map((m) => {
              const info = TIPO_LABEL[m.tipo] ?? {
                texto: m.tipo,
                cor: 'border-[#2d3748] bg-[#141922] text-[#949ba6]',
                dot: 'bg-[#5e6673]',
              };
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
