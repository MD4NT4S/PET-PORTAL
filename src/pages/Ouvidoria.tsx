import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStorage } from '../context/StorageContext';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

const schema = z.object({
    type: z.enum(['Elogio', 'Sugestão', 'Reclamação']),
    text: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres'),
    isAnonymous: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function Ouvidoria() {
    const { addOmbudsman, currentUser } = useStorage();
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isAnonymous: false,
            type: 'Sugestão'
        }
    });

    const onSubmit = (data: FormData) => {
        addOmbudsman({
            ...data,
            identification: data.isAnonymous ? undefined : (currentUser || 'Membro Identificado')
        });
        toast.success('Manifestação enviada com sucesso!', {
            description: 'Sua mensagem foi registrada e será analisada.',
            icon: <CheckCircle2 className="text-green-500" />
        });
        reset();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Ouvidoria</h1>
                <p className="text-secondary-500 dark:text-secondary-400">
                    Canal seguro para envio de sugestões, elogios ou reclamações.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Nova Manifestação</CardTitle>
                        <CardDescription>
                            Preencha o formulário abaixo. Seus dados são tratados com confidencialidade.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo</label>
                                <select
                                    {...register('type')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                                >
                                    <option value="Sugestão">Sugestão</option>
                                    <option value="Elogio">Elogio</option>
                                    <option value="Reclamação">Reclamação</option>
                                </select>
                                {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mensagem</label>
                                <textarea
                                    {...register('text')}
                                    rows={5}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 resize-none"
                                    placeholder="Descreva sua manifestação com detalhes..."
                                />
                                {errors.text && <p className="text-red-500 text-xs">{errors.text.message}</p>}
                            </div>

                            <div className="flex items-center space-x-2 rounded-md border border-secondary-200 p-3 bg-secondary-50 dark:bg-secondary-900 dark:border-secondary-800">
                                <input
                                    type="checkbox"
                                    id="anonymous"
                                    {...register('isAnonymous')}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                                />
                                <label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
                                    Enviar anonimamente
                                </label>
                            </div>

                            <Button type="submit" className="w-full">
                                Enviar Manifestação
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20">
                        <CardHeader>
                            <CardTitle className="flex items-center text-primary-700 dark:text-primary-400">
                                <ShieldAlert className="mr-2 h-5 w-5" />
                                Política de Privacidade
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-primary-800 dark:text-primary-300">
                            <p>
                                Todas as manifestações são tratadas com sigilo absoluto. Ao optar pelo envio anônimo,
                                nenhum dado de identificação será salvo no sistema.
                            </p>
                            <br />
                            <p>
                                As reclamações são encaminhadas diretamente para a comissão de ética do grupo.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dicas para um bom relato</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
                            <div className="flex items-start">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                                <p>Seja objetivo e claro na descrição dos fatos.</p>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                                <p>Se possível, inclua datas e locais.</p>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                                <p>Para sugestões, explique o benefício esperado.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
