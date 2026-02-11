import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ticket, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyRequests() {
    const { tickets, evaluations, currentUser } = useStorage();
    const [activeTab, setActiveTab] = useState<'tickets' | 'evaluations'>('tickets');

    // Filter by current user
    const myTickets = tickets.filter(t => t.author === currentUser);
    const myEvaluations = evaluations.filter(e => e.author === currentUser);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">Minhas Solicitações</h1>
                <p className="text-secondary-500 dark:text-secondary-400 mt-2">
                    Acompanhe o histórico de suas interações e avaliações.
                </p>
            </div>

            <div className="flex gap-4">
                <Button
                    variant={activeTab === 'tickets' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('tickets')}
                >
                    <Ticket className="mr-2 h-4 w-4" /> Chamados
                </Button>
                <Button
                    variant={activeTab === 'evaluations' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('evaluations')}
                >
                    <FileText className="mr-2 h-4 w-4" /> Autoavaliações
                </Button>
            </div>

            <div className="grid gap-6">
                {activeTab === 'tickets' ? (
                    myTickets.length > 0 ? (
                        myTickets.map(ticket => (
                            <Card key={ticket.id}>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold
                                                ${ticket.status === 'Concluído' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : ticket.status === 'Em Atendimento' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-xs text-secondary-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-semibold text-lg">{ticket.category}</h3>
                                            <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">{ticket.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-bold uppercase ${ticket.urgency === 'Alta' ? 'text-red-500' :
                                                ticket.urgency === 'Média' ? 'text-orange-500' : 'text-green-500'
                                                }`}>
                                                Urgência {ticket.urgency}
                                            </div>
                                        </div>
                                    </div>

                                    {ticket.response && (
                                        <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-800 w-full col-span-2">
                                            <p className="text-xs font-bold text-secondary-500 uppercase mb-1">Resposta do Admin</p>
                                            <p className="text-sm text-secondary-700 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-900 p-3 rounded-lg border border-secondary-200 dark:border-secondary-800">
                                                {ticket.response}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Users className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
                                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">Nenhum chamado encontrado</h3>
                                <p className="text-secondary-500 mb-6">Você ainda não abriu nenhum chamado na Central de Ajuda.</p>
                                <Link to="/ajuda">
                                    <Button>Abrir Novo Chamado</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    myEvaluations.length > 0 ? (
                        myEvaluations.map(evaluation => (
                            <Card key={evaluation.id}>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs text-secondary-500">{new Date(evaluation.createdAt).toLocaleDateString()}</span>
                                        <span className="text-xl" title="Humor">{evaluation.mood < 5 ? '🙁' : evaluation.mood < 8 ? '😐' : evaluation.mood < 10 ? '🙂' : '🤩'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-secondary-500">Presença</p>
                                            <p className="font-bold">{evaluation.presence}/10</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-500">Empenho</p>
                                            <p className="font-bold">{evaluation.effort}/10</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
                                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">Nenhuma avaliação encontrada</h3>
                                <p className="text-secondary-500 mb-6">Você ainda não enviou nenhuma autoavaliação.</p>
                                <Link to="/autoavaliacao">
                                    <Button>Fazer Autoavaliação</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )
                )}
            </div>
        </div >
    );
}
