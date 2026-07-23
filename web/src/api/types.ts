/**
 * Finalidade: tipos das entidades retornadas pela API (espelham as projeções do backend).
 * Relações: usados pelas páginas ao consumir api/client.
 */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  emailVerificado: boolean;
}

export type RotaStatus = "planejamento" | "em_andamento" | "concluida" | "cancelada";
export type Prioridade = "baixa" | "media" | "alta";
export type OrigemEntrada = "manual" | "foto" | "voz";

export interface Rota {
  id: string;
  status: RotaStatus;
  dataCriacao: string;
  modoOffline: boolean;
}

export interface Parada {
  id: string;
  idRota: string;
  enderecoTexto: string;
  latitude: number | null;
  longitude: number | null;
  ordemOriginal: number;
  ordemOtimizada: number | null;
  janelaHorarioInicio: string | null;
  janelaHorarioFim: string | null;
  prioridade: Prioridade | null;
  origemEntrada: OrigemEntrada;
  status: "pendente" | "concluida" | "pulada";
  descricaoPacote: string | null;
}

export interface RotaDetalhe extends Rota {
  paradas: Parada[];
}
