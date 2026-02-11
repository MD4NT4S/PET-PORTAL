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
    const { currentUser, members, updateMember, loans, returnLoan } = useStorage();
    const currentMember = members.find(m => m.name === currentUser); // Fix definition
    const [activeTab, setActiveTab] = useState<'profile' | 'loans'>('profile');
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
    // ... existing state

    // ... useEffect

    const myLoans = loans.filter(l => l.userId === currentUser);
    const activeLoans = myLoans.filter(l => l.status === 'Ativo');
    const historyLoans = myLoans.filter(l => l.status === 'Devolvido');

    const handleReturn = (loanId: string) => {
        if (confirm('Confirmar devolução do item?')) {
            returnLoan(loanId);
            toast.success('Item devolvido com sucesso!');
        }
    };

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
            <div className="flex space-x-4 border-b border-secondary-200 dark:border-secondary-800 mb-4">
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-secondary-500 hover:text-secondary-700'}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Editar Perfil
                </button>
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'loans' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-secondary-500 hover:text-secondary-700'}`}
                    onClick={() => setActiveTab('loans')}
                >
                    Meus Empréstimos
                </button>
            </div>

            {activeTab === 'profile' ? (
                <form onSubmit={handleSave} className="space-y-4">
                    {/* ... (Existing Profile Form Content) ... */}
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
            ) : (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium mb-3 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Em Aberto
                        </h4>
                        {activeLoans.length === 0 ? (
                            <p className="text-sm text-secondary-500 italic bg-secondary-50 dark:bg-secondary-900/50 p-4 rounded-lg text-center">
                                Você não possui itens emprestados no momento.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {activeLoans.map(loan => (
                                    <div key={loan.id} className="p-3 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-lg flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {loan.itemName}
                                                <span className="text-xs text-secondary-500 ml-1">
                                                    (x{loan.quantity || 1})
                                                </span>
                                            </p>
                                            <p className="text-xs text-secondary-500">
                                                Retirado em: {new Date(loan.date).toLocaleDateString()}
                                            </p>
                                            {loan.expectedReturnDate && loan.type === 'Empréstimo' && (
                                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                    Devolução prevista: {new Date(loan.expectedReturnDate).toLocaleDateString()}
                                                </p>
                                            )}
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full inline-block">
                                                    {loan.type}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium
                                                    ${loan.status === 'Ativo' ? 'bg-yellow-100 text-yellow-700' :
                                                        loan.status === 'Atrasado' ? 'bg-red-100 text-red-700 font-bold' :
                                                            'bg-green-100 text-green-700'}`}>
                                                    {loan.status}
                                                </span>
                                            </div>
                                        </div>
                                        {loan.type === 'Empréstimo' && (
                                            <Button size="sm" variant="outline" onClick={() => handleReturn(loan.id)}>
                                                Devolver
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {historyLoans.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-3 dark:text-white flex items-center gap-2 border-t border-secondary-100 dark:border-secondary-800 pt-4">
                                <span className="w-2 h-2 rounded-full bg-secondary-300"></span>
                                Histórico
                            </h4>
                            <div className="opacity-70 text-sm space-y-2">
                                {historyLoans.map(loan => (
                                    <div key={loan.id} className="flex justify-between items-center py-2 border-b border-dashed border-secondary-200 dark:border-secondary-800">
                                        <span>{loan.itemName}</span>
                                        <span className="text-xs text-secondary-500">Devolvido em: {new Date(loan.date).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
