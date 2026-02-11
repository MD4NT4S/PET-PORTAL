import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ChevronLeft, ChevronRight, Cake, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface EventForm {
    title: string;
    date: string;
    type: 'meeting' | 'deadline' | 'event' | 'birthday';
}

export default function Calendario() {
    const { events, addEvent, removeEvent, canManageCalendar, siteConfig } = useStorage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm<EventForm>();

    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: startDay }, (_, i) => i);
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const onSubmit = (data: EventForm) => {
        addEvent({
            id: crypto.randomUUID(),
            ...data
        });
        toast.success('Evento adicionado!');
        reset();
        setIsModalOpen(false);
    };

    const handleDelete = (id: string, title: string) => {
        if (confirm(`Remover "${title}"?`)) {
            removeEvent(id);
            toast.success('Evento removido.');
        }
    };

    const upcomingBirthdays = events
        .filter(e => {
            if (e.type !== 'birthday') return false;
            const [, m] = e.date.split('/');
            return parseInt(m) - 1 === currentDate.getMonth();
        })
        .sort((a, b) => {
            const [d1] = a.date.split('/');
            const [d2] = b.date.split('/');
            return parseInt(d1) - parseInt(d2);
        });

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            {/* Calendar Area */}
            <Card className="flex-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-primary-600" />
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardTitle>
                    <div className="flex gap-2">
                        {canManageCalendar && (
                            <Button size="sm" onClick={() => setIsModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Novo Evento
                            </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center font-medium text-secondary-500">
                        {weekDays.map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2 min-h-[500px] grid-rows-5">
                        {emptyDays.map(day => <div key={`empty-${day}`} />)}
                        {days.map(day => {
                            // Filter events for this specific day and month
                            const dayEvents = events.filter(e => {
                                const parts = e.date.split('/');
                                const eventDay = parseInt(parts[0]);
                                const eventMonth = parseInt(parts[1]) - 1; // 0-indexed
                                const eventYear = parts[2] ? parseInt(parts[2]) : null;

                                if (eventDay !== day) return false;
                                if (eventMonth !== currentDate.getMonth()) return false;
                                if (eventYear && eventYear !== currentDate.getFullYear()) return false;

                                return true;
                            });

                            return (
                                <div
                                    key={day}
                                    className="border border-secondary-100 dark:border-secondary-800 rounded-lg p-2 min-h-[80px] hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors relative group flex flex-col gap-1"
                                >
                                    <span className="text-secondary-400 font-medium text-sm">{day}</span>
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className={`p-1 rounded text-xs font-medium flex justify-between items-center group/event gap-1
                                                ${event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                                                    event.type === 'deadline' ? 'bg-red-100 text-red-700' :
                                                        event.type === 'birthday' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-purple-100 text-purple-700'
                                                }`}
                                            title={event.title}
                                        >
                                            <span className="truncate flex-1 text-left">{event.title}</span>
                                            {canManageCalendar && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id, event.title); }}
                                                    className="opacity-0 group-hover/event:opacity-100 p-0.5 hover:text-red-900 hover:bg-red-200/50 rounded flex-shrink-0 transition-all"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Sidebar Info */}
            <div className="w-full lg:w-80 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Cake className="mr-2 h-5 w-5 text-pink-500" />
                            Aniversariantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {upcomingBirthdays.length === 0 ? (
                                <p className="text-secondary-500 text-sm">Nenhum aniversário este mês.</p>
                            ) : upcomingBirthdays.map((b) => (
                                <li key={b.id} className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-800 pb-2 last:border-0 last:pb-0">
                                    <span className="font-medium">{b.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-secondary-500 bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded-full">{b.date}</span>
                                        {canManageCalendar && (
                                            <button onClick={() => handleDelete(b.id, b.title)} className="text-secondary-400 hover:text-red-500">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
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
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Evento"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Título"
                        {...register('title', { required: true })}
                        placeholder="Ex: Reunião de Pauta"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Data (DD/MM)"
                            {...register('date', { required: true })}
                            placeholder="Ex: 25/10"
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <select
                                {...register('type')}
                                className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                            >
                                <option value="meeting">Reunião</option>
                                <option value="deadline">Prazo/Entrega</option>
                                <option value="event">Evento</option>
                                <option value="birthday">Aniversário</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 gap-2">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Adicionar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
