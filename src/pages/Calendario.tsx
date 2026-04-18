import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Cake, Calendar as CalendarIcon, Plus, Trash2, Clock, Mail, Users, MapPin, AlignLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface EventForm {
    title: string;
    description: string;
    link: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    type: 'meeting' | 'deadline' | 'event' | 'birthday' | 'task';
    responsibles?: string[];
    reminderDaysEnabled: boolean;
    reminderDaysBefore: number;
}

export default function Calendario() {
    const { events, members, addEvent, removeEvent, canManageCalendar, siteConfig } = useStorage();
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewEvent, setViewEvent] = useState<any>(null); // For Event popover/modal
    const { register, handleSubmit, reset, setValue, watch, control } = useForm<EventForm>({
        defaultValues: { reminderDaysEnabled: false, reminderDaysBefore: 1, type: 'meeting' }
    });

    // Checkboxes
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allMembers = members.filter(m => m.role === 'member').map(m => m.name);
            setValue('responsibles', allMembers, { shouldValidate: true });
        } else {
            setValue('responsibles', [], { shouldValidate: true });
        }
    };

    const selectedResponsibles = watch('responsibles') || [];
    const reminderEnabled = watch('reminderDaysEnabled');
    const memberSubList = members.filter(m => m.role === 'member');
    const isAllSelected = memberSubList.length > 0 && selectedResponsibles.length === memberSubList.length;

    // Handlers
    const onSubmit = (data: EventForm) => {
        // Parse dates
        const start = new Date(`${data.startDate}T${data.startTime || '09:00'}:00`);
        let end: Date | undefined = undefined;
        if (data.endDate) {
            end = new Date(`${data.endDate}T${data.endTime || '10:00'}:00`);
        } else {
            // Default 1 hour duration if no end date
            end = new Date(start.getTime() + 60 * 60 * 1000); 
        }

        if (end <= start) {
            toast.error("O fim precisa ser depois do início.");
            return;
        }

        addEvent({
            id: crypto.randomUUID(),
            title: data.title,
            type: data.type,
            responsibles: data.responsibles,
            start,
            end,
            description: data.description,
            link: data.link,
            reminderDaysBefore: data.reminderDaysEnabled ? Number(data.reminderDaysBefore) : undefined,
            reminderSent: false
        });
        toast.success('Evento adicionado!');
        reset();
        setIsModalOpen(false);
    };

    const handleDelete = (id: string, title: string) => {
        if (confirm(`Remover "${title}"?`)) {
            removeEvent(id);
            setViewEvent(null);
            toast.success('Evento removido.');
        }
    };

    const upcomingBirthdays = events
        .filter(e => {
            if (e.type !== 'birthday') return false;
            // Verifica o mês 
            return e.start.getMonth() === new Date().getMonth();
        })
        .sort((a, b) => a.start.getDate() - b.start.getDate());

    // Map Events to FullCalendar format
    const fcEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        extendedProps: {
            ...e
        },
        backgroundColor: e.type === 'meeting' ? '#3b82f6' : 
                         e.type === 'deadline' ? '#ef4444' : 
                         e.type === 'birthday' ? '#ec4899' : 
                         e.type === 'task' ? '#f59e0b' : '#8b5cf6',
        borderColor: 'transparent'
    }));

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] min-h-[700px]">
             <div className="flex-1 bg-white dark:bg-secondary-950 p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-sm flex flex-col relative overflow-hidden">
                <style dangerouslySetInnerHTML={{__html:`
                    .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 700; color: var(--tw-prose-headings); }
                    .fc-button-primary { background-color: #3b82f6 !important; border-color: #3b82f6 !important; }
                    .fc-button-primary:hover { background-color: #2563eb !important; border-color: #2563eb !important; }
                    .fc-button-primary:disabled { opacity: 0.5 !important; }
                    .fc-event { cursor: pointer; transition: transform 0.1s; border-radius: 4px; padding: 2px; }
                    .fc-event:hover { transform: scale(1.02); z-index: 10; }
                    .fc-day-today { background-color: rgba(59, 130, 246, 0.05) !important; }
                    .dark .fc-daygrid-day-number, .dark .fc-col-header-cell-cushion { color: #d1d5db; }
                    .dark .fc-scrollgrid { border-color: #374151 !important; }
                    .dark .fc-scrollgrid td, .dark .fc-scrollgrid th { border-color: #374151 !important; }
                    .fc-view-harness { min-height: 500px; }
                `}} />

                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold flex items-center gap-2 text-secondary-900 dark:text-white">
                        <CalendarIcon className="h-6 w-6 text-primary-600" />
                        Agenda Geral
                     </h2>
                     <Button onClick={() => setIsModalOpen(true)}>
                         <Plus className="h-4 w-4 mr-2" /> Novo Evento
                     </Button>
                </div>
                
                <div className="flex-1 overflow-visible">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        locale="pt-br"
                        buttonText={{
                            today: 'Hoje',
                            month: 'Mês',
                            week: 'Semana',
                            day: 'Dia'
                        }}
                        events={fcEvents}
                        height="100%"
                        eventClick={(info) => {
                            setViewEvent(info.event);
                        }}
                    />
                </div>
             </div>

            {/* Sidebar Info */}
            <div className="w-full lg:w-[350px] space-y-6 flex flex-col">
                {/* Event Details Viewer (replaces default sidebar info when viewing an event) */}
                {viewEvent ? (
                    <Card className="flex-1 border-primary-200 dark:border-primary-900 shadow-md transform transition-all duration-300">
                        <CardHeader className="bg-primary-50 dark:bg-primary-900/20 pb-4 border-b border-primary-100 dark:border-primary-900/50 relative">
                            <div className="absolute top-4 right-4">
                                <Button size="sm" variant="ghost" onClick={() => setViewEvent(null)}>✕</Button>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-secondary-950 border border-secondary-200 w-fit text-secondary-600 uppercase tracking-wider mb-2">
                                {viewEvent.extendedProps.type}
                            </span>
                            <CardTitle className="text-xl text-primary-900 dark:text-primary-100">{viewEvent.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                             <div className="flex items-start gap-3 text-secondary-700 dark:text-secondary-300">
                                 <Clock className="w-5 h-5 text-secondary-400 mt-0.5" />
                                 <div>
                                     <p className="font-medium text-sm">
                                         Início: {viewEvent.start.toLocaleString()}
                                     </p>
                                     {viewEvent.end && (
                                         <p className="font-medium text-sm">
                                             Fim: {viewEvent.end.toLocaleString()}
                                         </p>
                                     )}
                                 </div>
                             </div>

                             {viewEvent.extendedProps.link && (
                                <div className="flex items-start gap-3 text-blue-600 dark:text-blue-400">
                                    <MapPin className="w-5 h-5 mt-0.5" />
                                    <a href={viewEvent.extendedProps.link} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline break-all">
                                        {viewEvent.extendedProps.link}
                                    </a>
                                </div>
                             )}

                             {viewEvent.extendedProps.description && (
                                <div className="flex items-start gap-3 text-secondary-700 dark:text-secondary-300">
                                    <AlignLeft className="w-5 h-5 text-secondary-400 mt-0.5" />
                                    <p className="text-sm border-l-2 border-secondary-200 pl-3">
                                        {viewEvent.extendedProps.description}
                                    </p>
                                </div>
                             )}

                             {viewEvent.extendedProps.reminderDaysBefore && (
                                <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50">
                                    <Mail className="w-5 h-5" />
                                    <span className="text-sm font-medium">Lembrete ativado: {viewEvent.extendedProps.reminderDaysBefore} dia(s) antes</span>
                                </div>
                             )}

                             {viewEvent.extendedProps.responsibles?.length > 0 && (
                                <div className="pt-2 border-t border-secondary-100 dark:border-secondary-800">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold mb-3 text-secondary-900 dark:text-white">
                                        <Users className="w-4 h-4" /> Envolvidos
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {viewEvent.extendedProps.responsibles.map((r: string) => (
                                            <span key={r} className="bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 text-xs px-2.5 py-1 rounded-full font-medium">
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                             )}

                             {canManageCalendar && (
                                 <div className="pt-6 w-full">
                                     <Button 
                                         variant="danger" 
                                         className="w-full"
                                         onClick={() => handleDelete(viewEvent.id, viewEvent.title)}
                                     >
                                         <Trash2 className="w-4 h-4 mr-2" />
                                         Excluir Evento
                                     </Button>
                                 </div>
                             )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <Cake className="mr-2 h-5 w-5 text-pink-500" />
                                    Aniversariantes ({upcomingBirthdays.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {upcomingBirthdays.length === 0 ? (
                                        <p className="text-secondary-500 text-sm">Nenhum aniversário este mês.</p>
                                    ) : upcomingBirthdays.map((b) => (
                                        <li key={b.id} className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-800 pb-2 last:border-0 last:pb-0">
                                            <span className="font-medium truncate flex-1">{b.title}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-secondary-500 bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded-full">
                                                    {b.start.getDate()}/{b.start.getMonth() + 1}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-900/30">
                            <CardHeader>
                                <CardTitle className="text-primary-700 dark:text-primary-400 text-lg">Foco do Ciclo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p
                                    className="text-primary-800 dark:text-primary-300 text-sm"
                                    dangerouslySetInnerHTML={{
                                        __html: siteConfig.cycleFocus || 'Defina o foco do ciclo no painel Admin > Gerenciar Site.'
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Evento"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-4">
                        <Input
                            label="Título do Evento *"
                            {...register('title', { required: true })}
                            placeholder="Reunião de Pauta, Entrega de Relatório..."
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Categoria</label>
                                <select
                                    {...register('type')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                                >
                                    <option value="meeting">Reunião</option>
                                    <option value="deadline">Prazo / Entrega</option>
                                    <option value="event">Evento / Capacitação</option>
                                    <option value="task">Tarefa</option>
                                    <option value="birthday">Aniversário</option>
                                </select>
                            </div>
                            <Input
                                label="Link da Reunião/Local (Opcional)"
                                {...register('link')}
                                placeholder="https://meet.google.com/..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-secondary-50 dark:bg-secondary-900/50 p-3 rounded-lg border border-secondary-200 dark:border-secondary-800">
                            <Input
                                label="Data Início *"
                                type="date"
                                {...register('startDate', { required: true })}
                            />
                            <Input
                                label="Fim (Opcional)"
                                type="date"
                                {...register('endDate')}
                            />
                            <Input
                                label="Hora Início *"
                                type="time"
                                defaultValue="09:00"
                                {...register('startTime', { required: true })}
                            />
                            <Input
                                label="Hora Fim (Opcional)"
                                type="time"
                                defaultValue="10:00"
                                {...register('endTime')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Descrição ou Pauta (Opcional)</label>
                            <textarea 
                                {...register('description')}
                                className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                placeholder="Coloque aqui informações extras sobre o evento..."
                            />
                        </div>

                        {/* Configurações de Lembrete Inteligente */}
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-900/30 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    {...register('reminderDaysEnabled')}
                                    className="rounded border-primary-300 text-primary-600 focus:ring-primary-600 h-4 w-4"
                                />
                                <span className="font-semibold text-primary-900 dark:text-primary-100 flex items-center gap-2">
                                    <Mail className="w-4 h-4"/>
                                    Ativar Lembrete por E-mail
                                </span>
                            </label>
                            
                            {reminderEnabled && (
                                <div className="pl-6 animate-in slide-in-from-top-2">
                                    <label className="text-sm font-medium block text-secondary-700 dark:text-secondary-300 mb-1">
                                        Enviar e-mail para todos os responsáveis...
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="number" 
                                            min="0"
                                            max="30"
                                            className="w-20"
                                            {...register('reminderDaysBefore', { required: reminderEnabled, valueAsNumber: true })}
                                        />
                                        <span className="text-sm">dias antes do evento</span>
                                    </div>
                                    <p className="text-xs text-secondary-500 mt-2">
                                        O sistema disparará os convites automaticamente na casa dos dias informados.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium block flex justify-between items-center">
                                <span>Responsáveis <span className="text-red-500">*</span></span>
                            </label>
                            <div className="max-h-32 overflow-y-auto border border-secondary-300 dark:border-secondary-700 rounded-md p-2 bg-white dark:bg-secondary-950 space-y-1">
                                {memberSubList.length > 0 && (
                                    <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded px-1 border-b border-secondary-100 dark:border-secondary-800 mb-2 pb-2">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-600 h-4 w-4"
                                        />
                                        <span className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Selecionar Todos ({memberSubList.length})</span>
                                    </label>
                                )}
                                {memberSubList.map(member => (
                                    <label key={member.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded px-1">
                                        <input
                                            type="checkbox"
                                            value={member.name}
                                            {...register('responsibles', { required: 'Selecione pelo menos um responsável' })}
                                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-600 h-4 w-4"
                                        />
                                        <span className="text-sm text-secondary-700 dark:text-secondary-300">{member.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 pb-2 border-t border-secondary-200 dark:border-secondary-800 mt-4 gap-2 sticky bottom-0 bg-white dark:bg-secondary-950 shadow-[0_-10px_10px_-10px_rgba(0,0,0,0.1)]">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Evento</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
