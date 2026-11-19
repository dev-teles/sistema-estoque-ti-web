import type { UnidadeEstoque } from '../../types/estoque';

export const TIPO_LABEL: Record<string, { texto: string; cor: string; dot: string }> = {
  entrada: {
    texto: 'Entrada',
    cor: 'border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]',
    dot: 'bg-[#34d399]',
  },
  saida: {
    texto: 'Saída',
    cor: 'border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]',
    dot: 'bg-[#f87171]',
  },
  reserva: {
    texto: 'Reserva',
    cor: 'border-[#d4a359]/40 bg-[#d4a359]/10 text-[#d4a359]',
    dot: 'bg-[#d4a359]',
  },
  cancelamento_reserva: {
    texto: 'Cancelada',
    cor: 'border-[#2d3748] bg-[#141922] text-[#949ba6]',
    dot: 'bg-[#5e6673]',
  },
  estorno: {
    texto: 'Ajuste',
    cor: 'border-[#e5a93c]/40 bg-[#e5a93c]/10 text-[#e5a93c]',
    dot: 'bg-[#e5a93c]',
  },
  ajuste_auditoria: {
    texto: 'Auditoria',
    cor: 'border-[#e5a93c]/40 bg-[#e5a93c]/10 text-[#e5a93c]',
    dot: 'bg-[#e5a93c]',
  },
};

export function StatusBadge({ status }: { status: UnidadeEstoque['status_reposicao'] }) {
  const map = {
    regular: {
      label: 'Em dia',
      cls: 'border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]',
      dot: 'bg-[#34d399]',
    },
    alerta: {
      label: 'Estoque baixo',
      cls: 'border-[#e5a93c]/40 bg-[#e5a93c]/10 text-[#e5a93c]',
      dot: 'bg-[#e5a93c]',
    },
    critico: {
      label: 'Em falta',
      cls: 'border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171]',
      dot: 'bg-[#f87171]',
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 border text-xs font-medium ${map.cls}`}
    >
      <span className={`w-1.5 h-1.5 ${map.dot}`} />
      {map.label}
    </span>
  );
}
