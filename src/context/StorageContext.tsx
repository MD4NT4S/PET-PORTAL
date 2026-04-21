import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { differenceInDays, isSameDay } from 'date-fns';

// Types
export interface Ticket {
    id: string;
    category: string;
    urgency: 'Baixa' | 'Média' | 'Alta';
    description: string;
    status: 'Novo' | 'Em Atendimento' | 'Concluído';
    createdAt: string;
    updatedAt?: string;
    author: string; // User name
    response?: string; // Admin response
}

export interface Feedback {
    id: string;
    to: string;
    message: string;
    from: string; // "Anônimo" or User name
    createdAt: string;
}

export interface Evaluation {
    id: string;
    presence: number;
    effort: number;
    mood: number; // 0-10 (Mapped from Emojis)
    feeling: string; // "Relato de Experiência"
    criteria: {
        // Satisfaction (0-10)
        satisfactionGroup?: number;
        satisfactionTutor?: number;
        satisfactionCoordination?: number;
        satisfactionBalance?: number;
        peerEvaluations?: Record<string, number>; // Nome -> Nota (0-10)

        // Text Answers (New Sections)
        weeklyDedication?: string;
        goalCompliance?: string;
        academicProduction?: string;
        sectorPerformance?: string;
        roomCare?: string;
        positiveHighlight?: string;

        // Legacy/Generic
        [key: string]: any;
    };
    improvement: string; // "O que pode melhorar?"
    createdAt: string;
    author: string; // User name
}

export interface Ombudsman {
    id: string;
    type: 'Elogio' | 'Sugestão' | 'Reclamação';
    text: string;
    isAnonymous: boolean;
    identification?: string; // Optional identification
    status?: 'Pendente' | 'Atendido';
    response?: string; // Admin response
    createdAt: string;
}

export interface Member {
    id: string;
    name: string;
    email: string;
    password?: string; // Optional for migration or if we decide to hash later (simulated)
    photoUrl?: string;
    role: 'member' | 'admin_master' | 'admin_infra' | 'admin_gp' | 'admin_secretaria' | 'admin_divulgacao' | 'admin_pesquisa';
    coordination?: string;
}

// ... existing interfaces
export interface InventoryItem {
    id: string;
    name: string;
    code?: string;
    quantity: number;
    status: 'Disponível' | 'Em Uso' | 'Emprestado' | 'Indisponível';
}

export interface Sector {
    id: string;
    name: string;
    category: string;
    displayOrder?: number;
    items: InventoryItem[];
}

export interface Loan {
    id: string;
    itemId: string;
    itemName: string;
    userId: string;
    userName: string;
    type: 'Empréstimo' | 'Uso Contínuo' | 'Empréstimo Temporário';
    quantity: number;
    expectedReturnDate?: string;
    date: string;
    status: 'Ativo' | 'Devolvido' | 'Atrasado' | 'Aguardando Aprovação';
    withdrawalPhotoUrl?: string; // Foto da retirada
    returnPhotoUrl?: string; // Foto da devolução
    returnCondition?: 'ok' | 'damaged' | 'dirty' | null;
    adminNotes?: string | null;
    actualReturnDate?: string;
}

export interface Photo {
    id: string;
    url: string;
    description: string;
    author: string; // User name
    createdAt: string;
    rotation: number; // Random rotation between -5 and 5 degrees
}

export interface Notice {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'alert' | 'event';
    createdAt: string;
    author: string;
}

interface StorageContextType {
    // ... existing types
    tickets: Ticket[];
    evaluations: Evaluation[];
    ombudsman: Ombudsman[];
    members: Member[];
    sectors: Sector[];
    loans: Loan[]; // NEW
    currentUser: string | null;
    isAuthLoading: boolean;
    isAdmin: boolean;
    canManageCalendar: boolean;
    userRole: 'member' | 'admin_master' | 'admin_infra' | 'admin_gp' | 'admin_secretaria' | 'admin_divulgacao' | 'admin_pesquisa' | null;
    loginUser: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
    logoutUser: () => Promise<void>;
    addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'author'>) => void;
    updateTicket: (id: string, data: Partial<Ticket>) => void;
    removeTicket: (id: string) => Promise<void>;
    addEvaluation: (evaluation: Omit<Evaluation, 'id' | 'createdAt' | 'author'>) => void;
    removeEvaluation: (id: string) => Promise<void>;
    addOmbudsman: (data: Omit<Ombudsman, 'id' | 'createdAt'>) => void;
    addMember: (member: Omit<Member, 'id'>) => void;
    removeMember: (id: string) => void;
    updateMember: (id: string, data: Partial<Member>) => void;
    updateOmbudsmanStatus: (id: string, status: 'Pendente' | 'Atendido', response?: string) => void;
    removeOmbudsman: (id: string) => void;
    updateSector: (id: string, data: Partial<Sector>) => void;
    updateSectorItems: (id: string, items: InventoryItem[]) => void;
    reorderSectors: (sectors: Sector[]) => Promise<void>;
    addLoan: (itemId: string, type: 'Empréstimo' | 'Uso Contínuo' | 'Empréstimo Temporário', quantity: number, returnDate?: string, photoUrl?: string) => Promise<boolean>;
    returnLoan: (loanId: string, returnPhotoUrl: string) => Promise<boolean>;
    approveLoanReturn: (loanId: string, condition: 'ok' | 'damaged' | 'dirty', notes?: string) => Promise<boolean>;
    fetchInventoryData: () => Promise<void>;
    loadingSectors: boolean;

    // Photos
    photos: Photo[];
    addPhoto: (url: string, description: string, file?: File) => Promise<void>;
    removePhoto: (id: string) => void;

    // Notices
    notices: Notice[];
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt'>) => Promise<void>;
    removeNotice: (id: string) => Promise<void>;

    // Config & Events
    siteConfig: SiteConfig;
    loadingConfig: boolean;
    updateSiteConfig: (config: SiteConfig) => void;
    events: CalendarEvent[];
    addEvent: (event: CalendarEvent) => void;
    updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
    removeEvent: (id: string) => void;
    feedbacks: Feedback[];
    addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
    removeFeedback: (id: string) => void;

    // Knowledge Base
    documents: DocumentDTO[];
    addDocument: (doc: Omit<DocumentDTO, 'id' | 'createdAt'>, file?: File) => Promise<void>;
    removeDocument: (id: string) => void;
    fetchDocumentsData: () => Promise<void>;
    loadingDocuments: boolean;
}

