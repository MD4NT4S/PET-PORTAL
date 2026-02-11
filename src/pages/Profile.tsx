import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Lock, Camera, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
    const { currentUser, members, updateMember, userRole } = useStorage();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser && members.length > 0) {
            const member = members.find(m => m.name === currentUser);
            if (member) {
                setUserId(member.id);
                setName(member.name);
                setPassword(member.password || '');
                setPhotoUrl(member.photoUrl || '');
            }
        }
    }, [currentUser, members]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        if (!name.trim()) {
            toast.error('O nome não pode ficar vazio.');
            return;
        }

        updateMember(userId, {
            name,
            password: password || undefined, // Only update if not empty, actually we bind to state so it replaces
            // Wait, if we want to allow empty to keep current, we need logic. 
            // innovative approach: showing plain text password here is requested "alterar suas senhas". 
            // Simple approach: Input shows current password. User changes it.
            photoUrl
        });
    };

    if (!currentUser) {
        return <div className="p-8 text-center">Acesso negado. Faça login.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-secondary-500 dark:text-secondary-400">
                    Gerencie suas informações pessoais e de acesso.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações da Conta</CardTitle>
                    <CardDescription>
                        Você está logado como <span className="font-semibold">{userRole?.includes('admin') ? 'Administrador' : 'Membro'}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex flex-col items-center mb-6 gap-4">
                            <div className="h-24 w-24 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center overflow-hidden border-2 border-primary-100 dark:border-primary-900">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-secondary-400" />
                                )}
                            </div>
                            <div className="flex gap-2 w-full max-w-xs">
                                <Input
                                    placeholder="URL da Foto"
                                    value={photoUrl}
                                    onChange={e => setPhotoUrl(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-secondary-500">Cole a URL de uma imagem para sua foto.</p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Nome Completo"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />

                            <Input
                                label="Senha"
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
