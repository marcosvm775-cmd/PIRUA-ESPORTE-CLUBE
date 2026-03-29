import { supabase } from '../supabase';

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

export interface Escalacao {
  eventoId: string;
  lista: string[];
}

export interface Solicitacao {
  id: string;
  nome: string;
  dataNascimento: string;
  rgCpf: string;
  telefone: string;
  categoria: string;
  responsavel: string;
  responsavelRgCpf: string;
  telefoneResponsavel: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  createdAt: string;
  // Anamnese fields
  horarioDormir?: string;
  dificuldadeAcordar?: boolean;
  tempoCelular?: string;
  alimentaBem?: boolean;
  frequenciaMedico?: string;
  fraturas?: string;
  tratamentoMedico?: string;
  medicacaoControlada?: string;
  outroExercicio?: string;
  alergias?: string;
  foto?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface Anamnese {
  alunoId: string;
  horarioDormir: string;
  dificuldadeAcordar: boolean;
  tempoCelular: string;
  alimentaBem: boolean;
  frequenciaMedico: string;
  fraturas: string;
  tratamentoMedico: string;
  medicacaoControlada: string;
  outroExercicio: string;
  alergias: string;
  updatedAt: string;
}

export const supabaseService = {
  // Alunos
  async getAlunos() {
    const { data, error } = await supabase
      .from('alunos')
      .select('*');
    if (error) throw error;
    return data as Aluno[];
  },

  async saveAluno(aluno: Aluno) {
    const { data, error } = await supabase
      .from('alunos')
      .upsert(aluno)
      .select();
    if (error) throw error;
    return data[0] as Aluno;
  },

  async deleteAluno(id: string) {
    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Professores
  async getProfessores() {
    const { data, error } = await supabase
      .from('professores')
      .select('*');
    if (error) throw error;
    return data as Professor[];
  },

  async saveProfessor(professor: Professor) {
    const { data, error } = await supabase
      .from('professores')
      .upsert(professor)
      .select();
    if (error) throw error;
    return data[0] as Professor;
  },

  async deleteProfessor(id: string) {
    const { error } = await supabase
      .from('professores')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Eventos
  async getEventos() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*');
    if (error) throw error;
    return data as Evento[];
  },

  async saveEvento(evento: Evento) {
    const { data, error } = await supabase
      .from('eventos')
      .upsert(evento)
      .select();
    if (error) throw error;
    return data[0] as Evento;
  },

  async deleteEvento(id: string) {
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Escalacoes
  async getEscalacoes() {
    const { data, error } = await supabase
      .from('escalacoes')
      .select('*');
    if (error) throw error;
    return data as Escalacao[];
  },

  async saveEscalacao(escalacao: Escalacao) {
    const { error } = await supabase
      .from('escalacoes')
      .upsert(escalacao);
    if (error) throw error;
  },

  // Presenças
  async getPresencas(data?: string) {
    let query = supabase.from('presencas').select('*');
    if (data) {
      query = query.eq('data', data);
    }
    const { data: presencas, error } = await query;
    if (error) throw error;
    return presencas;
  },

  async savePresence(alunoId: string, data: string, status: string) {
    const { error } = await supabase
      .from('presencas')
      .upsert({
        aluno_id: alunoId,
        data: data,
        status: status
      }, { onConflict: 'aluno_id,data' });
    if (error) throw error;
  },

  async savePresencas(data: string, lista: { alunoId: string, status: string }[]) {
    const toInsert = lista.map(item => ({
      aluno_id: item.alunoId,
      data: data,
      status: item.status
    }));

    const { error } = await supabase
      .from('presencas')
      .upsert(toInsert, { onConflict: 'aluno_id,data' });
    if (error) throw error;
  },

  // Solicitacoes
  async getSolicitacoes() {
    const { data, error } = await supabase
      .from('solicitacoes_cadastro')
      .select('*');
    if (error) throw error;
    return data as Solicitacao[];
  },

  async saveSolicitacao(solicitacao: Solicitacao) {
    const { error } = await supabase
      .from('solicitacoes_cadastro')
      .upsert(solicitacao);
    if (error) throw error;
  },

  async deleteSolicitacao(id: string) {
    const { error } = await supabase
      .from('solicitacoes_cadastro')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Anamneses
  async getAnamneses() {
    const { data, error } = await supabase
      .from('anamneses')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getAnamnese(alunoId: string) {
    const { data, error } = await supabase
      .from('anamneses')
      .select('*')
      .eq('aluno_id', alunoId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    if (!data) return null;
    return {
      alunoId: data.aluno_id,
      horarioDormir: data.horario_dormir,
      dificuldadeAcordar: data.dificuldade_acordar,
      tempoCelular: data.tempo_celular,
      alimentaBem: data.alimenta_bem,
      frequenciaMedico: data.frequencia_medico,
      fraturas: data.fraturas,
      tratamentoMedico: data.tratamento_medico,
      medicacaoControlada: data.medicacao_controlada,
      outroExercicio: data.outro_exercicio,
      alergias: data.alergias,
      updatedAt: data.updated_at
    } as Anamnese;
  },

  async saveAnamnese(anamnese: Anamnese) {
    const { error } = await supabase
      .from('anamneses')
      .upsert({
        aluno_id: anamnese.alunoId,
        horario_dormir: anamnese.horarioDormir,
        dificuldade_acordar: anamnese.dificuldadeAcordar,
        tempo_celular: anamnese.tempoCelular,
        alimenta_bem: anamnese.alimentaBem,
        frequencia_medico: anamnese.frequenciaMedico,
        fraturas: anamnese.fraturas,
        tratamento_medico: anamnese.tratamentoMedico,
        medicacao_controlada: anamnese.medicacaoControlada,
        outro_exercicio: anamnese.outroExercicio,
        alergias: anamnese.alergias,
        updated_at: anamnese.updatedAt
      });
    if (error) throw error;
  },

  // Settings
  async getSettings() {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    return data.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  },

  async saveSetting(key: string, value: string) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value });
    if (error) throw error;
  }
};
