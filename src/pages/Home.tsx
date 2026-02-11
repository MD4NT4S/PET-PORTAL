import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStorage } from '../context/StorageContext';
import { ArrowRight, MessageSquare, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PhotoWall from '../components/PhotoWall';

export default function Home() {
    const { tickets, evaluations, siteConfig, loadingConfig } = useStorage();

    if (loadingConfig) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-2xl bg-primary-600 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16 md:px-16 lg:py-20">
                <div className="relative z-10 max-w-2xl space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                        {siteConfig.heroTitle}
                    </h1>
                    <div
                        className="text-lg text-primary-100 max-w-xl"
                        dangerouslySetInnerHTML={{ __html: siteConfig.heroDescription }}
                    />
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link to="/autoavaliacao">
                            <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
                                Fazer Autoavaliação
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/ouvidoria">
                            <Button variant="outline" size="lg" className="border-white text-white hover:bg-primary-700 hover:text-white">
                                Ouvidoria
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Decorative Logo */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-8 opacity-20 transform rotate-12 pointer-events-none">
                    <img src="/logo-white.png" alt="PET Logo" className="w-80 h-80 md:w-96 md:h-96 object-contain" />
                </div>
            </section>

            {/* Photo Wall Section */}
            <PhotoWall />

            {/* Quick Actions / Recent */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Acesso Rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Link to="/ouvidoria" className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary-50 hover:bg-secondary-100 dark:bg-secondary-900 dark:hover:bg-secondary-800 transition-colors border border-secondary-200 dark:border-secondary-800">
                            <MessageSquare className="h-6 w-6 mb-2 text-primary-600" />
                            <span className="font-medium text-sm">Nova Manifestação</span>
                        </Link>
                        <Link to="/autoavaliacao" className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary-50 hover:bg-secondary-100 dark:bg-secondary-900 dark:hover:bg-secondary-800 transition-colors border border-secondary-200 dark:border-secondary-800">
                            <UserCheck className="h-6 w-6 mb-2 text-primary-600" />
                            <span className="font-medium text-sm">Autoavaliação</span>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status do Ciclo</CardTitle>
                        <CardDescription>Resumo das suas atividades.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-secondary-600 dark:text-secondary-400">Tickets Abertos</span>
                            <span className="font-bold">{tickets.filter(t => t.status !== 'Concluído').length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-secondary-600 dark:text-secondary-400">Avaliações Enviadas</span>
                            <span className="font-bold">{evaluations.length}</span>
                        </div>
                        <div className="w-full bg-secondary-200 rounded-full h-2.5 dark:bg-secondary-700 mt-4">
                            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <p className="text-xs text-secondary-500 text-right">45% do ciclo concluído</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
