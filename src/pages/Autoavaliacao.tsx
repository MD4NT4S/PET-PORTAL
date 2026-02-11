import React from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Frown, Meh, Smile, Heart } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema
const evaluationSchema = z.object({
    memberName: z.string().min(1, 'Selecione seu nome'),
    month: z.string().min(1, 'Selecione o mês'),

    // Section 1: Indicadores
    meetingParticipation: z.number(),
    weeklyDedication: z.string().min(1, 'Campo obrigatório'),
    goalCompliance: z.string().min(1, 'Campo obrigatório'),
    academicProduction: z.string().min(1, 'Campo obrigatório'),

    // Section 2: Coordenadoria e Espaço
    sectorPerformance: z.string().min(1, 'Campo obrigatório'),
    roomCare: z.string().min(1, 'Campo obrigatório'),

    // Section 3: Satisfação (0-10)
    satisfactionGroup: z.number(),
    satisfactionTutor: z.number(),
    satisfactionCoordination: z.number(),
    satisfactionBalance: z.number(),
    peerEvaluations: z.record(z.string(), z.number()),
    effort: z.number(),

    // Section 5: Bem-estar
    mood: z.enum(['Estressado', 'Neutro', 'Bem', 'Motivado']),
    experienceReport: z.string().min(1, 'Campo obrigatório'),
    improvement: z.string().optional(),
    positiveHighlight: z.string().optional(),
});

type EvaluationForm = z.infer<typeof evaluationSchema>;

