/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
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
  Share2,
  User,
  MoreVertical,
  ChevronRight,
  Trophy,
  UserCircle,
  Bell,
  Plus,
  Trash2,
  Edit,
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
  Cake,
  ClipboardCheck,
  CalendarPlus,
  Database,
  Upload,
  Cloud,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Toaster, toast } from 'sonner';
import { auth, db, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc, handleFirestoreError, OperationType } from './firebase.ts';
import { supabase, checkSupabaseConnection } from './supabase';
import { supabaseService } from './services/supabaseService';

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
  | 'aniversariantes'
  | 'public_registration'
  | 'solicitacoes_cadastro';

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
  status?: 'ativo' | 'inativo';
  numeroCamisa?: string;
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

interface Presenca {
  id: string;
  alunoId: string;
  status: 'presente' | 'falta' | 'justificado';
  date: string;
  uid: string;
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

const CATEGORIAS = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-Adulto'];

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

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, isMobile, badge }: { icon: any, label: string, active: boolean, onClick: () => void, collapsed?: boolean, isMobile?: boolean, badge?: number }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden",
      active 
        ? "bg-yellow-400 text-black shadow-xl shadow-yellow-400/20 font-bold" 
        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-yellow-400",
      collapsed && !isMobile && "justify-center px-0"
    )}
    title={collapsed && !isMobile ? label : ""}
  >
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="absolute inset-0 bg-yellow-400 z-0"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <Icon size={20} className={cn("shrink-0 relative z-10 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
    {(!collapsed || isMobile) && <span className="text-xs font-bold uppercase tracking-wider relative z-10 truncate">{label}</span>}
    {badge !== undefined && badge > 0 && (
      <span className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-black rounded-full z-20",
        active ? "bg-black text-yellow-400" : "bg-red-500 text-white"
      )}>
        {badge}
      </span>
    )}
  </button>
);

