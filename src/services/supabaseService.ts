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

  async savePresencas(data: string, lista: { alunoId: string, status: string }[]) {
    // Delete existing for that date
    await supabase.from('presencas').delete().eq('data', data);
    
    const toInsert = lista.map(item => ({
      aluno_id: item.alunoId,
      data: data,
      status: item.status
    }));

    const { error } = await supabase.from('presencas').insert(toInsert);
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
