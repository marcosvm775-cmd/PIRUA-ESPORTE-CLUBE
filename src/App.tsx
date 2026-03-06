/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  CheckSquare, 
  CalendarDays, 
  ClipboardList, 
  FileText, 
  IdCard, 
  Layers,
  Search,
  MoreVertical,
  ChevronRight,
  Trophy,
  UserCircle,
  Bell,
  Plus,
  Trash2,
  Download,
  Printer,
  Save,
  ShieldAlert,
  Plane,
  ShieldCheck,
  MapPin,
  Camera,
  X,
  Instagram,
  MessageCircle,
  Settings,
  ChevronLeft,
  Menu,
  Lock,
  LogOut,
  UserCheck,
  BarChart3,
  Cake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type UserRole = 'admin' | 'aluno';

type View = 
  | 'dashboard' 
  | 'cadastrar_aluno' 
  | 'cadastrar_professor'
  | 'lista_alunos' 
  | 'chamada' 
  | 'eventos' 
  | 'anamnese' 
  | 'documentos' 
  | 'carteirinha' 
  | 'categorias'
  | 'presenca_evento'
  | 'escalacao'
  | 'meu_perfil'
  | 'configuracoes'
  | 'relatorios'
  | 'aniversariantes';

interface Aluno {
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
}

interface Professor {
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

interface Evento {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  dataInicio: string;
  dataFim: string;
  horario: string;
}

// --- Mock Data ---

const MOCK_ALUNOS: Aluno[] = [
  { 
    id: '1', 
    nome: 'Lucas Silva', 
    idade: 10, 
    categoria: 'Sub-11', 
    posicao: 'Atacante', 
    dataNascimento: '12/05/2014', 
    responsavel: 'Maria Silva', 
    telefone: '(11) 98888-7777',
    rgCpf: '123.456.789-00',
    responsavelRgCpf: '987.654.321-11',
    endereco: 'Rua das Palmeiras, 123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    uf: 'SP'
  },
  { 
    id: '2', 
    nome: 'Gabriel Santos', 
    idade: 9, 
    categoria: 'Sub-11', 
    posicao: 'Goleiro', 
    dataNascimento: '22/08/2015', 
    responsavel: 'João Santos', 
    telefone: '(11) 97777-6666',
    rgCpf: '234.567.890-11',
    responsavelRgCpf: '876.543.210-22',
    endereco: 'Av. Brasil, 456',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    uf: 'SP'
  },
];

const MOCK_PROFESSORES: Professor[] = [
  {
    id: 'p1',
    nome: 'Ricardo Oliveira',
    dataNascimento: '15/03/1985',
    rgCpf: '111.222.333-44',
    cref: '012345-G/SP',
    telefone: '(11) 99999-8888',
    email: 'ricardo.coach@pirua.com',
    especialidade: 'Treinador Principal',
    endereco: 'Rua do Esporte, 10',
    bairro: 'Vila Olímpia',
    cidade: 'São Paulo',
    uf: 'SP'
  }
];

const MOCK_EVENTOS: Evento[] = [
  {
    id: 'e1',
    nome: 'Copa Regional de Futebol',
    endereco: 'Estádio Municipal de Itaquera',
    cidade: 'São Paulo',
    uf: 'SP',
    dataInicio: '2026-04-10',
    dataFim: '2026-04-12',
    horario: '08:00'
  },
  {
    id: 'e2',
    nome: 'Amistoso vs Santos FC',
    endereco: 'CT Rei Pelé',
    cidade: 'Santos',
    uf: 'SP',
    dataInicio: '2026-05-20',
    dataFim: '2026-05-20',
    horario: '14:00'
  }
];

const CATEGORIAS = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17'];

// URL do Escudo Oficial do Piruá E.C. (Fênix + Jogador - Versão Final Fiel à Imagem)
const ESCUDO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
  <defs>
    <linearGradient id="phoenixGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#d9480f;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#f59f00;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffd43b;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Outer Shield -->
  <path d="M20,60 L380,60 L380,300 C380,450 200,530 200,530 C200,530 20,450 20,300 L20,60 Z" fill="#000000" stroke="#facc15" stroke-width="14"/>
  
  <!-- White Background Area -->
  <path d="M40,80 L360,80 L360,280 C360,400 200,480 200,480 C200,480 40,400 40,280 L40,80 Z" fill="#ffffff"/>
  
  <!-- Top Black Header Area (V-Shape) -->
  <path d="M40,80 L360,80 L360,220 L200,350 L40,220 Z" fill="#000000" stroke="#facc15" stroke-width="4"/>

  <!-- Text -->
  <text x="200" y="150" text-anchor="middle" fill="#facc15" style="font-family: 'Arial Black', sans-serif; font-weight:900; font-size:65px; letter-spacing:1px;">PIRUÁ</text>
  <text x="200" y="200" text-anchor="middle" fill="#facc15" style="font-family: 'Arial Black', sans-serif; font-weight:900; font-size:40px; letter-spacing:8px;">E.C</text>

  <!-- Phoenix Mascot (Fiel à Imagem) -->
  <g transform="translate(200, 420) scale(1.8)">
    <!-- Wings (Left) -->
    <path d="M-2,0 C-15,-10 -50,-50 -40,-90 C-35,-70 -25,-60 -20,-70 C-25,-50 -15,-40 -10,-50 C-15,-30 -5,-20 0,-10 Z" fill="url(#phoenixGrad)"/>
    <!-- Wings (Right) -->
    <path d="M2,0 C15,-10 50,-50 40,-90 C35,-70 25,-60 20,-70 C25,-50 15,-40 10,-50 C15,-30 5,-20 0,-10 Z" fill="url(#phoenixGrad)"/>
    <!-- Body and Head -->
    <path d="M-8,0 Q0,8 8,0 L8,-25 Q8,-40 0,-40 Q-8,-40 -8,-25 Z" fill="#f97316"/>
    <!-- Beak (Facing Right) -->
    <path d="M5,-35 L22,-30 L5,-25 Z" fill="#facc15"/>
    <!-- Eye -->
    <circle cx="2" cy="-33" r="1.2" fill="#000000"/>
  </g>

  <!-- Bottom Black Tip -->
  <path d="M100,420 C140,450 200,480 200,480 C200,480 260,450 300,420 L200,530 Z" fill="#000000"/>