export interface DocumentDTO {
    id: string;
    title: string;
    category: string;
    url: string;
    type: string; // 'pdf', 'doc', 'xls', 'img', 'other'
    size: string;
    createdAt: string;
}

export interface SiteConfig {
    heroTitle: string;
    heroDescription: string;
    pillars: {
        teaching: { title: string; description: string };
        research: { title: string; description: string };
        extension: { title: string; description: string };
    };
    contact: {
        email: string;
        phone?: string;
        address?: string;
        instagram?: string;
        linkedin?: string;
        github?: string;
    };
    footer: {
        text: string;
        copyright?: string;
        version?: string;
        links?: { label: string; url: string }[];
    };
    cycleFocus?: string;
}



export interface CalendarEvent {
    id: string;
    title: string;
    type: 'meeting' | 'deadline' | 'event' | 'birthday' | 'task';
    responsibles?: string[];
    // Rich properties (serialized into `date` for DB compatibility)
    start: Date;
    end?: Date;
    // NEW: Multi-period reminder system (array of days-before, e.g. [30, 7, 1])
    reminderSchedule?: number[];
    // Tracks which periods have already been sent { "30": true, "7": true }
    remindersSent?: Record<string, boolean>;
    // LEGACY (kept for backward compat with old events)
    reminderDaysBefore?: number;
    reminderSent?: boolean;
    templateId?: string;
    description?: string;
    link?: string;
    area?: string;
    submissionDeadline?: string;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
    // Data States
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [ombudsman, setOmbudsman] = useState<Ombudsman[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loadingSectors, setLoadingSectors] = useState(false);
    const [loadingDocuments, setLoadingDocuments] = useState(false);

    // CMS State
    const DEFAULT_SITE_CONFIG: SiteConfig = {
        heroTitle: 'Bem-vindo ao PET Hub.',
        heroDescription: 'Sua central de gestão acadêmica. Acompanhe atividades, envie feedbacks e colabore com o grupo de forma simples e integrada.',
        pillars: {
            teaching: { title: 'Ensino', description: 'Monitorias e grupos de estudo' },
            research: { title: 'Pesquisa', description: 'Projetos e publicações' },
            extension: { title: 'Extensão', description: 'Impacto na comunidade' },
        },
        contact: {
            email: 'pet@university.edu',
            instagram: '@pet_hub',
            linkedin: 'company/pet-hub'
        },
        footer: {
            text: 'Desenvolvido com carinho pelo PET - Versão 1.1',
            version: 'v1.0.0',
            links: []
        },
        cycleFocus: 'Este mês estamos focados na organização da <strong>Semana Acadêmica</strong> e na finalização dos relatórios parciais.'
    };

    const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [userRole, setUserRole] = useState<'member' | 'admin_master' | 'admin_infra' | 'admin_gp' | 'admin_secretaria' | 'admin_divulgacao' | 'admin_pesquisa' | null>(null);

    // --- Auth Management (Supabase Auth) ---
    useEffect(() => {
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                // Fetch profile with a timeout/safety check to prevent infinite hanging
                try {
                    const fetchProfile = supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                        
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
                    
                    const response = await Promise.race([fetchProfile, timeoutPromise]) as any;
                    const profile = response?.data;
                    const profileError = response?.error;

                    if (profile && !profileError) {
                        setCurrentUser(profile.full_name || session.user.email);
                        setUserRole(profile.role as any);
                    } else {
                        // Fallback to metadata if profile not found or error
                        setCurrentUser(session.user.user_metadata?.full_name || session.user.email);
                        setUserRole(session.user.user_metadata?.role || 'member');
                    }
                } catch (err) {
                    console.error("Profile fetch error:", err);
                    setCurrentUser(session.user.user_metadata?.full_name || session.user.email);
                    setUserRole(session.user.user_metadata?.role || 'member');
                } finally {
                    setIsAuthLoading(false);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setIsAuthLoading(false);
            }
        });

