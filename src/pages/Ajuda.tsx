import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface TicketForm {
    category: string;
    urgency: 'Baixa' | 'Média' | 'Alta';
    description: string;
}

export default function Ajuda() {
    const { tickets, addTicket, currentUser } = useStorage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm<TicketForm>();

    // Filter tickets by current user
    const myTickets = tickets.filter(ticket => ticket.author === currentUser);

    const onSubmit = (data: TicketForm) => {
        addTicket({
            ...data,
            category: data.category || 'Geral'
        });
        toast.success("Ticket criado com sucesso!", { description: "Em breve entraremos em contato." });
        reset();
        setIsModalOpen(false);
    };

    const statusColors: Record<string, string> = {
        'Novo': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        'Em Atendimento': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        'Concluído': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };

    const urgencyColors = {
        'Baixa': 'text-green-600 dark:text-green-400',
        'Média': 'text-orange-500 dark:text-orange-400',
        'Alta': 'text-red-600 dark:text-red-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-white">Central de Ajuda</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">
                        Gerencie seus chamados e solicitações de suporte.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Ticket
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myTickets.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-secondary-200 rounded-lg dark:border-secondary-800">
                        <TicketIcon className="mx-auto h-12 w-12 text-secondary-300" />
                        <h3 className="mt-2 text-sm font-semibold text-secondary-900 dark:text-secondary-100">Nenhum ticket</h3>
                        <p className="mt-1 text-sm text-secondary-500">Comece criando uma nova solicitação.</p>
                    </div>
                ) : (
                    myTickets.map((ticket) => (
                        <Card key={ticket.id} className="hover:shadow-md transition-shadow dark:bg-secondary-900">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", statusColors[ticket.status])}>
                                        {ticket.status}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-bold uppercase",
                                        urgencyColors[ticket.urgency]
                                    )}>
                                        {ticket.urgency}
                                    </span>
                                </div>
                                <CardTitle className="text-lg leading-tight">{ticket.category}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Criado em {new Date(ticket.createdAt).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-secondary-600 dark:text-secondary-300 line-clamp-3 break-words">
                                    {ticket.description}
                                </p>
                                {ticket.response && (
                                    <div className="mt-3 pt-3 border-t border-secondary-100 dark:border-secondary-800">
                                        <p className="text-xs font-bold text-secondary-500 uppercase mb-1">Resposta do Admin</p>
                                        <p className="text-sm text-secondary-700 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-900 p-2 rounded border border-secondary-200 dark:border-secondary-800">
                                            {ticket.response}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Ticket de Suporte"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-secondary-200">Categoria</label>
                        <select
                            {...register('category')}
                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm dark:bg-secondary-950 dark:border-secondary-700 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                            <option value="Infraestrutura">Infraestrutura</option>
                            <option value="Material">Solicitação de Material</option>
                            <option value="Dúvida Acadêmica">Dúvida Acadêmica</option>
                            <option value="Burocracia">Burocracia</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-secondary-200">Urgência</label>
                        <div className="flex space-x-4">
                            {['Baixa', 'Média', 'Alta'].map((level) => (
                                <label key={level} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value={level}
                                        {...register('urgency')}
                                        defaultChecked={level === 'Baixa'}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm dark:text-secondary-300">{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-secondary-200">Descrição</label>
                        <textarea
                            {...register('description', { required: true })}
                            rows={4}
                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm resize-none dark:bg-secondary-950 dark:border-secondary-700 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="Descreva sua solicitação com detalhes..."
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Abrir Ticket</Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}