const BottomNavItem = ({ icon: Icon, label, active, onClick, badge }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: number }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-300 relative",
      active ? "text-yellow-400" : "text-zinc-500"
    )}
  >
    <div className={cn(
      "p-2 rounded-xl transition-all duration-300 relative",
      active ? "bg-yellow-400/10 scale-110" : ""
    )}>
      <Icon size={20} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] text-[8px] font-black bg-red-500 text-white rounded-full">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const PublicRegistrationForm = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    idade: '',
    categoria: '',
    posicao: '',
    dataNascimento: '',
    responsavel: '',
    telefone: '',
    rgCpf: '',
    responsavelRgCpf: '',
    telefoneResponsavel: '',
    endereco: '',
    bairro: '',
    cidade: '',
    uf: '',
    foto: '',
    // Anamnese fields
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.telefone || !formData.responsavel) {
      alert('Por favor, preencha pelo menos o nome, telefone e o responsável.');
      return;
    }
    setLoading(true);
    try {
      const id = Date.now().toString();
      const solicitacaoData = {
        ...formData,
        id,
        status: 'pendente' as const,
        createdAt: new Date().toISOString()
      };

      // Save to Supabase
      try {
        await supabaseService.saveSolicitacao(solicitacaoData);
        console.log("Solicitação salva no Supabase");
      } catch (supaError) {
        console.error("Erro ao salvar solicitação no Supabase:", supaError);
      }

      // Backup to Firestore
      await setDoc(doc(db, 'solicitacoes_cadastro', id), {
        ...solicitacaoData,
        uid: 'public'
      });

      alert('Solicitação enviada com sucesso! Aguarde o contato do clube.');
      onComplete();
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <img src={ESCUDO_URL} alt="Logo" className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">Ficha de <span className="text-yellow-400">Cadastro</span></h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Piruá Esporte Clube</p>
        </div>

        <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
          <div className="flex gap-2 mb-8">
            <div className={cn("h-1 flex-1 rounded-full transition-all", step >= 1 ? "bg-yellow-400" : "bg-zinc-800")}></div>
            <div className={cn("h-1 flex-1 rounded-full transition-all", step >= 2 ? "bg-yellow-400" : "bg-zinc-800")}></div>
            <div className={cn("h-1 flex-1 rounded-full transition-all", step >= 3 ? "bg-yellow-400" : "bg-zinc-800")}></div>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <User className="text-yellow-400" /> Dados do Aluno
              </h3>
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Foto 3x4</label>
                  <div className="relative group">
                    <div className={cn(
                      "w-32 h-40 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-yellow-400/50",
                      formData.foto && "border-solid border-yellow-400"
                    )}>
                      {formData.foto ? (
                        <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
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

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="Nome do Aluno"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Data de Nascimento</label>
                    <input 
                      type="date" 
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">RG / CPF</label>
                    <input 
                      type="text" 
                      value={formData.rgCpf}
                      onChange={(e) => setFormData({...formData, rgCpf: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Categoria</label>
                    <select 
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Posição</label>
                    <input 
                      type="text" 
                      value={formData.posicao}
                      onChange={(e) => setFormData({...formData, posicao: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="Ex: Goleiro, Atacante"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Telefone do Aluno (opcional)</label>
                    <input 
                      type="text" 
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all mt-8"
              >
                Próximo Passo: Endereço e Responsável
              </button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <MapPin className="text-yellow-400" /> Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Endereço Completo</label>
                    <input 
                      type="text" 
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bairro</label>
                    <input 
                      type="text" 
                      value={formData.bairro}
                      onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cidade</label>
                    <input 
                      type="text" 
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">UF</label>
                    <input 
                      type="text" 
                      value={formData.uf}
                      onChange={(e) => setFormData({...formData, uf: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="Estado"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <Users className="text-yellow-400" /> Dados do Responsável
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome do Responsável</label>
                    <input 
                      type="text" 
                      value={formData.responsavel}
                      onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="Nome do Pai ou Mãe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">RG / CPF do Responsável</label>
                    <input 
                      type="text" 
                      value={formData.responsavelRgCpf}
                      onChange={(e) => setFormData({...formData, responsavelRgCpf: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Telefone do Responsável</label>
                    <input 
                      type="text" 
                      value={formData.telefoneResponsavel}
                      onChange={(e) => setFormData({...formData, telefoneResponsavel: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-[2] bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all"
                >
                  Próximo Passo: Anamnese
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <ShieldAlert className="text-yellow-400" /> Ficha de Anamnese
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Horário que costuma dormir</label>
                  <input 
                    type="text" 
                    value={formData.horarioDormir}
                    onChange={(e) => setFormData({...formData, horarioDormir: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tempo de uso de celular/games</label>
                  <input 
                    type="text" 
                    value={formData.tempoCelular}
                    onChange={(e) => setFormData({...formData, tempoCelular: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Alergias</label>
                  <input 
                    type="text" 
                    value={formData.alergias}
                    onChange={(e) => setFormData({...formData, alergias: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Medicação Controlada</label>
                  <input 
                    type="text" 
                    value={formData.medicacaoControlada}
                    onChange={(e) => setFormData({...formData, medicacaoControlada: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Finalizar Cadastro'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Ops! Algo deu errado</h1>
          <p className="text-zinc-500 max-w-md mb-8">
            Ocorreu um erro inesperado no sistema. Tente recarregar a página ou entre em contato com o suporte.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-yellow-500 transition-all"
          >
            Recarregar Página
          </button>
          {(import.meta as any).env.DEV && (
            <pre className="mt-8 p-4 bg-zinc-900 rounded-xl text-left text-xs text-red-400 overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [instagramLink, setInstagramLink] = useState('https://www.instagram.com/pirua_esporte_clube/');
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/5537999999999');
  const [chamadaCategory, setChamadaCategory] = useState<string>('Sub-11');
  const [currentView, setCurrentView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'public_registration') return 'public_registration';
    }
    return 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [loggedInAluno, setLoggedInAluno] = useState<Aluno | null>(null);
  const [clubShield, setClubShield] = useState(ESCUDO_URL);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [anamneseData, setAnamneseData] = useState<any>({});
  const [eventLineups, setEventLineups] = useState<Record<string, string[]>>({});
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSyncingToSupabase, setIsSyncingToSupabase] = useState(false);

  // --- Supabase Connection Check ---
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection();
      setIsSupabaseConnected(connected);
      
      // Load preference from local storage
      const savedPreference = localStorage.getItem('supabase_sync_enabled');
      if (savedPreference === 'true') {
        setSupabaseEnabled(true);
      }
    };
    checkConnection();
  }, []);

  const toggleSupabaseSync = (enabled: boolean) => {
    setSupabaseEnabled(enabled);
    localStorage.setItem('supabase_sync_enabled', enabled.toString());
    if (enabled) {
      toast.success("Sincronização com Supabase ativada!");
    } else {
      toast.info("Sincronização com Supabase desativada.");
    }
  };

  const syncAllToSupabase = async () => {
    if (!isSupabaseConnected) {
      toast.error("Supabase não está conectado. Verifique as variáveis de ambiente.");
      return;
    }
    
    setIsSyncingToSupabase(true);
    const toastId = toast.loading("Sincronizando dados com Supabase...");
    
    try {
      // Sync Alunos
      for (const aluno of alunos) {
        await supabaseService.saveAluno(aluno);
      }
      
      // Sync Settings
      await supabaseService.saveSetting('clubShield', clubShield);
      await supabaseService.saveSetting('instagramLink', instagramLink);
      await supabaseService.saveSetting('whatsappLink', whatsappLink);
      
      toast.success("Sincronização concluída com sucesso!", { id: toastId });
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error(`Erro na sincronização: ${error.message}`, { id: toastId });
    } finally {
      setIsSyncingToSupabase(false);
    }
  };
  useEffect(() => {
    // Connection test
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'settings', 'connection-test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();

    // Handle redirect result
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        toast.success("Login realizado com sucesso!");
      }
    }).catch((error) => {
      console.error("Erro ao processar redirecionamento:", error);
      if (error.code !== 'auth/no-current-user') {
        toast.error("Erro ao processar login via redirecionamento.");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
      if (currentUser) {
        setUserRole('admin');
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      toast.loading("Iniciando login...", { id: "login" });
      console.log("Tentando login com popup...");
      await signInWithPopup(auth, googleProvider);
      toast.success("Login realizado com sucesso!", { id: "login" });
    } catch (error: any) {
      console.error("Erro detalhado de login:", error);
      
      if (error.code === 'auth/unauthorized-domain') {
        toast.error("Domínio não autorizado no Firebase. Por favor, adicione este domínio nas configurações de autenticação do seu console Firebase.", { 
          id: "login",
          duration: 10000 
        });
        console.error("Domínio atual:", window.location.hostname);
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        toast.info("O popup foi bloqueado ou fechado. Tentando redirecionamento...", { id: "login" });
        try {
          console.log("Tentando login com redirecionamento...");
          await signInWithRedirect(auth, googleProvider);
        } catch (redirError: any) {
          console.error("Erro no redirecionamento:", redirError);
          toast.error("Erro ao redirecionar: " + (redirError.message || "Erro desconhecido"), { id: "login" });
        }
      } else {
        toast.error("Erro ao fazer login: " + (error.message || "Erro desconhecido"), { id: "login" });
      }
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Iniciando logout...");
      await signOut(auth);
      setCurrentView('dashboard');
      toast.success("Sessão encerrada.");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // --- Sync (Supabase) ---
  useEffect(() => {
    if (!user) {
      // Reset data to mock or empty when logged out
      setAlunos(MOCK_ALUNOS);
      setEventos(MOCK_EVENTOS);
      setProfessores(MOCK_PROFESSORES);
      setEventLineups({});
      setPresencas({});
      setPresencasHistory([]);
      setSolicitacoes([]);
      return;
    }

    const fetchData = async () => {
      if (!isSupabaseConnected) return;

      try {
        const [
          alunosData, 
          eventosData, 
          professoresData, 
          escalacoesData, 
          presencasData, 
          settingsData,
          solicitacoesData,
          anamnesesData
        ] = await Promise.all([
          supabaseService.getAlunos(),
          supabaseService.getEventos(),
          supabaseService.getProfessores(),
          supabaseService.getEscalacoes(),
          supabaseService.getPresencas(),
          supabaseService.getSettings(),
          supabaseService.getSolicitacoes(),
          supabaseService.getAnamneses()
        ]);

        setAlunos(alunosData.length > 0 ? alunosData : MOCK_ALUNOS);
        setEventos(eventosData.length > 0 ? eventosData : MOCK_EVENTOS);
        setProfessores(professoresData.length > 0 ? professoresData : MOCK_PROFESSORES);
        
        const formattedEsc: Record<string, string[]> = {};
        escalacoesData.forEach(esc => {
          formattedEsc[esc.eventoId] = esc.lista;
        });
        setEventLineups(formattedEsc);

        const today = new Date().toISOString().split('T')[0];
        const todayPresencas: Record<string, 'presente' | 'falta' | 'justificado'> = {};
        const history: Presenca[] = [];
        presencasData.forEach((data: any) => {
          const p: Presenca = {
            id: data.id.toString(),
            alunoId: data.aluno_id,
            status: data.status,
            date: data.data,
            uid: data.uid || ''
          };
          history.push(p);
          if (p.date === today) {
            todayPresencas[p.alunoId] = p.status;
          }
        });
        setPresencas(todayPresencas);
        setPresencasHistory(history);

        if (settingsData.clubShield) setClubShield(settingsData.clubShield);
        if (settingsData.instagramLink) setInstagramLink(settingsData.instagramLink);
        if (settingsData.whatsappLink) setWhatsappLink(settingsData.whatsappLink);

        setSolicitacoes(solicitacoesData);
        setAnamneses(anamnesesData);
      } catch (error) {
        console.error("Erro ao buscar dados do Supabase:", error);
      }
    };

    fetchData();

    // Real-time subscriptions
    const channels = [
      supabase.channel('public:alunos').on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, fetchData).subscribe(),
      supabase.channel('public:eventos').on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, fetchData).subscribe(),
      supabase.channel('public:professores').on('postgres_changes', { event: '*', schema: 'public', table: 'professores' }, fetchData).subscribe(),
      supabase.channel('public:escalacoes').on('postgres_changes', { event: '*', schema: 'public', table: 'escalacoes' }, fetchData).subscribe(),
      supabase.channel('public:presencas').on('postgres_changes', { event: '*', schema: 'public', table: 'presencas' }, fetchData).subscribe(),
      supabase.channel('public:settings').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData).subscribe(),
      supabase.channel('public:solicitacoes_cadastro').on('postgres_changes', { event: '*', schema: 'public', table: 'solicitacoes_cadastro' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, isSupabaseConnected]);

  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);

  const handleApproveSolicitacao = async (solicitacao: any) => {
    try {
      const alunoId = solicitacao.id;
      const { 
        horarioDormir, dificuldadeAcordar, tempoCelular, alimentaBem, 
        frequenciaMedico, fraturas, tratamentoMedico, medicacaoControlada, 
        outroExercicio, alergias, ...alunoData 
      } = solicitacao;
      
      const newAluno = {
        ...alunoData,
        status: 'ativo'
      };

      const newAnamnese = {
        alunoId,
        horarioDormir,
        dificuldadeAcordar,
        tempoCelular,
        alimentaBem,
        frequenciaMedico,
        fraturas,
        tratamentoMedico,
        medicacaoControlada,
        outroExercicio,
        alergias,
        updatedAt: new Date().toISOString()
      };

      // Save to Supabase
      if (supabaseEnabled && isSupabaseConnected) {
        try {
          await supabaseService.saveAluno(newAluno);
          await supabaseService.saveAnamnese(newAnamnese);
          await supabaseService.deleteSolicitacao(solicitacao.id);
          console.log("Cadastro aprovado no Supabase");
        } catch (supaError) {
          console.error("Erro ao aprovar cadastro no Supabase:", supaError);
        }
      }

      // Backup to Firestore
      await setDoc(doc(db, 'alunos', alunoId), {
        ...newAluno,
        uid: user.uid
      });

      await setDoc(doc(db, 'anamneses', alunoId), {
        ...newAnamnese,
        uid: user.uid
      });

      await deleteDoc(doc(db, 'solicitacoes_cadastro', solicitacao.id));
      alert('Cadastro aprovado e aluno criado com sucesso!');
    } catch (error) {
      console.error("Erro ao aprovar cadastro:", error);
      alert('Erro ao aprovar cadastro.');
    }
  };

  const handleRejectSolicitacao = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta solicitação?')) return;
    try {
      // Delete from Supabase
      if (supabaseEnabled && isSupabaseConnected) {
        try {
          await supabaseService.deleteSolicitacao(id);
        } catch (supaError) {
          console.error("Erro ao excluir solicitação no Supabase:", supaError);
        }
      }

      await deleteDoc(doc(db, 'solicitacoes_cadastro', id));
      alert('Solicitação removida.');
    } catch (error) {
      alert('Erro ao remover solicitação.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    console.log('Piruá Cloud - View Param:', viewParam);
    if (viewParam === 'public_registration') {
      setCurrentView('public_registration');
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExport = async () => {
    try {
      const data = {
        alunos,
        professores,
        eventos,
        anamneses,
        presencas: presencasHistory,
        eventLineups,
        settings: {
          clubShield,
          instagramLink,
          whatsappLink
        },
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-pirua-ec-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erro ao exportar dados');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Atenção: A importação irá substituir os dados atuais na nuvem pelos dados do arquivo selecionado. Deseja continuar?')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Import Alunos
        if (data.alunos && Array.isArray(data.alunos)) {
          for (const aluno of data.alunos) {
            if (supabaseEnabled && isSupabaseConnected) {
              await supabaseService.saveAluno(aluno);
            }
            await setDoc(doc(db, 'alunos', aluno.id), aluno, { merge: true });
          }
        }

        // Import Professores
        if (data.professores && Array.isArray(data.professores)) {
          for (const prof of data.professores) {
            if (supabaseEnabled && isSupabaseConnected) {
              await supabaseService.saveProfessor(prof);
            }
            await setDoc(doc(db, 'professores', prof.id), prof, { merge: true });
          }
        }

        // Import Eventos
        if (data.eventos && Array.isArray(data.eventos)) {
          for (const evento of data.eventos) {
            if (supabaseEnabled && isSupabaseConnected) {
              await supabaseService.saveEvento(evento);
            }
            await setDoc(doc(db, 'eventos', evento.id), evento, { merge: true });
          }
        }

        // Import Anamneses
        if (data.anamneses && Array.isArray(data.anamneses)) {
          for (const anamnese of data.anamneses) {
            if (supabaseEnabled && isSupabaseConnected) {
              await supabaseService.saveAnamnese(anamnese);
            }
            await setDoc(doc(db, 'anamneses', anamnese.alunoId), anamnese, { merge: true });
          }
        }

        // Import Presencas
        if (data.presencas && Array.isArray(data.presencas)) {
          // Group by date for Supabase
          const byDate: Record<string, { alunoId: string, status: string }[]> = {};
          for (const p of data.presencas) {
            if (!byDate[p.date]) byDate[p.date] = [];
            byDate[p.date].push({ alunoId: p.alunoId, status: p.status });
            
            const id = `${p.date}_${p.alunoId}`;
            await setDoc(doc(db, 'presencas', id), p, { merge: true });
          }
          
          if (supabaseEnabled && isSupabaseConnected) {
            for (const [date, lista] of Object.entries(byDate)) {
              await supabaseService.savePresencas(date, lista);
            }
          }
        }

        // Import Escalacoes
        if (data.escalacoes && Array.isArray(data.escalacoes)) {
          for (const esc of data.escalacoes) {
            if (supabaseEnabled && isSupabaseConnected) {
              await supabaseService.saveEscalacao(esc);
            }
            await setDoc(doc(db, 'escalacoes', esc.eventoId), esc, { merge: true });
          }
        }

        // Import Settings
        if (data.settings) {
          if (data.settings.clubShield) await handleSaveSetting('clubShield', data.settings.clubShield);
          if (data.settings.instagramLink) await handleSaveSetting('instagramLink', data.settings.instagramLink);
          if (data.settings.whatsappLink) await handleSaveSetting('whatsappLink', data.settings.whatsappLink);
        }
        
        alert('Dados importados e sincronizados com a nuvem com sucesso!');
        window.location.reload();
      } catch (error) {
        console.error("Erro ao importar:", error);
        alert('Erro ao importar dados. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAluno = async (aluno: Aluno) => {
    // Normalize CPF
    if (aluno.rgCpf) {
      aluno.rgCpf = aluno.rgCpf.replace(/\D/g, '');
    }
    if (aluno.responsavelRgCpf) {
      aluno.responsavelRgCpf = aluno.responsavelRgCpf.replace(/\D/g, '');
    }

    // Normalize Date and Calculate Age
    if (aluno.dataNascimento && aluno.dataNascimento.includes('-')) {
      const [y, m, d] = aluno.dataNascimento.split('-');
      
      const birthYear = parseInt(y);
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      aluno.idade = age;

      // Auto-calculate category BEFORE changing format
      aluno.categoria = calculateCategory(aluno.dataNascimento);
      
      aluno.dataNascimento = `${d}/${m}/${y}`;
    }

    try {
      // Primary: Supabase
      if (isSupabaseConnected) {
        await supabaseService.saveAluno(aluno);
      }

      // Secondary: Firestore (Backup)
      const alunoRef = doc(db, 'alunos', aluno.id);
      await setDoc(alunoRef, { ...aluno, uid: user.uid }, { merge: true });
      
      alert('Cadastro salvo com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);
      alert('Erro ao salvar cadastro.');
    }
  };

  const handleDeleteAluno = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      try {
        // Primary: Supabase
        if (isSupabaseConnected) {
          await supabaseService.deleteAluno(id);
        }

        // Secondary: Firestore
        await deleteDoc(doc(db, 'alunos', id));
        
        alert('Aluno excluído com sucesso!');
      } catch (error) {
        console.error("Erro ao excluir aluno:", error);
        alert('Erro ao excluir aluno.');
      }
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      // Primary: Supabase
      if (isSupabaseConnected) {
        await supabaseService.saveSetting(key, value);
      }

      // Secondary: Firestore
      await setDoc(doc(db, 'settings', key), { value, updatedAt: new Date().toISOString() });
      
      return true;
    } catch (error) {
      console.error("Error saving setting:", error);
      return false;
    }
  };

  const handleSaveProfessor = async (professor: Professor) => {
    try {
      // Primary: Supabase
      if (isSupabaseConnected) {
        await supabaseService.saveProfessor(professor);
      }

      // Secondary: Firestore
      await setDoc(doc(db, 'professores', professor.id), { ...professor, uid: user.uid }, { merge: true });
      alert('Professor salvo com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar professor:", error);
      alert('Erro ao salvar professor.');
    }
  };

  const handleSaveEvento = async (evento: Evento) => {
    try {
      // Primary: Supabase
      if (isSupabaseConnected) {
        await supabaseService.saveEvento(evento);
      }

      // Secondary: Firestore
      await setDoc(doc(db, 'eventos', evento.id), { ...evento, uid: user.uid }, { merge: true });
      alert('Evento salvo com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      alert('Erro ao salvar evento.');
    }
  };

  const handleSaveAnamnese = async (anamneseData: any) => {
    if (!selectedAnamneseAluno) return;
    try {
      const newAnamnese = {
        ...anamneseData,
        alunoId: selectedAnamneseAluno.id,
        updatedAt: new Date().toISOString()
      };

      // Primary: Supabase
      if (isSupabaseConnected) {
        await supabaseService.saveAnamnese(newAnamnese);
      }

      // Secondary: Firestore
      await setDoc(doc(db, 'anamneses', selectedAnamneseAluno.id), {
        ...newAnamnese,
        uid: user.uid
      });

      alert('Anamnese salva com sucesso!');
      setCurrentView('lista_alunos');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'anamneses');
    }
  };

  const handleSaveEscalacao = async (eventoId: string, lista: string[]) => {
    try {
      // Primary: Supabase
      if (isSupabaseConnected) {
        await supabaseService.saveEscalacao({ eventoId, lista });
      }

      // Secondary: Firestore
      await setDoc(doc(db, 'escalacoes', eventoId), {
        eventoId,
        lista,
        updatedAt: new Date().toISOString(),
        uid: user.uid
      });
      alert('Escalação salva com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar escalação:", error);
      alert('Erro ao salvar escalação.');
    }
  };

  const handleGenerateInstaPost = async (aluno: Aluno) => {
    const element = document.getElementById('insta-post-template');
    if (!element || !aluno) return;

    // Wait a bit for React to render the new state and for images to potentially start loading
    await new Promise(resolve => setTimeout(resolve, 500));

    // Wait for all images in the template to load
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(imagePromises);
    
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // Higher quality
        backgroundColor: '#000000',
        logging: false,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `parabens-quadrado-${aluno.nome.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.click();
    } catch (error) {
      console.error("Error generating Instagram post:", error);
      alert('Erro ao gerar imagem para o Instagram');
    }
  };

  const handleGenerateBirthdayCard = async (aluno: Aluno) => {
    const element = document.getElementById('birthday-card-template');
    if (!element || !aluno) return;

    // Wait a bit for React to render the new state
    await new Promise(resolve => setTimeout(resolve, 500));

    // Wait for all images in the template to load
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(imagePromises);
    
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#000000',
        logging: false,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `parabens-story-${aluno.nome.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.click();
    } catch (error) {
      console.error('Erro ao gerar cartão:', error);
      alert('Erro ao gerar a imagem. Tente novamente.');
    }
  };

  const handlePrint = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir.');
      return;
    }

    // Get only essential styles or force a clean slate
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('');

    // Clone the element to remove any motion-related inline styles that might interfere
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.classList.remove('hidden');
    clonedElement.classList.remove('print:block');
    clonedElement.style.transform = 'none';
    clonedElement.style.opacity = '1';
    clonedElement.style.visibility = 'visible';
    
    if (elementId === 'carteirinha-atleta') {
      clonedElement.style.display = 'flex';
    } else {
      clonedElement.style.display = 'block';
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Piruá E.C. - Impressão</title>
          ${styles}
          <style>
            /* Reset total para impressão */
            html, body { 
              background: white !important; 
              color: black !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important;
              height: 100% !important;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            
            body {
              display: block !important;
              background-color: white !important;
            }

            @media print {
              @page { 
                margin: 10mm; 
                size: auto;
              }
              body { 
                padding: 0;
                background: white !important;
              }
              .no-print { display: none !important; }
            }

            /* Estilos para Tabela de Escalação */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-bottom: 20px !important;
            }
            th, td {
              border: 1px solid #000 !important;
              padding: 8px !important;
              text-align: left !important;
            }
            th {
              background-color: #f0f0f0 !important;
              font-weight: bold !important;
            }

            /* Forçar o container da carteirinha a ser fiel ao design */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #carteirinha-atleta {
              display: flex !important;
              flex-direction: column !important;
              width: 85.6mm !important;
              height: 53.98mm !important;
              min-width: 85.6mm !important;
              min-height: 53.98mm !important;
              background-color: #09090b !important; /* Zinc 950 */
              color: white !important;
              border: 0.5mm solid #facc15 !important; /* Yellow 400 */
              border-radius: 3.18mm !important;
              overflow: hidden !important;
              box-shadow: none !important;
              transform: none !important;
              opacity: 1 !important;
              visibility: visible !important;
              position: relative !important;
              margin: auto !important;
            }

            /* Garantir que as cores internas apareçam */
            .bg-yellow-400 { background-color: #facc15 !important; }
            .bg-zinc-950 { background-color: #09090b !important; }
            .bg-zinc-900 { background-color: #18181b !important; }
            .bg-black { background-color: #000000 !important; }
            .bg-white { background-color: #ffffff !important; }
            .text-black { color: #000000 !important; }
            .text-white { color: #ffffff !important; }
            .text-yellow-400 { color: #facc15 !important; }
            .text-zinc-300 { color: #d4d4d8 !important; }
            .text-zinc-500 { color: #71717a !important; }
            
            /* Ajustes de layout para o tamanho físico */
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .justify-between { justify-content: space-between !important; }
            .items-center { align-items: center !important; }
            .items-end { align-items: flex-end !important; }
            .w-full { width: 100% !important; }
            .h-full { height: 100% !important; }
            .rounded-full { border-radius: 9999px !important; }
            .overflow-hidden { overflow: hidden !important; }
            .relative { position: relative !important; }
            .absolute { position: absolute !important; }
            
            img { max-width: 100%; height: auto; }
            
            /* Ensure the printed element is visible */
            #${elementId} {
              display: ${elementId === 'carteirinha-atleta' ? 'flex' : 'block'} !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
          </style>
        </head>
        <body>
          <div style="padding: 20px; background: white;">
            ${clonedElement.outerHTML}
          </div>
          <script>
            const images = document.getElementsByTagName('img');
            const imagePromises = Array.from(images).map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
              });
            });

            Promise.all(imagePromises).then(() => {
              setTimeout(() => {
                window.print();
                // window.close();
              }, 1000);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownload = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(elementId);
          if (el) {
            // Force styles on the cloned element
            el.style.width = '324px';
            el.style.height = '204px';
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
            el.style.margin = '0';
            el.style.display = 'flex';
            el.style.backgroundColor = '#09090b'; // Zinc 950
            el.style.color = '#ffffff';
            el.style.borderRadius = '12px';
            el.style.border = '2px solid #facc15';
            
            // Force all children to have correct colors
            const allElements = el.querySelectorAll('*');
            allElements.forEach(item => {
              const htmlItem = item as HTMLElement;
              
              // Force text colors
              if (htmlItem.classList.contains('text-white')) htmlItem.style.color = '#ffffff';
              if (htmlItem.classList.contains('text-yellow-400')) htmlItem.style.color = '#facc15';
              if (htmlItem.classList.contains('text-zinc-300')) htmlItem.style.color = '#d4d4d8';
              if (htmlItem.classList.contains('text-zinc-500')) htmlItem.style.color = '#71717a';
              if (htmlItem.classList.contains('text-black')) htmlItem.style.color = '#000000';
              
              // Force background colors
              if (htmlItem.classList.contains('bg-yellow-400')) htmlItem.style.backgroundColor = '#facc15';
              if (htmlItem.classList.contains('bg-zinc-950')) htmlItem.style.backgroundColor = '#09090b';
              if (htmlItem.classList.contains('bg-zinc-900')) htmlItem.style.backgroundColor = '#18181b';
              if (htmlItem.classList.contains('bg-black')) htmlItem.style.backgroundColor = '#000000';
              if (htmlItem.classList.contains('bg-white')) htmlItem.style.backgroundColor = '#ffffff';
              
              // Ensure images are visible
              if (htmlItem.tagName === 'IMG') {
                (htmlItem as HTMLImageElement).style.opacity = '1';
                (htmlItem as HTMLImageElement).style.display = 'block';
              }
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Use actual credit card size: 85.6mm x 53.98mm
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      
      const pdf = new jsPDF('l', 'mm', [cardWidth, cardHeight]);
      pdf.addImage(imgData, 'PNG', 0, 0, cardWidth, cardHeight, undefined, 'FAST');
      pdf.save(`${filename.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Por favor, tente novamente. Detalhes: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedAnamneseAluno, setSelectedAnamneseAluno] = useState<Aluno | null>(null);
  const [celebratingAluno, setCelebratingAluno] = useState<Aluno | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [presencas, setPresencas] = useState<Record<string, 'presente' | 'falta' | 'justificado'>>({});
  const [presencasHistory, setPresencasHistory] = useState<Presenca[]>([]);
  const [anamneses, setAnamneses] = useState<any[]>([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [attendanceReport, setAttendanceReport] = useState<any[]>([]);
  const [birthdayMonth, setBirthdayMonth] = useState(new Date().getMonth() + 1);

  const fetchAttendanceReport = async (type: 'date' | 'month') => {
    try {
      let results: Presenca[] = [];
      if (type === 'date') {
        results = presencasHistory.filter(p => p.date === reportDate);
      } else {
        results = presencasHistory.filter(p => {
          const [y, m, d] = p.date.split('-');
          return parseInt(m) === reportMonth && parseInt(y) === reportYear;
        });
      }
      setAttendanceReport(results);
    } catch (error) {
      console.error("Error fetching attendance report:", error);
      setAttendanceReport([]);
    }
  };

  const handleSaveChamada = async () => {
    const date = new Date().toISOString().split('T')[0];
    const lista = Object.entries(presencas).map(([alunoId, status]) => ({ alunoId, status }));
    
    if (lista.length === 0) {
      alert('Nenhuma presença marcada.');
      return;
    }

    try {
      const presencasToSync = [];
      for (const item of lista) {
        const id = `${date}_${item.alunoId}`;
        const presencaData = {
          alunoId: item.alunoId,
          status: item.status,
          date,
          uid: user.uid
        };
        await setDoc(doc(db, 'presencas', id), presencaData);
        presencasToSync.push(presencaData);
      }
      
      // Sync to Supabase if enabled
      if (supabaseEnabled && isSupabaseConnected) {
        try {
          await supabaseService.savePresencas(date, lista);
          console.log("Chamada sincronizada com Supabase");
        } catch (supaError) {
          console.error("Erro ao sincronizar chamada com Supabase:", supaError);
        }
      }
      
      alert('Chamada salva com sucesso na nuvem!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'presencas');
    }
  };

  const handlePresence = async (alunoId: string, status: 'presente' | 'falta' | 'justificado') => {
    const date = new Date().toISOString().split('T')[0];
    const id = `${date}_${alunoId}`;
    try {
      const presencaData = {
        alunoId,
        status,
        date,
        uid: user.uid
      };
      
      // Primary: Supabase
      if (supabaseEnabled && isSupabaseConnected) {
        try {
          await supabaseService.savePresence(alunoId, date, status);
        } catch (supaError) {
          console.error("Erro ao sincronizar presença com Supabase:", supaError);
        }
      }

      // Secondary: Firestore
      await setDoc(doc(db, 'presencas', id), presencaData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'presencas');
    }
  };

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
        // Match any ID after /atleta/ (UUID or numeric)
        const match = decodedText.match(/\/atleta\/([a-zA-Z0-9-]+)/);
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

  useEffect(() => {
    if (currentView === 'meu_perfil' && loggedInAluno) {
      setFormCategoria(loggedInAluno.categoria);
    } else if (selectedAluno) {
      setFormCategoria(selectedAluno.categoria);
    } else {
      setFormCategoria('Sub-11');
    }
  }, [selectedAluno, loggedInAluno, currentView]);

  const [escalacaoEventoId, setEscalacaoEventoId] = useState<string>('');
  const [escalacaoEventoNome, setEscalacaoEventoNome] = useState('');

  const currentShield = clubShield;

  const calculateCategory = (birthDate: string) => {
    if (!birthDate) return 'Sub-11';
    
    // Use split to get the year directly from the YYYY-MM-DD string to avoid timezone issues
    const birthYear = parseInt(birthDate.split('-')[0]);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age <= 7) return 'Sub-7';
    if (age <= 9) return 'Sub-9';
    if (age <= 11) return 'Sub-11';
    if (age <= 13) return 'Sub-13';
    if (age <= 15) return 'Sub-15';
    if (age <= 17) return 'Sub-17';
    return 'Sub-Adulto';
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    const category = calculateCategory(birthDate);
    setFormCategoria(category);
  };

  const handleSaveShield = async () => {
    const success = await handleSaveSetting('clubShield', clubShield);
    if (success) {
      alert('Brasão salvo com sucesso!');
    } else {
      alert('Erro ao salvar brasão. Verifique o tamanho da imagem ou tente novamente.');
    }
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

  console.log("App rendering. AuthLoading:", authLoading, "User:", user ? "Yes" : "No");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Carregando Piruá Cloud...</p>
      </div>
    );
  }

  if (!user && currentView !== 'public_registration') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <Toaster position="top-right" richColors theme="dark" />
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/10 rounded-full blur-[120px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-12">
            <div className="w-32 h-32 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <img src={clubShield} alt="Piruá E.C" className="w-24 h-24 object-contain" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">Piruá <span className="text-yellow-400">Cloud</span></h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Sistema de Gestão Esportiva</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <p className="text-zinc-400 text-sm mb-8">Acesse sua conta para gerenciar atletas, eventos e relatórios do clube.</p>
            
            <button 
              onClick={handleLogin}
              className="w-full bg-white text-black h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all group"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Entrar com Google
            </button>

            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                © {new Date().getFullYear()} Piruá Esporte Clube • Todos os direitos reservados
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 font-sans text-zinc-100 overflow-hidden relative">
      <Toaster position="top-right" richColors theme="dark" />
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden on public registration */}
      {currentView !== 'public_registration' && (
        <aside className={cn(
          "bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 shrink-0 transition-all duration-300 relative z-[70] lg:static fixed inset-y-0 left-0",
          isSidebarCollapsed ? "w-20 p-4" : "w-72",
          !isMobileMenuOpen && "-translate-x-full lg:translate-x-0"
        )}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 bg-yellow-400 text-black rounded-full p-1 shadow-lg z-50 hover:scale-110 transition-transform hidden lg:block"
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
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden ml-auto text-zinc-500 hover:text-yellow-400"
          >
            <X size={24} />
          </button>
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
                onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={UserPlus} 
                label="Cadastrar Aluno" 
                active={currentView === 'cadastrar_aluno'} 
                onClick={() => { setCurrentView('cadastrar_aluno'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={UserCheck} 
                label="Solicitações" 
                active={currentView === 'solicitacoes_cadastro'} 
                onClick={() => { setCurrentView('solicitacoes_cadastro'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
                badge={solicitacoes.length > 0 ? solicitacoes.length : undefined}
              />
              <SidebarItem 
                icon={ShieldCheck} 
                label="Cadastrar Professor" 
                active={currentView === 'cadastrar_professor'} 
                onClick={() => { setCurrentView('cadastrar_professor'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={Users} 
                label="Lista Geral de Alunos" 
                active={currentView === 'lista_alunos'} 
                onClick={() => { setCurrentView('lista_alunos'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={Cake} 
                label="Aniversariantes" 
                active={currentView === 'aniversariantes'} 
                onClick={() => { setCurrentView('aniversariantes'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={CheckSquare} 
                label="Chamada de Presença" 
                active={currentView === 'chamada'} 
                onClick={() => { setCurrentView('chamada'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={BarChart3} 
                label="Relatórios" 
                active={currentView === 'relatorios'} 
                onClick={() => { setCurrentView('relatorios'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={CalendarDays} 
                label="Cadastrar Eventos" 
                active={currentView === 'eventos'} 
                onClick={() => { setCurrentView('eventos'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={ClipboardList} 
                label="Ficha de Anamnese" 
                active={currentView === 'anamnese'} 
                onClick={() => { setCurrentView('anamnese'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={FileText} 
                label="Gerar Documento" 
                active={currentView === 'documentos'} 
                onClick={() => { setCurrentView('documentos'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={Settings} 
                label="Configurações" 
                active={currentView === 'configuracoes'} 
                onClick={() => { setCurrentView('configuracoes'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={IdCard} 
                label="Carteirinha" 
                active={currentView === 'carteirinha'} 
                onClick={() => { setCurrentView('carteirinha'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={Layers} 
                label="Categorias Sub" 
                active={currentView === 'categorias'} 
                onClick={() => { setCurrentView('categorias'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={Trophy} 
                label="Escalação Evento" 
                active={currentView === 'escalacao'} 
                onClick={() => { setCurrentView('escalacao'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
            </>
          ) : (
            <>
              <SidebarItem 
                icon={UserPlus} 
                label="Cadastrar Aluno" 
                active={currentView === 'cadastrar_aluno'} 
                onClick={() => { setCurrentView('cadastrar_aluno'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={ClipboardList} 
                label="Ficha de Anamnese" 
                active={currentView === 'anamnese'} 
                onClick={() => { setCurrentView('anamnese'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={IdCard} 
                label="Carteirinha" 
                active={currentView === 'carteirinha'} 
                onClick={() => { setCurrentView('carteirinha'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
              <SidebarItem 
                icon={Trophy} 
                label="Lista de Presença Evento" 
                active={currentView === 'escalacao'} 
                onClick={() => { setCurrentView('escalacao'); setIsMobileMenuOpen(false); }} 
                collapsed={isSidebarCollapsed}
                isMobile={isMobile}
              />
            </>
          )}
        </nav>

        <div className="pt-6 border-t border-zinc-800 space-y-4">
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
            {!isSidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
          {isSidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-zinc-500 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>
      )}

      {/* Mobile Bottom Navigation - Hidden on public registration */}
      {currentView !== 'public_registration' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 px-4 pb-safe pt-2 z-[60] flex items-center justify-around">
          <BottomNavItem 
            icon={LayoutDashboard} 
            label="Início" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
          />
          <BottomNavItem 
            icon={Users} 
            label="Alunos" 
            active={currentView === 'lista_alunos'} 
            onClick={() => setCurrentView('lista_alunos')} 
          />
          <BottomNavItem 
            icon={CheckSquare} 
            label="Chamada" 
            active={currentView === 'chamada'} 
            onClick={() => setCurrentView('chamada')} 
          />
          <BottomNavItem 
            icon={CalendarDays} 
            label="Eventos" 
            active={currentView === 'eventos'} 
            onClick={() => setCurrentView('eventos')} 
          />
          <BottomNavItem 
            icon={Menu} 
            label="Menu" 
            active={isMobileMenuOpen} 
            onClick={() => setIsMobileMenuOpen(true)} 
            badge={solicitacoes.length > 0 ? solicitacoes.length : undefined}
          />
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto p-4 md:p-8 relative pb-24 lg:pb-8",
        currentView === 'public_registration' && "p-0 pb-0 lg:pb-0"
      )}>
        {/* Header - Hidden on public registration */}
        {currentView !== 'public_registration' && (
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-yellow-400"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-zinc-100 uppercase tracking-tight">
                  {currentView === 'meu_perfil' ? 'Meu Perfil' : 
                   currentView === 'presenca_evento' ? 'Presença em Evento' : 
                   currentView === 'cadastrar_professor' ? 'Cadastrar Professor' :
                   currentView.replace('_', ' ')}
                </h2>
                <p className="text-zinc-500 text-xs md:text-sm mt-1">Gestão Piruá Esporte Clube • {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full md:w-64 transition-all text-sm"
                />
              </div>
              <button 
                onClick={() => userRole === 'admin' && setCurrentView('solicitacoes_cadastro')}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-yellow-400 relative"
              >
                <Bell size={20} />
                {solicitacoes.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] text-[8px] font-black bg-red-500 text-white rounded-full animate-pulse">
                    {solicitacoes.length}
                  </span>
                )}
              </button>
            </div>
          </header>
        )}

        {/* View Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {userRole === 'aluno' && !['cadastrar_aluno', 'anamnese', 'carteirinha', 'escalacao', 'public_registration'].includes(currentView) && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-bold">Acesso Restrito</h3>
                <p className="text-zinc-500 max-w-xs">Você não tem permissão para acessar esta área. Utilize o menu lateral para as opções disponíveis.</p>
              </div>
            )}

            {currentView === 'public_registration' && (
              <PublicRegistrationForm onComplete={() => setCurrentView('dashboard')} />
            )}

            {currentView === 'solicitacoes_cadastro' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <UserPlus className="text-yellow-400" /> Solicitações de Cadastro
                  </h3>
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="text-zinc-500 hover:text-white flex items-center gap-1 text-xs font-bold transition-colors"
                  >
                    <ChevronLeft size={16} /> Voltar
                  </button>
                </div>

                {solicitacoes.length === 0 ? (
                  <div className="bg-zinc-900 p-12 rounded-3xl border border-zinc-800 text-center">
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Nenhuma solicitação pendente</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {solicitacoes.map(sol => (
                      <div key={sol.id} className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-bold text-zinc-100">{sol.nome}</h4>
                            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">{sol.categoria} • {sol.posicao}</p>
                          </div>
                          <div className="bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Pendente
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-zinc-500 uppercase font-black tracking-tighter mb-1">Responsável</p>
                            <p className="font-bold">{sol.responsavel}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 uppercase font-black tracking-tighter mb-1">Telefone</p>
                            <p className="font-bold">{sol.telefone}</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex gap-3">
                          <button 
                            onClick={() => handleApproveSolicitacao(sol)}
                            className="flex-1 bg-yellow-400 text-black font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleRejectSolicitacao(sol.id)}
                            className="flex-1 bg-zinc-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-red-500 transition-all"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentView === 'dashboard' && userRole === 'admin' && (
              <div className="space-y-8">
                <div className="glass p-10 rounded-3xl border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="w-32 h-32 shrink-0 relative z-10">
                    <img src={currentShield} alt="Escudo Piruá" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]" referrerPolicy="no-referrer" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-yellow-400 uppercase tracking-tight mb-2 text-glow">Bem-vindo ao Piruá E.C.</h3>
                    <p className="text-zinc-400 max-w-xl font-medium mb-6">Sistema de gestão oficial. Aqui você controla cadastros, presenças e eventos do clube com a força da nossa fênix.</p>
                    <button 
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('view', 'public_registration');
                        navigator.clipboard.writeText(url.toString());
                        alert('Link de cadastro copiado para a área de transferência!');
                      }}
                      className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"
                    >
                      <Share2 size={16} /> Compartilhar Link de Cadastro
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl card-hover group cursor-pointer" onClick={() => setCurrentView('solicitacoes_cadastro')}>
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <UserPlus className="text-yellow-400" size={24} />
                    </div>
                    <h3 className="text-4xl font-black text-zinc-100 tracking-tighter flex items-center gap-3">
                      {alunos.filter(a => a.status !== 'inativo').length}
                      {solicitacoes.length > 0 && (
                        <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse uppercase tracking-widest">
                          {solicitacoes.length} novos
                        </span>
                      )}
                    </h3>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Alunos Ativos</p>
                  </div>
                  <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl card-hover group">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <CalendarDays className="text-yellow-400" size={24} />
                    </div>
                    <h3 className="text-4xl font-black text-zinc-100 tracking-tighter">{eventos.length}</h3>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Eventos Cadastrados</p>
                  </div>
                  <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl card-hover group">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <ShieldAlert className="text-yellow-400" size={24} />
                    </div>
                    <h3 className="text-4xl font-black text-zinc-100 tracking-tighter">{alunos.filter(a => a.status === 'inativo').length}</h3>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Alunos Inativos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Aniversariantes do Dia */}
                  <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden card-hover">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Cake size={80} />
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <h3 className="text-sm font-black flex items-center gap-3 uppercase tracking-[0.2em] text-zinc-400">
                        <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                          <Cake className="text-yellow-400" size={16} />
                        </div>
                        Hoje
                      </h3>
                      <button 
                        onClick={() => setCurrentView('aniversariantes')}
                        className="text-[10px] font-black text-yellow-400 uppercase tracking-widest hover:underline"
                      >
                        Ver Todos
                      </button>
                    </div>
                    <div className="space-y-4 relative z-10">
                      {alunos.filter(aluno => {
                        if (!aluno.dataNascimento) return false;
                        const parts = aluno.dataNascimento.split('/');
                        if (parts.length < 2) return false;
                        const today = new Date();
                        return parseInt(parts[0]) === today.getDate() && parseInt(parts[1]) === (today.getMonth() + 1);
                      }).length > 0 ? (
                        alunos.filter(aluno => {
                          if (!aluno.dataNascimento) return false;
                          const parts = aluno.dataNascimento.split('/');
                          const today = new Date();
                          return parseInt(parts[0]) === today.getDate() && parseInt(parts[1]) === (today.getMonth() + 1);
                        }).slice(0, 3).map(aluno => (
                          <div key={aluno.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-yellow-400/10 hover:border-yellow-400/20 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-yellow-400 font-black overflow-hidden border border-white/5">
                                {aluno.foto ? (
                                  <img src={aluno.foto} alt={aluno.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  aluno.nome.charAt(0)
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-100">{aluno.nome}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{aluno.categoria}</p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                              <Trophy size={16} className="animate-pulse" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-zinc-500 bg-white/5 rounded-2xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest">
                          Nenhum aniversariante hoje
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Próximos Eventos */}
                  <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden card-hover">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Trophy size={80} />
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <h3 className="text-sm font-black flex items-center gap-3 uppercase tracking-[0.2em] text-zinc-400">
                        <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                          <Trophy className="text-yellow-400" size={16} />
                        </div>
                        Agenda
                      </h3>
                      <button 
                        onClick={() => setCurrentView('eventos')}
                        className="text-[10px] font-black text-yellow-400 uppercase tracking-widest hover:underline"
                      >
                        Ver Todos
                      </button>
                    </div>
                    <div className="space-y-4 relative z-10">
                      {eventos.length > 0 ? (
                        eventos.slice(0, 3).map(evento => (
                          <div key={evento.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-yellow-400/10 hover:border-yellow-400/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-yellow-400 font-black border border-white/5">
                                <CalendarDays size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-100">{evento.nome}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{evento.cidade} - {evento.uf}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-yellow-400">{evento.horario}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-zinc-500 bg-white/5 rounded-2xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest">
                          Nenhum evento programado. Aproveite para organizar um amistoso!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <h3 className="text-lg font-bold mb-6 uppercase tracking-tight">Ações Rápidas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => {
                        setSelectedAluno(null);
                        setCurrentView('cadastrar_aluno');
                      }}
                      className="flex flex-col items-center justify-center p-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 hover:border-yellow-400/50 hover:bg-zinc-800 transition-all group"
                    >
                      <UserPlus className="text-yellow-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-xs font-black uppercase tracking-widest">Novo Aluno</span>
                    </button>
                    <button 
                      onClick={() => setCurrentView('chamada')}
                      className="flex flex-col items-center justify-center p-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 hover:border-yellow-400/50 hover:bg-zinc-800 transition-all group"
                    >
                      <ClipboardCheck className="text-yellow-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-xs font-black uppercase tracking-widest">Fazer Chamada</span>
                    </button>
                    <button 
                      onClick={() => setCurrentView('eventos')}
                      className="flex flex-col items-center justify-center p-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 hover:border-yellow-400/50 hover:bg-zinc-800 transition-all group"
                    >
                      <CalendarPlus className="text-yellow-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-xs font-black uppercase tracking-widest">Novo Evento</span>
                    </button>
                    <button 
                      onClick={() => setCurrentView('relatorios')}
                      className="flex flex-col items-center justify-center p-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 hover:border-yellow-400/50 hover:bg-zinc-800 transition-all group"
                    >
                      <FileText className="text-yellow-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-xs font-black uppercase tracking-widest">Relatórios</span>
                    </button>
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
                          <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center text-black font-black text-xl overflow-hidden">
                            {aluno.foto ? (
                              <img src={aluno.foto} alt={aluno.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              aluno.nome.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-black text-black uppercase text-sm">{aluno.nome}</p>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">{aluno.categoria}</p>
                          </div>
                        </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setCelebratingAluno(aluno);
                                setTimeout(() => handleGenerateInstaPost(aluno), 300);
                              }}
                              className="p-2 bg-black/10 rounded-xl text-black hover:bg-black/20 transition-all"
                              title="Gerar Post Quadrado"
                            >
                              <Layers size={20} />
                            </button>
                            <button 
                              onClick={() => {
                                setCelebratingAluno(aluno);
                                setTimeout(() => handleGenerateBirthdayCard(aluno), 300);
                              }}
                              className="p-2 bg-black/10 rounded-xl text-black hover:bg-black/20 transition-all"
                              title="Gerar Post Story (9:16)"
                            >
                              <Smartphone size={20} />
                            </button>
                            <div className="text-black animate-bounce">
                              <Trophy size={24} />
                            </div>
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
                          <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-black overflow-hidden">
                            {aluno.foto ? (
                              <img src={aluno.foto} alt={aluno.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              aluno.dataNascimento.split('/')[0]
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{aluno.nome}</p>
                            <p className="text-xs text-zinc-500">{aluno.categoria}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setCelebratingAluno(aluno);
                              setTimeout(() => handleGenerateInstaPost(aluno), 300);
                            }}
                            className="p-2 bg-zinc-700/50 rounded-xl text-zinc-400 hover:text-yellow-400 transition-all"
                            title="Gerar Post Instagram"
                          >
                            <Instagram size={18} />
                          </button>
                          <div className="text-zinc-600">
                            <Cake size={18} />
                          </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 text-center">
                      <p className="text-3xl font-black text-emerald-500 mb-1">
                        {attendanceReport.filter(p => p.status === 'presente').length}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Presenças</p>
                    </div>
                    <div className="bg-rose-500/10 p-6 rounded-2xl border border-rose-500/20 text-center">
                      <p className="text-3xl font-black text-rose-500 mb-1">
                        {attendanceReport.filter(p => p.status === 'falta').length}
                      </p>
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Faltas</p>
                    </div>
                    <div className="bg-yellow-500/10 p-6 rounded-2xl border border-yellow-500/20 text-center">
                      <p className="text-3xl font-black text-yellow-500 mb-1">
                        {attendanceReport.filter(p => p.status === 'justificado').length}
                      </p>
                      <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Justificadas</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-zinc-500">Resumo por Aluno</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {alunos.filter(a => a.status !== 'inativo').map(aluno => {
                        const alunoPresencas = attendanceReport.filter(p => p.alunoId === aluno.id);
                        const total = alunoPresencas.length;
                        const presentes = alunoPresencas.filter(p => p.status === 'presente').length;
                        const percent = total > 0 ? Math.round((presentes / total) * 100) : 0;
                        
                        return (
                          <div key={aluno.id} className="bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs font-bold text-zinc-100 truncate pr-2">{aluno.nome}</p>
                              <span className="text-[10px] font-black text-yellow-400">{percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  percent >= 75 ? "bg-emerald-500" : percent >= 50 ? "bg-yellow-500" : "bg-rose-500"
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
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

                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Cloud className="text-yellow-400" /> Integração Supabase
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800">
                      <div>
                        <h4 className="text-lg font-black text-zinc-100 mb-1">Sincronização em Nuvem</h4>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                          Status: {isSupabaseConnected ? (
                            <span className="text-green-500 flex items-center gap-1 inline-flex">
                              <ShieldCheck size={12} /> Conectado
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 inline-flex">
                              <ShieldAlert size={12} /> Desconectado
                            </span>
                          )}
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleSupabaseSync(!supabaseEnabled)}
                        className={cn(
                          "w-14 h-8 rounded-full transition-all relative p-1 flex items-center",
                          supabaseEnabled ? "bg-yellow-400" : "bg-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 bg-white rounded-full transition-all shadow-md",
                          supabaseEnabled ? "translate-x-6" : "translate-x-0"
                        )} />
                      </button>
                    </div>

                    {supabaseEnabled && isSupabaseConnected && (
                      <div className="bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800 space-y-4">
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          A sincronização está ativa. Você pode forçar uma sincronização manual de todos os dados locais para o Supabase agora.
                        </p>
                        <button 
                          onClick={syncAllToSupabase}
                          disabled={isSyncingToSupabase}
                          className="bg-yellow-400 text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20 flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSyncingToSupabase ? (
                            <>Sincronizando...</>
                          ) : (
                            <><Database size={18} /> Sincronizar Agora</>
                          )}
                        </button>
                      </div>
                    )}

                    {!isSupabaseConnected && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <p className="text-xs text-red-200 leading-relaxed">
                          Não foi possível conectar ao Supabase. Certifique-se de que as variáveis <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> estão configuradas corretamente no ambiente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Database className="text-yellow-400" /> Backup de Dados
                  </h3>
                  <div className="space-y-8">
                    <div className="bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800">
                      <h4 className="text-lg font-black text-zinc-100 mb-4">Exportar e Importar Dados (Memória Interna)</h4>
                      <p className="text-zinc-400 mb-6 leading-relaxed">
                        Use esta função para salvar uma cópia completa de todos os seus dados diretamente no seu <strong>PC ou Celular</strong>. 
                        Isso permite que você tenha controle total sobre onde seus dados são armazenados fisicamente.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={handleExport}
                          className="bg-zinc-800 text-zinc-100 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center gap-2"
                        >
                          <Download size={18} /> Salvar no Dispositivo
                        </button>
                        <label className="bg-yellow-400 text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20 cursor-pointer flex items-center gap-2">
                          <Upload size={18} /> Restaurar do Dispositivo
                          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                      </div>
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
                    id: currentView === 'meu_perfil' ? loggedInAluno?.id : (selectedAluno?.id || Date.now().toString()),
                    nome: formData.get('nome'),
                    dataNascimento: formData.get('dataNascimento'),
                    rgCpf: formData.get('rgCpf'),
                    telefone: formData.get('telefone'),
                    categoria: formCategoria,
                    numeroCamisa: formData.get('numeroCamisa'),
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
                            defaultValue={
                              currentView === 'meu_perfil' 
                                ? loggedInAluno?.dataNascimento?.split('/').reverse().join('-') 
                                : (selectedAluno?.dataNascimento?.split('/').reverse().join('-') || '')
                            }
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
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Número da Camisa</label>
                          <input 
                            name="numeroCamisa"
                            type="text" 
                            defaultValue={currentView === 'meu_perfil' ? loggedInAluno?.numeroCamisa : ''}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="Ex: 10" 
                          />
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
                            name="nome"
                            type="text" 
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="Nome completo do professor" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Data de Nascimento</label>
                          <input 
                            name="dataNascimento"
                            type="date" 
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">RG / CPF</label>
                          <input 
                            name="rgCpf"
                            type="text" 
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="000.000.000-00" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">CREF (Registro Profissional)</label>
                          <input 
                            name="cref"
                            type="text" 
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="000000-G/UF" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Especialidade / Cargo</label>
                          <select 
                            name="especialidade"
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
                            name="telefone"
                            type="text" 
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            placeholder="(00) 00000-0000" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase">E-mail Profissional</label>
                          <input 
                            name="email"
                            type="email" 
                            required
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
                          name="endereco"
                          type="text" 
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Rua, número, complemento" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Bairro</label>
                        <input 
                          name="bairro"
                          type="text" 
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Bairro" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Cidade</label>
                        <input 
                          name="cidade"
                          type="text" 
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Cidade" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">UF</label>
                        <input 
                          name="uf"
                          type="text" 
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none" 
                          placeholder="Estado" 
                          maxLength={2} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="submit" className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all uppercase tracking-widest shadow-lg shadow-yellow-400/20">
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
                  <button 
                    onClick={() => {
                      setSelectedAluno(null);
                      setCurrentView('cadastrar_aluno');
                    }}
                    className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-black hover:bg-yellow-500 transition-colors uppercase"
                  >
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
                        <th className="px-6 py-4">Status</th>
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
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-black px-2 py-1 rounded-md border uppercase",
                              aluno.status === 'inativo' 
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>
                              {aluno.status || 'ativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedAluno(aluno);
                                  setCurrentView('cadastrar_aluno');
                                }}
                                className="p-2 text-zinc-500 hover:text-yellow-400 transition-all"
                                title="Editar Aluno"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteAluno(aluno.id)}
                                className="p-2 text-zinc-500 hover:text-red-400 transition-all"
                                title="Excluir Aluno"
                              >
                                <Trash2 size={18} />
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
                    <select 
                      value={chamadaCategory}
                      onChange={(e) => setChamadaCategory(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none"
                    >
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="date" className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="space-y-2">
                  {alunos.filter(a => a.categoria === chamadaCategory).map(aluno => (
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
                                {aluno.numeroCamisa || aluno.nome.charAt(0)}
                              </div>
                              <div>
                                <p className={cn("font-bold text-sm", isSelected ? "text-yellow-400" : "text-zinc-100")}>
                                  {aluno.numeroCamisa && <span className="text-yellow-400 mr-2">#{aluno.numeroCamisa}</span>}
                                  {aluno.nome}
                                </p>
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
                                <th className="py-2 text-left text-xs font-black uppercase w-10">#</th>
                                <th className="py-2 text-left text-xs font-black uppercase w-20">Uniforme</th>
                                <th className="py-2 text-left text-xs font-black uppercase">Nome do Atleta</th>
                                <th className="py-2 text-left text-xs font-black uppercase w-32">Nascimento</th>
                                <th className="py-2 text-left text-xs font-black uppercase w-40">RG / CPF</th>
                                <th className="py-2 text-left text-xs font-black uppercase w-32">Assinatura</th>
                              </tr>
                            </thead>
                            <tbody>
                              {atletasDaCategoria.map((aluno, index) => (
                                <tr key={aluno.id} className="border-b border-zinc-300">
                                  <td className="py-3 text-sm font-bold">{index + 1}</td>
                                  <td className="py-3 text-sm font-black">{aluno.numeroCamisa || '---'}</td>
                                  <td className="py-3 text-sm font-bold uppercase">{aluno.nome}</td>
                                  <td className="py-3 text-sm">{aluno.dataNascimento}</td>
                                  <td className="py-3 text-sm">{aluno.rgCpf || '---'}</td>
                                  <td className="py-3 border-b border-black/40"></td>
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
                            
                            let anamneseData: any = null;
                            
                            // Try Supabase first
                            if (isSupabaseConnected) {
                              try {
                                anamneseData = await supabaseService.getAnamnese(aluno.id);
                              } catch (supaError) {
                                console.error("Erro ao buscar anamnese no Supabase:", supaError);
                              }
                            }
                            
                            // Fallback to Firestore
                            if (!anamneseData) {
                              const anamnese = await getDoc(doc(db, 'anamneses', aluno.id));
                              if (anamnese.exists()) {
                                anamneseData = anamnese.data();
                              }
                            }

                            if (anamneseData) {
                              setAnamneseData(anamneseData);
                            } else {
                              setAnamneseData({
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
                            }
                            setCurrentView('anamnese');
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
                      className="relative w-[324px] h-[204px] bg-zinc-950 rounded-[3.18mm] border-[0.5mm] border-yellow-400 overflow-hidden shadow-2xl mx-auto flex flex-col"
                    >
                      {/* Top Bar */}
                      <div className="w-full h-8 bg-yellow-400 flex items-center px-3 justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                          <img src={currentShield} alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                          <span className="text-black font-black text-[8px] tracking-tighter">PIRUÁ ESPORTE CLUBE</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {selectedAluno.numeroCamisa && (
                            <div className="bg-black px-1.5 py-0.5 rounded-[0.5mm] text-[7px] font-black text-white uppercase">Nº {selectedAluno.numeroCamisa}</div>
                          )}
                          <div className="bg-black px-1.5 py-0.5 rounded-[0.5mm] text-[7px] font-black text-yellow-400 uppercase">Atleta</div>
                        </div>
                      </div>

                      <div className="flex-1 px-3 py-2 flex gap-3 overflow-hidden">
                        {/* Photo Area */}
                        <div className="w-20 h-26 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0 overflow-hidden flex items-center justify-center relative">
                          {selectedAluno.foto ? (
                            <img src={selectedAluno.foto} alt={selectedAluno.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <UserCircle size={32} className="text-zinc-700" />
                              <span className="text-[5px] text-zinc-600 font-bold uppercase">Sem Foto</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 w-full bg-yellow-400/90 py-0.5 text-center">
                            <span className="text-[7px] font-black text-black uppercase">{selectedAluno.categoria}</span>
                          </div>
                        </div>

                        {/* Data Area */}
                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                          <div className="space-y-1">
                            <div>
                              <p className="text-[6px] font-black text-yellow-400 uppercase tracking-widest">Nome Completo</p>
                              <p className="text-[9px] font-black uppercase text-white leading-tight truncate">{selectedAluno.nome}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-1">
                              <div>
                                <p className="text-[6px] font-black text-yellow-400 uppercase tracking-widest">Nascimento</p>
                                <p className="text-[8px] font-bold text-white">{selectedAluno.dataNascimento}</p>
                              </div>
                              <div>
                                <p className="text-[6px] font-black text-yellow-400 uppercase tracking-widest">RG / CPF</p>
                                <p className="text-[8px] font-bold text-white truncate">{selectedAluno.rgCpf || '---'}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-[6px] font-black text-yellow-400 uppercase tracking-widest">Endereço</p>
                              <p className="text-[7px] font-medium text-zinc-300 leading-tight truncate">
                                {selectedAluno.endereco}
                              </p>
                              <p className="text-[7px] font-medium text-zinc-300 leading-tight truncate">
                                {selectedAluno.bairro} - {selectedAluno.cidade}/{selectedAluno.uf}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-1">
                              <div>
                                <p className="text-[6px] font-black text-yellow-400 uppercase tracking-widest">Responsável</p>
                                <p className="text-[7px] font-bold text-white truncate">{selectedAluno.responsavel}</p>
                              </div>
                              <div>
                                <p className="text-[6px] font-black text-yellow-400 uppercase tracking-widest">Telefone</p>
                                <p className="text-[7px] font-bold text-white">{selectedAluno.telefone}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[6px] font-black text-yellow-400 uppercase tracking-widest">Matrícula</p>
                              <p className="text-[8px] font-bold text-white">#{selectedAluno.id.toString().slice(-5)}</p>
                            </div>
                            <div className="bg-white p-0.5 rounded shadow-sm">
                              <QRCodeCanvas 
                                value={`https://piruaec.com.br/atleta/${selectedAluno.id}`}
                                size={20}
                                level="L"
                                includeMargin={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Bar */}
                      <div className="w-full h-5 bg-zinc-900 border-t border-zinc-800 flex items-center px-3 justify-between shrink-0">
                        <span className="text-zinc-500 font-bold text-[6px] uppercase tracking-widest">ID INTERNO</span>
                        <span className="text-zinc-500 font-bold text-[6px] uppercase">Válido até 12/2026</span>
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
                        disabled={isGeneratingPDF}
                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-black py-3 rounded-xl font-black hover:bg-yellow-500 transition-all disabled:opacity-50"
                      >
                        <Download size={18} /> {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF'}
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
                        name="nome"
                        type="text" 
                        required
                        placeholder="Ex: Torneio Regional, Amistoso..."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Endereço do Evento</label>
                        <input 
                          name="endereco"
                          type="text" 
                          required
                          placeholder="Rua, número, estádio ou ginásio"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cidade do Evento</label>
                        <input 
                          name="cidade"
                          type="text" 
                          required
                          placeholder="Cidade"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">UF</label>
                        <input 
                          name="uf"
                          type="text" 
                          required
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
                          name="dataInicio"
                          type="date" 
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data de Fim</label>
                        <input 
                          name="dataFim"
                          type="date" 
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Horário</label>
                        <input 
                          name="horario"
                          type="time" 
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button type="submit" className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all uppercase tracking-widest shadow-lg shadow-yellow-400/20">
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
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-yellow-400" /> Gerar Documento
                      </h3>
                      <button 
                        onClick={() => setCurrentView('dashboard')}
                        className="text-zinc-500 hover:text-white flex items-center gap-1 text-xs font-bold transition-colors"
                      >
                        <ChevronLeft size={16} /> Voltar ao Menu
                      </button>
                    </div>

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

        {/* Birthday Card Story Template (Hidden) */}
        <div 
          id="birthday-card-template" 
          className="fixed left-[-9999px] top-[-9999px] w-[1080px] h-[1920px] bg-black flex flex-col items-center justify-between p-16 text-white overflow-hidden"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[40%] bg-yellow-400/20 rounded-full blur-[180px]" />
            <div className="absolute bottom-[-5%] right-[-10%] w-[60%] h-[40%] bg-yellow-400/20 rounded-full blur-[180px]" />
            
            {/* Decorative Lines */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-px h-full bg-yellow-400" />
              <div className="absolute top-0 left-2/4 w-px h-full bg-yellow-400" />
              <div className="absolute top-0 left-3/4 w-px h-full bg-yellow-400" />
            </div>
          </div>

          {/* Header Section */}
          <div className="relative z-10 flex flex-col items-center gap-8 mt-12">
            <img src={clubShield} alt="Escudo" className="w-48 h-48 object-contain drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" referrerPolicy="no-referrer" crossOrigin="anonymous" />
            <div className="text-center">
              <h2 className="text-9xl font-black uppercase tracking-tighter leading-none italic">
                Feliz<br />
                <span className="text-yellow-400">Aniversário</span>
              </h2>
            </div>
          </div>

          {/* Polaroid Photo Section */}
          <div className="relative z-10 mt-10">
            {/* Tape Effect */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-12 bg-zinc-700/50 backdrop-blur-sm rotate-2 z-20" />
            
            <div className="bg-white p-8 pb-24 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rotate-[-2deg]">
              <div className="w-[650px] h-[750px] bg-zinc-200 overflow-hidden">
                {celebratingAluno?.foto ? (
                  <img src={celebratingAluno.foto} alt={celebratingAluno.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full bg-zinc-300 flex items-center justify-center">
                    <UserCircle size={300} className="text-zinc-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Floating Decorations */}
            <div className="absolute -top-10 -left-10 text-yellow-400 animate-bounce">
              <Trophy size={80} />
            </div>
            <div className="absolute -bottom-10 -right-10 text-yellow-400">
              <Cake size={100} />
            </div>
          </div>

          {/* Message Section */}
          <div className="relative z-10 text-center mb-20 w-full px-10">
            <h3 className="text-7xl font-black uppercase text-white mb-6 tracking-tight">
              {celebratingAluno?.nome}
            </h3>
            <div className="h-1 w-40 bg-yellow-400 mx-auto mb-8" />
            <p className="text-3xl font-medium text-zinc-400 leading-relaxed max-w-2xl mx-auto italic">
              "Que a alegria, paz, saúde e felicidade sejam renovadas em sua vida hoje e se renovem sempre. Parabéns por mais um ano de vida e por fazer parte da nossa família!"
            </p>
            
            <div className="mt-16 flex flex-col items-center gap-4">
              <p className="text-2xl font-black uppercase tracking-[0.5em] text-yellow-400">Pirua Esporte Clube</p>
              <div className="flex items-center gap-3 text-zinc-500">
                <Instagram size={24} />
                <span className="text-xl font-bold">@pirua_esporte_clube</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Post Template (Hidden) */}
        <div 
          id="insta-post-template" 
          className="fixed left-[-9999px] top-[-9999px] w-[1080px] h-[1080px] bg-black flex flex-col items-center justify-between p-20 text-white overflow-hidden"
        >
          {/* Background Decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400 rounded-full blur-[150px]" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <img src={clubShield} alt="Escudo" className="w-40 h-40 object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
            <h2 className="text-6xl font-black uppercase tracking-[0.2em] text-yellow-400">Pirua E.C.</h2>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center gap-12 w-full">
            <div className="relative">
              <div className="w-[500px] h-[500px] rounded-full border-8 border-yellow-400 overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                {celebratingAluno?.foto ? (
                  <img src={celebratingAluno.foto} alt={celebratingAluno.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <UserCircle size={200} className="text-zinc-700" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-black p-6 rounded-3xl shadow-2xl transform rotate-12">
                <Cake size={60} />
              </div>
            </div>

            <div className="text-center space-y-4">
              <h1 className="text-8xl font-black uppercase tracking-tighter leading-none">
                Feliz<br />
                <span className="text-yellow-400">Aniversário!</span>
              </h1>
              <p className="text-4xl font-bold text-zinc-400 uppercase tracking-[0.3em]">
                {celebratingAluno?.nome}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 w-full flex justify-between items-end border-t border-white/10 pt-10">
            <div className="flex items-center gap-3">
              <Instagram className="text-yellow-400" size={32} />
              <span className="text-2xl font-bold text-zinc-500">@pirua_esporte_clube</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-black uppercase text-yellow-400 tracking-widest">Formando Atletas</p>
              <p className="text-lg font-bold text-zinc-600 uppercase">Transformando Vidas</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
