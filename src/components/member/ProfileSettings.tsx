import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../../context/StorageContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Camera, Upload, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
    const { currentUser, members, updateMember } = useStorage();
    const currentMember = members.find(m => m.name === currentUser);
    const [name, setName] = useState(currentMember?.name || '');
    const [email, setEmail] = useState(currentMember?.email || '');
    const [password, setPassword] = useState(currentMember?.password || '');
    const [photoUrl, setPhotoUrl] = useState(currentMember?.photoUrl || '');
    const [showPassword, setShowPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update local state when currentMember changes
    useEffect(() => {
        if (currentMember) {
            setName(currentMember.name);
            setEmail(currentMember.email);
            setPassword(currentMember.password || '');
            setPhotoUrl(currentMember.photoUrl || '');
        }
    }, [currentMember]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMember) return;

        updateMember(currentMember.id, {
            name,
            email,
            password,
            photoUrl
        });

        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </div>
            </form>
        </Modal>
    );
}
