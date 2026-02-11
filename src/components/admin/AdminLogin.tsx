import React, { useState } from 'react';
import { useStorage } from '../../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
    const { loginUser } = useStorage();
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = loginUser('admin', password, true);
        if (success) {
            toast.success('Login realizado com sucesso!');
        } else {
            setError(true);
            toast.error('Senha incorreta.');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-secondary-100 dark:bg-secondary-800 p-3 rounded-full w-fit mb-4">
                        <Lock className="h-8 w-8 text-primary-600" />
                    </div>
                    <CardTitle>Acesso Restrito</CardTitle>
                    <CardDescription>
                        Esta área é exclusiva para administradores.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Senha de Acesso"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            error={error ? "Senha incorreta" : undefined}
                        />
                        <Button type="submit" className="w-full">
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
