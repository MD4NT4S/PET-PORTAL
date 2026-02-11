import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Modal } from './ui/Modal';
import { toast } from 'sonner';

export default function PhotoWall() {
    const { photos, addPhoto, removePhoto, currentUser, userRole, isAdmin } = useStorage();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [newPhotoDesc, setNewPhotoDesc] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhotoUrl.trim() && !selectedFile) {
            toast.error('Adicione uma URL ou selecione um arquivo');
            return;
        }
        await addPhoto(newPhotoUrl, newPhotoDesc, selectedFile || undefined);
        setNewPhotoUrl('');
        setNewPhotoDesc('');
        setSelectedFile(null);
        setIsAddModalOpen(false);
    };

    const canDelete = (photoAuthor: string) => {
        if (!currentUser) return false;
        if (isAdmin) return true; // Admins can delete any photo
        return currentUser === photoAuthor; // Members can delete their own
    };

    return (
        <section className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-white">Mural do PET</h2>
                    <p className="text-secondary-500 dark:text-secondary-400">
                        Um espaço para compartilharmos nossos momentos.
                    </p>
                </div>
                {currentUser && (
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Foto
                    </Button>
                )}
            </div>

            {/* Board Container */}
            <div className="relative bg-stone-200 dark:bg-stone-900 p-8 rounded-xl shadow-inner border-8 border-stone-300 dark:border-stone-800 min-h-[500px]">

                {/* Board Texture/Pattern Overlay (Optional) */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {photos.length === 0 ? (
                    <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[300px] text-stone-500">
                        <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">O mural está vazio.</p>
                        <p className="text-sm">Adicione a primeira foto para começar a coleção!</p>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-wrap justify-center content-start gap-4 pb-20">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                className="group relative w-36 bg-white p-2 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:z-50 hover:scale-110"
                                style={{
                                    transform: `rotate(${photo.rotation}deg)`,
                                    marginTop: index % 2 === 0 ? '0px' : '20px', // Stagger vertical alignment
                                    marginLeft: '-15px', // Force overlap
                                    marginRight: '-15px',
                                }}
                            >
                                {/* Tape/Pin Effect (Visual only) */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 bg-yellow-100/80 shadow-sm transform -rotate-2"></div>

                                {/* Polaroid Effect */}
                                <div className="aspect-square w-full overflow-hidden mb-2 bg-stone-100">
                                    <img
                                        src={photo.url}
                                        alt={photo.description || 'Foto do mural'}
                                        className="h-full w-full object-cover pointer-events-none select-none"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Erro+na+Imagem';
                                        }}
                                    />
                                </div>
                                <div className="px-1">
                                    <p className="font-handwriting text-xs text-stone-800 truncate font-bold text-center mb-1">
                                        {photo.description || ''}
                                    </p>
                                    <p className="text-[10px] text-stone-400 text-center">
                                        {new Date(photo.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Delete Button (Overlay) */}
                                {canDelete(photo.author) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Remover esta foto?')) removePhoto(photo.id);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-50 cursor-pointer"
                                        title="Remover foto"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Photo Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar ao Mural">
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Foto</label>

                        <div className="flex flex-col gap-3">
                            {/* File Input */}
                            <div className="border-2 border-dashed border-secondary-300 rounded-lg p-4 text-center hover:bg-secondary-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedFile(e.target.files[0]);
                                            setNewPhotoUrl(''); // Clear URL if file selected
                                        }
                                    }}
                                />
                                {selectedFile ? (
                                    <p className="text-primary-600 font-medium truncate">{selectedFile.name}</p>
                                ) : (
                                    <div className="flex flex-col items-center text-secondary-500">
                                        <ImageIcon className="h-6 w-6 mb-1" />
                                        <span className="text-sm">Clique para enviar um arquivo</span>
                                    </div>
                                )}
                            </div>

                            <div className="relative flex py-1 items-center">
                                <div className="flex-grow border-t border-secondary-300"></div>
                                <span className="flex-shrink-0 mx-4 text-secondary-400 text-xs">OU</span>
                                <div className="flex-grow border-t border-secondary-300"></div>
                            </div>

                            <Input
                                placeholder="Cole a URL da imagem..."
                                value={newPhotoUrl}
                                onChange={e => {
                                    setNewPhotoUrl(e.target.value);
                                    setSelectedFile(null); // Clear file if URL entered
                                }}
                                disabled={!!selectedFile}
                                className="bg-secondary-50 dark:bg-secondary-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Legenda (Opcional)</label>
                        <Input
                            placeholder="Descreva o momento..."
                            value={newPhotoDesc}
                            onChange={e => setNewPhotoDesc(e.target.value)}
                            maxLength={50}
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!newPhotoUrl && !selectedFile}>
                            Postar Foto
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
