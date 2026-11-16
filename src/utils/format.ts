export function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarMoeda(valor?: number | string | null): string {
  const num = Number(valor ?? 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
