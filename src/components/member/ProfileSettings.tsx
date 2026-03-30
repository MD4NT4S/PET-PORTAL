import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../../context/StorageContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Camera, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

// Redimensiona a imagem para no máximo maxSize x maxSize antes de converter para base64
function resizeImage(file: File, maxSize = 200): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
            } else {
                if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;

        reader.readAsDataURL(file);
    });
}

export function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
    const { currentUser, members, updateMember } = useStorage();
    const currentMember = members.find(m => m.name === currentUser);
    const [name, setName] = useState(currentMember?.name || '');
    const [email, setEmail] = useState(currentMember?.email || '');
    const [password, setPassword] = useState(currentMember?.password || '');
    const [photoUrl, setPhotoUrl] = useState(currentMember?.photoUrl || '');
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Atualiza estado local quando o membro muda (ex: após recarregar dados)
    useEffect(() => {
        if (currentMember) {
            setName(currentMember.name);
            setEmail(currentMember.email);
            setPassword(currentMember.password || '');
            setPhotoUrl(currentMember.photoUrl || '');
        }
    }, [currentMember?.id, isOpen]); // recarrega também quando o modal abre

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMember) return;

        setIsSaving(true);
        try {
            await updateMember(currentMember.id, {
                name,
                email,
                password,
                photoUrl
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading('Processando imagem...');
            const resized = await resizeImage(file, 200);
            setPhotoUrl(resized);
            toast.dismiss();
        } catch {
            toast.dismiss();
            toast.error('Erro ao processar imagem.');
        }

        // Limpa o input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    };

    if (!currentMember) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Minha Conta">
            <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                    <div className="relative h-24 w-24 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center overflow-hidden mb-2">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-secondary-500">{name.charAt(0)}</span>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="mr-2 h-4 w-4" />
                            Alterar Foto
                        </Button>
                        {photoUrl && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setPhotoUrl('')}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium dark:text-secondary-200">Nome</label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium dark:text-secondary-200">Email</label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium dark:text-secondary-200">Senha</label>
                    <div className="relative">
                        <Input
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
