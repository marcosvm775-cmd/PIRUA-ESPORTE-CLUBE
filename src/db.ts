import Dexie, { type Table } from 'dexie';

export interface Aluno {
  id: string;
  nome: string;
  idade: number;
  categoria: string;
  posicao: string;
  dataNascimento: string;
  responsavel: string;
  telefone: string;
  rgCpf?: string;
  responsavelRgCpf?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  foto?: string;
  status?: 'ativo' | 'inativo';
  numeroCamisa?: string;
}

export interface Professor {
  id: string;
  nome: string;
  dataNascimento: string;
  rgCpf: string;
  cref: string;
  telefone: string;
  email: string;
  especialidade: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  foto?: string;
}

export interface Evento {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  dataInicio: string;
  dataFim: string;
  horario: string;
}

export interface Presenca {
  id?: number;
  alunoId: string;
  data: string;
  status: string;
}

export interface Escalacao {
  id?: number;
  eventoId: string;
  alunoId: string;
}

export interface Setting {
  key: string;
  value: string;
}

export class PiruaDatabase extends Dexie {
  alunos!: Table<Aluno>;
  professores!: Table<Professor>;
  eventos!: Table<Evento>;
  presencas!: Table<Presenca>;
  escalacoes!: Table<Escalacao>;
  settings!: Table<Setting>;
  anamneses!: Table<any>;

  constructor() {
    super('PiruaEC_LocalDB');
    this.version(1).stores({
      alunos: 'id, nome, categoria, status',
      professores: 'id, nome',
      eventos: 'id, nome, dataInicio',
      presencas: '++id, alunoId, data',
      escalacoes: '++id, eventoId, alunoId',
      settings: 'key',
      anamneses: 'alunoId'
    });
  }
}

export const localDb = new PiruaDatabase();