export default function Autoavaliacao() {
    console.log("Autoavaliacao component rendering");
    const { addEvaluation, currentUser, members } = useStorage();
    const navigate = useNavigate();

    const { control, handleSubmit, register, formState: { errors } } = useForm<EvaluationForm>({
        resolver: zodResolver(evaluationSchema),
        defaultValues: {
            memberName: currentUser || '',
            month: '',
            meetingParticipation: 5,
            satisfactionGroup: 5,
            satisfactionTutor: 5,
            satisfactionCoordination: 5,
            satisfactionBalance: 5,
            peerEvaluations: {},
            effort: 5,
            mood: undefined,
        }
    });

    const onSubmit = (data: EvaluationForm) => {
        // Map Emoji to Number for StorageContext/DB
        const moodMap = {
            'Estressado': 1,
            'Neutro': 5,
            'Bem': 8,
            'Motivado': 10
        };

        addEvaluation({
            presence: data.meetingParticipation,
            effort: data.effort,
            mood: moodMap[data.mood],
            feeling: data.experienceReport,
            improvement: data.improvement || '',
            criteria: {
                // Satisfaction
                satisfactionGroup: data.satisfactionGroup,
                satisfactionTutor: data.satisfactionTutor,
                satisfactionCoordination: data.satisfactionCoordination,
                satisfactionBalance: data.satisfactionBalance,
                peerEvaluations: data.peerEvaluations,

                // Text Answers
                weeklyDedication: data.weeklyDedication,
                goalCompliance: data.goalCompliance,
                academicProduction: data.academicProduction,
                sectorPerformance: data.sectorPerformance,
                roomCare: data.roomCare,
                positiveHighlight: data.positiveHighlight,

                // Metadata
                month: data.month
            }
        });

        toast.success('Autoavaliação enviada com sucesso!');
        navigate('/dashboard');
    };

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Custom Slider Component
    const CustomSlider = ({ value, onChange, label, max = 10 }: { value: number, onChange: (val: number) => void, label: string, max?: number }) => (
        <div className="space-y-4 mb-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{label}</label>
                <span className="text-primary-600 font-bold">{value}</span>
            </div>
            <input
                type="range"
                min="0"
                max={max}
                step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer dark:bg-secondary-700 accent-primary-600"
            />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">Autoavaliação Mensal – PET-Civil UFPA</h1>
                <p className="text-secondary-500 dark:text-secondary-400 mt-2 text-justify">
                    Este formulário tem como objetivo monitorar o cumprimento das normas do Programa de Educação Tutorial (PET), conforme previsto em nosso Estatuto, e servir como um canal de escuta ativa sobre o seu bem-estar dentro do grupo. Suas respostas auxiliam a coordenadoria de Gestão de Pessoas no acompanhamento de cada membro e na melhoria do clima organizacional.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Identificação */}
                <Card className="border-l-4 border-l-primary-600">
                    <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-500">Membro</label>
                            <div className="w-full rounded-md border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm text-secondary-900 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white font-medium">
                                {currentUser}
                            </div>
                            <input type="hidden" {...register('memberName')} value={currentUser || ''} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mês de Referência</label>
                            <Controller
                                name="month"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                                    >
                                        <option value="">Selecione...</option>
                                        {months.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.month && <p className="text-xs text-red-500">{errors.month.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Seção 1: Indicadores de Desempenho */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2 border-secondary-200 dark:border-secondary-800">Seção 1: Indicadores de Desempenho (Estatuto)</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <Controller
                                name="meetingParticipation"
                                control={control}
                                render={({ field }) => (
                                    <CustomSlider
                                        label="Participação em Reuniões: De 0 a 10, como avalia sua presença e participação ativa nas reuniões semanais? (Lembre-se que o mínimo exigido é 75%)"
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dedicação Semanal</label>
                                <p className="text-xs text-secondary-500 mb-1">Você conseguiu cumprir a carga horária de 20 horas semanais exigida pelo programa? Caso tenha havido dedicação inferior, justifique o motivo (saúde, graduação ou pesquisa).</p>
                                <textarea
                                    {...register('weeklyDedication')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                    placeholder="Sua resposta..."
                                />
                                {errors.weeklyDedication && <p className="text-xs text-red-500">{errors.weeklyDedication.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cumprimento de Metas</label>
                                <p className="text-xs text-secondary-500 mb-1">Como avalia seu desempenho na entrega de metas Imediatas, Intermediárias e Leves dentro dos prazos estipulados?</p>
                                <textarea
                                    {...register('goalCompliance')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                    placeholder="Sua resposta..."
                                />
                                {errors.goalCompliance && <p className="text-xs text-red-500">{errors.goalCompliance.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Produção Acadêmica e Lattes</label>
                                <p className="text-xs text-secondary-500 mb-1">Você progrediu na elaboração de sua publicação anual obrigatória em evento científico ou manteve seu Currículo Lattes devidamente atualizado este mês?</p>
                                <textarea
                                    {...register('academicProduction')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                    placeholder="Sua resposta..."
                                />
                                {errors.academicProduction && <p className="text-xs text-red-500">{errors.academicProduction.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Seção 2: Atuação na Coordenadoria e Espaço Físico */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2 border-secondary-200 dark:border-secondary-800">Seção 2: Atuação na Coordenadoria e Espaço Físico</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Desempenho no Setor</label>
                                <p className="text-xs text-secondary-500 mb-1">Como você avalia sua execução nas tarefas da sua atual coordenadoria (Ensino, Extensão, Pesquisa, Infraestrutura, Divulgação, Secretaria, Tesouraria ou Gestão de Pessoas)?</p>
                                <textarea
                                    {...register('sectorPerformance')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                    placeholder="Sua resposta..."
                                />
                                {errors.sectorPerformance && <p className="text-xs text-red-500">{errors.sectorPerformance.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Zelo pela Sala (LEC)</label>
                                <p className="text-xs text-secondary-500 mb-1">Você cumpriu com as responsabilidades de limpeza e organização da sala do PET (LEC), seguindo a escala e as normas de saída (apagar luzes, ar-condicionado e trancar a porta)?</p>
                                <textarea
                                    {...register('roomCare')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                    placeholder="Sua resposta..."
                                />
                                {errors.roomCare && <p className="text-xs text-red-500">{errors.roomCare.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Seção 3: Nível de Satisfação */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2 border-secondary-200 dark:border-secondary-800">Seção 3: Nível de Satisfação (0 a 10)</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <Controller name="satisfactionGroup" control={control} render={({ field }) => <CustomSlider label="Satisfação com o Grupo" value={field.value} onChange={field.onChange} />} />
                            <Controller name="satisfactionTutor" control={control} render={({ field }) => <CustomSlider label="Satisfação com a Tutoria" value={field.value} onChange={field.onChange} />} />
                            <Controller name="satisfactionCoordination" control={control} render={({ field }) => <CustomSlider label="Satisfação com a sua Coordenadoria Atual" value={field.value} onChange={field.onChange} />} />
                            <Controller name="satisfactionBalance" control={control} render={({ field }) => <CustomSlider label="Equilíbrio entre PET e Faculdade de Engenharia Civil" value={field.value} onChange={field.onChange} />} />
                            <Controller name="effort" control={control} render={({ field }) => <CustomSlider label="Nível de empenho pessoal nas atividades" value={field.value} onChange={field.onChange} />} />
                        </CardContent>
                    </Card>
                </div>

                {/* Seção 4: Relacionamento Interpessoal */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2 border-secondary-200 dark:border-secondary-800">Seção 4: Relacionamento Interpessoal (0 a 10)</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <p className="text-sm text-secondary-500 mb-4">
                                Avalie seu relacionamento com cada membro do grupo. Considere a comunicação, colaboração e convivência.
                            </p>
                            {members
                                .filter(m => m.name !== currentUser)
                                .map(member => (
                                    <Controller
                                        key={member.id}
                                        name={`peerEvaluations.${member.name}`}
                                        control={control}
                                        defaultValue={5}
                                        render={({ field }) => (
                                            <CustomSlider
                                                label={`Relacionamento com ${member.name}`}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                ))
                            }
                        </CardContent>
                    </Card>
                </div>

                {/* Seção 5: Bem-estar e Espaço Aberto */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2 border-secondary-200 dark:border-secondary-800">Seção 5: Bem-estar e Espaço Aberto</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Estado Emocional</label>
                                <p className="text-xs text-secondary-500 mb-2">Selecione o emoji que melhor descreve seu sentimento em relação ao grupo este mês.</p>
                                <Controller
                                    name="mood"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { value: 'Estressado', icon: Frown, color: 'text-red-500', bg: 'bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800' },
                                                { value: 'Neutro', icon: Meh, color: 'text-gray-500', bg: 'bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:border-gray-700' },
                                                { value: 'Bem', icon: Smile, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800' },
                                                { value: 'Motivado', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 hover:bg-pink-100 border-pink-200 dark:bg-pink-900/20 dark:hover:bg-pink-900/30 dark:border-pink-800' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => field.onChange(option.value)}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${field.value === option.value
                                                        ? `ring-2 ring-primary-600 ring-offset-2 ${option.bg} dark:ring-offset-secondary-950`
                                                        : `border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700`
                                                        }`}
                                                >
                                                    <option.icon className={`h-8 w-8 mb-2 ${option.color}`} />
                                                    <span className="font-medium text-sm">{option.value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                />
                                {errors.mood && <p className="text-xs text-red-500 pt-1">Selecione uma opção</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Relato de Experiência</label>
                                <p className="text-xs text-secondary-500 mb-1">Utilize este espaço para falar abertamente sobre como você se sente. Houve algum momento de maior dificuldade pessoal ou acadêmica que impactou seu rendimento?</p>
                                <textarea
                                    {...register('experienceReport')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[100px]"
                                    placeholder="Sua resposta..."
                                />
                                {errors.experienceReport && <p className="text-xs text-red-500">{errors.experienceReport.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">O que pode melhorar?</label>
                                <p className="text-xs text-secondary-500 mb-1">Existe algum processo no PET-Civil, dinâmica de reunião ou atividade que você acredita que poderia ser otimizada para o próximo ciclo?</p>
                                <textarea
                                    {...register('improvement')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                    placeholder="Sua resposta (opcional)..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Destaque Positivo</label>
                                <p className="text-xs text-secondary-500 mb-1">Gostaria de elogiar a atuação de algum colega ou destacar algo positivo que aconteceu no grupo este mês?</p>
                                <textarea
                                    {...register('positiveHighlight')}
                                    className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700 min-h-[80px]"
                                    placeholder="Sua resposta (opcional)..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button size="lg" type="submit" className="w-full md:w-auto px-12">
                        Enviar Avaliação
                    </Button>
                </div>
            </form>
        </div>
    );
}