        // Safety timeout just in case onAuthStateChange is delayed
        const authSafetyTimeout = setTimeout(() => {
            setIsAuthLoading(false);
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(authSafetyTimeout);
        };
    }, []);

    // Fix: Allow all admins to log in via AdminLogin
    const isAdmin = ['admin_master', 'admin_infra', 'admin_gp', 'admin_secretaria', 'admin_divulgacao', 'admin_pesquisa'].includes(userRole || '');
    const canManageCalendar = isAdmin || ['admin_secretaria', 'admin_divulgacao', 'admin_pesquisa'].includes(userRole || '');

    // --- Data Fetching ---
    const fetchCriticalData = async () => {
        setLoadingConfig(true);
        try {
            const results = await Promise.allSettled([
                supabase.from('site_config').select('*'),
                supabase.from('notices').select('*').order('created_at', { ascending: false }),
                supabase.from('photos').select('*').order('created_at', { ascending: false }),
                supabase.from('members').select('*')
            ]);

            const configRes = results[0].status === 'fulfilled' ? results[0].value : { data: null };
            const noticesRes = results[1].status === 'fulfilled' ? results[1].value : { data: null };
            const photosRes = results[2].status === 'fulfilled' ? results[2].value : { data: null };
            const membersRes = results[3].status === 'fulfilled' ? results[3].value : { data: null };

            // Process Config
            if (configRes.data && configRes.data.length > 0) {
                setSiteConfig(configRes.data[0].config);
            } else {
                // FALLBACK IF EMPTY OR ERROR to prevent white screen of death
                setSiteConfig(DEFAULT_SITE_CONFIG);
            }

            // Process Notices
            if (noticesRes.data) {
                setNotices(noticesRes.data.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    content: n.content,
                    type: n.type,
                    createdAt: n.created_at,
                    author: n.author
                })));
            }

            // Process Photos (Limited for Home)
            if (photosRes.data) {
                setPhotos(photosRes.data.map((p: any) => ({
                    id: p.id,
                    url: p.url,
                    description: p.description,
                    author: p.author,
                    createdAt: p.created_at,
                    rotation: p.rotation
                })));
            }

            // Process Members (Essential for Login)
            let loadedMembers: Member[] = [];
            if (membersRes.data) {
                loadedMembers = membersRes.data.map((m: any) => ({ ...m, photoUrl: m.photo_url }));
                setMembers(loadedMembers);
            }
            return loadedMembers;

        } catch (error) {
            console.error("Error fetching critical data:", error);
            return [];
        } finally {
            setLoadingConfig(false);
        }
    };

    const fetchSecondaryData = async (currentMembers: Member[]) => {
        // Individual fetchers for robustness
        const fetchers = [
            {
                name: 'tickets',
                fn: () => supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(100),
                setter: (data: any[]) => setTickets(data.map(t => ({ ...t, createdAt: t.created_at })))
            },
            {
                name: 'feedbacks',
                fn: () => supabase.from('feedbacks').select('*').order('created_at', { ascending: false }).limit(50),
                setter: (data: any[]) => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const validFeedbacks = data.filter(f => new Date(f.created_at) > thirtyDaysAgo);

                    // Cleanup old feedbacks silently
                    const expiredIds = data.filter(f => new Date(f.created_at) <= thirtyDaysAgo).map(f => f.id);
                    if (expiredIds.length > 0) {
                        supabase.from('feedbacks').delete().in('id', expiredIds).then(() => { });
                    }
                    setFeedbacks(validFeedbacks.map(f => ({ ...f, createdAt: f.created_at })));
                }
            },
            {
                name: 'evaluations',
                fn: () => supabase.from('evaluations').select('*').order('created_at', { ascending: false }).limit(100),
                setter: (data: any[]) => setEvaluations(data.map(e => ({ ...e, createdAt: e.created_at })))
            },
            {
                name: 'ombudsman',
                fn: () => supabase.from('ombudsman').select('*').order('created_at', { ascending: false }).limit(50),
                setter: (data: any[]) => setOmbudsman(data.map(o => ({ ...o, isAnonymous: o.is_anonymous, createdAt: o.created_at })))
            },
            {
                name: 'events',
                fn: () => supabase.from('events').select('*'),
                setter: (data: any[]) => {
                    const parsedEvents = data.map(e => {
                        try {
                            if (e.date) {
                                let richData = null;
                                if (typeof e.date === 'string' && e.date.startsWith('{')) {
                                    richData = JSON.parse(e.date);
                                } else if (typeof e.date === 'object') {
                                    richData = e.date;
                                }

                                if (richData) {
                                    return {
                                        ...e,
                                        start: new Date(richData.start),
                                        end: richData.end ? new Date(richData.end) : undefined,
                                        reminderSchedule: richData.reminderSchedule,
                                        remindersSent: richData.remindersSent || {},
                                        reminderDaysBefore: richData.reminderDaysBefore,
                                        reminderSent: richData.reminderSent,
                                        templateId: richData.templateId,
                                        description: richData.description,
                                        link: richData.link,
                                        area: richData.area,
                                        responsibles: richData.responsibles,
                                        submissionDeadline: richData.submissionDeadline
                                    };
                                }

                                if (typeof e.date === 'string') {
                                    const parts = e.date.split('/');
                                    if (parts.length >= 2) {
                                        const day = parseInt(parts[0]);
                                        const month = parseInt(parts[1]) - 1;
                                        const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
                                        return {
                                            ...e,
                                            start: new Date(year, month, day, 9, 0),
                                        };
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Error parsing event date:", err);
                        }
                        return { ...e, start: new Date() };
                    });
                    setEvents(parsedEvents);
                }
            },
            {
                name: 'sectors',
                fn: () => supabase.from('sectors').select('*, items:inventory_items(*)').order('display_order'),
                setter: (data: any[]) => {
                    const formattedSectors: Sector[] = data.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        category: s.category,
                        displayOrder: s.display_order,
                        items: s.items?.map((i: any) => ({
                            id: i.id,
                            name: i.name,
                            code: i.code,
                            quantity: i.quantity,
                            status: i.status
                        })) || []
                    }));
                    setSectors(formattedSectors);
                }
            },
            {
                name: 'loans',
                fn: () => supabase.from('loans').select('*').order('date', { ascending: false }).limit(100),
                setter: (data: any[]) => {
                    setLoans(data.map(l => {
                        let actualReturnDate = undefined;
                        let cleanNotes = l.admin_notes;
                        if (l.admin_notes && l.admin_notes.includes('[RETURN_DATE:')) {
                            const match = l.admin_notes.match(/\[RETURN_DATE:([^\]]+)\](.*)/s);
                            if (match) {
                                actualReturnDate = match[1];
                                cleanNotes = match[2].trim() || null;
                            }
                        }
                        return {
                            ...l,
                            itemId: l.item_id,
                            userId: l.user_id,
                            userName: l.user_name,
                            itemName: l.item_name,
                            expectedReturnDate: l.expected_return_date,
                            actualReturnDate,
                            withdrawalPhotoUrl: l.withdrawal_photo_url,
                            returnPhotoUrl: l.return_photo_url,
                            adminNotes: cleanNotes
                        };
                    }));
                }
            },
            {
                name: 'documents',
                fn: () => supabase.from('documents').select('*').order('created_at', { ascending: false }),
                setter: (data: any[]) => setDocuments(data.map(d => ({ ...d, createdAt: d.created_at })))
            }
        ];

        // Execute all in parallel but handle failures individually
        await Promise.allSettled(fetchers.map(async (f) => {
            try {
                const { data, error } = await f.fn();
                if (error) throw error;
                if (data) f.setter(data);
            } catch (err) {
                console.error(`Error fetching ${f.name}:`, err);
            }
        }));

    };

    const fetchInventoryData = async () => {
        setLoadingSectors(true);
        try {
            const [sectorsRes, loansRes] = await Promise.all([
                supabase.from('sectors').select('*, items:inventory_items(*)').order('display_order'),
                supabase.from('loans').select('*').order('date', { ascending: false }).limit(100)
            ]);

            if (sectorsRes.data) {
                const formattedSectors: Sector[] = sectorsRes.data.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    category: s.category,
                    displayOrder: s.display_order,
                    items: s.items?.map((i: any) => ({
                        id: i.id,
                        name: i.name,
                        code: i.code,
                        quantity: i.quantity,
                        status: i.status
                    })) || []
                }));
                setSectors(formattedSectors);
            }

            if (loansRes.data) {
                setLoans(loansRes.data.map(l => {
                    let actualReturnDate = undefined;
                    let cleanNotes = l.admin_notes;
                    if (l.admin_notes && l.admin_notes.includes('[RETURN_DATE:')) {
                        const match = l.admin_notes.match(/\[RETURN_DATE:([^\]]+)\](.*)/s);
                        if (match) {
                            actualReturnDate = match[1];
                            cleanNotes = match[2].trim() || null;
                        }
                    }

                    return {
                        ...l,
                        itemId: l.item_id,
                        userId: l.user_id,
                        userName: l.user_name,
                        itemName: l.item_name,
                        expectedReturnDate: l.expected_return_date,
                        actualReturnDate,
                        withdrawalPhotoUrl: l.withdrawal_photo_url,
                        returnPhotoUrl: l.return_photo_url,
                        adminNotes: cleanNotes
                    };
                }));
            }
        } catch (error) {
            console.error("Error syncing inventory data:", error);
        } finally {
            setLoadingSectors(false);
        }
    };

    const fetchDocumentsData = async () => {
        setLoadingDocuments(true);
        try {
            const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setDocuments(data.map(d => ({ ...d, createdAt: d.created_at })));
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoadingDocuments(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            try {
                const loadedMembers = await fetchCriticalData();
                await fetchSecondaryData(loadedMembers);
            } catch (err) {
                console.error("Initialization failed:", err);
            }
        };
        initialize();

        // Realtime Subscriptions for Inventory and Loans
        const channel = supabase.channel('inventory-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
                fetchInventoryData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sectors' }, () => {
                fetchInventoryData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
                fetchInventoryData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        const sendReminderEmail = async (event: CalendarEvent, daysLeft: number, recipients: string[]) => {
            const adminEmail = recipients[0];
            const bccList = recipients.filter(e => e !== adminEmail).join(',');

            // Envia via Supabase Function (Resend)
            const emailBody: any = {
                to: recipients.length === 1 ? recipients[0] : recipients,
                bcc: bccList,
                from_name: "Sistema PET (Automático)",
                subject: `Lembrete: ${event.title}`
            };

            // Se tiver templateID, usa! Senão usa HTML padrão.
            if (event.templateId) {
                const cleanTemplateId = event.templateId.trim();
                console.log(`[Lembrete] Usando template do Resend: ${cleanTemplateId}`);
                emailBody.template = {
                    id: cleanTemplateId,
                    variables: {
                        name: recipients.length === 1 ? members.find(m => m.email === recipients[0])?.name || 'Membro' : 'Participante',
                        event: event.title,
                        date: new Date(event.start).toLocaleDateString('pt-BR'),
                        area: event.area || 'Geral',
                        link: event.link || '',
                        timeto: String(daysLeft),
                        timeto_word: daysLeft === 1 ? 'dia' : 'dias',
                        timeto_verb: daysLeft === 1 ? 'Falta' : 'Faltam',
                        limit: event.submissionDeadline ? new Date(event.submissionDeadline + 'T00:00:00').toLocaleDateString('pt-BR') : ''
                    }
                };
            } else {
                const isNewEvent = daysLeft === -1;
                const periodLabel = isNewEvent ? 'Novo Evento!' : (daysLeft === 0 ? 'Hoje!' : daysLeft === 1 ? 'Amanhã!' : `Falta(m) ${daysLeft} dia(s)`);
                emailBody.subject = isNewEvent ? `Novo Evento: ${event.title}` : `Lembrete: ${event.title} — ${periodLabel}`;
                emailBody.html = `
                    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px;">
                        <h2 style="color: #3b82f6; margin-top: 0;">${isNewEvent ? 'Novo Evento Criado' : 'Lembrete de Evento'}</h2>
                        <p>Olá, este é um aviso automático do seu <strong>Portal PET</strong>.</p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Evento:</strong> ${event.title}</p>
                            <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date(event.start).toLocaleDateString('pt-BR')}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> ${isNewEvent ? 'Acabou de ser postado' : periodLabel}</p>
                            ${event.description ? `<p style="margin: 5px 0;"><strong>Descrição:</strong> ${event.description}</p>` : ''}
                        </div>
                        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">Este é um e-mail automático. Por favor, não responda.</p>
                    </div>
                `;
            }

            const response = await supabase.functions.invoke('resend-email', {
                body: emailBody
            });

            const { data: resData, error: funcError } = response;

            if (funcError || (resData && resData.error)) {
                console.error('[Lembrete] Erro detectado no envio via Resend:', { funcError, resData });
                let errorMessage = 'Erro no envio';
                if (resData && resData.message) {
                    errorMessage = resData.message;
                } else if (funcError) {
                    errorMessage = funcError.message;
                }
                throw new Error(errorMessage);
            }
        };

        const getRecipients = (event: CalendarEvent): string[] => {
            let recipients: string[] = [];

            // Se houver responsáveis, envia APENAS para eles
            if (event.responsibles && event.responsibles.length > 0) {
                recipients = members
                    .filter(m => event.responsibles?.includes(m.name))
                    .map(m => m.email)
                    .filter(Boolean);
            }

            // Se não houver responsáveis, envia para todos (fallback)
            if (recipients.length === 0) {
                recipients = members
                    .map(m => m.email)
                    .filter(Boolean);
            }

            return recipients;
        };

        const checkReminders = async () => {
            if (events.length === 0 || members.length === 0) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const event of events) {
                if (!event.start) continue;

                const eventDate = new Date(event.start);
                eventDate.setHours(0, 0, 0, 0);
                const daysLeft = differenceInDays(eventDate, today);

                // Skip past events
                if (daysLeft < 0) continue;

                // ===== NEW: Multi-period reminder schedule =====
                if (event.reminderSchedule && event.reminderSchedule.length > 0) {
                    const sentMap = event.remindersSent || {};

                    for (const period of event.reminderSchedule) {
                        // Already sent for this period?
                        if (sentMap[String(period)]) continue;

                        // Is it time? (daysLeft <= period means we are at or past the trigger point)
                        if (daysLeft <= period) {
                            try {
                                console.log(`[Lembrete Multi] Disparando período ${period}d para: ${event.title}. Dias restantes: ${daysLeft}`);

                                const recipients = getRecipients(event);
                                if (recipients.length === 0) {
                                    console.warn('[Lembrete] Nenhum destinatário encontrado para o evento:', event.title);
                                    continue;
                                }

                                await sendReminderEmail(event, daysLeft, recipients);

                                // Mark this specific period as sent
                                const updatedSentMap = { ...sentMap, [String(period)]: true };
                                await updateEvent(event.id, { remindersSent: updatedSentMap });

                                console.log(`[Lembrete Multi] E-mail enviado com sucesso: ${event.title} (período: ${period}d)`);
                                toast.success(`Lembrete enviado: ${event.title} (${period} dias antes)`);
                            } catch (err: any) {
                                console.error('[Lembrete Multi] Erro:', err);
                                toast.error(`Erro lembrete: ${err.message || 'Falha na conexão'}`);
                            }
                        }
                    }
                    continue; // Skip legacy check for this event
                }

                // ===== LEGACY: Single reminderDaysBefore (backward compat) =====
                if (event.reminderDaysBefore !== undefined && !event.reminderSent) {
                    if (daysLeft <= event.reminderDaysBefore && daysLeft >= 0) {
                        try {
                            console.log(`[Lembrete Legacy] Disparando para o evento: ${event.title}. Dias restantes: ${daysLeft}`);

                            const recipients = getRecipients(event);
                            if (recipients.length === 0) {
                                console.warn('[Lembrete] Nenhum destinatário encontrado para o evento:', event.title);
                                continue;
                            }

                            await sendReminderEmail(event, daysLeft, recipients);

                            await updateEvent(event.id, { reminderSent: true });
                            console.log(`[Lembrete Legacy] E-mail enviado com sucesso: ${event.title}`);
                            toast.success(`Lembrete enviado: ${event.title}`);
                        } catch (err: any) {
                            console.error('[Lembrete Legacy] Erro:', err);
                            toast.error(`Erro: ${err.message || 'Falha na conexão'}`);
                        }
                    }
                }
            }
        };

        // Delay checking slightly to ensure DB is fully loaded
        const timeout = setTimeout(() => {
            checkReminders();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [events.length, isAdmin, members.length]);

    // Auth Persistence
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('pet-current-user', currentUser);
        } else {
            localStorage.removeItem('pet-current-user');
        }
    }, [currentUser]);

    useEffect(() => {
        if (userRole) {
            localStorage.setItem('pet-user-role', userRole);
        } else {
            localStorage.removeItem('pet-user-role');
        }
    }, [userRole]);


    // --- Actions ---

    const addTicket = async (data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'author'>) => {
        const newTicket = {
            ...data,
            status: 'Novo',
            author: currentUser || 'Anônimo'
        };
        const { data: inserted, error } = await supabase.from('tickets').insert(newTicket).select().single();
        if (error) {
            toast.error('Erro ao criar chamado');
            return;
        }
        if (inserted) {
            setTickets(prev => [{ ...inserted, createdAt: inserted.created_at } as Ticket, ...prev]);
            toast.success('Chamado criado com sucesso!');
        }
    };

    const updateTicket = async (id: string, data: Partial<Ticket>) => {
        const { error } = await supabase.from('tickets').update(data).eq('id', id);

        if (error) {
            toast.error('Erro ao atualizar ticket');
            return;
        }

        setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        toast.success('Ticket atualizado!');
    };

    const removeTicket = async (id: string) => {
        const { error } = await supabase.from('tickets').delete().eq('id', id);

        if (error) {
            toast.error('Erro ao excluir ticket');
            return;
        }

        setTickets(prev => prev.filter(t => t.id !== id));
        toast.success('Ticket excluído com sucesso!');
    };

    const addFeedback = async (data: Omit<Feedback, 'id' | 'createdAt'>) => {
        const { data: inserted, error } = await supabase.from('feedbacks').insert(data).select().single();
        if (error) {
            toast.error('Erro ao enviar feedback');
            return;
        }
        if (inserted) {
            setFeedbacks(prev => [{ ...inserted, createdAt: inserted.created_at } as Feedback, ...prev]);
            toast.success('Feedback enviado!');
        }
    };

    const addEvaluation = async (data: Omit<Evaluation, 'id' | 'createdAt' | 'author'>) => {
        const newEvaluation = {
            ...data,
            author: currentUser || 'Anônimo'
        };
        const { data: inserted, error } = await supabase.from('evaluations').insert(newEvaluation).select().single();
        if (error) {
            toast.error('Erro ao salvar avaliação');
            return;
        }
        if (inserted) {
            setEvaluations(prev => [{ ...inserted, createdAt: inserted.created_at } as Evaluation, ...prev]);
            toast.success('Autoavaliação salva!');
        }
    };

    const removeFeedback = async (id: string) => {
        const { error } = await supabase.from('feedbacks').delete().eq('id', id);
        if (error) {
            toast.error('Erro ao remover feedback');
            return;
        }
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        toast.success('Kudos removido');
    };


    const removeEvaluation = async (id: string) => {
        const { error } = await supabase.from('evaluations').delete().eq('id', id);
        if (error) {
            toast.error('Erro ao remover avaliação');
            return;
        }
        setEvaluations(prev => prev.filter(e => e.id !== id));
        toast.success('Avaliação removida!');
    };

    const addOmbudsman = async (data: Omit<Ombudsman, 'id' | 'createdAt'>) => {
        const newOmbudsman = {
            type: data.type,
            text: data.text,
            is_anonymous: data.isAnonymous,
            identification: data.identification,
            status: 'Pendente'
        };
        const { data: inserted, error } = await supabase.from('ombudsman').insert(newOmbudsman).select().single();
        if (error) {
            toast.error('Erro ao enviar ouvidoria');
            return;
        }
        if (inserted) {
            setOmbudsman(prev => [{ ...inserted, isAnonymous: inserted.is_anonymous, createdAt: inserted.created_at } as Ombudsman, ...prev]);
            toast.success('Enviado com sucesso!');
        }
    };

    const updateOmbudsmanStatus = async (id: string, status: 'Pendente' | 'Atendido', response?: string) => {
        const updateData: any = { status };
        if (response !== undefined) {
            updateData.response = response;
        }
        const { error } = await supabase.from('ombudsman').update(updateData).eq('id', id);
        if (error) {
            toast.error('Erro ao atualizar status');
            return;
        }
        setOmbudsman(prev => prev.map(item => item.id === id ? { ...item, status, ...(response !== undefined ? { response } : {}) } : item));
    };

    const removeOmbudsman = async (id: string) => {
        const { error } = await supabase.from('ombudsman').delete().eq('id', id);
        if (error) {
            toast.error('Erro ao remover item');
            return;
        }
        setOmbudsman(prev => prev.filter(item => item.id !== id));
    };

    const updateSiteConfig = async (config: SiteConfig) => {
        // Assuming single config row
        // Better:
        const { data: current } = await supabase.from('site_config').select('id').limit(1).single();
        if (current) {
            await supabase.from('site_config').update({ config }).eq('id', current.id);
            setSiteConfig(config);
            toast.success('Configurações salvas!');
        }
    };

    const addMember = async (data: Omit<Member, 'id'>) => {
        const { data: inserted, error } = await supabase.from('members').insert(data).select().single();
        if (error) {
            toast.error('Erro ao adicionar membro');
            return;
        }
        if (inserted) {
            setMembers(prev => [...prev, { ...inserted, photoUrl: inserted.photo_url }].sort((a, b) => a.name.localeCompare(b.name)));
            toast.success('Membro adicionado!');
        }
    };

    const updateMember = async (id: string, data: Partial<Member>) => {
        const updateData: any = { ...data };
        if ('photoUrl' in data) {
            updateData.photo_url = data.photoUrl || null;
            delete updateData.photoUrl;
        }

        const { error } = await supabase.from('members').update(updateData).eq('id', id);

        if (error) {
            console.error('Update member error:', error);
            toast.error('Erro ao atualizar perfil.');
            return;
        }

        setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
        toast.success('Perfil atualizado com sucesso!');

        if (currentUser && data.name) {
            const member = members.find(m => m.id === id);
            if (member && member.name === currentUser) {
                setCurrentUser(data.name);
                localStorage.setItem('pet_user', data.name);
            }
        }
    };


    const removeMember = async (id: string) => {
        const { error } = await supabase.from('members').delete().eq('id', id);
        if (error) {
            toast.error('Erro ao remover membro');
            return;
        }
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    const addEvent = async (event: CalendarEvent) => {
        if (!canManageCalendar) {
            toast.error('Apenas administradores podem criar eventos');
            return;
        }
        const { id, start, end, reminderSchedule, remindersSent, reminderDaysBefore, reminderSent, templateId, description, link, area, responsibles, submissionDeadline, ...eventData } = event;
        
        // REVERT to storing all rich data as JSON in the `date` column, 
        // because the events table might NOT have separate columns for description/link/responsibles.
        const richData = JSON.stringify({ 
            start: start.toISOString(), 
            end: end?.toISOString(), 
            reminderSchedule,
            remindersSent,
            reminderDaysBefore, 
            reminderSent, 
            templateId,
            description,
            link,
            area,
            responsibles,
            submissionDeadline
        });
        
        const dbEvent = { ...eventData, date: richData };

        const { data: inserted, error } = await supabase.from('events').insert(dbEvent).select().single();
        if (error) {
            console.error('Error adding event:', error);
            toast.error(`Erro do banco: ${error.message}`);
            return;
        }
        if (inserted) {
            // Update state with the proper event object including start/end Dates
            const createdEvent = { ...event, id: inserted.id };
            setEvents(prev => [...prev, createdEvent]);

            // Notificação Imediata
            const recipients = getRecipients(createdEvent);
            if (recipients.length > 0) {
                console.log(`[Lembrete] Enviando notificação imediata de novo evento para ${recipients.length} pessoas.`);
                sendReminderEmail(createdEvent, -1, recipients).catch(err => {
                    console.error("Erro ao enviar e-mail de novo evento:", err);
                });
            }
        }
    };

    const updateEvent = async (id: string, event: Partial<CalendarEvent>) => {
        if (!canManageCalendar) {
            toast.error('Apenas administradores podem editar eventos');
            return;
        }
        // Find existing to merge rich data
        const existing = events.find(e => e.id === id);
        if (!existing) return;

        const updated = { ...existing, ...event };
        const { id: _, start, end, reminderSchedule, remindersSent, reminderDaysBefore, reminderSent, templateId, description, link, area, responsibles, submissionDeadline, ...eventData } = updated;
        const richData = JSON.stringify({
            start: start.toISOString(),
            end: end?.toISOString(),
            reminderSchedule,
            remindersSent,
            reminderDaysBefore,
            reminderSent,
            templateId,
            description,
            link,
            area,
            responsibles,
            submissionDeadline
        });

        const dbEvent = { ...eventData, date: richData };
        const { error } = await supabase.from('events').update(dbEvent).eq('id', id);
        if (!error) {
            setEvents(prev => prev.map(e => e.id === id ? updated : e));
        }
    };

    const removeEvent = async (id: string) => {
        if (!canManageCalendar) {
            toast.error('Apenas administradores podem remover eventos');
            return;
        }
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (!error) {
            setEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    // Inventory & Loans (Complex)

    const updateSector = async (id: string, data: Partial<Sector>) => {
        const { error } = await supabase.from('sectors').update(data).eq('id', id);
        if (!error) {
            setSectors(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
        }
    };

    const updateSectorItems = async (id: string, items: InventoryItem[]) => {
        // sync items for sector
        try {
            // 1. Get current items from DB for this sector
            const { data: currentItems } = await supabase.from('inventory_items').select('id').eq('sector_id', id);
            const currentIds = currentItems?.map(i => i.id) || [];

            const newIds = items.map(i => i.id).filter(Boolean);

            // 2. Delete items that are no longer in the list (if ID was in DB but not in new list)
            // Note: If frontend sends new items with temp IDs, we need to distinguish.
            // Usually frontend keeps UUIDs. If it's a new item added in UI, does it have a UUID? 
            // The `InventoryItem` interface suggests it always has an ID.

            const toDelete = currentIds.filter(cid => !newIds.includes(cid));
            if (toDelete.length > 0) {
                await supabase.from('inventory_items').delete().in('id', toDelete);
            }

            // 3. Upsert items
            const upsertData = items.map(i => ({
                id: i.id.length < 30 ? undefined : i.id,
                sector_id: id,
                name: i.name,
                code: i.code,
                quantity: i.quantity,
                status: i.status
            }));

            const { data: newItems, error } = await supabase.from('inventory_items').upsert(upsertData).select();

            if (error) throw error;

            // Refresh local state for this sector
            setSectors(prev => prev.map(s => {
                if (s.id === id && newItems) {
                    return {
                        ...s,
                        items: newItems.map((i: any) => ({
                            id: i.id,
                            name: i.name,
                            code: i.code,
                            quantity: i.quantity,
                            status: i.status
                        }))
                    };
                }
                return s;
            }));
            toast.success('Inventário atualizado');

        } catch (e) {
            console.error(e);
            toast.error('Erro ao atualizar itens');
        }
    };

    const reorderSectors = async (reorderedSectors: Sector[]) => {
        try {
            // Update display_order for each sector in the database
            const updates = reorderedSectors.map((sector, index) =>
                supabase.from('sectors')
                    .update({ display_order: index })
                    .eq('id', sector.id)
            );

            await Promise.all(updates);

            // Update local state
            setSectors(reorderedSectors.map((s, idx) => ({ ...s, displayOrder: idx })));
            toast.success('Ordem dos setores atualizada!');
        } catch (error) {
            console.error('Error reordering sectors:', error);
            toast.error('Erro ao reordenar setores');
        }
    };

    const addLoan = async (itemId: string, type: 'Empréstimo' | 'Uso Contínuo' | 'Empréstimo Temporário', quantity: number, returnDate?: string, photoUrl?: string): Promise<boolean> => {
        if (!currentUser) {
            toast.error('Você precisa estar logado.');
            return false;
        }

        // 1. Fetch Item to check qty
        const { data: item } = await supabase.from('inventory_items').select('*').eq('id', itemId).single();

        if (!item || item.quantity < quantity) {
            toast.error('Quantidade indisponível');
            return false;
        }

        const newQuantity = item.quantity - quantity;
        let newStatus = item.status;
        if (newQuantity === 0) {
            newStatus = (type === 'Empréstimo' || type === 'Empréstimo Temporário') ? 'Emprestado' : 'Indisponível';
        }

        // 2. Update item
        const { error: updateError } = await supabase.from('inventory_items').update({
            quantity: newQuantity,
            status: newStatus
        }).eq('id', itemId);

        if (updateError) {
            toast.error('Erro ao atualizar estoque');
            return false;
        }

        // 3. Create Loan
        let dbType = type;
        const newLoan = {
            item_id: itemId,
            item_name: item.name,
            user_id: currentUser, // Using name
            user_name: currentUser,
            type: dbType,
            quantity,
            expected_return_date: returnDate,
            date: new Date().toISOString(), // explicitly supply the date
            status: type === 'Uso Contínuo' ? 'Devolvido' : 'Ativo', // Automatically mark as Devolvido so it doesn't need a return
            withdrawal_photo_url: photoUrl
        };

        let { data: loan, error: loanError } = await supabase.from('loans').insert(newLoan).select().single();

        // Workaround for Check Constraint on DB: fallback to 'Empréstimo'
        if (loanError && type === 'Empréstimo Temporário') {
            console.warn('Fallback: DB constraint may prevent Empréstimo Temporário insert, using Empréstimo instead.', loanError);
            dbType = 'Empréstimo';
            newLoan.type = dbType;
            const retryRes = await supabase.from('loans').insert(newLoan).select().single();
            loan = retryRes.data;
            loanError = retryRes.error;
        }

        if (loanError) {
            console.error('Error creating loan:', loanError);

            // Critical fix: Rollback inventory change to prevent state drift
            const rollbackQuantity = item.quantity;
            await supabase.from('inventory_items').update({
                quantity: rollbackQuantity,
                status: item.status
            }).eq('id', itemId);

            toast.error('Erro ao registrar empréstimo, as alterações de estoque foram desfeitas.');
            return false;
        } else {
            setLoans(prev => [{
                ...loan,
                itemId: loan.item_id,
                userId: loan.user_id,
                userName: loan.user_name,
                itemName: loan.item_name,
                expectedReturnDate: loan.expected_return_date,
                withdrawalPhotoUrl: loan.withdrawal_photo_url,
                type: type // show the correct type in the UI locally
            } as Loan, ...prev]);

            // Update local sector state
            setSectors(prev => prev.map(s => {
                const itemIdx = s.items.findIndex(i => i.id === itemId);
                if (itemIdx > -1) {
                    const newItems = [...s.items];
                    newItems[itemIdx] = { ...newItems[itemIdx], quantity: newQuantity, status: newStatus };
                    return { ...s, items: newItems };
                }
                return s;
            }));
            toast.success('Empréstimo realizado!');
            return true;
        }
    };

    const returnLoan = async (loanId: string, returnPhotoUrl: string): Promise<boolean> => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan || loan.status === 'Devolvido') return false;

        // 1. Update Loan to Pending Approval
        const { error: loanError } = await supabase.from('loans').update({
            status: 'Aguardando Aprovação',
            return_photo_url: returnPhotoUrl,
            return_condition: null // Will be set by admin
        }).eq('id', loanId);

        if (loanError) {
            toast.error('Erro ao solicitar devolução');
            return false;
        }

        setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: 'Aguardando Aprovação', returnPhotoUrl } : l));
        toast.success('Devolução solicitada! Aguarde a aprovação do admin.');
        return true;
    };

    const approveLoanReturn = async (loanId: string, condition: 'ok' | 'damaged' | 'dirty', notes?: string): Promise<boolean> => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan || loan.status !== 'Aguardando Aprovação') return false;

        const actualReturnDate = new Date().toISOString();
        const combinedNotes = `[RETURN_DATE:${actualReturnDate}] ` + (notes || '');

        // 1. Finalize Loan
        const { error: loanError } = await supabase.from('loans').update({
            status: 'Devolvido',
            return_condition: condition,
            admin_notes: combinedNotes
        }).eq('id', loanId);

        if (loanError) {
            toast.error('Erro ao aprovar devolução');
            return false;
        }

        setLoans(prev => prev.map(l => l.id === loanId ? {
            ...l,
            status: 'Devolvido',
            returnCondition: condition,
            adminNotes: notes,
            actualReturnDate
        } : l));

        // 2. Return Item to Stock
        if (loan.itemId) {
            const { data: item } = await supabase.from('inventory_items').select('*').eq('id', loan.itemId).single();
            if (item) {
                const newQty = item.quantity + (loan.quantity || 1);
                const updatedItem = {
                    quantity: newQty,
                    status: 'Disponível'
                };
                await supabase.from('inventory_items').update(updatedItem).eq('id', loan.itemId);

                setSectors(prev => prev.map(s => {
                    const itemIdx = s.items.findIndex(i => i.id === loan.itemId);
                    if (itemIdx > -1) {
                        const newItems = [...s.items];
                        newItems[itemIdx] = { ...newItems[itemIdx], quantity: newQty, status: 'Disponível' };
                        return { ...s, items: newItems };
                    }
                    return s;
                }));
            }
        }
        toast.success('Devolução aprovada!');
        return true;
    };

    // --- Photo Actions ---
    const addPhoto = async (url: string, description: string, file?: File) => {
        if (!currentUser) return;

        let finalUrl = url;

        if (file) {
            const toastId = toast.loading('Enviando foto...');
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('photos')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
                finalUrl = data.publicUrl;
                toast.dismiss(toastId);
            } catch (error: any) {
                console.error('Error uploading file:', error);
                toast.error(`Erro: ${error.message || 'Falha no upload'}`);
                toast.dismiss(toastId);
                return;
            }
        }

        const rotation = Math.floor(Math.random() * 6) - 3; // -3 to 3 degrees
        const newPhoto = {
            url: finalUrl,
            description,
            author: currentUser,
            rotation
        };

        try {
            const { data, error } = await supabase.from('photos').insert([newPhoto]).select();

            if (error) throw error;

            if (data) {
                const createdPhoto: Photo = {
                    id: data[0].id,
                    url: data[0].url,
                    description: data[0].description,
                    author: data[0].author,
                    createdAt: data[0].created_at,
                    rotation: data[0].rotation
                };
                setPhotos(prev => [createdPhoto, ...prev]);
                toast.success('Foto adicionada ao mural!');
            }
        } catch (error) {
            console.error('Error adding photo:', error);
            toast.error('Erro ao adicionar foto.');
        }
    };

    const removePhoto = async (id: string) => {
        try {
            const { error } = await supabase.from('photos').delete().match({ id });
            if (error) throw error;
            setPhotos(prev => prev.filter(p => p.id !== id));
            toast.success('Foto removida.');
        } catch (error) {
            console.error('Error removing photo:', error);
            toast.error('Erro ao remover foto.');
        }
    };

    // --- Notice Actions ---
    const addNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
        const newNotice = {
            title: notice.title,
            content: notice.content,
            type: notice.type,
            author: notice.author
        };

        const { data: inserted, error } = await supabase.from('notices').insert(newNotice).select().single();

        if (error) {
            console.error('Error adding notice:', error);
            toast.error('Erro ao postar aviso');
            return;
        }

        if (inserted) {
            const createdNotice: Notice = {
                id: inserted.id,
                title: inserted.title,
                content: inserted.content,
                type: inserted.type,
                createdAt: inserted.created_at,
                author: inserted.author
            };
            setNotices(prev => [createdNotice, ...prev]);
            toast.success('Aviso postado!');

            // TODO: EmailJS Integration here
            // sendEmailNotification(createdNotice); 
        }
    };

    const removeNotice = async (id: string) => {
        const { error } = await supabase.from('notices').delete().eq('id', id);
        if (error) {
            toast.error('Erro ao remover aviso');
            return;
        }
        setNotices(prev => prev.filter(n => n.id !== id));
        toast.success('Aviso removido');
    };

    // --- Knowledge Base Actions ---
    const addDocument = async (doc: Omit<DocumentDTO, 'id' | 'createdAt'>, file?: File) => {
        let finalUrl = doc.url;

        if (file) {
            const toastId = toast.loading('Enviando arquivo...');
            try {
                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                finalUrl = publicUrl;
                toast.dismiss(toastId);
            } catch (error) {
                console.error('Upload Error:', error);
                toast.dismiss(toastId);
                toast.error('Erro ao fazer upload do arquivo');
                return;
            }
        }

        const docToSave = { ...doc, url: finalUrl };

        const { data: inserted, error } = await supabase.from('documents').insert(docToSave).select().single();
        if (error) {
            toast.error('Erro ao adicionar documento');
            return;
        }
        if (inserted) {
            setDocuments(prev => [{ ...inserted, createdAt: inserted.created_at } as DocumentDTO, ...prev]);
            toast.success('Documento adicionado!');
        }
    };

    const removeDocument = async (id: string) => {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) {
            toast.error('Erro ao remover documento');
            return;
        }
        setDocuments(prev => prev.filter(d => d.id !== id));
        toast.success('Documento removido');
    };

    const loginUser = async (email: string, password?: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: password || '',
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const logoutUser = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUserRole(null);
    };



    const contextValue = React.useMemo(() => ({
        tickets,
        addTicket,
        updateTicket,
        removeTicket,
        feedbacks,
        addFeedback,
        removeFeedback,
        evaluations,
        addEvaluation,
        removeEvaluation,
        ombudsman,
        addOmbudsman,
        siteConfig,
        loadingConfig,
        updateSiteConfig,
        isAdmin,
        userRole,
        currentUser,
        loginUser,
        logoutUser,
        members,
        addMember,
        removeMember,
        events,
        addEvent,
        updateEvent,
        removeEvent,
        updateOmbudsmanStatus,
        removeOmbudsman,
        updateMember,
        sectors,
        updateSector,
        updateSectorItems,
        reorderSectors,
        loans,
        addLoan,
        returnLoan,
        approveLoanReturn,
        fetchInventoryData,
        loadingSectors,
        documents,
        addDocument,
        removeDocument,
        fetchDocumentsData,
        loadingDocuments,
        canManageCalendar,
        photos,
        addPhoto,
        removePhoto,
        notices,
        addNotice,
        removeNotice,
        isAuthLoading
    }), [
        tickets, feedbacks, evaluations, ombudsman, siteConfig, loadingConfig, isAdmin, userRole, currentUser,
        members, events, sectors, loans, documents, canManageCalendar, photos, notices, isAuthLoading
    ]);

    return (
        <StorageContext.Provider value={contextValue}>
            {children}
        </StorageContext.Provider>
    );
}

export function useStorage() {
    const context = useContext(StorageContext);
    if (context === undefined) {
        throw new Error('useStorage must be used within a StorageProvider');
    }
    return context;
}
