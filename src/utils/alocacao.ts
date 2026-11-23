const STORAGE_KEY_SETORES = 'estoque_ti_setores_v1';

export const SETORES_PADRAO = [
  'TI',
  'Financeiro',
  'RH',
  'Comercial',
  'Diretoria',
  'Recepção',
  'Operações',
  'Atendimento',
  'Marketing',
  'Logística',
  'Sala de Reuniões',
];

export function listarSetores(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETORES);
    if (!raw) return SETORES_PADRAO;
    const extras = JSON.parse(raw);
    if (!Array.isArray(extras)) return SETORES_PADRAO;
    return Array.from(new Set([...SETORES_PADRAO, ...extras.filter((s) => typeof s === 'string' && s.trim() !== '')]));
  } catch {
    return SETORES_PADRAO;
  }
}

export function registrarSetor(setor: string) {
  const limpo = setor.trim();
  if (!limpo) return;
  try {
    const atuais = listarSetores();
    if (!atuais.some((s) => s.toLowerCase() === limpo.toLowerCase())) {
      localStorage.setItem(STORAGE_KEY_SETORES, JSON.stringify([...atuais, limpo]));
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Formata o vínculo do equipamento/movimentação para envio à API:
 * - Setor + Pessoa -> "Setor: <setor> • Pessoa: <pessoa>"
 * - Apenas Setor   -> "Setor: <setor>"
 * - Apenas Pessoa  -> "<pessoa>"
 */
export function formatarVinculoDestino(setor: string, pessoa: string): string {
  const s = setor.trim();
  const p = pessoa.trim();

  if (s && p) {
    return `Setor: ${s} • Pessoa: ${p}`.slice(0, 150);
  }
  if (s) {
    return `Setor: ${s}`.slice(0, 150);
  }
  if (p) {
    return p.slice(0, 150);
  }
  return '';
}
