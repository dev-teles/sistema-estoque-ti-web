export type Role = 'admin' | 'gestor' | 'operador';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: Role;
  role_label: string;
  ativo: boolean;
  ultimo_login_em?: string | null;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string | null;
  itens_count?: number;
}

export interface ItemCatalogo {
  id: number;
  nome: string;
  descricao?: string | null;
  categoria_id: number;
  categoria?: { id: number; nome: string };
  unidade_medida?: string;
  quantidade_minima: number;
  lead_time_dias: number;
  ativo?: boolean;
  saldo_fisico?: number;
  saldo_disponivel?: number;
}

export interface UnidadeEstoque {
  id: number;
  item: ItemCatalogo;
  saldo_fisico: number;
  saldo_reservado?: number;
  saldo_disponivel: number;
  status_reposicao: 'regular' | 'alerta' | 'critico';
  atualizado_em?: string;
}

export type TipoMovimentacao =
  | 'entrada'
  | 'saida'
  | 'reserva'
  | 'cancelamento_reserva'
  | 'estorno'
  | 'ajuste_auditoria';

export interface Movimentacao {
  id: number;
  tipo: TipoMovimentacao;
  motivo?: 'consumo' | 'transferencia' | 'dano' | null;
  quantidade: number;
  delta_fisico: number;
  delta_reservado: number;
  saldo_fisico_apos: number;
  saldo_reservado_apos: number;
  valor_unitario?: string | null;
  item?: { id: number; nome: string; unidade_medida: string };
  user?: { id: number; name: string };
  nota_fiscal?: { id: number; numero: string } | null;
  reserva_id?: number | null;
  auditoria_id?: number | null;
  movimentacao_estornada_id?: number | null;
  estornada?: boolean;
  destino?: string | null;
  justificativa?: string | null;
  created_at: string;
}

export interface Reserva {
  id: number;
  item_id: number;
  item?: { id: number; nome: string; unidade_medida: string };
  solicitante: string;
  quantidade: number;
  status: 'reservado' | 'entregue' | 'cancelado';
  observacao?: string | null;
  criado_por?: { id: number; name: string };
  finalizada_por?: { id: number; name: string } | null;
  finalizada_em?: string | null;
  created_at: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  contato_nome?: string | null;
  email?: string | null;
  telefone?: string | null;
}

export interface NotaFiscal {
  id: number;
  numero: string;
  serie: string;
  data_emissao: string;
  valor_total?: string | null;
  observacao?: string | null;
  fornecedor?: { id: number; nome: string; cnpj: string };
  registrada_por?: { id: number; name: string };
  itens_count?: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
