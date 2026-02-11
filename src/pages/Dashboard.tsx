import React, { useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Activity, Heart } from 'lucide-react';

export default function Dashboard() {
    const { evaluations } = useStorage();

    const metrics = useMemo(() => {
        // Filter by Current Month
        const now = new Date();
        const currentMonthEvaluations = evaluations.filter(ev => {
            const evDate = new Date(ev.createdAt);
            return evDate.getMonth() === now.getMonth() && evDate.getFullYear() === now.getFullYear();
        });

        if (currentMonthEvaluations.length === 0) return null;

        const totalPresence = currentMonthEvaluations.reduce((acc, curr) => acc + curr.presence, 0);
        const totalEffort = currentMonthEvaluations.reduce((acc, curr) => acc + curr.effort, 0);
        const totalMood = currentMonthEvaluations.reduce((acc, curr) => acc + curr.mood, 0);

        // Averages
        const count = currentMonthEvaluations.length;
        const avgPresence = totalPresence / count; // 0-10
        const avgEffort = totalEffort / count; // 0-10
        const avgMood = totalMood / count; // 0-10

        // Satisfaction Averages (New Logic)
        const satisfactionKeys = [
            { key: 'satisfactionGroup', label: 'Satisfação com Grupo', source: 'criteria' },
            { key: 'satisfactionTutor', label: 'Satisfação com Tutoria', source: 'criteria' },
            { key: 'satisfactionCoordination', label: 'Satisfação com Coordenadoria', source: 'criteria' },
            { key: 'satisfactionBalance', label: 'Equilíbrio (PET x Faculdade)', source: 'criteria' },
            { key: 'effort', label: 'Nível de Empenho', source: 'root' }
        ];

        const avgSatisfaction = satisfactionKeys.map(item => {
            const sum = currentMonthEvaluations.reduce((acc, curr) => {
                let val = 0;
                if (item.source === 'criteria') {
                    val = curr.criteria?.[item.key] || 0;
                } else {
                    val = (curr as any)[item.key] || 0;
                }
                return acc + val;
            }, 0);

            return {
                name: item.label,
                value: (sum / count).toFixed(1)
            };
        });

        // Climate Logic
        let climateLabel = '';
        let climateColor = '';
        if (avgMood <= 4.0) {
            climateLabel = 'PETdrástico';
            climateColor = 'text-red-600 bg-red-100 dark:bg-red-900/20';
        } else if (avgMood <= 6.0) {
            climateLabel = 'PETsado';
            climateColor = 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
        } else if (avgMood <= 8.0) {
            climateLabel = 'PETfeito';
            climateColor = 'text-green-600 bg-green-100 dark:bg-green-900/20';
        } else {
            climateLabel = 'ImPETcável';
            climateColor = 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
        }

        return {
            avgPresence,
            avgPresencePct: (avgPresence * 10).toFixed(0), // %
            avgEffort: avgEffort.toFixed(1),
            avgMood: avgMood.toFixed(1),
            climateLabel,
            climateColor,
            satisfaction: avgSatisfaction,
            count
        };
    }, [evaluations]);

    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Activity className="h-16 w-16 text-secondary-200" />
                <h2 className="text-xl font-semibold text-secondary-700">Sem dados neste mês</h2>
                <p className="text-secondary-500 max-w-md">
                    Ainda não há autoavaliações registradas para o mês atual.
                    Realize sua autoavaliação para visualizar as métricas do grupo.
                </p>
            </div>
        )
    }

    const statsCards = [
        { label: 'Participação (Mês)', value: metrics.count, icon: Users, color: 'text-blue-600' },
        { label: 'Taxa de Presença', value: `${metrics.avgPresencePct}%`, icon: Activity, color: 'text-green-600' },
        { label: 'Média de Sentimento', value: metrics.avgMood, icon: Heart, color: metrics.climateColor.split(' ')[0], bg: metrics.climateColor },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transparência & Métricas</h1>
                <p className="text-secondary-500 text-lg">Visão geral do engajamento e clima do grupo (Mês Atual).</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statsCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-secondary-500">{stat.label}</p>
                                    <p className={`text-2xl font-bold mt-1 ${stat.bg ? 'text-sm' : ''}`}>{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-full bg-secondary-50 dark:bg-secondary-800 ${stat.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Mood Gauge/Bar */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Termômetro do Grupo</CardTitle>
                        <CardDescription>Média do Sentimento (0-10)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <div className="relative w-full max-w-sm">
                            <div className="flex justify-between text-xs text-secondary-400 mb-2 font-medium">
                                <span>Crítico</span>
                                <span>Neutro</span>
                                <span>Bom</span>
                                <span>Excelente</span>
                            </div>
                            <div className="h-4 w-full bg-secondary-100 rounded-full overflow-hidden flex">
                                <div className="w-[40%] bg-red-400 h-full"></div>
                                <div className="w-[20%] bg-orange-400 h-full"></div>
                                <div className="w-[20%] bg-green-400 h-full"></div>
                                <div className="w-[20%] bg-blue-500 h-full"></div>
                            </div>
                            {/* Indicator */}
                            <div
                                className="absolute top-6 w-full text-center transition-all duration-700"
                            >
                                <div
                                    className="w-1 h-3 bg-black dark:bg-white mx-auto mb-1 animate-bounce"
                                    style={{ marginLeft: `${Number(metrics.avgMood) * 10}%` }}
                                />
                                <span className={`text-xl font-bold ${metrics.climateColor.split(' ')[0]}`}>{metrics.climateLabel}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Criteria Progress Bars */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Níveis de Satisfação</CardTitle>
                        <CardDescription>Média das autoavaliações do grupo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {metrics.satisfaction.map((c) => (
                            <div key={c.name}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                                        {c.name}
                                    </span>
                                    <span className="text-sm font-bold text-secondary-900 dark:text-secondary-100">{c.value}</span>
                                </div>
                                <div className="w-full bg-secondary-100 rounded-full h-2.5 dark:bg-secondary-800">
                                    <div
                                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-1000"
                                        style={{ width: `${Number(c.value) * 10}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
