import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Heart, Plus, Send, Quote, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface KudosForm {
    to: string;
    message: string;
    isAnonymous: boolean;
}

export default function Feedback() {
    const { feedbacks, addFeedback, removeFeedback, currentUser, userRole } = useStorage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm<KudosForm>();

    const onSubmit = (data: KudosForm) => {
        addFeedback({
            to: data.to,
            message: data.message,
            from: data.isAnonymous ? 'Anônimo' : (currentUser || 'Membro')
        });
        toast.success("Kudos enviado!", {
            description: `Sua mensagem foi entregue para ${data.to}.`,
            icon: <Heart className="text-red-500 fill-red-500" />
        });
        reset();
        setIsModalOpen(false);
    };

    const bgColors = [
        'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20',
        'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20',
        'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20',
        'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/20',
        'bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/20',
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mural de Kudos</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">
                        Reconheça o trabalho dos seus colegas. Um elogio muda o dia!
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} size="lg" className="rounded-full shadow-lg">
                    <Heart className="mr-2 h-5 w-5 fill-white" />
                    Enviar Kudos
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {feedbacks.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <Heart className="mx-auto h-16 w-16 text-secondary-200 fill-secondary-50 mb-4" />
                        <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">O mural está vazio</h3>
                        <p className="text-secondary-500 mt-2">Seja o primeiro a enviar uma mensagem positiva!</p>
                    </div>
                ) : (
                    feedbacks.map((item, idx) => (
                        <Card key={item.id} className={`transform hover:-translate-y-1 transition-all duration-300 ${bgColors[idx % bgColors.length]}`}>
                            <CardContent className="pt-6 relative">
                                <Quote className="h-8 w-8 text-black/5 absolute top-4 right-4" />
                                <p className="text-lg font-medium italic text-secondary-800 dark:text-secondary-200 mb-6">
                                    "{item.message}"
                                </p>
                                <div className="flex items-end justify-between border-t border-black/5 pt-4">
                                    <div className="flex gap-4 w-full">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-secondary-500 uppercase font-bold tracking-wider">Para</span>
                                            <span className="font-semibold text-secondary-900 dark:text-secondary-100">{item.to}</span>
                                        </div>
                                        <div className="flex flex-col text-right ml-auto">
                                            <span className="text-xs text-secondary-500 uppercase font-bold tracking-wider">De</span>
                                            <span className="font-semibold text-secondary-900 dark:text-secondary-100">{item.from}</span>
                                        </div>
                                    </div>
                                </div>
                                {['admin_master', 'admin_gp'].includes(userRole || '') && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Remover este Kudos?')) removeFeedback(item.id);
                                        }}
                                        className="absolute top-2 right-2 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Remover (Admin)"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Enviar Kudos"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Para quem?</label>
                        <input
                            {...register('to', { required: true })}
                            type="text"
                            placeholder="Nome do colega"
                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sua mensagem</label>
                        <textarea
                            {...register('message', { required: true })}
                            rows={4}
                            placeholder="Ex: Obrigado pela ajuda com o projeto de React! Você explicou super bem."
                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="anon-kudos"
                            {...register('isAnonymous')}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                        />
                        <label htmlFor="anon-kudos" className="text-sm text-secondary-600 dark:text-secondary-400">
                            Enviar anonimamente
                        </label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            <Send className="mr-2 h-4 w-4" /> Enviar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
