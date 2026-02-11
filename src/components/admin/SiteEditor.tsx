import React, { useState, useEffect } from 'react';
import { useStorage } from '../../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Layout, Type, Phone, Share2, Globe } from 'lucide-react';
import { SimpleEditor } from './SimpleEditor';

export default function SiteEditor() {
    const { siteConfig, updateSiteConfig } = useStorage();
    const [configForm, setConfigForm] = useState(siteConfig);
    const [activeSection, setActiveSection] = useState<'hero' | 'pillars' | 'contact' | 'footer' | 'dashboard'>('hero');

    // Sync form with context when it changes (e.g. initial load)
    useEffect(() => {
        setConfigForm(siteConfig);
    }, [siteConfig]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateSiteConfig(configForm);
        toast.success('Configurações do site atualizadas com sucesso!');
    };

    const handleChange = (section: string, key: string, value: any) => {
        setConfigForm(prev => ({
            ...prev,
            [section]: {
                ...(prev[section as keyof typeof prev] as object),
                [key]: value
            }
        }));
    };

    const handlePillarChange = (pillar: 'teaching' | 'research' | 'extension', field: 'title' | 'description', value: string) => {
        setConfigForm(prev => ({
            ...prev,
            pillars: {
                ...prev.pillars,
                [pillar]: {
                    ...prev.pillars[pillar],
                    [field]: value
                }
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <Card className="md:w-64 h-fit">
                    <CardContent className="p-2">
                        <nav className="space-y-1">
                            {[
                                { id: 'hero', label: 'Principal (Hero)', icon: Layout },
                                { id: 'pillars', label: 'Pilares', icon: Type },
                                { id: 'contact', label: 'Contatos & Social', icon: Share2 },
                                { id: 'dashboard', label: 'Dashboard / Calendário', icon: Layout },
                                { id: 'footer', label: 'Rodapé', icon: Globe },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id as any)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === item.id
                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                        : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800'
                                        }`}
                                >
                                    <item.icon className="mr-3 h-4 w-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </CardContent>
                </Card>

                {/* Editor Content */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>
                            {activeSection === 'hero' && 'Editar Seção Principal'}
                            {activeSection === 'pillars' && 'Editar Pilares'}
                            {activeSection === 'contact' && 'Editar Contatos e Redes Sociais'}
                            {activeSection === 'dashboard' && 'Editar Dashboard e Calendário'}
                            {activeSection === 'footer' && 'Editar Rodapé'}
                        </CardTitle>
                        <CardDescription>
                            Faça alterações no conteúdo visível do site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">

                            {activeSection === 'hero' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <Input
                                        label="Título Principal"
                                        value={configForm.heroTitle}
                                        onChange={e => setConfigForm({ ...configForm, heroTitle: e.target.value })}
                                        placeholder="Ex: Bem-vindo ao PET Hub"
                                    />
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Descrição</label>
                                        <SimpleEditor
                                            value={configForm.heroDescription}
                                            onChange={value => setConfigForm({ ...configForm, heroDescription: value })}
                                            placeholder="Breve descrição do grupo..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'pillars' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="p-4 border rounded-lg border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10">
                                        <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                            Ensino
                                        </h4>
                                        <div className="space-y-3">
                                            <Input
                                                label="Título do Pilar"
                                                value={configForm.pillars.teaching.title}
                                                onChange={e => handlePillarChange('teaching', 'title', e.target.value)}
                                            />
                                            <Input
                                                label="Descrição Curta"
                                                value={configForm.pillars.teaching.description}
                                                onChange={e => handlePillarChange('teaching', 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg border-purple-200 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-900/10">
                                        <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                                            Pesquisa
                                        </h4>
                                        <div className="space-y-3">
                                            <Input
                                                label="Título do Pilar"
                                                value={configForm.pillars.research.title}
                                                onChange={e => handlePillarChange('research', 'title', e.target.value)}
                                            />
                                            <Input
                                                label="Descrição Curta"
                                                value={configForm.pillars.research.description}
                                                onChange={e => handlePillarChange('research', 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10">
                                        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                            Extensão
                                        </h4>
                                        <div className="space-y-3">
                                            <Input
                                                label="Título do Pilar"
                                                value={configForm.pillars.extension.title}
                                                onChange={e => handlePillarChange('extension', 'title', e.target.value)}
                                            />
                                            <Input
                                                label="Descrição Curta"
                                                value={configForm.pillars.extension.description}
                                                onChange={e => handlePillarChange('extension', 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'contact' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input
                                            label="Email de Contato"
                                            value={configForm.contact.email}
                                            onChange={e => handleChange('contact', 'email', e.target.value)}
                                            placeholder="contato@exemplo.com"
                                        />
                                        <Input
                                            label="Telefone (Opcional)"
                                            value={configForm.contact.phone || ''}
                                            onChange={e => handleChange('contact', 'phone', e.target.value)}
                                            placeholder="(00) 0000-0000"
                                        />
                                    </div>
                                    <Input
                                        label="Endereço (Opcional)"
                                        value={configForm.contact.address || ''}
                                        onChange={e => handleChange('contact', 'address', e.target.value)}
                                        placeholder="Sala 123, Bloco A..."
                                    />

                                    <hr className="border-secondary-200 dark:border-secondary-800" />

                                    <h4 className="font-medium">Redes Sociais</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input
                                            label="Instagram"
                                            value={configForm.contact.instagram || ''}
                                            onChange={e => handleChange('contact', 'instagram', e.target.value)}
                                            placeholder="@usuario"
                                        />
                                        <Input
                                            label="LinkedIn"
                                            value={configForm.contact.linkedin || ''}
                                            onChange={e => handleChange('contact', 'linkedin', e.target.value)}
                                            placeholder="company/usuario"
                                        />
                                        <Input
                                            label="GitHub"
                                            value={configForm.contact.github || ''}
                                            onChange={e => handleChange('contact', 'github', e.target.value)}
                                            placeholder="usuario"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'footer' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <Input
                                        label="Texto do Rodapé"
                                        value={configForm.footer.text}
                                        onChange={e => handleChange('footer', 'text', e.target.value)}
                                        placeholder="Mensagem exibida no rodapé"
                                    />
                                    <Input
                                        label="Copyright (Opcional)"
                                        value={configForm.footer.copyright || ''}
                                        onChange={e => handleChange('footer', 'copyright', e.target.value)}
                                        placeholder="© 2024 Todos os direitos reservados"
                                    />
                                </div>
                            )}

                            {activeSection === 'dashboard' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Foco do Ciclo</label>
                                        <div className="text-xs text-secondary-500 mb-1">
                                            Mensagem exibida na barra lateral do calendário e dashboard.
                                        </div>
                                        <SimpleEditor
                                            value={configForm.cycleFocus || ''}
                                            onChange={value => setConfigForm({ ...configForm, cycleFocus: value })}
                                            placeholder="Este mês estamos focados em..."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="submit" className="w-full md:w-auto">
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
