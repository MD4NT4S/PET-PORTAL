import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ticket, Users, FileText, Package, Camera, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function MyRequests() {
    const { tickets, evaluations, currentUser, loans, returnLoan } = useStorage();
    const [activeTab, setActiveTab] = useState<'tickets' | 'evaluations' | 'loans'>('tickets');
    const [selectedLoanReturn, setSelectedLoanReturn] = useState<string | null>(null);
    const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Filter by current user
    const myTickets = tickets.filter(t => t.author === currentUser);
    const myEvaluations = evaluations.filter(e => e.author === currentUser);
    const myLoans = loans.filter(l => l.userName === currentUser && (l.status === 'Ativo' || l.status === 'Aguardando Aprovação' || l.status === 'Atrasado'));

    const handleReturnLoan = async () => {
        if (!selectedLoanReturn || !returnPhoto) {
            toast.error('É obrigatório enviar uma foto da devolução.');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = returnPhoto.name.split('.').pop();
            const fileName = `loan-return-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(fileName, returnPhoto);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('photos').getPublicUrl(fileName);

            const success = await returnLoan(selectedLoanReturn, data.publicUrl);

            if (success) {
                setSelectedLoanReturn(null);
                setReturnPhoto(null);
            }
        } catch (error) {
            console.error('Error returning loan:', error);
            toast.error('Erro ao enviar foto de devolução.');
        } finally {
            setIsUploading(false);
        }
    };

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
                <Button
                    variant={activeTab === 'loans' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('loans')}
                >
                    <Package className="mr-2 h-4 w-4" /> Empréstimos
                </Button>
            </div>

            <div className="grid gap-6">
                {activeTab === 'tickets' && (
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
                )}
                {activeTab === 'evaluations' && (
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
                {activeTab === 'loans' && (
                    myLoans.length > 0 ? (
                        myLoans.map(loan => (
                            <Card key={loan.id}>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold
                                                    ${loan.status === 'Ativo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        loan.status === 'Atrasado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                    {loan.status}
                                                </span>
                                                <span className="text-xs text-secondary-500">{new Date(loan.date).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-semibold text-lg">{loan.itemName}</h3>
                                            <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">
                                                Quantidade: {loan.quantity} • Tipo: {loan.type}
                                            </p>
                                            {loan.expectedReturnDate && (
                                                <p className="text-xs text-secondary-500 mt-1">
                                                    Devolução prevista: {new Date(loan.expectedReturnDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {loan.status === 'Ativo' || loan.status === 'Atrasado' ? (
                                                <Button size="sm" onClick={() => setSelectedLoanReturn(loan.id)}>
                                                    Devolver
                                                </Button>
                                            ) : (
                                                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
                                                    Aguardando aprovação
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {loan.withdrawalPhotoUrl && (
                                        <div className="mt-4">
                                            <p className="text-xs font-medium text-secondary-500 mb-2">Foto da Retirada:</p>
                                            <img
                                                src={loan.withdrawalPhotoUrl}
                                                alt="Foto da retirada"
                                                className="w-24 h-24 object-cover rounded-lg border border-secondary-200 dark:border-secondary-700"
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Package className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
                                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">Nenhum empréstimo ativo</h3>
                                <p className="text-secondary-500 mb-6">Você não tem itens pendentes de devolução.</p>
                                <Link to="/infraestrutura">
                                    <Button>Solicitar Material</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )
                )}
            </div>

            <Modal
                isOpen={!!selectedLoanReturn}
                onClose={() => setSelectedLoanReturn(null)}
                title="Devolver Item"
            >
                <div className="space-y-4">
                    <p className="text-sm text-secondary-600 dark:text-secondary-300">
                        Para confirmar a devolução, por favor envie uma foto atual do item mostrando suas condições.
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Foto da Devolução (Obrigatório)</label>
                        <div className="relative w-full">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setReturnPhoto(e.target.files?.[0] || null)}
                                className="hidden"
                                id="return-photo-upload"
                            />
                            <label
                                htmlFor="return-photo-upload"
                                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer hover:bg-secondary-50 transition-colors"
                            >
                                {returnPhoto ? (
                                    <span className="text-sm text-green-600 font-medium flex items-center">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {returnPhoto.name}
                                    </span>
                                ) : (
                                    <span className="text-sm text-secondary-500 flex items-center">
                                        <Camera className="w-4 h-4 mr-2" />
                                        Clique para tirar ou escolher foto
                                    </span>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            className="w-full"
                            onClick={handleReturnLoan}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Enviando...' : 'Confirmar Devolução'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
