import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, UserCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { loginUser, members } = useStorage();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');
    const [selectedMember, setSelectedMember] = useState('');
    const [memberPassword, setMemberPassword] = useState('');

    // Admin State
    const [adminIdentifier, setAdminIdentifier] = useState(''); // Email or Name
    const [adminPassword, setAdminPassword] = useState('');
    const [error, setError] = useState(false);

    const handleMemberLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember || !memberPassword) {
            toast.error('Preencha seu nome e senha.');
            return;
        }

        const success = loginUser(selectedMember, memberPassword);

        if (success) {
            toast.success(`Bem-vindo, ${selectedMember}!`);
            navigate('/');
        } else {
            toast.error('Senha incorreta ou usuário não encontrado.');
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminIdentifier || !adminPassword) {
            toast.error('Preencha todos os campos.');
            return;
        }

        const success = loginUser(adminIdentifier.trim(), adminPassword, true);
        if (success) {
            toast.success('Acesso administrativo concedido.');
            navigate('/');
        } else {
            setError(true);
            toast.error('Credenciais incorretas.');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-secondary-100 dark:bg-secondary-950 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-primary-600">Portal PET - CAP</h1>
                    <p className="text-secondary-600 dark:text-secondary-400">Entre para acessar sua central de gestão.</p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex space-x-2 border-b border-secondary-200 dark:border-secondary-800 pb-1 mb-4">
                            <button
                                onClick={() => setActiveTab('member')}
                                className={`flex-1 flex items-center justify-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2
                            ${activeTab === 'member'
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-secondary-500 hover:text-secondary-700'
                                    }`}
                            >
                                <Users className="h-4 w-4" />
                                Sou Membro
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex-1 flex items-center justify-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2
                            ${activeTab === 'admin'
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-secondary-500 hover:text-secondary-700'
                                    }`}
                            >
                                <Lock className="h-4 w-4" />
                                Administração
                            </button>
                        </div>
                        <CardTitle>{activeTab === 'member' ? 'Acesso do Membro' : 'Acesso Administrativo'}</CardTitle>
                        <CardDescription>
                            {activeTab === 'member' ? 'Selecione seu nome para continuar.' : 'Entre com seu email ou usuário de administrador.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeTab === 'member' ? (
                            <form onSubmit={handleMemberLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Seu Nome</label>
                                    <select
                                        className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                                        value={selectedMember}
                                        onChange={(e) => setSelectedMember(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {members.filter(m => m.role === 'member').map(member => (
                                            <option key={member.id} value={member.name}>{member.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Sua Senha"
                                    type="password"
                                    placeholder="••••••••"
                                    value={memberPassword}
                                    onChange={e => setMemberPassword(e.target.value)}
                                />
                                <Button type="submit" className="w-full">
                                    Entrar
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <Input
                                    label="Email ou Usuário"
                                    type="text"
                                    placeholder="admin@pet.com ou Nome" // Removed generic placeholder
                                    value={adminIdentifier}
                                    onChange={(e) => {
                                        setAdminIdentifier(e.target.value);
                                        setError(false);
                                    }}
                                />
                                <Input
                                    label="Senha"
                                    type="password"
                                    placeholder="••••••••"
                                    value={adminPassword}
                                    onChange={(e) => {
                                        setAdminPassword(e.target.value);
                                        setError(false);
                                    }}
                                    error={error ? "Credenciais incorretas" : undefined}
                                />
                                <Button type="submit" className="w-full">
                                    Acessar Painel
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-secondary-500">
                    &copy; {new Date().getFullYear()} Portal PET
                </p>
            </div>
        </div>
    );
}
