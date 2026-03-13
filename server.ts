import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  console.log("Initializing database...");
  
  // Get database path from environment or default
  let dbPath = process.env.DATABASE_PATH || "./database.sqlite";
  
  // Database setup
  let db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Function to re-initialize database if path changes
  const reinitDatabase = async (newPath: string) => {
    try {
      await db.close();
      db = await open({
        filename: newPath,
        driver: sqlite3.Database,
      });
      await runMigrations();
      dbPath = newPath;
      return { success: true };
    } catch (error: any) {
      console.error("Failed to re-init database:", error);
      // Try to reopen the old one
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });
      return { success: false, message: error.message };
    }
  };

  const runMigrations = async () => {
    console.log("Running migrations...");
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
        foto TEXT,
        status TEXT DEFAULT 'ativo',
        numeroCamisa TEXT
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
  };

  await runMigrations();

  // Migration for existing databases
  try {
    await db.run("ALTER TABLE alunos ADD COLUMN status TEXT DEFAULT 'ativo'");
  } catch (e) {}
  try {
    await db.run("ALTER TABLE alunos ADD COLUMN numeroCamisa TEXT");
  } catch (e) {}

  // Initialize settings if empty
  const shieldExists = await db.get("SELECT * FROM settings WHERE key = 'clubShield'");
  if (!shieldExists) {
    await db.run("INSERT INTO settings (key, value) VALUES ('clubShield', 'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield.svg')");
    await db.run("INSERT INTO settings (key, value) VALUES ('instagramLink', 'https://www.instagram.com/pirua_esporte_clube/')");
    await db.run("INSERT INTO settings (key, value) VALUES ('whatsappLink', 'https://wa.me/5537999999999')");
  }

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      await db.get("SELECT 1");
      res.json({ 
        status: "ok", 
        database: "connected", 
        path: dbPath,
        time: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ status: "error", message: "Database connection failed" });
    }
  });

  app.get("/api/db-path", (req, res) => {
    res.json({ path: dbPath });
  });

  app.post("/api/db-path", async (req, res) => {
    const { path: newPath } = req.body;
    if (!newPath) return res.status(400).json({ error: "Path is required" });
    
    const result = await reinitDatabase(newPath);
    if (result.success) {
      res.json({ message: "Database path updated", path: dbPath });
    } else {
      res.status(500).json({ error: result.message });
    }
  });
  app.get("/api/alunos", async (req, res) => {
    try {
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
      // Keep SQLite in sync for now
      const existingSqlite = await db.get("SELECT * FROM alunos WHERE rgCpf = ? AND id != ?", [aluno.rgCpf, aluno.id]);
      if (existingSqlite) {
        return res.status(400).json({ success: false, message: "Este CPF já está cadastrado no sistema (SQLite)." });
      }

      await db.run(
        `INSERT OR REPLACE INTO alunos (id, nome, idade, categoria, posicao, dataNascimento, responsavel, telefone, rgCpf, responsavelRgCpf, endereco, bairro, cidade, uf, foto, status, numeroCamisa) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [aluno.id, aluno.nome, aluno.idade, aluno.categoria, aluno.posicao, aluno.dataNascimento, aluno.responsavel, aluno.telefone, aluno.rgCpf, aluno.responsavelRgCpf, aluno.endereco, aluno.bairro, aluno.cidade, aluno.uf, aluno.foto, aluno.status || 'ativo', aluno.numeroCamisa]
      );

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: "Erro ao salvar aluno" });
    }
  });

  app.delete("/api/alunos/:id", async (req, res) => {
    await db.run("DELETE FROM alunos WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/settings", async (req, res) => {
    try {
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
    await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
    res.json({ success: true });
  });

  app.get("/api/presencas", async (req, res) => {
    const { data, mes, ano } = req.query;
    
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
      await db.run("DELETE FROM presencas WHERE data = ?", [data]);
      const stmt = await db.prepare("INSERT INTO presencas (alunoId, data, status) VALUES (?, ?, ?)");
      for (const item of lista) {
        await stmt.run([item.alunoId, data, item.status]);
        
        // Logic for active/inactive status
        if (item.status === 'presente') {
          await db.run("UPDATE alunos SET status = 'ativo' WHERE id = ?", [item.alunoId]);
        } else if (item.status === 'falta') {
          const last4 = await db.all("SELECT status FROM presencas WHERE alunoId = ? ORDER BY data DESC LIMIT 4", [item.alunoId]);
          if (last4.length >= 4 && last4.every(p => p.status === 'falta')) {
            await db.run("UPDATE alunos SET status = 'inativo' WHERE id = ?", [item.alunoId]);
          }
        }
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
      const sqliteProfessores = await db.all("SELECT * FROM professores");
      res.json(sqliteProfessores);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/professores", async (req, res) => {
    const professor = req.body;
    try {
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
      const sqliteEventos = await db.all("SELECT * FROM eventos");
      res.json(sqliteEventos);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/eventos", async (req, res) => {
    const evento = req.body;
    try {
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
      const sqliteAnamnese = await db.get("SELECT * FROM anamneses WHERE alunoId = ?", [req.params.alunoId]);
      res.json(sqliteAnamnese || null);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/anamneses", async (req, res) => {
    const anamnese = req.body;
    try {
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
      const sqliteEscalacoes = await db.all("SELECT * FROM escalacoes");
      res.json(sqliteEscalacoes);
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/escalacoes", async (req, res) => {
    const { eventoId, lista } = req.body; // lista: [alunoId]
    try {
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

  // Backup & Restore
  app.get("/api/export", async (req, res) => {
    try {
      const tables = ['alunos', 'settings', 'professores', 'eventos', 'anamneses', 'presencas', 'escalacoes'];
      const data: any = {};
      for (const table of tables) {
        data[table] = await db.all(`SELECT * FROM ${table}`);
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao exportar dados" });
    }
  });

  app.post("/api/import", async (req, res) => {
    const data = req.body;
    try {
      const tables = ['alunos', 'settings', 'professores', 'eventos', 'anamneses', 'presencas', 'escalacoes'];
      for (const table of tables) {
        if (data[table]) {
          await db.run(`DELETE FROM ${table}`);
          if (data[table].length > 0) {
            const columns = Object.keys(data[table][0]);
            const placeholders = columns.map(() => '?').join(', ');
            const stmt = await db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
            for (const row of data[table]) {
              await stmt.run(Object.values(row));
            }
            await stmt.finalize();
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ success: false, message: "Erro ao importar dados" });
    }
  });

  console.log("Migrations complete. Setting up Vite...");
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

