import type { UnidadeEstoque } from '../../types/estoque';

export const TIPO_LABEL: Record<string, { texto: string; cor: string }> = {
  entrada: {
    texto: 'Entrada',
    cor: 'bg-green-950/70 text-green-400',
  },
  saida: {
    texto: 'Saída',
    cor: 'bg-red-950/70 text-red-400',
  },
  reserva: {
    texto: 'Reservado',
    cor: 'bg-sky-950/70 text-sky-400',
  },
  cancelamento_reserva: {
    texto: 'Reserva Cancelada',
    cor: 'bg-slate-700 text-slate-300',
  },
  estorno: {
    texto: 'Correção / Ajuste',
    cor: 'bg-amber-950/70 text-amber-400',
  },
  ajuste_auditoria: {
    texto: 'Ajuste de Contagem',
    cor: 'bg-amber-950/70 text-amber-400',
  },
};

export function StatusBadge({ status }: { status: UnidadeEstoque['status_reposicao'] }) {
  const map = {
    regular: {
      label: 'Tudo certo',
      cls: 'bg-green-950/70 text-green-400',
    },
    alerta: {
      label: 'Poucos itens',
      cls: 'bg-amber-950/70 text-amber-400',
    },
    critico: {
      label: 'Em Falta',
      cls: 'bg-red-950/70 text-red-400',
    },
  }[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${map.cls}`}>
      {map.label}
    </span>
  );
}
