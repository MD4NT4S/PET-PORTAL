import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, Table as TableIcon, LayoutTemplate, LogOut, Users, Trash2, Plus, Pencil, Check, X, Box, Package, ShieldAlert, Megaphone } from 'lucide-react';

import { toast } from 'sonner';
import AdminLogin from '../components/admin/AdminLogin';
import SiteEditor from '../components/admin/SiteEditor';
import { Modal } from '../components/ui/Modal';
import type { Member, Sector, InventoryItem, Evaluation } from '../context/StorageContext';
import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';

export default function Admin() {
    const { tickets, evaluations, ombudsman, isAdmin, logoutUser, members, addMember, removeMember, updateMember, updateOmbudsmanStatus, removeOmbudsman, sectors, updateSector, updateSectorItems, loans, updateTicket, userRole, removeEvaluation, approveLoanReturn, notices, addNotice, removeNotice, currentUser } = useStorage();


    // Define tabs and permissions
    const allTabs = [
        { id: 'ouvidoria', label: 'Ouvidoria', roles: ['admin_master', 'admin_gp'] },
        { id: 'avaliacoes', label: 'Autoavaliações', roles: ['admin_master', 'admin_gp'] },
        { id: 'tickets', label: 'Tickets', roles: ['admin_master', 'admin_gp', 'admin_infra'] },
        { id: 'membros', label: 'Membros', icon: Users, roles: ['admin_master', 'admin_gp'] },
        { id: 'infraestrutura', label: 'Infraestrutura', icon: Box, roles: ['admin_master', 'admin_infra'] },
        { id: 'cms', label: 'Gerenciar Site', icon: LayoutTemplate, roles: ['admin_master', 'admin_gp'] },
        { id: 'avisos', label: 'Avisos', icon: Megaphone, roles: ['admin_master', 'admin_gp', 'admin_secretaria', 'admin_divulgacao'] }
    ];

    const availableTabs = allTabs.filter(tab => tab.roles.includes(userRole || ''));

    // Initialize activeTab safely
    const [activeTab, setActiveTab] = useState<string>(availableTabs.length > 0 ? availableTabs[0].id : 'ouvidoria');

    React.useEffect(() => {
        if (availableTabs.length > 0) {
            const isCurrentTabValid = availableTabs.find(tab => tab.id === activeTab);
            if (!isCurrentTabValid) {
                setActiveTab(availableTabs[0].id);
            }
        }
    }, [userRole, availableTabs]);

    // Member State
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');

    // Admin Management State
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminRole, setNewAdminRole] = useState<'admin_master' | 'admin_infra' | 'admin_gp' | 'admin_secretaria' | 'admin_divulgacao'>('admin_master');

    // Edit Member State
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');

    // Infrastructure State
    const [editingSector, setEditingSector] = useState<Sector | null>(null);
    const [sectorName, setSectorName] = useState('');
    const [sectorCategory, setSectorCategory] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemCode, setNewItemCode] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
    const [newItemStatus, setNewItemStatus] = useState<'Disponível' | 'Em Uso' | 'Emprestado' | 'Indisponível'>('Disponível');

    // Notice State
    const [newNoticeTitle, setNewNoticeTitle] = useState('');
    const [newNoticeContent, setNewNoticeContent] = useState('');
    const [newNoticeType, setNewNoticeType] = useState<'info' | 'alert' | 'event'>('info');

    // Evaluation Viewer State
    const [evalViewMode, setEvalViewMode] = useState<'members' | 'months' | 'detail'>('members');
    const [selectedMemberEval, setSelectedMemberEval] = useState<Member | null>(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

    // Filter tickets based on role
    const filteredTickets = tickets.filter(ticket => {
        if (userRole === 'admin_infra') {
            return ticket.category === 'Infraestrutura' || ticket.category === 'Material';
        }
        return true;
    });

    if (!isAdmin) {
        return <AdminLogin />;
    }

    const handleExport = () => {
        if (activeTab === 'cms' || activeTab === 'membros' || activeTab === 'infraestrutura') return;

        let headers: string[] = [];
        let rows: string[][] = [];

        if (activeTab === 'avaliacoes') {
            headers = [
                'Data', 'Membro', 'Presença', 'Esforço', 'Humor', 'Sentimento', 'Melhoria',
                'Sat. Grupo', 'Sat. Tutor', 'Sat. Coord', 'Sat. Peers', 'Sat. Equilíbrio',
                'Dedicação Semanal', 'Cumprimento Metas', 'Produção Acadêmica', 'Desempenho Setor', 'Cuidado Sala', 'Destaque Positivo'
            ];
            rows = evaluations.map(e => [
                new Date(e.createdAt).toLocaleDateString(),
                e.author,
                e.presence.toString(),
                e.effort.toString(),
                e.mood.toString(),
                `"${e.feeling?.replace(/"/g, '""') || ''}"`,
                `"${e.improvement?.replace(/"/g, '""') || ''}"`,
                e.criteria?.satisfactionGroup?.toString() || '',
                e.criteria?.satisfactionTutor?.toString() || '',
                e.criteria?.satisfactionCoordination?.toString() || '',
                // Calculate Average Peer Satisfaction
                e.criteria?.peerEvaluations ? (Object.values(e.criteria.peerEvaluations).reduce((a: number, b: number) => a + b, 0) / Object.values(e.criteria.peerEvaluations).length).toFixed(1) : '',
                e.criteria?.satisfactionBalance?.toString() || '',
                `"${e.criteria?.weeklyDedication?.replace(/"/g, '""') || ''}"`,
                `"${e.criteria?.goalCompliance?.replace(/"/g, '""') || ''}"`,
                `"${e.criteria?.academicProduction?.replace(/"/g, '""') || ''}"`,
                `"${e.criteria?.sectorPerformance?.replace(/"/g, '""') || ''}"`,
                `"${e.criteria?.roomCare?.replace(/"/g, '""') || ''}"`,
                `"${e.criteria?.positiveHighlight?.replace(/"/g, '""') || ''}"`
            ]);
        } else if (activeTab === 'ouvidoria') {
            headers = ['Data', 'Tipo', 'Identificação', 'Status', 'Mensagem'];
            rows = ombudsman.map(o => [
                new Date(o.createdAt).toLocaleDateString(),
                o.type,
                o.isAnonymous ? 'Anônimo' : (o.identification || 'Não informado'),
                o.status || 'Pendente',
                `"${o.text.replace(/"/g, '""')}"`
            ]);
        } else if (activeTab === 'tickets') {
            headers = ['Data', 'Categoria', 'Urgência', 'Status', 'Solicitante', 'Descrição', 'Resposta'];
            rows = filteredTickets.map(t => [
                new Date(t.createdAt).toLocaleDateString(),
                t.category,
                t.urgency,
                t.status,
                t.author || 'Anônimo',
                `"${t.description.replace(/"/g, '""')}"`,
                `"${t.response?.replace(/"/g, '""') || ''}"`
            ]);
        }

        if (rows.length === 0) {
            toast.error('Não há dados para exportar.');
            return;
        }

        // Add BOM for Excel UTF-8 compatibility
        const BOM = "\uFEFF";
        const csvContent = "data:text/csv;charset=utf-8," + BOM
            + headers.join(";") + "\n"
            + rows.map(r => r.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Relatório exportado com sucesso!');
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()) {
            toast.error('Preencha todos os campos.');
            return;
        }

        addMember({
            name: newMemberName.trim(),
            email: newMemberEmail.trim(),
            password: newMemberPassword.trim(),
            role: 'member'
        });

        setNewMemberName('');
        setNewMemberEmail('');
        setNewMemberPassword('');
        toast.success('Membro adicionado com sucesso!');
    };

    const handleRemoveMember = (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja remover ${name}?`)) {
            removeMember(id);
            toast.success('Membro removido.');
        }
    }

    const handleAddAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
            toast.error('Preencha todos os campos.');
            return;
        }

        addMember({
            name: newAdminName.trim(),
            email: newAdminEmail.trim(),
            password: newAdminPassword.trim(),
            role: newAdminRole
        });

        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminRole('admin_master'); // Reset to default
        toast.success('Administrador adicionado com sucesso!');
    };

    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [ticketResponse, setTicketResponse] = useState('');
    const [ticketStatus, setTicketStatus] = useState<'Novo' | 'Em Atendimento' | 'Concluído'>('Novo');
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    const handleTicketClick = (ticket: any) => {
        setSelectedTicket(ticket);
        setTicketResponse(ticket.response || '');
        setTicketStatus(ticket.status === 'Aberto' ? 'Novo' : ticket.status === 'Resolvido' ? 'Concluído' : ticket.status as any);
        setIsTicketModalOpen(true);
    };

    const handleUpdateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;

        updateTicket(selectedTicket.id, {
            status: ticketStatus,
            response: ticketResponse
        });

        setIsTicketModalOpen(false);
        toast.success('Ticket atualizado!');
    };

    const openEditMember = (member: Member) => {
        setEditingMember(member);
        setEditName(member.name);
        setEditEmail(member.email);
        setEditPassword(member.password || '');
    };

    const handleUpdateMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) {
            updateMember(editingMember.id, {
                name: editName,
                email: editEmail,
                password: editPassword
            });
            setEditingMember(null);
            toast.success('Membro atualizado com sucesso!');
        }
    };

    const handleResolveOmbudsman = (id: string) => {
        updateOmbudsmanStatus(id, 'Atendido');
        toast.success('Solicitação marcada como atendida.');
    };

    const handleRemoveOmbudsman = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            removeOmbudsman(id);
            toast.success('Registro excluído.');
        }
    };

    // Infrastructure Handlers
    const openEditSector = (sector: Sector) => {
        setEditingSector(sector);
        setSectorName(sector.name);
        setSectorCategory(sector.category);
        setNewItemName('');
        setNewItemCode('');
        setNewItemQuantity(1);
        setNewItemStatus('Disponível');
    };

    const handleUpdateSector = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSector) {
            updateSector(editingSector.id, {
                name: sectorName,
                category: sectorCategory
            });
            setEditingSector(null);
            toast.success('Setor atualizado!');
        }
    };





    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSector || !newItemName.trim()) return;

        const newItem: InventoryItem = {
            id: crypto.randomUUID(),
            name: newItemName.trim(),
            code: newItemCode.trim(),
            quantity: newItemQuantity,
            status: newItemStatus
        };

        const updatedItems = [...editingSector.items, newItem];
        updateSectorItems(editingSector.id, updatedItems);

        // Update local state to reflect change immediately in modal
        setEditingSector({ ...editingSector, items: updatedItems });
        setNewItemName('');
        setNewItemCode('');
        setNewItemQuantity(1);
        setNewItemStatus('Disponível');
    };

    const handleRemoveItem = (itemId: string) => {
        if (!editingSector) return;

        const updatedItems = editingSector.items.filter(item => item.id !== itemId);
        updateSectorItems(editingSector.id, updatedItems);

        // Update local state
        setEditingSector({ ...editingSector, items: updatedItems });
        setEditingSector({ ...editingSector, items: updatedItems });
    };



    const handleAddNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
            toast.error('Preencha título e conteúdo.');
            return;
        }

        const noticeData = {
            title: newNoticeTitle,
            content: newNoticeContent,
            type: newNoticeType,
            author: currentUser || 'Admin'
        };

        // 1. Save to Database
        addNotice(noticeData);

        // 2. Send Emails (Fire and Forget)
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
            toast.info('Iniciando envio de emails...');

            // Get all member emails
            const recipients = members.map(m => m.email).filter(Boolean);
            console.log('Sending emails to:', recipients);

            // Send one email per recipient (Personalized)
            // Note: Loops can hit rate limits on free tier.
            // For production with many members, consider BCC or a backend loop.
            // Here we limit to demonstrate or send to all if count is low.

            // Strategy: Send individually to show "To Name" if possible, or just send generic.
            // Let's try sending to each member.

            let sentCount = 0;

            for (const member of members) {
                if (!member.email) continue;

                try {
                    await emailjs.send(serviceId, templateId, {
                        to_name: member.name,
                        to_email: member.email, // Check if template uses this or just sends to "to_name" email?
                        // Actually EmailJS client SDK doesn't send to "to_email" directly unless it's in the packet and the template is mapped to it.
                        // But usually we just send the message.
                        // Wait, client-side emailjs.send() sends ONE email per call.
                        // We need to pass the recipient email in the template params if the template uses it as "To".
                        // BUT, usually EmailJS Service setting defines who receives it, UNLESS we override it or it's a "User Auto-Reply" type.
                        // Actually, for "Send to User", we usually map a variable like `user_email` to the "To" field in the EmailJS Template Settings.
                        // I will pass `to_email: member.email`.

                        title: newNoticeTitle,
                        message: newNoticeContent,
                        type: newNoticeType === 'info' ? 'Informativo' : newNoticeType === 'alert' ? 'Alerta' : 'Evento',
                        from_name: currentUser || 'Admin'
                    }, publicKey);
                    sentCount++;
                    console.log(`Email sent to ${member.email}`);
                } catch (err) {
                    console.error('Failed to send email to', member.email, err);
                    toast.error(`Falha ao enviar para ${member.email}`);
                }
            }

            if (sentCount > 0) {
                toast.success(`Emails enviados para ${sentCount} membros!`);
            } else {
                toast.warning('Nenhum email enviado. Verifique se há membros com email cadastrado.');
            }
        } else {
            console.error('EmailJS keys missing in .env:', { serviceId, templateId, publicKey });
            toast.error('Erro de Configuração: Chaves do EmailJS não encontradas. Verifique o .env e reinicie o servidor.');
        }

        setNewNoticeTitle('');
        setNewNoticeContent('');
        setNewNoticeType('info');
    };

    const handleRemoveNotice = (id: string) => {
        if (confirm('Tem certeza que deseja remover este aviso?')) {
            removeNotice(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">
                        Acesso restrito à gestão do grupo. <span className="font-semibold text-primary-600">({userRole === 'admin_master' ? 'Geral' : userRole === 'admin_infra' ? 'Infraestrutura' : userRole === 'admin_gp' ? 'Gestão de Pessoas' : userRole === 'admin_secretaria' ? 'Secretaria' : userRole === 'admin_divulgacao' ? 'Divulgação' : 'Admin'})</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab !== 'cms' && activeTab !== 'membros' && activeTab !== 'infraestrutura' && (
                        <Button onClick={handleExport} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    )}
                    <Button onClick={logoutUser} variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </div>

            <div className="flex space-x-2 border-b border-secondary-200 dark:border-secondary-800 pb-1 overflow-x-auto">
                {availableTabs.map((tab) => {
                    if (tab.id === 'admins' && userRole !== 'admin_master') return null;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
              ${activeTab === tab.id
                                    ? 'bg-white border-x border-t border-secondary-200 text-primary-600 dark:bg-secondary-900 dark:border-secondary-800 dark:text-primary-400'
                                    : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                                }`}
                        >
                            {tab.icon && <tab.icon className="h-4 w-4" />}
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {activeTab === 'membros' ? (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Adicionar Membro</CardTitle>
                            <CardDescription>Cadastre um novo integrante do PET.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddMember} className="space-y-3">
                                <Input
                                    placeholder="Nome Completo"
                                    value={newMemberName}
                                    onChange={e => setNewMemberName(e.target.value)}
                                />
                                <Input
                                    placeholder="Email"
                                    type="email"
                                    value={newMemberEmail}
                                    onChange={e => setNewMemberEmail(e.target.value)}
                                />
                                <Input
                                    placeholder="Senha Inicial"
                                    type="text"
                                    value={newMemberPassword}
                                    onChange={e => setNewMemberPassword(e.target.value)}
                                />
                                <Button type="submit" className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar Membro
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Membros Ativos ({members.length})</CardTitle>
                            <CardDescription>Lista de integrantes cadastrados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {members.filter(m => m.role === 'member').length === 0 ? (
                                    <p className="text-secondary-500 text-sm">Nenhum membro cadastrado.</p>
                                ) : (
                                    members.filter(m => m.role === 'member').map(member => (
                                        <div key={member.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-xs text-secondary-500">{member.email}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditMember(member)}
                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : activeTab === 'admins' ? (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gerenciar Administradores</CardTitle>
                            <CardDescription>Visualize e edite as credenciais dos administradores do sistema.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Add Admin Form */}
                            <div className="mb-6 p-4 bg-secondary-50 dark:bg-secondary-900/50 rounded-lg border border-secondary-200 dark:border-secondary-800">
                                <h3 className="font-medium mb-3">Adicionar Novo Administrador</h3>
                                <form onSubmit={handleAddAdmin} className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
                                    <Input
                                        placeholder="Nome"
                                        value={newAdminName}
                                        onChange={e => setNewAdminName(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Email"
                                        type="email"
                                        value={newAdminEmail}
                                        onChange={e => setNewAdminEmail(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Senha"
                                        type="text"
                                        value={newAdminPassword}
                                        onChange={e => setNewAdminPassword(e.target.value)}
                                    />
                                    <select
                                        value={newAdminRole}
                                        onChange={(e) => setNewAdminRole(e.target.value as any)}
                                        className="flex h-10 w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-800 dark:bg-secondary-950 dark:ring-offset-secondary-950 dark:placeholder:text-secondary-400"
                                    >
                                        <option value="admin_master">Geral</option>
                                        <option value="admin_infra">Infraestrutura</option>
                                        <option value="admin_gp">Gestão de Pessoas</option>
                                        <option value="admin_secretaria">Secretaria</option>
                                        <option value="admin_divulgacao">Divulgação</option>
                                    </select>
                                    <Button type="submit">
                                        <Plus className="mr-2 h-4 w-4" /> Adicionar
                                    </Button>
                                </form>
                            </div>

                            <div className="rounded-md border border-secondary-200 dark:border-secondary-800">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-900 dark:text-secondary-300">
                                        <tr>
                                            <th className="px-6 py-3">Nome</th>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Cargo</th>
                                            <th className="px-6 py-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.filter(m => m.role.startsWith('admin_')).map((admin) => (
                                            <tr key={admin.id} className="bg-white border-b dark:bg-secondary-950 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900">
                                                <td className="px-6 py-4 font-medium text-secondary-900 dark:text-white">{admin.name}</td>
                                                <td className="px-6 py-4 text-secondary-500">{admin.email}</td>
                                                <td className="px-6 py-4 text-secondary-500">
                                                    {admin.role === 'admin_master' ? 'Geral' :
                                                        admin.role === 'admin_infra' ? 'Infraestrutura' :
                                                            admin.role === 'admin_gp' ? 'Gestão de Pessoas' :
                                                                admin.role === 'admin_secretaria' ? 'Secretaria' :
                                                                    admin.role === 'admin_divulgacao' ? 'Divulgação' : admin.role}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openEditMember(admin)}>
                                                        <Pencil className="h-4 w-4 mr-1" /> Editar
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : activeTab === 'infraestrutura' ? (
                <div className="space-y-8">
                    {/* Sectors Management */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sectors.map(sector => (
                            <Card key={sector.id} className="hover:border-primary-500 transition-colors">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex justify-between items-center">
                                        {sector.name}
                                        <Button size="icon" variant="ghost" onClick={() => openEditSector(sector)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </CardTitle>
                                    <CardDescription>{sector.category}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-secondary-500 text-sm">
                                        <Package className="h-4 w-4 mr-2" />
                                        {sector.items.length} itens cadastrados
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Loan History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Empréstimos</CardTitle>
                            <CardDescription>Registro de retiradas e devoluções de materiais.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-secondary-200 dark:border-secondary-800 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-900 dark:text-secondary-300">
                                        <tr>
                                            <th className="px-6 py-3">Data</th>
                                            <th className="px-6 py-3">Item</th>
                                            <th className="px-6 py-3">Qtd</th>
                                            <th className="px-6 py-3">Membro</th>
                                            <th className="px-6 py-3">Tipo</th>
                                            <th className="px-6 py-3">Devolução</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800">
                                        {loans.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-secondary-500">
                                                    Nenhum empréstimo registrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            loans.map(loan => (
                                                <tr key={loan.id} className="bg-white dark:bg-secondary-950 hover:bg-secondary-50 dark:hover:bg-secondary-900">
                                                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                                                        {new Date(loan.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">{loan.itemName}</td>
                                                    <td className="px-6 py-4">{loan.quantity || 1}</td>
                                                    <td className="px-6 py-4">{loan.userName}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                                                            {loan.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {loan.type === 'Empréstimo' && loan.expectedReturnDate ? (
                                                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                                                                {new Date(loan.expectedReturnDate).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-secondary-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold
                                                            ${loan.status === 'Ativo' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                loan.status === 'Atrasado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                            {loan.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Return Approvals */}
                    <Card className="border-t-4 border-t-yellow-500">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Aprovações Pendentes</span>
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-yellow-200 dark:text-yellow-900">
                                    {loans.filter(l => l.status === 'Aguardando Aprovação').length} pendentes
                                </span>
                            </CardTitle>
                            <CardDescription>Valide as devoluções de materiais.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loans.filter(l => l.status === 'Aguardando Aprovação').length === 0 ? (
                                    <p className="text-secondary-500 text-center py-4">Nenhuma devolução pendente de aprovação.</p>
                                ) : (
                                    loans.filter(l => l.status === 'Aguardando Aprovação').map(loan => (
                                        <div key={loan.id} className="bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 p-4 rounded-lg flex flex-col md:flex-row gap-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg">{loan.itemName}</h4>
                                                        <p className="text-secondary-600 dark:text-secondary-400 text-sm">Devolvido por: <span className="font-semibold">{loan.userName}</span></p>
                                                        <p className="text-secondary-500 text-xs mt-1">Data Retirada: {new Date(loan.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-4">
                                                    {loan.withdrawalPhotoUrl && (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-medium text-secondary-500">Retirada</span>
                                                            <a href={loan.withdrawalPhotoUrl} target="_blank" rel="noopener noreferrer">
                                                                <img src={loan.withdrawalPhotoUrl} alt="Retirada" className="w-24 h-24 object-cover rounded border hover:scale-105 transition-transform" />
                                                            </a>
                                                        </div>
                                                    )}
                                                    {loan.returnPhotoUrl && (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-medium text-secondary-500">Devolução</span>
                                                            <a href={loan.returnPhotoUrl} target="_blank" rel="noopener noreferrer">
                                                                <img src={loan.returnPhotoUrl} alt="Devolução" className="w-24 h-24 object-cover rounded border hover:scale-105 transition-transform" />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center gap-2 min-w-[200px]">
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={async () => {
                                                        if (confirm('Confirmar que o item foi devolvido em boas condições?')) {
                                                            await approveLoanReturn(loan.id, 'ok');
                                                            toast.success('Devolução aprovada!');
                                                        }
                                                    }}
                                                >
                                                    <Check className="mr-2 h-4 w-4" /> Aprovar (OK)
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={async () => {
                                                        const notes = prompt('Descreva o problema (ex: sujo, quebrado):');
                                                        if (notes) {
                                                            const condition = confirm('O item está danificado?') ? 'damaged' : 'dirty';
                                                            await approveLoanReturn(loan.id, condition, notes);
                                                            toast.success('Problema reportado e devolução processada.');
                                                        }
                                                    }}
                                                >
                                                    <ShieldAlert className="mr-2 h-4 w-4" /> Reportar Problema
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : activeTab === 'cms' ? (
                <SiteEditor />
            ) : activeTab === 'avisos' ? (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Novo Aviso</CardTitle>
                            <CardDescription>Poste um aviso no mural da Home. Se configurado, enviará email.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddNotice} className="space-y-4">
                                <Input
                                    placeholder="Título do Aviso"
                                    value={newNoticeTitle}
                                    onChange={e => setNewNoticeTitle(e.target.value)}
                                />
                                <div>
                                    <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1 block">
                                        Tipo
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="noticeType"
                                                value="info"
                                                checked={newNoticeType === 'info'}
                                                onChange={() => setNewNoticeType('info')}
                                                className="text-primary-600"
                                            />
                                            Informativo
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="noticeType"
                                                value="alert"
                                                checked={newNoticeType === 'alert'}
                                                onChange={() => setNewNoticeType('alert')}
                                                className="text-red-600"
                                            />
                                            Alerta
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="noticeType"
                                                value="event"
                                                checked={newNoticeType === 'event'}
                                                onChange={() => setNewNoticeType('event')}
                                                className="text-blue-600"
                                            />
                                            Evento
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <textarea
                                        className="w-full min-h-[120px] rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-800 dark:bg-secondary-950 dark:ring-offset-secondary-950 dark:placeholder:text-secondary-400"
                                        placeholder="Conteúdo do aviso..."
                                        value={newNoticeContent}
                                        onChange={e => setNewNoticeContent(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    <Megaphone className="mr-2 h-4 w-4" /> Postar Aviso
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Avisos Ativos</CardTitle>
                            <CardDescription>Gerencie os avisos visíveis no mural.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                {notices.length === 0 ? (
                                    <p className="text-secondary-500 text-center py-4">Nenhum aviso ativo.</p>
                                ) : (
                                    notices.map(notice => (
                                        <div key={notice.id} className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 relative group">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-secondary-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => handleRemoveNotice(notice.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <div className="flex items-center gap-2 mb-1">
                                                {notice.type === 'alert' && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">Alerta</span>}
                                                {notice.type === 'event' && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">Evento</span>}
                                                <h4 className="font-semibold">{notice.title}</h4>
                                            </div>
                                            <p className="text-sm text-secondary-600 dark:text-secondary-300 line-clamp-2">{notice.content}</p>
                                            <div className="mt-2 flex justify-between text-xs text-secondary-400">
                                                <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                                <span>Por: {notice.author}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : activeTab === 'avaliacoes' ? (
                <div className="space-y-6">
                    {/* Breadcrumbs / Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-sm text-secondary-500">
                            <button
                                onClick={() => { setEvalViewMode('members'); setSelectedMemberEval(null); setSelectedEvaluation(null); }}
                                className={`hover:text-primary-600 ${evalViewMode === 'members' ? 'font-bold text-primary-600' : ''}`}
                            >
                                Membros
                            </button>
                            {evalViewMode !== 'members' && (
                                <>
                                    <span>/</span>
                                    <button
                                        onClick={() => { setEvalViewMode('months'); setSelectedEvaluation(null); }}
                                        className={`hover:text-primary-600 ${evalViewMode === 'months' ? 'font-bold text-primary-600' : ''}`}
                                    >
                                        {selectedMemberEval?.name}
                                    </button>
                                </>
                            )}
                            {evalViewMode === 'detail' && (
                                <>
                                    <span>/</span>
                                    <span className="font-bold text-primary-600">
                                        {selectedEvaluation?.criteria?.month || 'Detalhes'}
                                    </span>
                                </>
                            )}
                        </div>

                        {(userRole === 'admin_master' || userRole === 'admin_gp') && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={async () => {
                                    if (confirm('ATENÇÃO: Isso apagará TODAS as autoavaliações do sistema. Tem certeza absoluta?')) {
                                        const { error } = await supabase.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                                        if (error) toast.error('Erro ao limpar dados.');
                                        else {
                                            toast.success('Todas as avaliações foram excluídas.');
                                            window.location.reload();
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Limpar Tudo
                            </Button>
                        )}
                    </div>

                    {/* Stage 1: Member Grid */}
                    {evalViewMode === 'members' && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Histórico de Avaliações</h2>
                            <p className="text-secondary-500 mb-6">Selecione um PETiano para ver seu progresso.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {members.filter(m => m.role === 'member').map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => {
                                            setSelectedMemberEval(member);
                                            setEvalViewMode('months');
                                        }}
                                        className="flex flex-col items-center justify-center p-6 bg-secondary-900/50 hover:bg-secondary-800 border border-secondary-800 rounded-xl transition-all hover:scale-105 group"
                                    >
                                        {member.photoUrl ? (
                                            <img
                                                src={member.photoUrl}
                                                alt={member.name}
                                                className="h-16 w-16 rounded-full object-cover mb-3 border-2 border-orange-500 group-hover:border-orange-600"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-orange-500 flex items-center justify-center text-2xl font-bold text-white mb-3 group-hover:bg-orange-600">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-medium text-white text-center">{member.name}</span>
                                        <span className="text-xs text-secondary-500 mt-1">Ver avaliações</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stage 2: Month Selection */}
                    {evalViewMode === 'months' && selectedMemberEval && (
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-xl font-bold text-white">
                                    {selectedMemberEval.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedMemberEval.name}</h2>
                                    <p className="text-secondary-500">Selecione o mês para visualizar a autoavaliação.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {evaluations
                                    .filter(ev => ev.author === selectedMemberEval.name)
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .map(ev => (
                                        <div
                                            key={ev.id}
                                            className="relative group"
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedEvaluation(ev);
                                                    setEvalViewMode('detail');
                                                }}
                                                className="w-full p-6 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl text-left hover:border-primary-500 transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-lg font-bold text-primary-600">
                                                        {ev.criteria?.month || 'Mês não informado'}
                                                    </span>
                                                    <span className="text-xs text-secondary-400">
                                                        {new Date(ev.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-300">
                                                    <div className="flex items-center gap-1">
                                                        <span>Presença:</span>
                                                        <span className="font-bold">{ev.presence}</span>
                                                    </div>
                                                    <span className="text-secondary-300">|</span>
                                                    <div className="flex items-center gap-1">
                                                        <span>Humor:</span>
                                                        <span className="font-bold">{ev.mood}</span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Delete Button */}
                                            {(userRole === 'admin_master' || userRole === 'admin_gp') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
                                                            removeEvaluation(ev.id);
                                                            if (selectedEvaluation?.id === ev.id) {
                                                                setSelectedEvaluation(null);
                                                                setEvalViewMode('months');
                                                            }
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 p-2 text-red-500 hover:text-red-700 bg-white/50 dark:bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Excluir Avaliação"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                    ))}

                                {evaluations.filter(ev => ev.author === selectedMemberEval.name).length === 0 && (
                                    <div className="col-span-full py-12 text-center text-secondary-500 italic bg-secondary-50 dark:bg-secondary-900/50 rounded-lg">
                                        Nenhuma avaliação encontrada para este membro.
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                    }

                    {/* Stage 3: Detail View */}
                    {
                        evalViewMode === 'detail' && selectedEvaluation && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="border-l-4 border-l-primary-500">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between">
                                            <span>Autoavaliação de {selectedEvaluation.criteria?.month}</span>
                                            <span className="text-sm font-normal text-secondary-500">Enviado em {new Date(selectedEvaluation.createdAt).toLocaleString()}</span>
                                        </CardTitle>
                                        <CardDescription>Membro: {selectedEvaluation.author}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        {/* Mood & Basics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
                                            <div className="text-center">
                                                <p className="text-xs text-secondary-500 uppercase">Presença</p>
                                                <p className="text-2xl font-bold">{selectedEvaluation.presence}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-secondary-500 uppercase">Empenho</p>
                                                <p className="text-2xl font-bold">{selectedEvaluation.effort}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-secondary-500 uppercase">Humor (0-10)</p>
                                                <p className="text-2xl font-bold">{selectedEvaluation.mood}</p>
                                            </div>
                                            <div className="text-center">
                                                {/* Calculate Average Satisfaction if possible */}
                                                <p className="text-xs text-secondary-500 uppercase">Equilíbrio</p>
                                                <p className="text-2xl font-bold">{selectedEvaluation.criteria?.satisfactionBalance || '-'}</p>
                                            </div>
                                        </div>

                                        {/* Text Answers */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-4">
                                                <h3 className="font-bold border-b pb-1">Desempenho & Metas</h3>
                                                <div>
                                                    <p className="text-sm font-medium text-secondary-500">Dedicação Semanal</p>
                                                    <p className="p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-sm mt-1">{selectedEvaluation.criteria?.weeklyDedication || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-secondary-500">Cumprimento de Metas</p>
                                                    <p className="p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-sm mt-1">{selectedEvaluation.criteria?.goalCompliance || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-secondary-500">Produção Acadêmica</p>
                                                    <p className="p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-sm mt-1">{selectedEvaluation.criteria?.academicProduction || '-'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="font-bold border-b pb-1">Coordenadoria & Vivência</h3>
                                                <div>
                                                    <p className="text-sm font-medium text-secondary-500">Desempenho no Setor</p>
                                                    <p className="p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-sm mt-1">{selectedEvaluation.criteria?.sectorPerformance || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-secondary-500">Zelo pela Sala</p>
                                                    <p className="p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-sm mt-1">{selectedEvaluation.criteria?.roomCare || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-secondary-500">Relato de Experiência</p>
                                                    <p className="p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-sm mt-1 italic">"{selectedEvaluation.feeling}"</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Satisfactions */}
                                        <div>
                                            <h3 className="font-bold border-b pb-1 mb-3">Satisfações (0-10)</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 border rounded-lg text-center">
                                                    <span className="block text-xs text-secondary-500">Grupo</span>
                                                    <span className="font-bold text-lg">{selectedEvaluation.criteria?.satisfactionGroup || '-'}</span>
                                                </div>
                                                <div className="p-3 border rounded-lg text-center">
                                                    <span className="block text-xs text-secondary-500">Tutoria</span>
                                                    <span className="font-bold text-lg">{selectedEvaluation.criteria?.satisfactionTutor || '-'}</span>
                                                </div>
                                                <div className="p-3 border rounded-lg text-center">
                                                    <span className="block text-xs text-secondary-500">Coordenação</span>
                                                    <span className="font-bold text-lg">{selectedEvaluation.criteria?.satisfactionCoordination || '-'}</span>
                                                </div>
                                                <div className="p-3 border rounded-lg text-center">
                                                    <span className="block text-xs text-secondary-500">Relacionamento (Média)</span>
                                                    <span className="font-bold text-lg">
                                                        {selectedEvaluation.criteria?.peerEvaluations
                                                            ? (Object.values(selectedEvaluation.criteria.peerEvaluations).reduce((a: number, b: number) => a + b, 0) / Object.values(selectedEvaluation.criteria.peerEvaluations).length).toFixed(1)
                                                            : '-'}
                                                    </span>
                                                </div>
                                                <div className="p-3 border rounded-lg text-center">
                                                    <span className="block text-xs text-secondary-500">Equilíbrio</span>
                                                    <span className="font-bold text-lg">{selectedEvaluation.criteria?.satisfactionBalance || '-'}</span>
                                                </div>
                                            </div>

                                            {/* Peer Details Breakdown */}
                                            {selectedEvaluation.criteria?.peerEvaluations && (
                                                <div className="pt-4 mt-2 border-t">
                                                    <h4 className="text-sm font-bold mb-2">Detalhes de Relacionamento Interpessoal</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                        {Object.entries(selectedEvaluation.criteria.peerEvaluations).map(([name, score]) => (
                                                            <div key={name} className="flex justify-between items-center p-2 bg-secondary-50 dark:bg-secondary-900 rounded text-xs">
                                                                <span className="truncate mr-2" title={name}>{name}</span>
                                                                <span className="font-bold">{score as number}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {(selectedEvaluation.improvement || selectedEvaluation.criteria?.positiveHighlight) && (
                                            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                                {selectedEvaluation.improvement && (
                                                    <div>
                                                        <p className="text-sm font-medium text-red-500 mb-1">Pontos de Melhoria / Sugestões</p>
                                                        <p className="text-sm">{selectedEvaluation.improvement}</p>
                                                    </div>
                                                )}
                                                {selectedEvaluation.criteria?.positiveHighlight && (
                                                    <div>
                                                        <p className="text-sm font-medium text-green-500 mb-1">Destaque Positivo</p>
                                                        <p className="text-sm">{selectedEvaluation.criteria.positiveHighlight}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </CardContent>
                                </Card>
                            </div>
                        )
                    }
                </div >
            ) : activeTab === 'ouvidoria' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Manifestações Recebidas</CardTitle>
                        <CardDescription>Visão tabular dos dados registrados no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-secondary-200 dark:border-secondary-800 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-900 dark:text-secondary-300">
                                    <tr>
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3">Identificação</th>
                                        <th className="px-6 py-3">Texto</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800">
                                    {ombudsman.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-secondary-500">
                                                <TableIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                Nenhum registro encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        ombudsman.map(item => (
                                            <tr key={item.id} className="bg-white dark:bg-secondary-950 hover:bg-secondary-50 dark:hover:bg-secondary-900">
                                                <td className="px-6 py-4 font-medium whitespace-nowrap">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold
                                                        ${((item.type as string) === 'Denúncia' || item.type === 'Reclamação') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.isAnonymous ? (
                                                        <span className="text-secondary-500 italic">Anônimo</span>
                                                    ) : (
                                                        <span className="font-medium">{item.identification || 'Não identificado'}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 truncate max-w-xs" title={item.text}>{item.text}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold
                                                        ${item.status === 'Atendido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {item.status || 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    {item.status !== 'Atendido' && (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleResolveOmbudsman(item.id)} title="Marcar como Atendido">
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleRemoveOmbudsman(item.id)} title="Excluir">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : activeTab === 'tickets' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Chamados em Aberto</CardTitle>
                        <CardDescription>Gerenciamento de tickets de suporte.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-secondary-200 dark:border-secondary-800 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-50 dark:bg-secondary-900 dark:text-secondary-300">
                                    <tr>
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3">Categoria</th>
                                        <th className="px-6 py-3">Solicitante</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Urgência</th>
                                        <th className="px-6 py-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800">
                                    {filteredTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-secondary-500">
                                                <TableIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                <p>Nenhum ticket encontrado.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTickets.map(ticket => (
                                            <tr key={ticket.id} className="bg-white dark:bg-secondary-950 hover:bg-secondary-50 dark:hover:bg-secondary-900">
                                                <td className="px-6 py-4 font-medium whitespace-nowrap">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">{ticket.category}</td>
                                                <td className="px-6 py-4">{ticket.author || 'Anônimo'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold
                                                        ${ticket.status === 'Concluído' ? 'bg-green-100 text-green-700' :
                                                            ticket.status === 'Em Atendimento' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'}`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-bold text-xs uppercase ${ticket.urgency === 'Alta' ? 'text-red-500' :
                                                        ticket.urgency === 'Média' ? 'text-orange-500' : 'text-green-500'}`}>
                                                        {ticket.urgency}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button variant="ghost" size="sm" onClick={() => handleTicketClick(ticket)}>
                                                        Gerenciar
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : null
            }

            {/* Ticket Management Modal */}
            <Modal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                title="Gerenciar Ticket"
            >
                <form onSubmit={handleUpdateTicket} className="space-y-4">
                    {selectedTicket && (
                        <div className="p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span className="font-bold">{selectedTicket.category}</span>
                                <span className="text-xs text-secondary-500">
                                    {new Date(selectedTicket.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-secondary-600 dark:text-secondary-300">
                                {selectedTicket.description}
                            </p>
                            <p className="text-xs text-secondary-400">
                                Aberto por: {selectedTicket.author || 'Anônimo'}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-secondary-200">Status</label>
                        <select
                            value={ticketStatus}
                            onChange={(e) => setTicketStatus(e.target.value as any)}
                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm dark:bg-secondary-950 dark:border-secondary-700 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                            <option value="Novo">Novo</option>
                            <option value="Em Atendimento">Em Atendimento</option>
                            <option value="Concluído">Concluído</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-secondary-200">Resposta / Anotação</label>
                        <textarea
                            value={ticketResponse}
                            onChange={(e) => setTicketResponse(e.target.value)}
                            rows={4}
                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm resize-none dark:bg-secondary-950 dark:border-secondary-700 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="Escreva uma resposta para o solicitante..."
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsTicketModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Atualizar</Button>
                    </div>
                </form>
            </Modal>


            {/* Edit Member Modal */}
            <Modal
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                title="Editar Membro"
            >
                <form onSubmit={handleUpdateMember} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-secondary-200">Nome</label>
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nome do membro"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-secondary-200">Email</label>
                        <Input
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="Email do membro"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-secondary-200">Senha</label>
                        <Input
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="Nova senha"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setEditingMember(null)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Sector Modal */}
            <Modal
                isOpen={!!editingSector}
                onClose={() => setEditingSector(null)}
                title="Gerenciar Setor"
            >
                <div className="space-y-6">
                    <form onSubmit={handleUpdateSector} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-secondary-200">Nome do Setor</label>
                            <Input
                                value={sectorName}
                                onChange={(e) => setSectorName(e.target.value)}
                                placeholder="Ex: Prateleira 1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-secondary-200">Categoria</label>
                            <Input
                                value={sectorCategory}
                                onChange={(e) => setSectorCategory(e.target.value)}
                                placeholder="Ex: Papelaria"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" size="sm">Atualizar Detalhes</Button>
                        </div>
                    </form>

                    <div className="border-t border-secondary-200 dark:border-secondary-800 pt-4">
                        <h4 className="font-medium mb-2 dark:text-white">Inventário</h4>

                        <form onSubmit={handleAddItem} className="space-y-3 mb-4 p-3 bg-secondary-50 dark:bg-secondary-900/50 rounded-lg border border-secondary-200 dark:border-secondary-800">
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    placeholder="Nome do item"
                                    className="col-span-2"
                                />
                                <Input
                                    value={newItemCode}
                                    onChange={e => setNewItemCode(e.target.value)}
                                    placeholder="Cód (opcional)"
                                />
                                <Input
                                    type="number"
                                    min="1"
                                    value={newItemQuantity}
                                    onChange={e => setNewItemQuantity(parseInt(e.target.value))}
                                    placeholder="Qtd"
                                />
                                <div className="col-span-2">
                                    <select
                                        value={newItemStatus}
                                        onChange={e => setNewItemStatus(e.target.value as any)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-secondary-900 dark:text-white"
                                    >
                                        <option value="Disponível" className="bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white">Disponível</option>
                                        <option value="Em Uso" className="bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white">Em Uso</option>
                                        <option value="Emprestado" className="bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white">Emprestado</option>
                                        <option value="Indisponível" className="bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white">Indisponível</option>
                                    </select>
                                </div>
                            </div>
                            <Button type="submit" size="sm" className="w-full">
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                            </Button>
                        </form>

                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                            {editingSector?.items.length === 0 ? (
                                <p className="text-sm text-secondary-500 italic">Nenhum item cadastrado.</p>
                            ) : (
                                editingSector?.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-secondary-50 dark:bg-secondary-900 p-2 rounded text-sm group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.name}</span>
                                                {item.code && <span className="text-xs text-secondary-500 bg-secondary-200 dark:bg-secondary-800 px-1 rounded">{item.code}</span>}
                                            </div>
                                            <div className="flex gap-2 text-xs text-secondary-500 mt-0.5">
                                                <span>Qtd: {item.quantity}</span>
                                                <span className={`
                                                    ${item.status === 'Disponível' ? 'text-green-600' :
                                                        item.status === 'Indisponível' ? 'text-red-600' : 'text-yellow-600'}
                                                `}>{item.status}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
