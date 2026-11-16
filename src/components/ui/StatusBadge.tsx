import type { UnidadeEstoque } from '../../types/estoque';

export const TIPO_LABEL: Record<string, { texto: string; cor: string }> = {
  entrada: {
    texto: 'Entrada',
    cor: 'bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-400',
  },
  saida: {
    texto: 'Saída',
    cor: 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400',
  },
  reserva: {
    texto: 'Reservado',
    cor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-400',
  },
  cancelamento_reserva: {
    texto: 'Reserva Cancelada',
    cor: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
  estorno: {
    texto: 'Correção / Ajuste',
    cor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400',
  },
  ajuste_auditoria: {
    texto: 'Ajuste de Contagem',
    cor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400',
  },
};

export function StatusBadge({ status }: { status: UnidadeEstoque['status_reposicao'] }) {
  const map = {
    regular: {
      label: 'Estoque OK',
      cls: 'bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-400',
    },
    alerta: {
      label: 'Acabando (Repor)',
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400',
    },
    critico: {
      label: 'Em Falta (Zerado)',
      cls: 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400',
    },
  }[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${map.cls}`}>
      {map.label}
    </span>
  );
}
