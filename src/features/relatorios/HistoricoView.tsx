import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatarData } from '../../utils/format';
import { TIPO_LABEL } from '../../components/ui/StatusBadge';
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
    <div className="space-y-4">
      <div className="bg-slate-800 p-4 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Histórico de entradas e saídas</h2>
        </div>

        <select
          aria-label="Filtrar histórico por tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Mostrar tudo</option>
          <option value="entrada">Apenas Entradas</option>
          <option value="saida">Apenas Saídas</option>
          <option value="reserva">Apenas Reservas</option>
        </select>
      </div>

      <div className="bg-slate-800 border border-slate-700 overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-sky-400 text-slate-950 font-semibold">
              <th className="py-3 px-4">Quando</th>
              <th className="py-3 px-4">O que houve</th>
              <th className="py-3 px-4">Equipamento / Material</th>
              <th className="py-3 px-4 text-center">Quantidade</th>
              <th className="py-3 px-4 text-center">Ficou no Estoque</th>
              <th className="py-3 px-4">Quem registrou</th>
              <th className="py-3 px-4">Para quem / Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data?.map((m) => {
              const info = TIPO_LABEL[m.tipo] ?? { texto: m.tipo, cor: 'bg-slate-700 text-slate-200' };
              return (
                <tr key={m.id}>
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                    {formatarData(m.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.cor}`}>
                      {info.texto}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold">{m.item?.nome}</td>
                  <td className="py-3 px-4 text-center font-bold">{m.quantidade} un</td>
                  <td className="py-3 px-4 text-center font-medium">{m.saldo_fisico_apos} un</td>
                  <td className="py-3 px-4">{m.user?.name}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
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
