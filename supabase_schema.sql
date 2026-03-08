-- Migration for Supabase (PostgreSQL)
-- Run this in your Supabase SQL Editor

-- 1. Alunos Table
CREATE TABLE IF NOT EXISTS alunos (
    id TEXT PRIMARY KEY,
    nome TEXT,
    idade INTEGER,
    categoria TEXT,
    posicao TEXT,
    data_nascimento TEXT, -- Using snake_case for Postgres convention, but server.ts uses camelCase. 
    -- Actually, server.ts uses:
    -- [aluno.id, aluno.nome, aluno.idade, aluno.categoria, aluno.posicao, aluno.dataNascimento, aluno.responsavel, aluno.telefone, aluno.rgCpf, aluno.responsavelRgCpf, aluno.endereco, aluno.bairro, aluno.cidade, aluno.uf, aluno.foto, aluno.status || 'ativo', aluno.numeroCamisa]
    -- So I should match the keys used in the upsert:
    "dataNascimento" TEXT,
    responsavel TEXT,
    telefone TEXT,
    "rgCpf" TEXT UNIQUE,
    "responsavelRgCpf" TEXT,
    endereco TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    foto TEXT,
    status TEXT DEFAULT 'ativo',
    "numeroCamisa" TEXT
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT,
    role TEXT,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE SET NULL
);

-- 3. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 4. Presencas Table
CREATE TABLE IF NOT EXISTS presencas (
    id BIGSERIAL PRIMARY KEY,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    data TEXT,
    status TEXT
);

-- 5. Professores Table
CREATE TABLE IF NOT EXISTS professores (
    id TEXT PRIMARY KEY,
    nome TEXT,
    "dataNascimento" TEXT,
    "rgCpf" TEXT,
    cref TEXT,
    telefone TEXT,
    email TEXT,
    especialidade TEXT,
    endereco TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    foto TEXT
);

-- 6. Eventos Table
CREATE TABLE IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    nome TEXT,
    endereco TEXT,
    cidade TEXT,
    uf TEXT,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    horario TEXT
);

-- 7. Anamneses Table
CREATE TABLE IF NOT EXISTS anamneses (
    "alunoId" TEXT PRIMARY KEY REFERENCES alunos(id) ON DELETE CASCADE,
    "horarioDormir" TEXT,
    "dificuldadeAcordar" BOOLEAN,
    "tempoCelular" TEXT,
    "alimentaBem" BOOLEAN,
    "frequenciaMedico" TEXT,
    fraturas TEXT,
    "tratamentoMedico" TEXT,
    "medicacaoControlada" TEXT,
    "outroExercicio" TEXT,
    alergias TEXT
);

-- 8. Escalacoes Table
CREATE TABLE IF NOT EXISTS escalacoes (
    id BIGSERIAL PRIMARY KEY,
    "eventoId" TEXT REFERENCES eventos(id) ON DELETE CASCADE,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE
);

-- Initial Admin User
INSERT INTO users (username, password, role) 
VALUES ('05504043689', '05504043689', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Initial Settings
INSERT INTO settings (key, value) VALUES 
('clubShield', 'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield.svg'),
('instagramLink', 'https://www.instagram.com/pirua_esporte_clube/'),
('whatsappLink', 'https://wa.me/5537999999999')
ON CONFLICT (key) DO NOTHING;