  <!-- Player Silhouette (Fiel à Imagem) -->
  <g transform="translate(200, 490) scale(0.75)">
    <path d="M-10,-80 C-5,-85 5,-85 10,-80 L15,-60 L30,-40 L10,-30 L5,-50 L-5,-50 L-10,-30 L-30,-40 L-15,-60 L-10,-80 Z" fill="#ffffff"/>
    <circle cx="0" cy="-90" r="9" fill="#ffffff"/>
    <!-- Kicking Leg -->
    <path d="M10,-30 L45,10 L55,0 L30,-35 Z" fill="#ffffff"/>
    <!-- Ball -->
    <circle cx="60" cy="15" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <!-- Ball Details -->
    <path d="M60,15 L68,15 M60,7 L60,23 M52,15 L60,15" stroke="#000000" stroke-width="1"/>
  </g>
</svg>
`)}`;

// --- Components ---

// --- Components ---

function Login({ onLogin, error, username, setUsername, password, setPassword }: { 
  onLogin: (e: React.FormEvent) => void, 
  error: string,
  username: string,
  setUsername: (v: string) => void,
  password: string,
  setPassword: (v: string) => void
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 mb-4">
            <img src={ESCUDO_URL} alt="Logo" className="w-14 h-14 object-contain" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-yellow-400">PIRUÁ E.C.</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Atletas</p>
        </div>

        <form onSubmit={onLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Login (CPF)</label>
            <input 
              name="email"
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Senha</label>
            <input 
              name="password"
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-500 transition-all uppercase tracking-widest shadow-lg shadow-yellow-400/20"
          >
            Entrar no Sistema
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: { icon: any, label: string, active: boolean, onClick: () => void, collapsed?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
      active 
        ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 font-bold" 
        : "text-zinc-400 hover:bg-zinc-800 hover:text-yellow-400",
      collapsed && "justify-center px-0"
    )}
    title={collapsed ? label : ""}
  >
    <Icon size={20} className="shrink-0" />
    {!collapsed && <span className="text-sm truncate">{label}</span>}
  </button>
);

export default function App() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [instagramLink, setInstagramLink] = useState('https://www.instagram.com/pirua_esporte_clube/');
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/5537999999999');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('aluno');
  const [loggedInAluno, setLoggedInAluno] = useState<Aluno | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [clubShield, setClubShield] = useState(ESCUDO_URL);
  const [searchQuery, setSearchQuery] = useState('');
  const [anamneseData, setAnamneseData] = useState<any>({});
  const [eventLineups, setEventLineups] = useState<Record<string, string[]>>({});

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resAlunos = await fetch('/api/alunos');
        const dataAlunos = await resAlunos.json();
        setAlunos(dataAlunos.length > 0 ? dataAlunos : MOCK_ALUNOS);
        
        const resProf = await fetch('/api/professores');
        const dataProf = await resProf.json();
        setProfessores(dataProf.length > 0 ? dataProf : MOCK_PROFESSORES);

        const resEv = await fetch('/api/eventos');
        const dataEv = await resEv.json();
        setEventos(dataEv.length > 0 ? dataEv : MOCK_EVENTOS);

        const resEsc = await fetch('/api/escalacoes');
        const dataEsc = await resEsc.json();
        if (dataEsc.length > 0) {
          const formattedEsc: Record<string, string[]> = {};
          dataEsc.forEach((esc: any) => {
            if (!formattedEsc[esc.eventoId]) formattedEsc[esc.eventoId] = [];
            formattedEsc[esc.eventoId].push(esc.alunoId);
          });
          setEventLineups(formattedEsc);
        }

        const resSettings = await fetch('/api/settings');
        const dataSettings = await resSettings.json();
        if (dataSettings.clubShield) setClubShield(dataSettings.clubShield);
        if (dataSettings.instagramLink) setInstagramLink(dataSettings.instagramLink);
        if (dataSettings.whatsappLink) setWhatsappLink(dataSettings.whatsappLink);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAlunos(MOCK_ALUNOS);
      }
    };
    fetchData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setUserRole(data.user.role);
        setLoggedInAluno(data.aluno);
        setLoginError('');
        if (data.user.role === 'aluno') {
          setCurrentView('cadastrar_aluno');
        } else {
          setCurrentView('dashboard');
        }
      } else {
        setLoginError(data.message);
      }
    } catch (error) {
      setLoginError('Erro ao conectar com o servidor');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('aluno');
    setLoggedInAluno(null);
    setUsername('');
    setPassword('');
  };

  const handleSaveAluno = async (aluno: Aluno) => {
    // Normalize CPF
    if (aluno.rgCpf) {
      aluno.rgCpf = aluno.rgCpf.replace(/\D/g, '');
    }
    if (aluno.responsavelRgCpf) {
      aluno.responsavelRgCpf = aluno.responsavelRgCpf.replace(/\D/g, '');
    }

    try {
      const res = await fetch('/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aluno)
      });
      if (res.ok) {
        setAlunos(prev => {
          const exists = prev.find(a => a.id === aluno.id);
          if (exists) return prev.map(a => a.id === aluno.id ? aluno : a);
          return [...prev, aluno];
        });
        alert('Cadastro salvo com sucesso!');
      }
    } catch (error) {
      console.error("Error saving aluno:", error);
    }
  };

  const handleDeleteAluno = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      try {
        const res = await fetch(`/api/alunos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setAlunos(prev => prev.filter(a => a.id !== id));
        }
      } catch (error) {
        console.error("Error deleting aluno:", error);
      }
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
    } catch (error) {
      console.error("Error saving setting:", error);
    }
  };

  const handleSaveProfessor = async (professor: Professor) => {
    try {
      const res = await fetch('/api/professores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(professor)
      });
      if (res.ok) {
        setProfessores(prev => {
          const exists = prev.find(p => p.id === professor.id);
          if (exists) return prev.map(p => p.id === professor.id ? professor : p);
          return [...prev, professor];
        });
        alert('Professor salvo com sucesso!');
      }
    } catch (error) {
      console.error("Error saving professor:", error);
    }
  };

  const handleSaveEvento = async (evento: Evento) => {
    try {
      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
      });
      if (res.ok) {
        setEventos(prev => {
          const exists = prev.find(e => e.id === evento.id);
          if (exists) return prev.map(e => e.id === evento.id ? evento : e);
          return [...prev, evento];
        });
        alert('Evento salvo com sucesso!');
      }
    } catch (error) {
      console.error("Error saving evento:", error);
    }
  };

  const handleSaveAnamnese = async () => {
    if (!selectedAnamneseAluno) return;
    try {
      const res = await fetch('/api/anamneses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...anamneseData, alunoId: selectedAnamneseAluno.id })
      });
      if (res.ok) {
        alert('Anamnese salva com sucesso!');
      }
    } catch (error) {
      console.error("Error saving anamnese:", error);
    }
  };

  const handleSaveEscalacao = async (eventoId: string, lista: string[]) => {
    try {
      const res = await fetch('/api/escalacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventoId, lista })
      });
      if (res.ok) {
        alert('Escalação salva com sucesso!');
      }
    } catch (error) {
      console.error("Error saving escalacao:", error);
    }
  };

  const handlePrint = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão - Piruá E.C.</title>
          ${styles}
          <style>
            @media print {
              body { background: white !important; color: black !important; padding: 20px; }
              .print-hidden { display: none !important; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            body { font-family: sans-serif; background: white; color: black; }
            .hidden { display: block !important; }
            .print\\:block { display: block !important; }
            .print\\:hidden { display: none !important; }
            .bg-zinc-900 { background-color: white !important; }
            .text-white { color: black !important; }
            .text-zinc-400, .text-zinc-500 { color: #666 !important; }
            .border-zinc-800 { border-color: #eee !important; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${element.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  };
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedAnamneseAluno, setSelectedAnamneseAluno] = useState<Aluno | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [presencas, setPresencas] = useState<Record<string, 'presente' | 'falta' | 'justificado'>>({});
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [attendanceReport, setAttendanceReport] = useState<any[]>([]);
  const [birthdayMonth, setBirthdayMonth] = useState(new Date().getMonth() + 1);

  const fetchAttendanceReport = async (type: 'date' | 'month') => {
    try {
      const res = await fetch('/api/presencas');
      let data = await res.json();
      
      if (type === 'date') {
        data = data.filter((p: any) => p.data === reportDate);
      } else {
        data = data.filter((p: any) => {
          const pDate = new Date(p.data);
          return (pDate.getMonth() + 1) === reportMonth && pDate.getFullYear() === reportYear;
        });
      }
      
      setAttendanceReport(data);
    } catch (error) {
      console.error("Error fetching attendance report:", error);
    }
  };

  const handleSaveChamada = async () => {
    const data = new Date().toISOString().split('T')[0];
    const lista = Object.entries(presencas).map(([alunoId, status]) => ({ alunoId, status }));
    
    if (lista.length === 0) {
      alert('Nenhuma presença marcada.');
      return;
    }

    try {
      const res = await fetch('/api/presencas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, lista })
      });
      if (res.ok) {
        alert('Chamada salva com sucesso!');
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert('Erro ao salvar chamada');
    }
  };

  const handlePresence = (alunoId: string, status: 'presente' | 'falta' | 'justificado') => {
    setPresencas(prev => ({ ...prev, [alunoId]: status }));
  };

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
        const match = decodedText.match(/\/atleta\/(\d+)/);
        if (match) {
          const id = match[1];
          const aluno = alunos.find(a => a.id === id);
          if (aluno) {
            handlePresence(id, 'presente');
            scanner.clear().then(() => {
              setIsScannerOpen(false);
              alert(`Presença registrada para: ${aluno.nome}`);
            }).catch(err => console.error(err));
          } else {
            alert("Atleta não encontrado no sistema.");
          }
        }
      }, (error) => {
        // Ignorar erros de leitura contínua
      });

      return () => {
        scanner.clear().catch(err => console.error("Erro ao limpar scanner", err));
      };
    }
  }, [isScannerOpen]);
  const [docType, setDocType] = useState<'viagem' | 'termo'>('viagem');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [eventAttendance, setEventAttendance] = useState<Record<string, 'confirmado' | 'ausente' | 'pendente'>>({});
  const [formCategoria, setFormCategoria] = useState<string>('Sub-11');
  const [escalacaoEventoId, setEscalacaoEventoId] = useState<string>('');
  const [escalacaoEventoNome, setEscalacaoEventoNome] = useState('');

  const currentShield = clubShield;

  const calculateCategory = (birthDate: string) => {
    if (!birthDate) return 'Sub-11';
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age <= 7) return 'Sub-7';
    if (age <= 9) return 'Sub-9';
    if (age <= 11) return 'Sub-11';
    if (age <= 13) return 'Sub-13';
    if (age <= 15) return 'Sub-15';
    if (age <= 17) return 'Sub-17';
    return 'Sub-17';
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    const category = calculateCategory(birthDate);
    setFormCategoria(category);
  };

  const handleSaveShield = async () => {
    await handleSaveSetting('clubShield', clubShield);
    alert('Brasão salvo com sucesso!');
  };

  const handleShieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClubShield(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Sincronizar categoria do formulário quando entrar no perfil ou mudar de aluno logado
  useEffect(() => {
    if (currentView === 'meu_perfil' && loggedInAluno) {
      setFormCategoria(loggedInAluno.categoria);
    }
  }, [currentView, loggedInAluno]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredAlunos = useMemo(() => {
    return alunos.filter(a => a.nome.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, alunos]);

  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin} 
        error={loginError} 
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
      />
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 shrink-0 transition-all duration-300 relative",
        isSidebarCollapsed ? "w-20 p-4" : "w-72"
      )}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 bg-yellow-400 text-black rounded-full p-1 shadow-lg z-50 hover:scale-110 transition-transform"
        >
          {isSidebarCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={cn("flex items-center gap-3 mb-10 px-2", isSidebarCollapsed && "justify-center px-0")}>
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
            <img src={currentShield} alt="Escudo Piruá E.C" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
          </div>
          {!isSidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-lg font-black tracking-tighter text-yellow-400 leading-none">PIRUÁ</h1>
              <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Esporte Clube</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className={cn("space-y-1 mb-6 pb-4 border-b border-zinc-800", isSidebarCollapsed && "px-0")}>
            {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Redes & Contato</p>}
            <div className={cn("flex gap-2 px-2", isSidebarCollapsed && "flex-col px-0")}>
              <a 
                href={instagramLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-pink-500 hover:bg-zinc-700 transition-all duration-200"
                title="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-green-500 hover:bg-zinc-700 transition-all duration-200"
                title="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {userRole === 'admin' ? (
            <>
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Início" 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={UserPlus} 
                label="Cadastrar Aluno" 
                active={currentView === 'cadastrar_aluno'} 
                onClick={() => setCurrentView('cadastrar_aluno')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={ShieldCheck} 
                label="Cadastrar Professor" 
                active={currentView === 'cadastrar_professor'} 
                onClick={() => setCurrentView('cadastrar_professor')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={Users} 
                label="Lista Geral de Alunos" 
                active={currentView === 'lista_alunos'} 
                onClick={() => setCurrentView('lista_alunos')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={Cake} 
                label="Aniversariantes" 
                active={currentView === 'aniversariantes'} 
                onClick={() => setCurrentView('aniversariantes')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={CheckSquare} 
                label="Chamada de Presença" 
                active={currentView === 'chamada'} 
                onClick={() => setCurrentView('chamada')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={BarChart3} 
                label="Relatórios" 
                active={currentView === 'relatorios'} 
                onClick={() => setCurrentView('relatorios')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={CalendarDays} 
                label="Cadastrar Eventos" 
                active={currentView === 'eventos'} 
                onClick={() => setCurrentView('eventos')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={ClipboardList} 
                label="Ficha de Anamnese" 
                active={currentView === 'anamnese'} 
                onClick={() => setCurrentView('anamnese')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={FileText} 
                label="Gerar Documento" 
                active={currentView === 'documentos'} 
                onClick={() => setCurrentView('documentos')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={Settings} 
                label="Configurações" 
                active={currentView === 'configuracoes'} 
                onClick={() => setCurrentView('configuracoes')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={IdCard} 
                label="Carteirinha" 
                active={currentView === 'carteirinha'} 
                onClick={() => setCurrentView('carteirinha')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={Layers} 
                label="Categorias Sub" 
                active={currentView === 'categorias'} 
                onClick={() => setCurrentView('categorias')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={Trophy} 
                label="Escalação Evento" 
                active={currentView === 'escalacao'} 
                onClick={() => setCurrentView('escalacao')} 
                collapsed={isSidebarCollapsed}
              />
            </>
          ) : (
            <>
              <SidebarItem 
                icon={UserPlus} 
                label="Cadastrar Aluno" 
                active={currentView === 'cadastrar_aluno'} 
                onClick={() => setCurrentView('cadastrar_aluno')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={ClipboardList} 
                label="Ficha de Anamnese" 
                active={currentView === 'anamnese'} 
                onClick={() => setCurrentView('anamnese')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={IdCard} 
                label="Carteirinha" 
                active={currentView === 'carteirinha'} 
                onClick={() => setCurrentView('carteirinha')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={Trophy} 
                label="Lista de Presença Evento" 
                active={currentView === 'escalacao'} 
                onClick={() => setCurrentView('escalacao')} 
                collapsed={isSidebarCollapsed}
              />
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800 space-y-4">
          <div className={cn("flex items-center gap-3 px-2", isSidebarCollapsed && "justify-center px-0")}>
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
              <UserCircle className="text-black" size={24} />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate flex-1">
                <p className="text-sm font-bold text-zinc-100 truncate">{userRole === 'admin' ? 'Administrador' : loggedInAluno?.nome}</p>
                <p className="text-xs text-zinc-500 truncate">{userRole === 'admin' ? 'Piruá E.C.' : loggedInAluno?.categoria}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm",
              isSidebarCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-zinc-100 uppercase tracking-tight">
              {currentView === 'meu_perfil' ? 'Meu Perfil' : 
               currentView === 'presenca_evento' ? 'Presença em Evento' : 
               currentView === 'cadastrar_professor' ? 'Cadastrar Professor' :
               currentView.replace('_', ' ')}
            </h2>
            <p className="text-zinc-500 mt-1">Gestão Piruá Esporte Clube • {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 w-64 transition-all text-sm"
              />
            </div>
            <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-yellow-400 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border-2 border-zinc-900"></span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {userRole === 'aluno' && !['cadastrar_aluno', 'anamnese', 'carteirinha', 'escalacao'].includes(currentView) && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-bold">Acesso Restrito</h3>
                <p className="text-zinc-500 max-w-xs">Você não tem permissão para acessar esta área. Utilize o menu lateral para as opções disponíveis.</p>
              </div>
            )}

            {currentView === 'dashboard' && userRole === 'admin' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 shrink-0">
                    <img src={currentShield} alt="Escudo Piruá" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-yellow-400 uppercase tracking-tight mb-2">Bem-vindo ao Piruá E.C.</h3>
                    <p className="text-zinc-400 max-w-xl">Sistema de gestão oficial. Aqui você controla cadastros, presenças e eventos do clube com a força da nossa fênix.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                    <Users className="text-yellow-400 mb-4" size={32} />
                    <h3 className="text-4xl font-black text-zinc-100">142</h3>
                    <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">Alunos Ativos</p>
                  </div>
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                    <CalendarDays className="text-yellow-400 mb-4" size={32} />
                    <h3 className="text-4xl font-black text-zinc-100">08</h3>
                    <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">Eventos este mês</p>
                  </div>
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                    <ShieldAlert className="text-yellow-400 mb-4" size={32} />
                    <h3 className="text-4xl font-black text-zinc-100">12</h3>
                    <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">Anamneses Pendentes</p>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'aniversariantes' && userRole === 'admin' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Aniversariantes de Hoje */}
                <div className="bg-zinc-900 p-8 rounded-3xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-black">
                      <Cake size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Aniversariantes de Hoje</h3>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alunos.filter(aluno => {
                      if (!aluno.dataNascimento) return false;
                      const parts = aluno.dataNascimento.split('/');
                      if (parts.length < 2) return false;
                      const today = new Date();
                      return parseInt(parts[0]) === today.getDate() && parseInt(parts[1]) === (today.getMonth() + 1);
                    }).map(aluno => (
                      <div key={aluno.id} className="bg-yellow-400 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-yellow-400/20">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center text-black font-black text-xl">
                            {aluno.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-black uppercase text-sm">{aluno.nome}</p>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">{aluno.categoria}</p>
                          </div>
                        </div>
                        <div className="text-black animate-bounce">
                          <Trophy size={24} />
                        </div>
                      </div>
                    ))}
                    {alunos.filter(aluno => {
                      if (!aluno.dataNascimento) return false;
                      const parts = aluno.dataNascimento.split('/');
                      const today = new Date();
                      return parts.length >= 2 && parseInt(parts[0]) === today.getDate() && parseInt(parts[1]) === (today.getMonth() + 1);
                    }).length === 0 && (
                      <div className="col-span-full py-8 text-center text-zinc-500 bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-800">
                        Nenhum aniversariante hoje.
                      </div>
                    )}
                  </div>
                </div>

                {/* Busca por Mês */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <CalendarDays className="text-zinc-400" /> Buscar por Mês
                    </h3>
                    <select 
                      value={birthdayMonth}
                      onChange={(e) => setBirthdayMonth(parseInt(e.target.value))}
                      className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none font-bold text-yellow-400"
                    >
                      {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alunos.filter(aluno => {
                      if (!aluno.dataNascimento) return false;
                      const parts = aluno.dataNascimento.split('/');
                      if (parts.length < 2) return false;
                      return parseInt(parts[1]) === birthdayMonth;
                    }).sort((a, b) => {
                      const dayA = parseInt(a.dataNascimento.split('/')[0]);
                      const dayB = parseInt(b.dataNascimento.split('/')[0]);
                      return dayA - dayB;
                    }).map(aluno => (
                      <div key={aluno.id} className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-black">
                            {aluno.dataNascimento.split('/')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{aluno.nome}</p>
                            <p className="text-xs text-zinc-500">{aluno.categoria}</p>
                          </div>
                        </div>
                        <div className="text-zinc-600">
                          <Cake size={18} />
                        </div>
                      </div>
                    ))}
                    {alunos.filter(aluno => {
                      if (!aluno.dataNascimento) return false;
                      const parts = aluno.dataNascimento.split('/');
                      return parts.length >= 2 && parseInt(parts[1]) === birthdayMonth;
                    }).length === 0 && (
                      <div className="col-span-full py-12 text-center text-zinc-500">
                        Nenhum aniversariante encontrado para este mês.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentView === 'relatorios' && userRole === 'admin' && (
              <div className="space-y-8 max-w-5xl mx-auto">
                {/* Relatório de Categorias */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl" id="report-categories">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Layers className="text-yellow-400" /> Quantidade de Alunos por Categoria
                    </h3>
                    <div className="flex gap-2 print:hidden">
                      <button onClick={() => handlePrint('report-categories')} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"><Printer size={18} /></button>
                      <button onClick={() => handleDownload('report-categories', 'relatorio-categorias')} className="p-2 bg-yellow-400 rounded-lg hover:bg-yellow-500 text-black transition-all"><Download size={18} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {CATEGORIAS.map(cat => {
                      const count = alunos.filter(a => a.categoria === cat).length;
                      return (
                        <div key={cat} className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-800 text-center">
                          <p className="text-3xl font-black text-yellow-400 mb-1">{count}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{cat}</p>
                        </div>
                      );
                    })}
                    <div className="bg-yellow-400/10 p-6 rounded-2xl border border-yellow-400/20 text-center">
                      <p className="text-3xl font-black text-yellow-400 mb-1">{alunos.length}</p>
                      <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Total Geral</p>
                    </div>
                  </div>
                </div>

                {/* Relatório de Presença */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl" id="report-attendance">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <CheckSquare className="text-yellow-400" /> Relatório de Presença
                    </h3>
                    <div className="flex flex-wrap gap-3 print:hidden">
                      <div className="flex bg-zinc-800 rounded-xl p-1">
                        <input 
                          type="date" 
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="bg-transparent text-xs font-bold px-3 py-1 outline-none"
                        />
                        <button 
                          onClick={() => fetchAttendanceReport('date')}
                          className="bg-yellow-400 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase"
                        >
                          Filtrar Dia
                        </button>
                      </div>
                      <div className="flex bg-zinc-800 rounded-xl p-1">
                        <select 
                          value={reportMonth}
                          onChange={(e) => setReportMonth(parseInt(e.target.value))}
                          className="bg-transparent text-xs font-bold px-2 py-1 outline-none"
                        >
                          {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>{i+1}</option>
                          ))}
                        </select>
                        <select 
                          value={reportYear}
                          onChange={(e) => setReportYear(parseInt(e.target.value))}
                          className="bg-transparent text-xs font-bold px-2 py-1 outline-none"
                        >
                          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button 
                          onClick={() => fetchAttendanceReport('month')}
                          className="bg-yellow-400 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase"
                        >
                          Filtrar Mês
                        </button>
                      </div>
                      <button onClick={() => handlePrint('report-attendance')} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"><Printer size={18} /></button>
                      <button onClick={() => handleDownload('report-attendance', 'relatorio-presenca')} className="p-2 bg-yellow-400 rounded-lg hover:bg-yellow-500 text-black transition-all"><Download size={18} /></button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          <th className="py-4 px-4">Atleta</th>
                          <th className="py-4 px-4">Data</th>
                          <th className="py-4 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {attendanceReport.map((item, idx) => {
                          const aluno = alunos.find(a => a.id === item.alunoId);
                          return (
                            <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="py-4 px-4 font-bold text-sm text-zinc-100">{aluno?.nome || 'Desconhecido'}</td>
                              <td className="py-4 px-4 text-xs text-zinc-400">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                              <td className="py-4 px-4">
                                <span className={cn(
                                  "px-2 py-1 rounded text-[10px] font-black uppercase",
                                  item.status === 'presente' ? "bg-emerald-500/10 text-emerald-500" :
                                  item.status === 'falta' ? "bg-rose-500/10 text-rose-500" :
                                  "bg-yellow-500/10 text-yellow-500"
                                )}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {attendanceReport.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-12 text-center text-zinc-500 text-sm italic">Nenhum registro de presença encontrado para o filtro selecionado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'configuracoes' && userRole === 'admin' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Settings className="text-yellow-400" /> Configurações do Clube
                  </h3>
                  <div className="flex flex-col md:flex-row items-center gap-8 bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800">
                    <div className="relative group">
                      <div className="w-48 h-48 bg-zinc-800 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-yellow-400/50">
                        <img src={currentShield} alt="Escudo Atual" className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <Plus className="text-yellow-400" size={48} />
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleShieldChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-zinc-500 font-bold uppercase text-center mt-3">Escudo Oficial</p>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-black text-zinc-100 mb-4">Subir seu Próprio Escudo</h4>
                      <p className="text-zinc-400 mb-6 leading-relaxed">
                        Se você já possui um brasão oficial em formato de imagem (PNG, JPG ou SVG), você pode enviá-lo aqui. 
                        A imagem será aplicada instantaneamente em:
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        <li className="flex items-center gap-2 text-sm text-zinc-500 font-bold uppercase">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Carteirinhas de Atleta
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-500 font-bold uppercase">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Documentos de Viagem
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-500 font-bold uppercase">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Termos de Responsabilidade
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-500 font-bold uppercase">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Cabeçalho do Sistema
                        </li>
                      </ul>
                      <div className="flex flex-wrap gap-4">
                        <label className="bg-zinc-800 text-zinc-100 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest cursor-pointer hover:bg-zinc-700 transition-all border border-zinc-700">
                          Alterar Foto
                          <input type="file" accept="image/*" onChange={handleShieldChange} className="hidden" />
                        </label>
                        <button 
                          onClick={handleSaveShield}
                          className="bg-yellow-400 text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"
                        >
                          Salvar Brasão
                        </button>
                        <button 
                          onClick={async () => {
                            setClubShield(ESCUDO_URL);
                            await handleSaveSetting('clubShield', ESCUDO_URL);
                            alert('Brasão restaurado!');
                          }}
                          className="bg-zinc-800 text-zinc-400 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-all"
                        >
                          Restaurar Padrão
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <MessageCircle className="text-yellow-400" /> Links de Redes Sociais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Link do Instagram</label>
                        <input 
                          type="text" 
                          value={instagramLink}
                          onChange={(e) => {
                            setInstagramLink(e.target.value);
                            handleSaveSetting('instagramLink', e.target.value);
                          }}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="https://instagram.com/..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Link do WhatsApp</label>
                        <input 
                          type="text" 
                          value={whatsappLink}
                          onChange={(e) => {
                            setWhatsappLink(e.target.value);
                            handleSaveSetting('whatsappLink', e.target.value);
                          }}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="https://wa.me/..." 
                        />
                      </div>
                  </div>
                </div>
              </div>
            )}

            {(currentView === 'cadastrar_aluno' || currentView === 'meu_perfil') && (
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl max-w-5xl">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  {currentView === 'meu_perfil' ? <UserCircle className="text-yellow-400" /> : <UserPlus className="text-yellow-400" />} 
                  {currentView === 'meu_perfil' ? 'Meus Dados Cadastrais' : 'Novo Cadastro de Atleta'}
                </h3>
                <form className="space-y-8" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const alunoData: any = {
                    id: currentView === 'meu_perfil' ? loggedInAluno?.id : Date.now().toString(),
                    nome: formData.get('nome'),
                    dataNascimento: formData.get('dataNascimento'),
                    rgCpf: formData.get('rgCpf'),
                    telefone: formData.get('telefone'),
                    categoria: formCategoria,
                    endereco: formData.get('endereco'),
                    bairro: formData.get('bairro'),
                    cidade: formData.get('cidade'),
                    uf: formData.get('uf'),
                    responsavel: formData.get('responsavel'),
                    responsavelRgCpf: formData.get('responsavelRgCpf'),
                    telefoneResponsavel: formData.get('telefoneResponsavel'),
                    foto: photoPreview || loggedInAluno?.foto
                  };
                  await handleSaveAluno(alunoData);
                }}>
                  {/* Dados do Aluno */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Dados do Aluno</h4>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Foto 3x4 */}
                      <div className="shrink-0 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase block">Foto 3x4</label>
                        <div className="relative group">
                          <div className={cn(
                            "w-32 h-40 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-yellow-400/50",
                            (photoPreview || (currentView === 'meu_perfil' && loggedInAluno?.foto)) && "border-solid border-yellow-400"
                          )}>
                            {(photoPreview || (currentView === 'meu_perfil' && loggedInAluno?.foto)) ? (
                              <img src={photoPreview || loggedInAluno?.foto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="text-center p-4">
                                <IdCard className="text-zinc-600 mx-auto mb-2" size={32} />
                                <p className="text-[10px] text-zinc-500 font-bold uppercase leading-tight">Clique para subir</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handlePhotoChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Nome Completo</label>
                          <input 
                            name="nome"
                            type="text" 
                            defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.nome : ''}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="Nome completo" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Data de Nascimento</label>
                          <input 
                            name="dataNascimento"
                            type="date" 
                            defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.dataNascimento.split('/').reverse().join('-') : ''}
                            onChange={handleBirthDateChange}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">RG / CPF</label>
                          <input 
                            name="rgCpf"
                            type="text" 
                            defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.rgCpf : ''}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="000.000.000-00" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Telefone</label>
                          <input 
                            name="telefone"
                            type="text" 
                            defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.telefone : ''}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="(00) 00000-0000" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                          <select 
                            value={formCategoria}
                            onChange={(e) => setFormCategoria(e.target.value)}
                            disabled={currentView === 'meu_perfil'}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none disabled:opacity-50"
                          >
                            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Endereço Completo</label>
                        <input 
                          name="endereco"
                          type="text" 
                          defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.endereco : ''}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Rua, número, complemento" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Bairro</label>
                        <input 
                          name="bairro"
                          type="text" 
                          defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.bairro : ''}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Bairro" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Cidade</label>
                        <input 
                          name="cidade"
                          type="text" 
                          defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.cidade : ''}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Cidade" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">UF</label>
                        <input 
                          name="uf"
                          type="text" 
                          defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.uf : ''}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Estado" 
                          maxLength={2} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Responsável */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Dados do Responsável</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Responsável</label>
                        <input 
                          name="responsavel"
                          type="text" 
                          defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.responsavel : ''}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Nome completo" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">RG / CPF do Responsável</label>
                        <input 
                          name="responsavelRgCpf"
                          type="text" 
                          defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.responsavelRgCpf : ''}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="000.000.000-00" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Telefone do Responsável</label>
                        <input 
                          name="telefoneResponsavel"
                          type="text" 
                          defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.telefone : ''}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="(00) 00000-0000" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="submit" className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all uppercase tracking-widest shadow-lg shadow-yellow-400/20">
                      {currentView === 'meu_perfil' ? 'Atualizar Meus Dados' : 'Finalizar Cadastro do Atleta'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentView === 'cadastrar_professor' && userRole === 'admin' && (
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl max-w-5xl">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <ShieldCheck className="text-yellow-400" /> 
                  Novo Cadastro de Professor / Comissão Técnica
                </h3>
                <form className="space-y-8" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const profData: any = {
                    id: Date.now().toString(),
                    nome: formData.get('nome'),
                    dataNascimento: formData.get('dataNascimento'),
                    rgCpf: formData.get('rgCpf'),
                    cref: formData.get('cref'),
                    telefone: formData.get('telefone'),
                    email: formData.get('email'),
                    especialidade: formData.get('especialidade'),
                    endereco: formData.get('endereco'),
                    bairro: formData.get('bairro'),
                    cidade: formData.get('cidade'),
                    uf: formData.get('uf'),
                    foto: photoPreview
                  };
                  await handleSaveProfessor(profData);
                }}>
                  {/* Dados do Professor */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Dados Profissionais</h4>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Foto 3x4 */}
                      <div className="shrink-0 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase block">Foto 3x4</label>
                        <div className="relative group">
                          <div className={cn(
                            "w-32 h-40 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-yellow-400/50",
                            photoPreview && "border-solid border-yellow-400"
                          )}>
                            {photoPreview ? (
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="text-center p-4">
                                <IdCard className="text-zinc-600 mx-auto mb-2" size={32} />
                                <p className="text-[10px] text-zinc-500 font-bold uppercase leading-tight">Clique para subir</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handlePhotoChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Nome Completo</label>
                          <input 
                            type="text" 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="Nome completo do professor" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Data de Nascimento</label>
                          <input 
                            type="date" 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">RG / CPF</label>
                          <input 
                            type="text" 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="000.000.000-00" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">CREF (Registro Profissional)</label>
                          <input 
                            type="text" 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="000000-G/UF" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Especialidade / Cargo</label>
                          <select 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none"
                          >
                            <option>Treinador Principal</option>
                            <option>Auxiliar Técnico</option>
                            <option>Preparador Físico</option>
                            <option>Treinador de Goleiros</option>
                            <option>Coordenador Técnico</option>
                            <option>Fisioterapeuta</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Telefone de Contato</label>
                          <input 
                            type="text" 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="(00) 00000-0000" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">E-mail Profissional</label>
                          <input 
                            type="email" 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="email@pirua.com" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Endereço Residencial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Endereço Completo</label>
                        <input 
                          type="text" 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Rua, número, complemento" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Bairro</label>
                        <input 
                          type="text" 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Bairro" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Cidade</label>
                        <input 
                          type="text" 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Cidade" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">UF</label>
                        <input 
                          type="text" 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Estado" 
                          maxLength={2} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="button" className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all uppercase tracking-widest shadow-lg shadow-yellow-400/20">
                      Finalizar Cadastro do Professor
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentView === 'lista_alunos' && userRole === 'admin' && (
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Listagem Geral</h3>
                  <button className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-black hover:bg-yellow-500 transition-colors uppercase">
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-800/50 text-zinc-500 text-[10px] uppercase font-black tracking-widest">
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4">Nascimento</th>
                        <th className="px-6 py-4">Responsável</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredAlunos.map(aluno => (
                        <tr key={aluno.id} className="hover:bg-zinc-800/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-yellow-400">
                                {aluno.nome.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-100">{aluno.nome}</p>
                                <p className="text-xs text-zinc-500">{aluno.posicao}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded-md border border-yellow-400/20 uppercase">
                              {aluno.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-400">{aluno.dataNascimento}</td>
                          <td className="px-6 py-4 text-xs text-zinc-400">{aluno.responsavel}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleDeleteAluno(aluno.id)}
                                className="p-2 text-zinc-500 hover:text-red-400 transition-all"
                                title="Excluir Aluno"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button className="p-2 text-zinc-500 hover:text-yellow-400 transition-all">
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentView === 'chamada' && userRole === 'admin' && (
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold">Chamada de Presença</h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsScannerOpen(true)}
                      className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-yellow-500 transition-all"
                    >
                      <Camera size={16} /> LER QR CODE
                    </button>
                    <select className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none">
                      {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="date" className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="space-y-2">
                  {alunos.map(aluno => (
                    <div key={aluno.id} className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      presencas[aluno.id] === 'presente' ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-800/50 border-zinc-800"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          presencas[aluno.id] === 'presente' ? "bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-300"
                        )}>
                          {presencas[aluno.id] === 'presente' ? <ShieldCheck size={16} /> : aluno.nome.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-sm block">{aluno.nome}</span>
                          {presencas[aluno.id] === 'presente' && (
                            <span className="text-[10px] text-emerald-500 font-black uppercase">Presença Confirmada</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePresence(aluno.id, 'presente')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-black uppercase border transition-all",
                            presencas[aluno.id] === 'presente' 
                              ? "bg-emerald-500 text-white border-emerald-500" 
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                          )}
                        >
                          Presente
                        </button>
                        <button 
                          onClick={() => handlePresence(aluno.id, 'falta')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-black uppercase border transition-all",
                            presencas[aluno.id] === 'falta' 
                              ? "bg-rose-500 text-white border-rose-500" 
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
                          )}
                        >
                          Faltou
                        </button>
                        <button 
                          onClick={() => handlePresence(aluno.id, 'justificado')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-black uppercase border transition-all",
                            presencas[aluno.id] === 'justificado' 
                              ? "bg-yellow-500 text-white border-yellow-500" 
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500 hover:text-white"
                          )}
                        >
                          Justificado
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleSaveChamada}
                  className="w-full mt-8 bg-yellow-400 text-black font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"
                >
                  Salvar Chamada
                </button>
              </div>
            )}

            {currentView === 'escalacao' && (
              <div className="max-w-6xl mx-auto space-y-6">
                {userRole === 'aluno' ? (
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-400" /> Lista de Presença Evento
                      </h3>
                      <p className="text-zinc-500 text-sm mt-1">Confirme sua participação nos próximos eventos do clube.</p>
                    </div>

                    <div className="space-y-4">
                      {eventos.map(evento => {
                        const currentLineupId = evento.id;
                        const isConfirmed = (eventLineups[currentLineupId] || []).includes(loggedInAluno?.id || '');
                        
                        return (
                          <div key={evento.id} className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-zinc-100">{evento.nome}</h4>
                              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1"><CalendarDays size={14} /> {evento.dataInicio}</span>
                                <span className="flex items-center gap-1"><MapPin size={14} /> {evento.endereco}</span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => {
                                if (!loggedInAluno) return;
                                setEventLineups(prev => {
                                  const currentLineup = prev[currentLineupId] || [];
                                  const isAlreadyConfirmed = currentLineup.includes(loggedInAluno.id);
                                  const newLineup = isAlreadyConfirmed 
                                    ? currentLineup.filter(id => id !== loggedInAluno.id) 
                                    : [...currentLineup, loggedInAluno.id];
                                  handleSaveEscalacao(currentLineupId, newLineup);
                                  return { ...prev, [currentLineupId]: newLineup };
                                });
                              }}
                              className={cn(
                                "px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border",
                                isConfirmed 
                                  ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-yellow-400 hover:text-yellow-400"
                              )}
                            >
                              {isConfirmed ? 'PRESENÇA CONFIRMADA' : 'CONFIRMAR PRESENÇA'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl print:hidden">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Trophy className="text-yellow-400" /> Escalação para Evento
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">Selecione os atletas para gerar a lista de escalação oficial.</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleSaveEscalacao(escalacaoEventoId || 'custom', eventLineups[escalacaoEventoId || 'custom'] || [])}
                          disabled={!escalacaoEventoNome}
                          className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Save size={18} /> SALVAR ESCALAÇÃO
                        </button>
                        <button 
                          onClick={() => handlePrint('printable-lineup')}
                          disabled={!escalacaoEventoNome || (eventLineups[escalacaoEventoId || 'custom']?.length || 0) === 0}
                          className="bg-yellow-400 text-black px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Printer size={18} /> IMPRIMIR LISTA
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Selecionar Evento Cadastrado</label>
                        <select 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 transition-all"
                          value={escalacaoEventoId}
                          onChange={(e) => {
                            const evento = eventos.find(ev => ev.id === e.target.value);
                            if (evento) {
                              setEscalacaoEventoId(evento.id);
                              setEscalacaoEventoNome(evento.nome);
                            } else {
                              setEscalacaoEventoId('');
                            }
                          }}
                        >
                          <option value="">-- Selecione um Evento --</option>
                          {eventos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                          <option value="custom">-- Outro Evento (Manual) --</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Nome do Evento</label>
                        <input 
                          type="text" 
                          placeholder="Nome do evento para a lista..."
                          value={escalacaoEventoNome}
                          onChange={(e) => {
                            setEscalacaoEventoNome(e.target.value);
                            if (!escalacaoEventoId) setEscalacaoEventoId('custom');
                          }}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Filtro por Categoria</label>
                        <select 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 transition-all"
                          onChange={(e) => {
                            const cat = e.target.value;
                            if (cat === 'Todas') {
                              setSearchQuery('');
                            } else {
                              setSearchQuery(cat);
                            }
                          }}
                        >
                          <option value="Todas">Todas as Categorias</option>
                          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {alunos.map(aluno => {
                        const currentLineupId = escalacaoEventoId || 'custom';
                        const isSelected = (eventLineups[currentLineupId] || []).includes(aluno.id);
                        return (
                          <button 
                            key={aluno.id}
                            onClick={() => {
                              setEventLineups(prev => {
                                const currentLineup = prev[currentLineupId] || [];
                                const newLineup = isSelected 
                                  ? currentLineup.filter(id => id !== aluno.id) 
                                  : [...currentLineup, aluno.id];
                                return { ...prev, [currentLineupId]: newLineup };
                              });
                            }}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                              isSelected 
                                ? "bg-yellow-400/10 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.1)]" 
                                : "bg-zinc-800/50 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                                isSelected ? "bg-yellow-400 text-black" : "bg-zinc-700 text-zinc-400"
                              )}>
                                {aluno.nome.charAt(0)}
                              </div>
                              <div>
                                <p className={cn("font-bold text-sm", isSelected ? "text-yellow-400" : "text-zinc-100")}>{aluno.nome}</p>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{aluno.categoria}</p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                              isSelected ? "bg-yellow-400 border-yellow-400" : "border-zinc-700"
                            )}>
                              {isSelected && <CheckSquare size={12} className="text-black" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Print Preview Area */}
                <div id="printable-lineup" className="hidden print:block bg-white text-black p-10 min-h-screen">
                  <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-8">
                    <div className="flex items-center gap-4">
                      <img src={currentShield} alt="Logo" className="w-20 h-20 object-contain" />
                      <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Piruá Esporte Clube</h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">Departamento de Futebol de Base</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-black uppercase underline">Lista de Escalação Oficial</h2>
                      <p className="text-sm font-bold mt-1">{escalacaoEventoNome || 'Evento Não Informado'}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {CATEGORIAS.map(categoria => {
                      const currentLineupId = escalacaoEventoId || 'custom';
                      const atletasDaCategoria = alunos.filter(a => 
                        (eventLineups[currentLineupId] || []).includes(a.id) && a.categoria === categoria
                      );

                      if (atletasDaCategoria.length === 0) return null;

                      return (
                        <div key={categoria} className="space-y-4">
                          <h3 className="text-lg font-black bg-black text-white px-4 py-1 inline-block uppercase tracking-widest">
                            Categoria {categoria}
                          </h3>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-black">
                                <th className="py-2 text-left text-xs font-black uppercase w-12">Nº</th>
                                <th className="py-2 text-left text-xs font-black uppercase">Nome do Atleta</th>
                                <th className="py-2 text-left text-xs font-black uppercase w-32">Nascimento</th>
                                <th className="py-2 text-left text-xs font-black uppercase w-40">RG / CPF</th>
                                <th className="py-2 text-left text-xs font-black uppercase w-32">Assinatura</th>
                              </tr>
                            </thead>
                            <tbody>
                              {atletasDaCategoria.map((aluno, index) => (
                                <tr key={aluno.id} className="border-b border-zinc-200">
                                  <td className="py-3 text-sm font-bold">{index + 1}</td>
                                  <td className="py-3 text-sm font-bold uppercase">{aluno.nome}</td>
                                  <td className="py-3 text-sm">{aluno.dataNascimento}</td>
                                  <td className="py-3 text-sm">{aluno.rgCpf || '---'}</td>
                                  <td className="py-3 border-b border-black/20"></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-[10px] font-bold text-zinc-500 text-right italic">
                            Total de atletas na categoria {categoria}: {atletasDaCategoria.length}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-20 grid grid-cols-2 gap-20">
                    <div className="text-center border-t border-black pt-2">
                      <p className="text-xs font-bold uppercase">Assinatura do Responsável / Técnico</p>
                    </div>
                    <div className="text-center border-t border-black pt-2">
                      <p className="text-xs font-bold uppercase">Piruá Esporte Clube - Diretoria</p>
                    </div>
                  </div>

                  <div className="mt-12 pt-4 border-t border-zinc-200 text-[8px] text-zinc-400 text-center">
                    Documento gerado em {new Date().toLocaleString('pt-BR')} | Piruá E.C. Gestão Esportiva
                  </div>
                </div>
              </div>
            )}

            {currentView === 'anamnese' && (
              <div className="max-w-4xl mx-auto">
                {!selectedAnamneseAluno ? (
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <ClipboardList className="text-yellow-400" /> Ficha de Anamnese
                    </h3>
                    <p className="text-zinc-500 mb-8 italic">Selecione um atleta para preencher ou visualizar a ficha de histórico médico e hábitos.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {alunos.map(aluno => (
                        <button 
                          key={aluno.id} 
                          onClick={async () => {
                            setSelectedAnamneseAluno(aluno);
                            const res = await fetch(`/api/anamneses/${aluno.id}`);
                            const data = await res.json();
                            setAnamneseData(data || {
                              horarioDormir: '',
                              dificuldadeAcordar: false,
                              tempoCelular: '',
                              alimentaBem: false,
                              frequenciaMedico: '',
                              fraturas: '',
                              tratamentoMedico: '',
                              medicacaoControlada: '',
                              outroExercicio: '',
                              alergias: ''
                            });
                          }}
                          className="flex items-center justify-between p-6 bg-zinc-800/50 border border-zinc-800 rounded-2xl hover:border-yellow-400/50 transition-all group"
                        >
                          <div className="text-left">
                            <p className="font-bold text-zinc-100 group-hover:text-yellow-400 transition-colors">{aluno.nome}</p>
                            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mt-1">{aluno.categoria}</p>
                          </div>
                          <ChevronRight className="text-zinc-600 group-hover:text-yellow-400 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                      <button 
                        onClick={() => setSelectedAnamneseAluno(null)}
                        className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-bold"
                      >
                        <ChevronRight className="rotate-180" size={18} /> Voltar para Lista
                      </button>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handlePrint('printable-anamnese')}
                          className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-700"
                        >
                          <Printer size={18} /> Imprimir Ficha
                        </button>
                        <button 
                          onClick={handleSaveAnamnese}
                          className="bg-yellow-400 text-black px-6 py-2 rounded-xl font-black text-sm hover:bg-yellow-500"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>

                    <div id="printable-anamnese" className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl print:bg-white print:text-black print:p-0 print:border-0 print:shadow-none">
                      {/* Header da Ficha (Print Only) */}
                      <div className="hidden print:block text-center border-b-2 border-black pb-6 mb-8">
                        <img src={currentShield} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
                        <h2 className="text-xl font-black uppercase tracking-tighter">Piruá Esporte Clube</h2>
                        <h3 className="text-sm font-bold uppercase underline">Ficha de Anamnese e Histórico Médico</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Dados Pessoais (Baseados na Ficha Cadastral) */}
                        <div className="md:col-span-3 bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800 print:bg-zinc-50 print:border-zinc-200">
                          <h4 className="text-yellow-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2 print:text-black">
                            <UserCircle size={16} /> Dados do Atleta
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">Nome</p>
                              <p className="text-sm font-bold">{selectedAnamneseAluno.nome}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">Nascimento</p>
                              <p className="text-sm font-bold">{selectedAnamneseAluno.dataNascimento}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">RG / CPF</p>
                              <p className="text-sm font-bold">{selectedAnamneseAluno.rgCpf || '---'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">Categoria</p>
                              <p className="text-sm font-bold">{selectedAnamneseAluno.categoria}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">Endereço</p>
                              <p className="text-sm font-bold">{selectedAnamneseAluno.endereco}, {selectedAnamneseAluno.bairro}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">Responsável</p>
                              <p className="text-sm font-bold">{selectedAnamneseAluno.responsavel}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">Telefone</p>
                              <p className="text-sm font-bold">{selectedAnamneseAluno.telefone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Hábitos e Rotina */}
                        <div className="space-y-6">
                          <h4 className="text-yellow-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 print:text-black">
                            <ClipboardList size={16} /> Hábitos e Rotina
                          </h4>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Horário que dorme</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Ex: 22:00" 
                                value={anamneseData.horarioDormir || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, horarioDormir: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-yellow-400" 
                                id="acordar-cedo" 
                                checked={anamneseData.dificuldadeAcordar || false}
                                onChange={(e) => setAnamneseData({ ...anamneseData, dificuldadeAcordar: e.target.checked })}
                              />
                              <label htmlFor="acordar-cedo" className="text-sm text-zinc-300 print:text-black">Dificuldade em acordar cedo?</label>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Tempo de Celular/Jogos (dia)</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Ex: 2 horas" 
                                value={anamneseData.tempoCelular || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, tempoCelular: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-yellow-400" 
                                id="alimenta-bem" 
                                checked={anamneseData.alimentaBem || false}
                                onChange={(e) => setAnamneseData({ ...anamneseData, alimentaBem: e.target.checked })}
                              />
                              <label htmlFor="alimenta-bem" className="text-sm text-zinc-300 print:text-black">Se alimenta bem (come de tudo)?</label>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Frequência ao Médico</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Ex: Semestral" 
                                value={anamneseData.frequenciaMedico || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, frequenciaMedico: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Histórico Médico */}
                        <div className="space-y-6">
                          <h4 className="text-yellow-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 print:text-black">
                            <ShieldAlert size={16} /> Histórico Médico
                          </h4>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Já fraturou algum membro?</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Qual?" 
                                value={anamneseData.fraturas || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, fraturas: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Tratamento médico atual?</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Qual?" 
                                value={anamneseData.tratamentoMedico || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, tratamentoMedico: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Medicação controlada?</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Qual?" 
                                value={anamneseData.medicacaoControlada || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, medicacaoControlada: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Outro exercício físico?</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Qual?" 
                                value={anamneseData.outroExercicio || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, outroExercicio: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Alergias?</label>
                              <input 
                                type="text" 
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" 
                                placeholder="Qual?" 
                                value={anamneseData.alergias || ''}
                                onChange={(e) => setAnamneseData({ ...anamneseData, alergias: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Condições Específicas */}
                        <div className="space-y-6">
                          <h4 className="text-yellow-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 print:text-black">
                            <Layers size={16} /> Condições e Restrições
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { id: 'resp', label: 'Problemas Respiratórios' },
                              { id: 'card', label: 'Problemas Cardíacos' },
                              { id: 'hiper', label: 'Hipertensão (Alta)' },
                              { id: 'hipo', label: 'Hipotensão (Baixa)' },
                              { id: 'epil', label: 'Epilepsia' },
                              { id: 'diab', label: 'Diabetes' },
                              { id: 'alim', label: 'Restrição Alimentar' }
                            ].map(item => (
                              <div key={item.id} className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <input type="checkbox" className="w-4 h-4 accent-yellow-400" id={item.id} />
                                  <label htmlFor={item.id} className="text-sm text-zinc-300 print:text-black">{item.label}</label>
                                </div>
                                <input type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-[10px] outline-none focus:border-yellow-400 print:border-zinc-300 print:bg-white" placeholder="Detalhes..." />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Patologias (Checkboxes) */}
                        <div className="md:col-span-3 bg-zinc-800/20 p-6 rounded-2xl border border-zinc-800 print:bg-zinc-50 print:border-zinc-200">
                          <h4 className="text-yellow-400 font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2 print:text-black">
                            <ShieldAlert size={16} /> Patologias e Transtornos (Diagnóstico)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                              { id: 'tdah', label: 'TDAH (Déficit de Atenção/Hiperatividade)' },
                              { id: 'tea', label: 'TEA (Autismo)' },
                              { id: 'tod', label: 'TOD (Transtorno Opositor Desafiador)' },
                              { id: 'di', label: 'DI (Déficit Intelectual)' },
                              { id: 'ans', label: 'Ansiedade' }
                            ].map(pat => (
                              <div key={pat.id} className="flex items-center gap-3">
                                <input type="checkbox" className="w-5 h-5 accent-yellow-400 rounded-md" id={pat.id} />
                                <label htmlFor={pat.id} className="text-sm text-zinc-300 font-medium print:text-black">{pat.label}</label>
                              </div>
                            ))}
                            <div className="md:col-span-3 space-y-2">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold">Outras patologias ou observações importantes</label>
                              <textarea className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 min-h-[100px] print:border-zinc-300 print:bg-white" placeholder="Descreva aqui..."></textarea>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assinatura (Print Only) */}
                      <div className="hidden print:block mt-20 pt-10 border-t border-black">
                        <div className="grid grid-cols-2 gap-20">
                          <div className="text-center">
                            <div className="border-b border-black mb-2"></div>
                            <p className="text-[10px] font-bold uppercase">Assinatura do Responsável</p>
                          </div>
                          <div className="text-center">
                            <div className="border-b border-black mb-2"></div>
                            <p className="text-[10px] font-bold uppercase">Carimbo e Assinatura do Clube</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'carteirinha' && (
              <div className="flex flex-col items-center">
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl w-full max-w-md">
                  <h3 className="text-xl font-bold mb-8 text-center">Visualizar Carteirinha</h3>
                  <div className="space-y-4 mb-8">
                    {alunos.map(aluno => (
                      <button 
                        key={aluno.id} 
                        onClick={() => setSelectedAluno(aluno)}
                        className={cn(
                          "w-full p-4 rounded-xl border transition-all text-left",
                          selectedAluno?.id === aluno.id ? "bg-yellow-400 border-yellow-400 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        )}
                      >
                        <p className="font-bold">{aluno.nome}</p>
                      </button>
                    ))}
                  </div>

                  {selectedAluno && (
                    <motion.div 
                      id="carteirinha-atleta"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative w-full aspect-[1.58/1] bg-zinc-950 rounded-2xl border-2 border-yellow-400 overflow-hidden shadow-2xl"
                    >
                      {/* Top Bar */}
                      <div className="absolute top-0 left-0 w-full h-10 bg-yellow-400 flex items-center px-4 justify-between">
                        <div className="flex items-center gap-2">
                          <img src={currentShield} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                          <span className="text-black font-black text-[10px] tracking-tighter">PIRUÁ ESPORTE CLUBE</span>
                        </div>
                        <div className="bg-black px-2 py-0.5 rounded text-[8px] font-black text-yellow-400 uppercase">Atleta</div>
                      </div>

                      <div className="mt-12 px-4 flex gap-4">
                        {/* Photo Area */}
                        <div className="w-24 h-32 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0 overflow-hidden flex items-center justify-center relative">
                          {selectedAluno.foto ? (
                            <img src={selectedAluno.foto} alt={selectedAluno.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <UserCircle size={40} className="text-zinc-700" />
                              <span className="text-[6px] text-zinc-600 font-bold uppercase">Sem Foto</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 w-full bg-yellow-400/90 py-1 text-center">
                            <span className="text-[8px] font-black text-black uppercase">{selectedAluno.categoria}</span>
                          </div>
                        </div>

                        {/* Data Area */}
                        <div className="flex-1 space-y-2 py-1">
                          <div>
                            <p className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">Nome Completo</p>
                            <p className="text-[11px] font-black uppercase text-white leading-tight">{selectedAluno.nome}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">Nascimento</p>
                              <p className="text-[10px] font-bold text-white">{selectedAluno.dataNascimento}</p>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">RG / CPF</p>
                              <p className="text-[10px] font-bold text-white">{selectedAluno.rgCpf || '---'}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">Endereço Completo</p>
                            <p className="text-[9px] font-medium text-zinc-300 leading-tight">
                              {selectedAluno.endereco}, {selectedAluno.bairro}<br />
                              {selectedAluno.cidade} - {selectedAluno.uf}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">Responsável</p>
                              <p className="text-[9px] font-bold text-white truncate">{selectedAluno.responsavel}</p>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">Telefone</p>
                              <p className="text-[9px] font-bold text-white">{selectedAluno.telefone}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-end pt-1">
                            <div>
                              <p className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">Matrícula</p>
                              <p className="text-[10px] font-bold text-white">#{selectedAluno.id.toString().padStart(5, '0')}</p>
                            </div>
                            <div className="bg-white p-0.5 rounded shadow-sm">
                              <QRCodeSVG 
                                value={`https://piruaec.com.br/atleta/${selectedAluno.id}`}
                                size={24}
                                level="L"
                                includeMargin={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Bar */}
                      <div className="absolute bottom-0 left-0 w-full h-6 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 justify-between">
                        <span className="text-zinc-500 font-bold text-[7px] uppercase tracking-widest">Documento de Identificação Interna</span>
                        <span className="text-zinc-500 font-bold text-[7px] uppercase">Válido até 12/2026</span>
                      </div>
                    </motion.div>
                  )}
                  
                  {selectedAluno && (
                    <div className="flex gap-4 mt-8">
                      <button 
                        onClick={() => handlePrint('carteirinha-atleta')}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 text-white py-3 rounded-xl font-bold hover:bg-zinc-700 transition-all"
                      >
                        <Printer size={18} /> Imprimir
                      </button>
                      <button 
                        onClick={() => handleDownload('carteirinha-atleta', `carteirinha-${selectedAluno?.nome}`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-black py-3 rounded-xl font-black hover:bg-yellow-500 transition-all"
                      >
                        <Download size={18} /> Baixar PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'presenca_evento' && (
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl max-w-4xl mx-auto">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <CalendarDays className="text-yellow-400" /> Próximos Eventos e Presença
                </h3>
                <div className="space-y-6">
                  {eventos.map(evento => (
                    <div key={evento.id} className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-yellow-400/10 p-3 rounded-xl text-yellow-400">
                          <Trophy size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{evento.nome}</p>
                          <p className="text-sm text-zinc-500">{evento.cidade} - {evento.uf} • {new Date(evento.dataInicio).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setEscalacaoEventoId(evento.id);
                            setEscalacaoEventoNome(evento.nome);
                            setCurrentView('escalacao');
                          }}
                          className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2"
                        >
                          <Trophy size={14} /> Escalação
                        </button>
                        <button 
                          onClick={() => setEventAttendance(prev => ({ ...prev, [evento.id]: 'confirmado' }))}
                          className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black uppercase border transition-all",
                            eventAttendance[evento.id] === 'confirmado' 
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-emerald-500/50"
                          )}
                        >
                          Vou Participar
                        </button>
                        <button 
                          onClick={() => setEventAttendance(prev => ({ ...prev, [evento.id]: 'ausente' }))}
                          className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black uppercase border transition-all",
                            eventAttendance[evento.id] === 'ausente' 
                              ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20" 
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-rose-500/50"
                          )}
                        >
                          Não Vou
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'categorias' && userRole === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CATEGORIAS.map(cat => (
                  <div key={cat} className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl group hover:border-yellow-400/50 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-yellow-400/10 p-3 rounded-2xl text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                        <Layers size={24} />
                      </div>
                      <span className="text-zinc-500 font-black text-xs">2024/2025</span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-100 mb-2">{cat}</h3>
                    <p className="text-zinc-500 text-sm mb-6">Atletas nascidos em {2024 - parseInt(cat.split('-')[1])} e {2024 - parseInt(cat.split('-')[1]) + 1}.</p>
                    <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                      <span className="text-xs font-bold text-zinc-400">24 Alunos</span>
                      <button className="text-yellow-400 font-black text-xs uppercase tracking-widest hover:underline">Ver Lista</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentView === 'eventos' && userRole === 'admin' && (
              <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                    <CalendarDays className="text-yellow-400" /> Cadastrar Novo Evento
                  </h3>
                  <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const eventoData: any = {
                    id: Date.now().toString(),
                    nome: formData.get('nome'),
                    endereco: formData.get('endereco'),
                    cidade: formData.get('cidade'),
                    uf: formData.get('uf'),
                    dataInicio: formData.get('dataInicio'),
                    dataFim: formData.get('dataFim'),
                    horario: formData.get('horario')
                  };
                  await handleSaveEvento(eventoData);
                }}>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Evento</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Torneio Regional, Amistoso..."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Endereço do Evento</label>
                        <input 
                          type="text" 
                          placeholder="Rua, número, estádio ou ginásio"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cidade do Evento</label>
                        <input 
                          type="text" 
                          placeholder="Cidade"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">UF</label>
                        <input 
                          type="text" 
                          placeholder="Estado"
                          maxLength={2}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all uppercase" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data de Início</label>
                        <input 
                          type="date" 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data de Fim</label>
                        <input 
                          type="date" 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Horário</label>
                        <input 
                          type="time" 
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button type="button" className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all uppercase tracking-widest shadow-lg shadow-yellow-400/20">
                        Salvar Evento
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Trophy className="text-yellow-400" /> Eventos Cadastrados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eventos.map(evento => (
                      <div key={evento.id} className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-800 flex justify-between items-center group hover:border-yellow-400/50 transition-all">
                        <div>
                          <p className="font-bold text-zinc-100">{evento.nome}</p>
                          <p className="text-xs text-zinc-500 mt-1">{evento.cidade} - {evento.uf} • {new Date(evento.dataInicio).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setEscalacaoEventoId(evento.id);
                            setEscalacaoEventoNome(evento.nome);
                            setCurrentView('escalacao');
                          }}
                          className="bg-zinc-700 text-white p-3 rounded-xl hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 text-xs font-black uppercase"
                        >
                          <Trophy size={16} /> Escalar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentView === 'documentos' && userRole === 'admin' && (
              <div className="max-w-4xl mx-auto">
                {!showDocPreview ? (
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                      <FileText className="text-yellow-400" /> Gerar Documento
                    </h3>

                    {/* Seleção de Tipo de Documento */}
                    <div className="flex gap-4 mb-8">
                      <button
                        onClick={() => setDocType('viagem')}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2",
                          docType === 'viagem' ? "bg-yellow-400 border-yellow-400 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        )}
                      >
                        <Plane size={18} /> Autorização de Viagem
                      </button>
                      <button
                        onClick={() => setDocType('termo')}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2",
                          docType === 'termo' ? "bg-yellow-400 border-yellow-400 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        )}
                      >
                        <ShieldCheck size={18} /> Termo de Responsabilidade
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {/* Seleção de Atleta */}
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">1. Selecione o Atleta</label>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {alunos.map(aluno => (
                            <button 
                              key={aluno.id}
                              onClick={() => setSelectedAluno(aluno)}
                              className={cn(
                                "w-full p-4 rounded-xl border transition-all text-left flex items-center gap-3",
                                selectedAluno?.id === aluno.id ? "bg-yellow-400 border-yellow-400 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                              )}
                            >
                              <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center font-black">{aluno.nome.charAt(0)}</div>
                              <span className="font-bold text-sm">{aluno.nome}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Seleção de Evento (Apenas para Viagem) */}
                      {docType === 'viagem' ? (
                        <div className="space-y-4">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">2. Selecione o Evento</label>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {eventos.map(evento => (
                              <button 
                                key={evento.id}
                                onClick={() => setSelectedEvento(evento)}
                                className={cn(
                                  "w-full p-4 rounded-xl border transition-all text-left flex items-center gap-3",
                                  selectedEvento?.id === evento.id ? "bg-yellow-400 border-yellow-400 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                )}
                              >
                                <CalendarDays size={18} className={selectedEvento?.id === evento.id ? "text-black" : "text-yellow-400"} />
                                <div>
                                  <p className="font-bold text-sm">{evento.nome}</p>
                                  <p className="text-[10px] opacity-70">{evento.cidade} - {evento.uf}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-12 h-12 bg-yellow-400/10 rounded-full flex items-center justify-center text-yellow-400">
                            <MapPin size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-200">Local de Treinamento Fixo</p>
                            <p className="text-xs text-zinc-500 mt-1">ESTÁDIO MUNICIPAL QUINZINHO NERY</p>
                          </div>
                          <p className="text-[10px] text-zinc-600 italic">Este documento utiliza o endereço padrão do clube para treinamentos e avaliações.</p>
                        </div>
                      )}
                    </div>

                    <button 
                      disabled={!selectedAluno || (docType === 'viagem' && !selectedEvento)}
                      onClick={() => setShowDocPreview(true)}
                      className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20"
                    >
                      Gerar Documento para Impressão
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                      <button 
                        onClick={() => setShowDocPreview(false)}
                        className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-bold"
                      >
                        <ChevronRight className="rotate-180" size={18} /> Voltar
                      </button>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handlePrint('printable-doc')}
                          className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-700"
                        >
                          <Printer size={18} /> Imprimir
                        </button>
                        <button 
                          onClick={() => handleDownload('printable-doc', `documento-${selectedAluno?.nome}`)}
                          className="bg-yellow-400 text-black px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-yellow-500"
                        >
                          <Download size={18} /> Baixar PDF
                        </button>
                      </div>
                    </div>

                    {/* Documento Estilizado para Impressão */}
                    <div className="bg-white text-black p-12 shadow-2xl rounded-sm min-h-[800px] print:shadow-none print:p-0" id="printable-doc">
                      <div className="text-center border-b-2 border-black pb-6 mb-8">
                        <img src={currentShield} alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Piruá Esporte Clube</h2>
                        <p className="text-xs font-bold uppercase tracking-widest">Departamento de Futebol de Base</p>
                      </div>

                      {docType === 'viagem' ? (
                        <div className="space-y-8 text-justify leading-relaxed">
                          <h3 className="text-xl font-black text-center uppercase underline">Autorização de Viagem e Participação em Evento</h3>

                          <p className="text-sm">
                            Eu, <strong>{selectedAluno?.responsavel}</strong>, portador(a) do RG/CPF nº <strong>{selectedAluno?.responsavelRgCpf || '____________________'}</strong>, 
                            na qualidade de responsável legal pelo atleta menor <strong>{selectedAluno?.nome}</strong>, nascido em <strong>{selectedAluno?.dataNascimento}</strong>, 
                            inscrito sob o RG/CPF nº <strong>{selectedAluno?.rgCpf || '____________________'}</strong>, residente e domiciliado em <strong>{selectedAluno?.endereco}, {selectedAluno?.bairro}, {selectedAluno?.cidade}-{selectedAluno?.uf}</strong>, 
                            venho por meio desta <strong>AUTORIZAR</strong> sua participação no evento denominado <strong>{selectedEvento?.nome}</strong>.
                          </p>

                          <p className="text-sm">
                            O referido evento realizar-se-á na cidade de <strong>{selectedEvento?.cidade}-{selectedEvento?.uf}</strong>, no endereço <strong>{selectedEvento?.endereco}</strong>, 
                            com início previsto para o dia <strong>{selectedEvento?.dataInicio ? new Date(selectedEvento.dataInicio).toLocaleDateString('pt-BR') : '___/___/___'}</strong> e término em <strong>{selectedEvento?.dataFim ? new Date(selectedEvento.dataFim).toLocaleDateString('pt-BR') : '___/___/___'}</strong>.
                          </p>

                          <p className="text-sm">
                            Autorizo ainda que o atleta seja transportado em veículo gentilmente cedido pela <strong>Prefeitura Municipal de Campos Altos</strong>, através da <strong>Secretaria de Esporte e Lazer</strong> juntamente com a <strong>Secretaria de Administração do Município</strong>, ou por outros meios designados pelo Piruá Esporte Clube.
                          </p>

                          <p className="text-sm italic bg-zinc-50 p-4 border-l-4 border-black">
                            "Isento os organizadores do Evento de qualquer responsabilidade por danos eventualmente causados ao menor acima citado no decorrer da competição. Ressaltamos que prestaremos toda atenção necessária durante a viagem, como também durante os jogos. No caso de lesões ou até mesmo fraturas, enfatizamos que prestaremos todo apoio necessário ao atleta de acordo com as nossas condições."
                          </p>

                          <div className="pt-12">
                            <p className="text-sm text-right">
                              {selectedEvento?.cidade}, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                            </p>
                          </div>

                          <div className="pt-20 grid grid-cols-1 gap-12 max-w-md mx-auto">
                            <div className="text-center border-t border-black pt-2">
                              <p className="text-xs font-bold uppercase">{selectedAluno?.responsavel}</p>
                              <p className="text-[10px] text-zinc-600">Assinatura do Responsável Legal</p>
                            </div>
                            <div className="text-center border-t border-black pt-2">
                              <p className="text-xs font-bold uppercase">Piruá Esporte Clube</p>
                              <p className="text-[10px] text-zinc-600">Carimbo e Assinatura da Diretoria</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-justify leading-snug text-[11px]">
                          <h3 className="text-lg font-black text-center uppercase underline mb-4">Termo de Responsabilidade e Autorização</h3>

                          <p className="font-bold">Declaramos e autorizamos o quanto segue abaixo:</p>

                          <p>
                            Autorizo o menor acima mencionado, <strong>{selectedAluno?.nome}</strong>, a treinar e realizar testes/avaliação de futebol no <strong>ESTÁDIO MUNICIPAL QUINZINHO NERY</strong>, situado ao endereço Av. Newton Ferreira de Paiva, nº ___, Bairro Nossa Senhora Aparecida, Cidade de Campos Altos, Estado de Minas Gerais, CEP 38970-000, ou (37) 99124-3101, sob a supervisão de <strong>Marcos Vinícius Machado</strong> e, pelo período mínimo de 12 meses (1 ano) a contar a partir da data deste documento, e sobre todas as normas estabelecidas nesse TERMO DE RESPONSABILIDADE E AUTORIZAÇÃO como segue abaixo:
                          </p>

                          <div className="space-y-2">
                            <p>1. O RESPONSÁVEL declara ter pleno conhecimento de que o treinamento envolve testes físicos, treinamentos com bola, coletivos e trabalho técnico.</p>
                            <p>2. O RESPONSÁVEL assume ainda integral responsabilidade, civil e criminal, pela autenticidade dos documentos ora apresentados, na eventualidade dos mesmos conterem qualquer vício.</p>
                            <p>3. O RESPONSÁVEL declara que o ATLETA possui documentação original regularizada devidamente, e prática regularmente atividades esportivas, não sofrendo de nenhuma doença ou limitação física que desaconselhe ou impeça a prática do mesmo nos treinos futebolísticos.</p>
                            <p>4. O RESPONSÁVEL declara estar ciente de que, como em qualquer outra atividade física, podem ocorrer lesões e ferimentos no ATLETA durante o período de treinamento.</p>
                            <p>5. Sendo desejo do ATLETA e do RESPONSÁVEL que o primeiro participe dos treinamentos a serem realizados no Estádio Municipal Quinzinho Nery, ambos isentam os TREINADORES de toda e qualquer responsabilidade por eventuais lesões físicas, fraturas, acidentes em geral ou danos de qualquer natureza que venham a ocorrer no período de testes. Nestes casos prestaremos todo apoio necessário para melhora do atleta, condução ao hospital ou PAM, e também em casa para os primeiros atendimentos. Este termo se faz necessário pois nós instrutores não somos remunerados e não temos condições de custear nenhum tratamento pois somos voluntários interessados em ajudar no desenvolvimento do seu filho, seja no âmbito esportivo e social, salvo que tentaremos ajudar da melhor forma possível se algo acontecer.</p>
                            <p>6. O RESPONSÁVEL declara estar ciente de que o ATLETA deverá trazer de casa para treinar a chuteira, caneleira, um tênis para corrida, chinelo. Caso falte um dos itens, o ATLETA não treinará até que providencie tal item, cumprindo esta norma.</p>
                            <p>7. O RESPONSÁVEL declara estar ciente de que deve anexar uma cópia da Cédula de Identidade RG do ATLETA e do RESPONSÁVEL, e que se esse item não for 100% cumprido até o início dos treinamentos, o ATLETA não iniciará os treinos enquanto não cumprir em 100% tal exigência.</p>
                            <p>8. O RESPONSÁVEL declara estar ciente e concordar que nesse período de treinamento e também em caso de teste/avaliação, qualquer dano causado ao patrimônio deverá ser por ele imediatamente custeado, e o cumprimento em 100% do Regulamento.</p>
                            <p>9. O RESPONSÁVEL declara estar ciente e autoriza a organização do projeto a realizar postagem de fotos, vídeos "conteúdos de mídia", em redes sociais como Facebook, YouTube, Instagram e WhatsApp a fim de promover o trabalho desenvolvido na escolinha, como também envio de vídeos e fotos a profissionais ligados ao futebol como avaliadores, olheiros que com o intuito de projetar seu filho(a) ao mercado futebolístico.</p>
                          </div>

                          <p className="font-bold mt-4">
                            Por estar ciente e de acordo com todos os itens acima estabelecidos, o RESPONSÁVEL expressamente autoriza a participação do atleta nos treinamentos, teste/avaliação de futebol, assumindo toda e qualquer responsabilidade por eventuais acidentes, lesões e/ou demais danos que possam ser ocasionados ao ATLETA em decorrência dessa participação, independente da extensão e natureza dos mesmos.
                          </p>

                          <div className="bg-zinc-50 p-3 border border-zinc-200 rounded text-[9px] space-y-1">
                            <p className="font-black uppercase">Observações e Punições:</p>
                            <p>• Ofensas verbais aos companheiros, treinadores, professores na escola e também aos pais.</p>
                            <p>• Chegar aos treinos com atrasos sem justificativa.</p>
                            <p>• Brigas no âmbito escolar, no centro de treinamento (campo) ou na rua.</p>
                            <p>• É de extrema importância a entrega dos boletins escolares. O aluno deve ter boas notas e se esforçar para melhorar seu desempenho.</p>
                            <p className="font-bold">As punições podem variar de proibição de treinos/jogos até exclusão definitiva.</p>
                            <p className="font-bold">Horário de treino: 07:30h às 12:30h. Obrigatório RG para viagens e jogos.</p>
                          </div>

                          <div className="pt-8 grid grid-cols-1 gap-8 max-w-md mx-auto">
                            <div className="text-center border-t border-black pt-1">
                              <p className="text-[10px] font-bold uppercase">{selectedAluno?.responsavel}</p>
                              <p className="text-[8px] text-zinc-600">Assinatura do Responsável Legal</p>
                            </div>
                            <div className="text-center border-t border-black pt-1">
                              <p className="text-[10px] font-bold uppercase">Piruá Esporte Clube</p>
                              <p className="text-[8px] text-zinc-600">Carimbo e Assinatura da Diretoria</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-12 pt-4 border-t border-zinc-200 text-[9px] text-zinc-400 text-center">
                        Documento gerado pelo Sistema de Gestão Piruá E.C. em {new Date().toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Scanner Modal */}
        <AnimatePresence>
          {isScannerOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            >
              <div className="bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-400 p-2 rounded-lg">
                      <Camera size={20} className="text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Validar Presença</h3>
                      <p className="text-xs text-zinc-500">Aponte a câmera para o QR Code</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsScannerOpen(false)}
                    className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6">
                  <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-zinc-700 bg-black aspect-square"></div>
                  <div className="mt-6 text-center">
                    <p className="text-sm text-zinc-400">
                      O sistema irá identificar automaticamente o atleta e registrar sua presença.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
