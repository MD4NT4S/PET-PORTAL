import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Modal } from '../components/ui/Modal';
import { Package, Info, ArrowUpRight, CheckCircle2, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import type { Sector, InventoryItem } from '../context/StorageContext';
import { supabase } from '../lib/supabase';
import { Camera, Loader2 } from 'lucide-react';

export default function Infraestrutura() {
    const { sectors, addLoan, currentUser, userRole, reorderSectors } = useStorage();
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
    const [selectedItemForLoan, setSelectedItemForLoan] = useState<InventoryItem | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const [loanQuantity, setLoanQuantity] = useState(1);
    const [loanDays, setLoanDays] = useState(7);
    const [loanPhoto, setLoanPhoto] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const isAdmin = userRole === 'admin_master' || userRole === 'admin_infra';

    const handleDragStart = (index: number) => {
        if (!isAdmin) return;
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (!isAdmin || draggedIndex === null) return;
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (!isAdmin || draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        // Swap positions instead of splice
        const newSectors = [...sectors];
        const temp = newSectors[draggedIndex];
        newSectors[draggedIndex] = newSectors[dropIndex];
        newSectors[dropIndex] = temp;

        reorderSectors(newSectors);
        setDraggedIndex(null);
    };

    const handleLoanRequest = async (type: 'Empréstimo' | 'Uso Contínuo') => {
        if (selectedItemForLoan) {
            if (!loanPhoto) {
                toast.error('É obrigatório enviar uma foto do item.');
                return;
            }

            setIsUploading(true);
            let photoUrl = '';

            try {
                const fileExt = loanPhoto.name.split('.').pop();
                const fileName = `loan-withdrawal-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('photos')
                    .upload(fileName, loanPhoto);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
                photoUrl = data.publicUrl;

            } catch (error) {
                console.error('Upload Error:', error);
                toast.error('Erro ao enviar foto.');
                setIsUploading(false);
                return;
            }

            let returnDate = undefined;
            if (type === 'Empréstimo') {
                const date = new Date();
                date.setDate(date.getDate() + loanDays);
                returnDate = date.toISOString();
            }

            const success = await addLoan(selectedItemForLoan.id, type, loanQuantity, returnDate, photoUrl);

            if (success) {
                setSelectedItemForLoan(null);
                setLoanQuantity(1);
                setLoanDays(7);
                setLoanPhoto(null);
            }
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Infraestrutura e Inventário</h1>
                <p className="text-secondary-500 dark:text-secondary-400">
                    Visualize a organização do armário e localize os materiais disponíveis.
                </p>
            </div>

            <div className="flex justify-center">
                {/* Cabinet Simulation Container */}
                <div className="relative bg-[#5D4037] p-4 rounded-lg shadow-2xl border-4 border-[#3E2723] max-w-4xl w-full">
                    {/* Cabinet Header/Top */}
                    <div className="absolute -top-3 left-0 right-0 h-4 bg-[#4E342E] rounded-t-lg mx-2" />

                    {/* Grid of Sectors with Custom Layout */}
                    <div
                        className="grid grid-cols-2 gap-4 bg-[#3E2723] p-4 rounded border-2 border-[#5D4037]"
                        style={{ gridTemplateRows: 'repeat(14, minmax(40px, 1fr))' }}
                    >
                        {sectors.map((sector, index) => {
                            // Calculate Grid Position based on Index
                            let gridAreaClass = '';

                            // Top 3 rows (Standard, 2 slots high each) check
                            if (index === 0) gridAreaClass = 'col-start-1 row-start-1 row-span-2';
                            else if (index === 1) gridAreaClass = 'col-start-2 row-start-1 row-span-2';
                            else if (index === 2) gridAreaClass = 'col-start-1 row-start-3 row-span-2';
                            else if (index === 3) gridAreaClass = 'col-start-2 row-start-3 row-span-2';
                            else if (index === 4) gridAreaClass = 'col-start-1 row-start-5 row-span-2';
                            else if (index === 5) gridAreaClass = 'col-start-2 row-start-5 row-span-2';

                            // Bottom Section (Complex)
                            // Left Column (4 items, 2 slots high each)
                            else if (index === 6) gridAreaClass = 'col-start-1 row-start-7 row-span-2';
                            else if (index === 7) gridAreaClass = 'col-start-1 row-start-9 row-span-2';
                            else if (index === 8) gridAreaClass = 'col-start-1 row-start-11 row-span-2';
                            else if (index === 9) gridAreaClass = 'col-start-1 row-start-13 row-span-2';

                            // Right Column (2 items, 2.5 and 1.5 equivalent = 5 and 3 slots)
                            else if (index === 10) gridAreaClass = 'col-start-2 row-start-7 row-span-5';
                            else if (index === 11) gridAreaClass = 'col-start-2 row-start-12 row-span-3';

                            return (
                                <div
                                    key={sector.id}
                                    draggable={isAdmin}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onClick={() => setSelectedSector(sector)}
                                    className={`group relative bg-[#D7CCC8]/10 hover:bg-[#D7CCC8]/20 border-2 border-[#A1887F]/30 hover:border-[#A1887F] rounded transition-all ${isAdmin ? 'cursor-move' : 'cursor-pointer'} flex flex-col items-center justify-center overflow-hidden ${gridAreaClass} ${draggedIndex === index ? 'opacity-50' : ''}`}
                                >
                                    {/* Wood Texture Effect Overlay */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none" />

                                    {/* Label */}
                                    <div className="z-10 text-center p-2 transition-transform group-hover:scale-110">
                                        <span className="block text-white/90 font-bold text-lg drop-shadow-md">{sector.name}</span>
                                        <span className="block text-white/60 text-xs uppercase tracking-wider text-[10px]">{sector.category}</span>
                                    </div>

                                    {/* Drag Handle (Admin Only) */}
                                    {isAdmin && (
                                        <div className="absolute top-2 left-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <GripVertical className="text-white/80 h-4 w-4" />
                                        </div>
                                    )}

                                    {/* Hover Info Icon */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Info className="text-white/80 h-4 w-4" />
                                    </div>

                                    {/* Item Count Badge */}
                                    <div className="absolute bottom-2 right-2 bg-primary-600/90 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                        {sector.items.length} itens
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Cabinet Footer/Bottom */}
                    <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[#4E342E] rounded-b-lg mx-2" />
                </div>
            </div>

            {/* Sector Details Modal */}
            <Modal
                isOpen={!!selectedSector}
                onClose={() => setSelectedSector(null)}
                title={selectedSector ? selectedSector.name : 'Detalhes do Setor'}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                        <span className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Categoria</span>
                        <span className="font-bold text-primary-700 dark:text-primary-400">{selectedSector?.category}</span>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center text-secondary-700 dark:text-secondary-200">
                            <Package className="h-4 w-4 mr-2" />
                            Itens Armazenados ({selectedSector?.items.length})
                        </h4>
                        <div className="bg-secondary-50 dark:bg-secondary-900/50 rounded-lg p-4 max-h-[300px] overflow-y-auto border border-secondary-100 dark:border-secondary-800">
                            {selectedSector?.items.length === 0 ? (
                                <p className="text-sm text-secondary-500 italic text-center py-4">Este setor está vazio.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {selectedSector?.items.map(item => (
                                        <li key={item.id} className="text-sm border-b border-dashed border-secondary-200 dark:border-secondary-800 last:border-0 pb-2 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 shrink-0" />
                                                    <div>
                                                        <span className="font-medium text-secondary-900 dark:text-secondary-100">{item.name}</span>
                                                        {item.code && <span className="ml-2 text-xs text-secondary-500 bg-secondary-200 dark:bg-secondary-800 px-1 rounded font-mono">{item.code}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                                        ${item.status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            item.status === 'Indisponível' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                                                    `}>
                                                        {item.status}
                                                    </span>
                                                    {currentUser && item.quantity > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 text-xs"
                                                            onClick={() => {
                                                                setSelectedItemForLoan(item);
                                                                setLoanQuantity(1);
                                                                setLoanDays(7);
                                                            }}
                                                        >
                                                            Solicitar
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pl-3.5 mt-1 text-xs text-secondary-500">
                                                Quantidade disponível: {item.quantity}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Loan Confirmation Modal */}
            <Modal
                isOpen={!!selectedItemForLoan}
                onClose={() => setSelectedItemForLoan(null)}
                title="Realizar Empréstimo"
            >
                <div className="space-y-6">
                    <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg">
                        <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-1">Item selecionado:</p>
                        <p className="font-bold text-lg">{selectedItemForLoan?.name}</p>
                        <p className="text-xs text-secondary-500 mt-1">Disponível em estoque: {selectedItemForLoan?.quantity}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantidade</label>
                            <input
                                type="number"
                                min="1"
                                max={selectedItemForLoan?.quantity || 1}
                                value={loanQuantity}
                                onChange={(e) => setLoanQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), selectedItemForLoan?.quantity || 1))}
                                className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Devolver em (dias)</label>
                            <input
                                type="number"
                                min="1"
                                value={loanDays}
                                onChange={(e) => setLoanDays(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {loanDays > 0 && (
                        <p className="text-sm text-secondary-500">
                            Data prevista de devolução: <span className="font-semibold">{(() => {
                                const d = new Date();
                                d.setDate(d.getDate() + loanDays);
                                return d.toLocaleDateString();
                            })()}</span>
                        </p>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Foto do Item (Obrigatório)</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-full">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLoanPhoto(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="loan-photo-upload"
                                />
                                <label
                                    htmlFor="loan-photo-upload"
                                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer hover:bg-secondary-50 transition-colors"
                                >
                                    {loanPhoto ? (
                                        <span className="text-sm text-green-600 font-medium flex items-center">
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            {loanPhoto.name}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-secondary-500 flex items-center">
                                            <Camera className="w-4 h-4 mr-2" />
                                            Clique para tirar ou escolher foto
                                        </span>
                                    )}
                                </label>
                            </div>
                        </div>
                        <p className="text-xs text-secondary-500">
                            Registre o estado atual do item antes de retirar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => handleLoanRequest('Empréstimo')}
                            disabled={isUploading}
                            className={`flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 transition-all text-left group
                                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div>
                                <span className="block font-semibold text-primary-700 dark:text-primary-400 group-hover:text-primary-800">Confirmar Empréstimo</span>
                                <span className="text-xs text-secondary-500">Item será devolvido ao estoque.</span>
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-secondary-400 group-hover:text-primary-500" />
                        </button>

                        <button
                            onClick={() => handleLoanRequest('Uso Contínuo')}
                            disabled={isUploading}
                            className={`flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-800 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-900 hover:border-secondary-300 transition-all text-left group
                                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div>
                                <span className="block font-semibold text-secondary-800 dark:text-secondary-200">Confirmar Uso Contínuo</span>
                                <span className="text-xs text-secondary-500">Item será consumido/sem devolução.</span>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-secondary-400 group-hover:text-secondary-600" />
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
