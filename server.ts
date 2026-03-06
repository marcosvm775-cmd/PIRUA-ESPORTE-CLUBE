import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://poafkzclxpjgocauuxas.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8gGCpVfPD-gmfBUgsfWpXA__3abYoJ-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Database setup
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS alunos (
      id TEXT PRIMARY KEY,
      nome TEXT,
      idade INTEGER,
      categoria TEXT,
      posicao TEXT,
      dataNascimento TEXT,
      responsavel TEXT,
      telefone TEXT,
      rgCpf TEXT UNIQUE,
      responsavelRgCpf TEXT,
      endereco TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
      foto TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT,
      role TEXT,
      alunoId TEXT,
      FOREIGN KEY(alunoId) REFERENCES alunos(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS presencas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alunoId TEXT,
      data TEXT,
      status TEXT,
      FOREIGN KEY(alunoId) REFERENCES alunos(id)
    );

    CREATE TABLE IF NOT EXISTS professores (
      id TEXT PRIMARY KEY,
      nome TEXT,
      dataNascimento TEXT,
      rgCpf TEXT,
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

    CREATE TABLE IF NOT EXISTS eventos (
      id TEXT PRIMARY KEY,
      nome TEXT,
      endereco TEXT,
      cidade TEXT,
      uf TEXT,
      dataInicio TEXT,
      dataFim TEXT,
      horario TEXT
    );

    CREATE TABLE IF NOT EXISTS anamneses (
      alunoId TEXT PRIMARY KEY,
      horarioDormir TEXT,
      dificuldadeAcordar BOOLEAN,
      tempoCelular TEXT,
      alimentaBem BOOLEAN,
      frequenciaMedico TEXT,
      fraturas TEXT,
      tratamentoMedico TEXT,
      medicacaoControlada TEXT,
      outroExercicio TEXT,
      alergias TEXT,
      FOREIGN KEY(alunoId) REFERENCES alunos(id)
    );

    CREATE TABLE IF NOT EXISTS escalacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventoId TEXT,
      alunoId TEXT,
      FOREIGN KEY(eventoId) REFERENCES eventos(id),
      FOREIGN KEY(alunoId) REFERENCES alunos(id)
    );
  `);

  // Initialize default admin if empty
  const adminExists = await db.get("SELECT * FROM users WHERE username = '05504043689'");
  if (!adminExists) {
    await db.run("INSERT INTO users (username, password, role) VALUES ('05504043689', '05504043689', 'admin')");
  }

  // Initialize settings if empty
  const shieldExists = await db.get("SELECT * FROM settings WHERE key = 'clubShield'");
  if (!shieldExists) {
    await db.run("INSERT INTO settings (key, value) VALUES ('clubShield', 'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield.svg')");
    await db.run("INSERT INTO settings (key, value) VALUES ('instagramLink', 'https://www.instagram.com/pirua_esporte_clube/')");
    await db.run("INSERT INTO settings (key, value) VALUES ('whatsappLink', 'https://wa.me/5537999999999')");
  }

  // API Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Try Supabase first
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (user) {
        let aluno = null;
        if (user.role === 'aluno' && user.alunoId) {
          const { data: alunoData } = await supabase
            .from('alunos')
            .select('*')
            .eq('id', user.alunoId)
            .single();
          aluno = alunoData;
        }
        return res.json({ success: true, user: { username: user.username, role: user.role }, aluno });
      }

      // Fallback to SQLite
      const sqliteUser = await db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
      if (sqliteUser) {
        let aluno = null;
        if (sqliteUser.role === 'aluno' && sqliteUser.alunoId) {
          aluno = await db.get("SELECT * FROM alunos WHERE id = ?", [sqliteUser.alunoId]);
        }
        res.json({ success: true, user: { username: sqliteUser.username, role: sqliteUser.role }, aluno });
      } else {
        res.status(401).json({ success: false, message: "Login ou senha inválidos" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  });

  app.get("/api/alunos", async (req, res) => {
    try {
      const { data: alunos, error } = await supabase.from('alunos').select('*');
      if (alunos && alunos.length > 0) {
        return res.json(alunos);
      }
      
      const sqliteAlunos = await db.all("SELECT * FROM alunos");
      res.json(sqliteAlunos);
    } catch (error) {
      console.error("Fetch alunos error:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar alunos" });
    }
  });

  app.post("/api/alunos", async (req, res) => {
    const aluno = req.body;
    try {
      // Check if CPF already exists in Supabase
      const { data: existingSupabase } = await supabase
        .from('alunos')
        .select('*')
        .eq('rgCpf', aluno.rgCpf)
        .neq('id', aluno.id)
        .single();

      if (existingSupabase) {
        return res.status(400).json({ success: false, message: "Este CPF já está cadastrado no sistema (Supabase)." });
      }

      // Save to Supabase
      const { error: supabaseError } = await supabase
        .from('alunos')
        .upsert(aluno);

      if (supabaseError) {
        console.error("Supabase upsert error:", supabaseError);
      }

      // Create/Update user for this student in Supabase
      if (aluno.rgCpf) {
        const cleanCpf = aluno.rgCpf.replace(/\D/g, '');
        if (cleanCpf) {
          await supabase
            .from('users')
            .upsert({
              username: cleanCpf,
              password: cleanCpf,
              role: 'aluno',
              alunoId: aluno.id
            });
        }
      }

      // Keep SQLite in sync for now
      const existingSqlite = await db.get("SELECT * FROM alunos WHERE rgCpf = ? AND id != ?", [aluno.rgCpf, aluno.id]);
      if (!existingSqlite) {
        await db.run(
          `INSERT OR REPLACE INTO alunos (id, nome, idade, categoria, posicao, dataNascimento, responsavel, telefone, rgCpf, responsavelRgCpf, endereco, bairro, cidade, uf, foto) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [aluno.id, aluno.nome, aluno.idade, aluno.categoria, aluno.posicao, aluno.dataNascimento, aluno.responsavel, aluno.telefone, aluno.rgCpf, aluno.responsavelRgCpf, aluno.endereco, aluno.bairro, aluno.cidade, aluno.uf, aluno.foto]
        );

        if (aluno.rgCpf) {
          const cleanCpf = aluno.rgCpf.replace(/\D/g, '');
          if (cleanCpf) {
            await db.run(
              "INSERT OR REPLACE INTO users (username, password, role, alunoId) VALUES (?, ?, ?, ?)",
              [cleanCpf, cleanCpf, 'aluno', aluno.id]
            );
          }
        }
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: "Erro ao salvar aluno" });
    }
  });

  app.delete("/api/alunos/:id", async (req, res) => {
    await supabase.from('alunos').delete().eq('id', req.params.id);
    await db.run("DELETE FROM alunos WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const { data: settings } = await supabase.from('settings').select('*');
      if (settings && settings.length > 0) {
        const formatted = settings.reduce((acc: any, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        return res.json(formatted);
      }

      const sqliteSettings = await db.all("SELECT * FROM settings");
      const formatted = sqliteSettings.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(formatted);
    } catch (error) {
      console.error("Fetch settings error:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar configurações" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    await supabase.from('settings').upsert({ key, value });
    await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
    res.json({ success: true });
  });

  app.get("/api/presencas", async (req, res) => {
    const { data, mes, ano } = req.query;
    
    // Try Supabase
    let supabaseQuery = supabase.from('presencas').select('*');
    if (data) {
      supabaseQuery = supabaseQuery.eq('data', data);
    } else if (mes && ano) {
      supabaseQuery = supabaseQuery.like('data', `${ano}-${mes.toString().padStart(2, '0')}-%`);
    }
    const { data: presencas } = await supabaseQuery;
    if (presencas && presencas.length > 0) {
      return res.json(presencas);
    }

    // SQLite Fallback
    let query = "SELECT * FROM presencas WHERE 1=1";
    const params = [];
    if (data) {
      query += " AND data = ?";
      params.push(data);
    } else if (mes && ano) {
      query += " AND data LIKE ?";
      params.push(`${ano}-${mes.toString().padStart(2, '0')}-%`);
    }
    const sqlitePresencas = await db.all(query, params);
    res.json(sqlitePresencas);
  });

  app.post("/api/presencas", async (req, res) => {
    const { data, lista } = req.body; // lista: [{ alunoId, status }]
    try {
      // Supabase
      await supabase.from('presencas').delete().eq('data', data);
      const presencasToInsert = lista.map((item: any) => ({
        alunoId: item.alunoId,
        data: data,
        status: item.status
      }));
      await supabase.from('presencas').insert(presencasToInsert);

      // SQLite
      await db.run("DELETE FROM presencas WHERE data = ?", [data]);
      const stmt = await db.prepare("INSERT INTO presencas (alunoId, data, status) VALUES (?, ?, ?)");
      for (const item of lista) {
        await stmt.run([item.alunoId, data, item.status]);
      }
      await stmt.finalize();
      
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  });

  // Professores
  app.get("/api/professores", async (req, res) => {
    try {
      const { data: professores } = await supabase.from('professores').select('*');
      if (professores && professores.length > 0) return res.json(professores);
      const sqliteProfessores = await db.all("SELECT * FROM professores");
      res.json(sqliteProfessores);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/professores", async (req, res) => {
    const professor = req.body;
    try {
      await supabase.from('professores').upsert(professor);
      await db.run(
        `INSERT OR REPLACE INTO professores (id, nome, dataNascimento, rgCpf, cref, telefone, email, especialidade, endereco, bairro, cidade, uf, foto) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [professor.id, professor.nome, professor.dataNascimento, professor.rgCpf, professor.cref, professor.telefone, professor.email, professor.especialidade, professor.endereco, professor.bairro, professor.cidade, professor.uf, professor.foto]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  // Eventos
  app.get("/api/eventos", async (req, res) => {
    try {
      const { data: eventos } = await supabase.from('eventos').select('*');
      if (eventos && eventos.length > 0) return res.json(eventos);
      const sqliteEventos = await db.all("SELECT * FROM eventos");
      res.json(sqliteEventos);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/eventos", async (req, res) => {
    const evento = req.body;
    try {
      await supabase.from('eventos').upsert(evento);
      await db.run(
        `INSERT OR REPLACE INTO eventos (id, nome, endereco, cidade, uf, dataInicio, dataFim, horario) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [evento.id, evento.nome, evento.endereco, evento.cidade, evento.uf, evento.dataInicio, evento.dataFim, evento.horario]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  // Anamneses
  app.get("/api/anamneses/:alunoId", async (req, res) => {
    try {
      const { data: anamnese } = await supabase.from('anamneses').select('*').eq('alunoId', req.params.alunoId).single();
      if (anamnese) return res.json(anamnese);
      const sqliteAnamnese = await db.get("SELECT * FROM anamneses WHERE alunoId = ?", [req.params.alunoId]);
      res.json(sqliteAnamnese || null);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/anamneses", async (req, res) => {
    const anamnese = req.body;
    try {
      await supabase.from('anamneses').upsert(anamnese);
      await db.run(
        `INSERT OR REPLACE INTO anamneses (alunoId, horarioDormir, dificuldadeAcordar, tempoCelular, alimentaBem, frequenciaMedico, fraturas, tratamentoMedico, medicacaoControlada, outroExercicio, alergias) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [anamnese.alunoId, anamnese.horarioDormir, anamnese.dificuldadeAcordar, anamnese.tempoCelular, anamnese.alimentaBem, anamnese.frequenciaMedico, anamnese.fraturas, anamnese.tratamentoMedico, anamnese.medicacaoControlada, anamnese.outroExercicio, anamnese.alergias]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  // Escalacoes
  app.get("/api/escalacoes", async (req, res) => {
    try {
      const { data: escalacoes } = await supabase.from('escalacoes').select('*');
      if (escalacoes && escalacoes.length > 0) return res.json(escalacoes);
      const sqliteEscalacoes = await db.all("SELECT * FROM escalacoes");
      res.json(sqliteEscalacoes);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/escalacoes", async (req, res) => {
    const { eventoId, lista } = req.body; // lista: [alunoId]
    try {
      // Supabase
      await supabase.from('escalacoes').delete().eq('eventoId', eventoId);
      const toInsert = lista.map((alunoId: string) => ({ eventoId, alunoId }));
      await supabase.from('escalacoes').insert(toInsert);

      // SQLite
      await db.run("DELETE FROM escalacoes WHERE eventoId = ?", [eventoId]);
      const stmt = await db.prepare("INSERT INTO escalacoes (eventoId, alunoId) VALUES (?, ?)");
      for (const alunoId of lista) {
        await stmt.run([eventoId, alunoId]);
      }
      await stmt.finalize();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
