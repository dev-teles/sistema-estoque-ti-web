import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(err);
  },
);

export interface AuvoTarefa {
  task_id: number;
  solicitante: string;
  orientacao?: string | null;
  modo_demo?: boolean;
}

export async function buscarTarefaAuvo(rawId: string): Promise<AuvoTarefa> {
  const idLimpo = rawId.replace(/\D/g, '');
  if (!idLimpo) {
    throw new Error('Informe o nº da tarefa.');
  }
  const res = await api.get<{ data: AuvoTarefa }>(`/auvo/tarefas/${idLimpo}`);
  return res.data.data;
}
