import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';
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
    isAdmin: boolean;
    canManageCalendar: boolean;
    userRole: 'member' | 'admin_master' | 'admin_infra' | 'admin_gp' | 'admin_secretaria' | 'admin_divulgacao' | 'admin_pesquisa' | null;
    loginUser: (identifier: string, password?: string | boolean, isAdmin?: boolean) => boolean;
    logoutUser: () => void;
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
    reminderDaysBefore?: number;
    reminderSent?: boolean;
    description?: string;
    link?: string;
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

    // Auth State (Local Persistence for Session)
    const [currentUser, setCurrentUser] = useState<string | null>(() => {
        return localStorage.getItem('pet-current-user');
    });

    const [userRole, setUserRole] = useState<'member' | 'admin_master' | 'admin_infra' | 'admin_gp' | 'admin_secretaria' | 'admin_divulgacao' | 'admin_pesquisa' | null>(() => {
        return localStorage.getItem('pet-user-role') as any || null;
    });

    // Fix: Allow all admins to log in via AdminLogin
    const isAdmin = ['admin_master', 'admin_infra', 'admin_gp', 'admin_secretaria', 'admin_divulgacao', 'admin_pesquisa'].includes(userRole || '');
    const canManageCalendar = isAdmin || ['admin_secretaria', 'admin_divulgacao', 'admin_pesquisa'].includes(userRole || '');

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            // Initiate all requests in parallel
            const [
                ticketsRes,
                feedbacksRes,
                evaluationsRes,
                ombudsmanRes,
                membersRes,
                eventsRes,
                sectorsRes,
                loansRes,
                siteConfigRes,
                documentsRes,
                photosRes,
                noticesRes
            ] = await Promise.all([
                supabase.from('tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('feedbacks').select('*').order('created_at', { ascending: false }),
                supabase.from('evaluations').select('*').order('created_at', { ascending: false }),
                supabase.from('ombudsman').select('*').order('created_at', { ascending: false }),
                supabase.from('members').select('*').order('name'),
                supabase.from('events').select('*'),
                supabase.from('sectors').select('*, items:inventory_items(*)').order('display_order'),
                supabase.from('loans').select('*').order('date', { ascending: false }),
                supabase.from('site_config').select('*').limit(1).single(),
                supabase.from('documents').select('*').order('created_at', { ascending: false }),
                supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(30), // Limit to 30 recent photos
                supabase.from('notices').select('*').order('created_at', { ascending: false })
            ]);

            // Process Tickets
            if (ticketsRes.data) setTickets(ticketsRes.data.map(t => ({ ...t, createdAt: t.created_at })));

            // Process Feedbacks
            if (feedbacksRes.data) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const validFeedbacks = feedbacksRes.data.filter(f => new Date(f.created_at) > thirtyDaysAgo);

                // Cleanup old feedbacks silently
                const expiredIds = feedbacksRes.data.filter(f => new Date(f.created_at) <= thirtyDaysAgo).map(f => f.id);
                if (expiredIds.length > 0) {
                    supabase.from('feedbacks').delete().in('id', expiredIds).then(() => console.log('Cleaned up old kudos'));
                }
                setFeedbacks(validFeedbacks.map(f => ({ ...f, createdAt: f.created_at })));
            }

            // Process Evaluations
            if (evaluationsRes.data) setEvaluations(evaluationsRes.data.map(e => ({ ...e, createdAt: e.created_at })));

            // Process Ombudsman
            if (ombudsmanRes.data) setOmbudsman(ombudsmanRes.data.map(o => ({ ...o, isAnonymous: o.is_anonymous, createdAt: o.created_at })));

            // Process Members & Seed Admins
            if (membersRes.data) {
                const loadedMembers = membersRes.data.map(m => ({ ...m, photoUrl: m.photo_url }));
                setMembers(loadedMembers);

                const defaultAdmins = [
                    { name: 'Administrador Geral', email: 'admin@pet.com', password: 'admin123', role: 'admin_master' },
                    { name: 'Administrador Infra', email: 'infra@pet.com', password: 'infra123', role: 'admin_infra' },
                    { name: 'Administrador GP', email: 'gp@pet.com', password: 'gp123', role: 'admin_gp' },
                    { name: 'Administrador Secretaria', email: 'secretaria@pet.com', password: 'secretaria123', role: 'admin_secretaria' },
                    { name: 'Administrador Divulgação', email: 'divulgacao@pet.com', password: 'divulgacao123', role: 'admin_divulgacao' },
                    { name: 'Administrador Pesquisa', email: 'pesquisa@pet.com', password: 'pesquisa123', role: 'admin_pesquisa' }
                ];

                // Check and seed defaults asynchronously
                (async () => {
                    for (const admin of defaultAdmins) {
                        const exists = loadedMembers.some(m => m.role === admin.role);
                        if (!exists) {
                            console.log(`Seeding default admin: ${admin.role}`);
                            await supabase.from('members').insert({
                                name: admin.name,
                                email: admin.email,
                                password: admin.password,
                                role: admin.role,
                                photo_url: null
                            });
                        }
                    }
                })();
            }

            // Process Events
            if (eventsRes.data) {
                const parsedEvents = eventsRes.data.map(e => {
                    try {
                        if (e.date && e.date.startsWith('{')) {
                            const richData = JSON.parse(e.date);
                            return {
                                ...e,
                                start: new Date(richData.start),
                                end: richData.end ? new Date(richData.end) : undefined,
                                reminderDaysBefore: richData.reminderDaysBefore,
                                reminderSent: richData.reminderSent,
                                description: richData.description,
                                link: richData.link
                            };
                        }
                    } catch {}
                    
                    // Fallback for legacy DD/MM/YYYY dates
                    if (typeof e.date === 'string') {
                        const parts = e.date.split('/');
                        if (parts.length >= 2) {
                            const day = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1;
                            const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
                            return {
                                ...e,
                                start: new Date(year, month, day, 9, 0), // 9 AM default
                            };
                        }
                    }
                    return { ...e, start: new Date() };
                });
                setEvents(parsedEvents);
            }

            // Process Sectors
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

            // Process Loans
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

            // Process Site Config
            if (siteConfigRes.data) {
                setSiteConfig(siteConfigRes.data.config);
            } else {
                await supabase.from('site_config').insert({ config: DEFAULT_SITE_CONFIG });
            }

            // Process Documents
            if (documentsRes.data) setDocuments(documentsRes.data.map(d => ({ ...d, createdAt: d.created_at })));

            // Process Photos
            if (photosRes.data) {
                setPhotos(photosRes.data.map(p => ({
                    id: p.id,
                    url: p.url,
                    description: p.description,
                    author: p.author,
                    createdAt: p.created_at,
                    rotation: p.rotation
                })));
            }

            // Process Notices
            if (noticesRes.data) {
                setNotices(noticesRes.data.map(n => ({
                    id: n.id,
                    title: n.title,
                    content: n.content,
                    type: n.type,
                    createdAt: n.created_at,
                    author: n.author
                })));
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Erro ao carregar dados do banco de dados.");
        } finally {
            setLoadingConfig(false);
        }
    };

    const fetchInventoryData = async () => {
        try {
            const [sectorsRes, loansRes] = await Promise.all([
                supabase.from('sectors').select('*, items:inventory_items(*)').order('display_order'),
                supabase.from('loans').select('*').order('date', { ascending: false })
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
        }
    };

    useEffect(() => {
        fetchData();

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

    // Email Reminder Routine
    useEffect(() => {
        const checkReminders = async () => {
            if (!isAdmin || events.length === 0 || members.length === 0) return;

            const today = new Date();
            let eventsUpdated = false;

            for (const event of events) {
                if (event.reminderDaysBefore && !event.reminderSent && event.start) {
                    const daysLeft = differenceInDays(event.start, today);
                    if (daysLeft <= event.reminderDaysBefore && daysLeft >= 0) {
                        try {
                            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
                            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
                            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

                            if (serviceId && templateId && publicKey) {
                                // Find emails of responsibles or default to all active members
                                let recipients: string[] = [];
                                if (event.responsibles && event.responsibles.length > 0) {
                                    recipients = members.filter(m => event.responsibles?.includes(m.name)).map(m => m.email).filter(Boolean);
                                } else {
                                    recipients = members.map(m => m.email).filter(Boolean);
                                }

                                if (recipients.length === 0) continue;

                                const adminEmail = recipients[0];
                                const bccList = recipients.join(',');

                                await emailjs.send(serviceId, templateId, {
                                    to_name: "Participante",
                                    to_email: adminEmail,
                                    bcc: bccList,
                                    title: `Lembrete: ${event.title}`,
                                    message: `Faltam ${daysLeft} dia(s) para o evento: ${event.description || ''}`,
                                    type: event.type,
                                    from_name: "Sistema PET (Automático)"
                                }, publicKey);

                                // Mark as sent in Database via the new updateEvent
                                await updateEvent(event.id, { reminderSent: true });
                                eventsUpdated = true;
                                console.log(`[Lembrete] E-mail enviado para o evento: ${event.title}`);
                            }
                        } catch (err) {
                            console.error('[Lembrete] Falha ao enviar lembrete:', err);
                        }
                    }
                }
            }
        };

        // Delay checking slightly to ensure DB is fully loaded
        const timeout = setTimeout(() => {
            checkReminders();
        }, 5000);

        return () => clearTimeout(timeout);
    }, [events, isAdmin, members]);

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
        const { id, start, end, reminderDaysBefore, reminderSent, description, link, ...eventData } = event;
        const richData = JSON.stringify({ 
            start: start.toISOString(), 
            end: end?.toISOString(), 
            reminderDaysBefore, 
            reminderSent, 
            description,
            link
        });
        
        const dbEvent = { ...eventData, date: richData };

        const { data: inserted, error } = await supabase.from('events').insert(dbEvent).select().single();
        if (error) {
            toast.error('Erro ao adicionar evento');
            return;
        }
        if (inserted) {
            setEvents(prev => [...prev, { ...event, id: inserted.id }]);
        }
    };

    const updateEvent = async (id: string, event: Partial<CalendarEvent>) => {
        // Find existing to merge rich data
        const existing = events.find(e => e.id === id);
        if (!existing) return;

        const updated = { ...existing, ...event };
        const { id: _, start, end, reminderDaysBefore, reminderSent, description, link, ...eventData } = updated;
        const richData = JSON.stringify({ 
            start: start.toISOString(), 
            end: end?.toISOString(), 
            reminderDaysBefore, 
            reminderSent, 
            description,
            link
        });

        const dbEvent = { ...eventData, date: richData };
        const { error } = await supabase.from('events').update(dbEvent).eq('id', id);
        if (!error) {
            setEvents(prev => prev.map(e => e.id === id ? updated : e));
        }
    };

    const removeEvent = async (id: string) => {
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

    const loginUser = (identifier: string, passwordOrIsAdmin?: string | boolean, isAdminAttempt: boolean = false) => {
        // Sync Login using loaded members
        if (typeof passwordOrIsAdmin === 'boolean') {
            isAdminAttempt = passwordOrIsAdmin;
        }
        const password = typeof passwordOrIsAdmin === 'string' ? passwordOrIsAdmin : '';

        // Unified Login Logic: check members list (which now includes admins)
        // We match by Name OR Email (identifier) AND Password
        // AND if isAdminAttempt is true, we verify the user has an admin role.

        const user = members.find(m => (m.name === identifier || m.email === identifier) && m.password === password);

        if (user) {
            if (isAdminAttempt) {
                // Must have admin role
                const adminRoles = ['admin_master', 'admin_infra', 'admin_gp', 'admin_secretaria', 'admin_divulgacao', 'admin_pesquisa'];
                if (adminRoles.includes(user.role)) {
                    setCurrentUser(user.name);
                    setUserRole(user.role as any);
                    return true;
                } else {
                    return false; // Valid credentials but not an admin
                }
            } else {
                // Member login (can be any role, but usually 'member')
                setCurrentUser(user.name);
                setUserRole(user.role as any);
                return true;
            }
        }

        return false;
    };

    const logoutUser = () => {
        setCurrentUser(null);
        setUserRole(null);
    };



    return (
        <StorageContext.Provider
            value={{
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
                documents,
                addDocument,
                removeDocument,
                canManageCalendar,
                photos,
                addPhoto,
                removePhoto,
                notices,
                addNotice,
                removeNotice
            }}
        >
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
