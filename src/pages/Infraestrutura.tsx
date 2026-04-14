import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Modal } from '../components/ui/Modal';
import { Package, Info, ArrowUpRight, CheckCircle2, GripVertical, Download, Search, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import type { Sector, InventoryItem } from '../context/StorageContext';
import { supabase } from '../lib/supabase';
import { Camera, Loader2 } from 'lucide-react';

export default function Infraestrutura() {
    const { sectors, loans, addLoan, currentUser, userRole, reorderSectors } = useStorage();
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
    const [selectedItemForLoan, setSelectedItemForLoan] = useState<InventoryItem | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [loanQuantity, setLoanQuantity] = useState<number | ''>(1);
    const [loanDays, setLoanDays] = useState<number | ''>(7);
    const [loanPhoto, setLoanPhoto] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loanType, setLoanType] = useState<'Empréstimo' | 'Empréstimo Temporário' | 'Uso Contínuo'>('Empréstimo');

    const isAdmin = userRole === 'admin_master' || userRole === 'admin_infra';

    // Keep selectedSector in sync with realtime updates
    React.useEffect(() => {
        if (selectedSector) {
            const updated = sectors.find(s => s.id === selectedSector.id);
            if (updated) {
                setSelectedSector(updated);
            }
        }
    }, [sectors, selectedSector]);

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

    const handleLoanRequest = async (type: 'Empréstimo' | 'Uso Contínuo' | 'Empréstimo Temporário') => {
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
                const daysToAdd = typeof loanDays === 'number' ? loanDays : 1;
                date.setDate(date.getDate() + daysToAdd);
                returnDate = date.toISOString();
            } else if (type === 'Empréstimo Temporário') {
                // Return date is today for temporary loans
                const date = new Date();
                returnDate = date.toISOString();
            }

            const finalQuantity = typeof loanQuantity === 'number' ? loanQuantity : 1;
            const success = await addLoan(selectedItemForLoan.id, type, finalQuantity, returnDate, photoUrl);

            if (success) {
                setSelectedItemForLoan(null);
                setLoanQuantity(1);
                setLoanDays(7);
                setLoanPhoto(null);
                setLoanType('Empréstimo');
            }
            setIsUploading(false);
        }
    };

    const handleExportInventory = () => {
        const BOM = "\uFEFF";
        let csvContent = BOM + "Setor;Categoria;Nome do Item;Código;Quantidade;Status\r\n";

        sectors.forEach(sector => {
            sector.items.forEach(item => {
                const safeSectorName = (sector.name || '').replace(/"/g, '""');
                const safeCategory = (sector.category || '').replace(/"/g, '""');
                const safeItemName = (item.name || '').replace(/"/g, '""');
                const safeCode = (item.code || '').replace(/"/g, '""');
                const safeStatus = (item.status || '').replace(/"/g, '""');

                const row = [
                    `"${safeSectorName}"`,
                    `"${safeCategory}"`,
                    `"${safeItemName}"`,
                    `"${safeCode}"`,
                    item.quantity,
                    `"${safeStatus}"`
                ].join(";");
                csvContent += row + "\r\n";
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const encodedUri = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `estoque-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(encodedUri);
        toast.success("Relatório de estoque baixado!");
    };

    const handleExportLoans = () => {
        const BOM = "\uFEFF";
        let csvContent = BOM + "ID;Item;Solicitante;Tipo;Quantidade;Data Cadastro;Devolução Prevista;Status\r\n";

        loans.forEach(loan => {
            const safeId = (loan.id || '').replace(/"/g, '""');
            const safeItemName = (loan.itemName || '').replace(/"/g, '""');
            const safeUserName = (loan.userName || '').replace(/"/g, '""');
            const safeType = (loan.type || '').replace(/"/g, '""');
            
            let displayStatus: string = loan.status || '';
            if (loan.type === 'Uso Contínuo') displayStatus = 'Retirado';
            const safeStatus = displayStatus.replace(/"/g, '""');

            const row = [
                `"${safeId}"`,
                `"${safeItemName}"`,
                `"${safeUserName}"`,
                `"${safeType}"`,
                loan.quantity || 1,
                `"${new Date(loan.date).toLocaleDateString()}"`,
                `"${loan.expectedReturnDate ? new Date(loan.expectedReturnDate).toLocaleDateString() : '-'}"`,
                `"${safeStatus}"`
            ].join(";");
            csvContent += row + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const encodedUri = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `historico-emprestimos-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(encodedUri);
        toast.success("Relatório de histórico baixado!");
    };

    // Calculate search results
    const searchResults = React.useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();

        const results: Array<{ item: InventoryItem; sectorName: string }> = [];
        sectors.forEach(sector => {
            sector.items.forEach(item => {
                if (item.name.toLowerCase().includes(term) || (item.code && item.code.toLowerCase().includes(term))) {
                    results.push({ item, sectorName: sector.name });
                }
            });
        });

        return results.slice(0, 8); // Limit to top 8 results to avoid unmanageable dropdowns
    }, [searchTerm, sectors]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Infraestrutura e Inventário</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">
                        Visualize a organização do armário e localize os materiais disponíveis.
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportInventory} className="flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Relatório de Estoque
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportLoans} className="flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Histórico de Empréstimos
                        </Button>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto z-20">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                        type="text"
                        placeholder="Buscar material no armário (ex: Caneta, tesoura, papel)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                    />
                </div>

                {/* Dropdown Results */}
                {searchTerm.trim() !== '' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                        {searchResults.length > 0 ? (
                            <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                {searchResults.map((result, idx) => (
                                    <li key={idx} className="p-3 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                                                        {result.item.name}
                                                    </span>
                                                    {result.item.code && (
                                                        <span className="text-[10px] bg-secondary-100 dark:bg-secondary-800 px-1.5 py-0.5 rounded font-mono text-secondary-600 dark:text-secondary-400">
                                                            {result.item.code}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-secondary-500 flex items-center">
                                                        <Package className="w-3 h-3 mr-1" />
                                                        {result.sectorName}
                                                    </span>
                                                    <span className="text-secondary-300 dark:text-secondary-700">&bull;</span>
                                                    <span className="text-xs text-secondary-500">
                                                        Estoque: <strong className="text-secondary-700 dark:text-secondary-300">{result.item.quantity}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                                                    ${result.item.status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        result.item.status === 'Indisponível' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                                                `}>
                                                    {result.item.status}
                                                </span>

                                                {currentUser && result.item.quantity > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        className="h-7 text-xs px-3 shadow-none"
                                                        onClick={() => {
                                                            setSelectedItemForLoan(result.item);
                                                            setLoanQuantity(1);
                                                            setLoanDays(7);
                                                            setSearchTerm(''); // Limpa a busca ao abrir o modal
                                                        }}
                                                    >
                                                        Solicitar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-secondary-500 flex flex-col items-center">
                                <Search className="w-8 h-8 text-secondary-300 mb-2 opacity-50" />
                                <p>Nenhum item encontrado no armário com "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row justify-center items-end gap-8 w-full max-w-6xl mx-auto pb-4">
                {/* Cabinet Simulation Container */}
                <div className="relative bg-[#5D4037] p-4 rounded-lg shadow-2xl border-4 border-[#3E2723] max-w-4xl w-full">
                    {/* Cabinet Header/Top */}
                    <div className="absolute -top-3 left-0 right-0 h-4 bg-[#4E342E] rounded-t-lg mx-2" />

                    {/* Grid of Sectors with Custom Layout */}
                    <div
                        className="grid grid-cols-2 gap-4 bg-[#3E2723] p-4 rounded border-2 border-[#5D4037]"
                        style={{ gridTemplateRows: 'repeat(14, minmax(40px, 1fr))' }}
                    >
                        {sectors.slice(0, 13).map((sector, index) => {
                            // Calculate Grid Position based on Index
                            let gridAreaClass = '';

                            // Top 3 rows (Standard, 2 slots high each) check
                            if (index === 0) gridAreaClass = 'col-start-1 row-start-1 row-span-2 w-[calc(50%-8px)] justify-self-start';
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
                            
                            // Nova Categoria 13 dividindo o espaço com a Categoria 1 (coluna 1, linha 1)
                            else if (index === 12) gridAreaClass = 'col-start-1 row-start-1 row-span-2 w-[calc(50%-8px)] justify-self-end';

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

                {/* Organizer Box (Index 13) */}
                {sectors[13] && (
                    <div className="flex-shrink-0 w-full lg:w-72 mt-8 lg:mt-0 relative group perspective-1000">
                        <div
                            draggable={isAdmin}
                            onDragStart={() => handleDragStart(13)}
                            onDragOver={(e) => handleDragOver(e, 13)}
                            onDrop={(e) => handleDrop(e, 13)}
                            onClick={() => setSelectedSector(sectors[13])}
                            className={`relative bg-gradient-to-b from-white/60 to-white/30 dark:from-secondary-800/60 dark:to-secondary-800/30 backdrop-blur-md border-2 border-white/50 dark:border-secondary-600 rounded-b-xl rounded-t-sm shadow-[0_10px_30px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(255,255,255,0.4)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.1)] p-6 min-h-[200px] flex flex-col items-center justify-center transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.15),inset_0_0_20px_rgba(255,255,255,0.6)] ${isAdmin ? 'cursor-move' : 'cursor-pointer'} ${draggedIndex === 13 ? 'opacity-50' : ''}`}
                        >
                            {/* Plastic Box Lid overlay effect */}
                            <div className="absolute -top-6 left-0 right-0 h-8 bg-gradient-to-b from-white/90 to-white/70 dark:from-secondary-700/90 dark:to-secondary-600/70 rounded-t-xl border-x-2 border-t-2 border-white/60 dark:border-secondary-500 shadow-sm flex items-center justify-center group-hover:-translate-y-1 transition-transform origin-bottom z-10">
                                {/* Box Handle Indentation */}
                                <div className="w-16 h-2 bg-black/10 dark:bg-black/20 rounded-full" />
                            </div>
                            
                            {/* Front Lip / Ridge of the box */}
                            <div className="absolute top-0 left-0 right-0 h-3 bg-white/40 dark:bg-secondary-500/40 border-b border-white/30 dark:border-secondary-500/30"></div>

                            {/* Internal shadow for depth */}
                            <div className="absolute inset-x-2 inset-y-4 rounded-lg shadow-[inset_0_4px_15px_rgba(0,0,0,0.05)] pointer-events-none"></div>

                            {/* Label */}
                            <div className="z-10 text-center relative p-3 bg-white/80 dark:bg-secondary-900/80 rounded-lg shadow-sm border border-secondary-100 dark:border-secondary-800 backdrop-blur-sm transform transition-transform group-hover:scale-105 mt-2">
                                <span className="block text-secondary-900 dark:text-secondary-100 font-bold text-lg">{sectors[13].name}</span>
                                <span className="block text-primary-600 dark:text-primary-400 font-medium text-[10px] uppercase tracking-wider">{sectors[13].category}</span>
                            </div>

                            {/* Drag Handle (Admin Only) */}
                            {isAdmin && (
                                <div className="absolute top-4 left-4 opacity-60 group-hover:opacity-100 transition-opacity z-20">
                                    <GripVertical className="text-secondary-600 dark:text-secondary-400 h-5 w-5" />
                                </div>
                            )}

                            {/* Hover Info Icon */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <Info className="text-secondary-600 dark:text-secondary-400 h-5 w-5" />
                            </div>

                            {/* Item Count Badge */}
                            <div className="absolute bottom-4 right-4 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm font-medium z-20">
                                {sectors[13].items.length} itens
                            </div>
                            
                            {/* Semi-transparent items illustration inside the box */}
                            {sectors[13].items.length > 0 && (
                                <div className="absolute bottom-2 left-6 right-8 h-1/3 opacity-20 dark:opacity-30 flex items-end gap-1 overflow-hidden pointer-events-none">
                                    {Array.from({ length: Math.min(sectors[13].items.length, 5) }).map((_, i) => (
                                        <div key={i} className={`w-8 h-${['12', '16', '10', '14', '8'][i % 5]} bg-secondary-600 dark:bg-secondary-300 rounded-t-sm rotate-${[-6, 12, -2, 8, -10][i % 5]}`}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
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

                    <div className="space-y-3">
                        <label className="text-sm font-medium">Tipo de Solicitação</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => setLoanType('Empréstimo')}
                                className={`p-3 rounded-lg border text-left transition-all ${loanType === 'Empréstimo' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20' : 'border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900'}`}
                            >
                                <div className="font-semibold text-primary-700 dark:text-primary-400">Empréstimo</div>
                                <div className="text-[10px] text-secondary-500 mt-1">Devolução padrão</div>
                            </button>
                            <button
                                onClick={() => setLoanType('Empréstimo Temporário')}
                                className={`p-3 rounded-lg border text-left transition-all ${loanType === 'Empréstimo Temporário' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-500/20' : 'border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900'}`}
                            >
                                <div className="font-semibold text-yellow-700 dark:text-yellow-400">Temporário</div>
                                <div className="text-[10px] text-secondary-500 mt-1">Uso no mesmo dia</div>
                            </button>
                            <button
                                onClick={() => setLoanType('Uso Contínuo')}
                                className={`p-3 rounded-lg border text-left transition-all ${loanType === 'Uso Contínuo' ? 'border-secondary-500 bg-secondary-100 dark:bg-secondary-800 ring-2 ring-secondary-500/20' : 'border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900'}`}
                            >
                                <div className="font-semibold text-secondary-800 dark:text-secondary-200">Retirada</div>
                                <div className="text-[10px] text-secondary-500 mt-1">Sem devolução</div>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Input
                                label="Quantidade"
                                type="number"
                                min={1}
                                max={selectedItemForLoan?.quantity || 1}
                                value={loanQuantity}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') setLoanQuantity('');
                                    else setLoanQuantity(Math.min(Math.max(1, parseInt(val)), selectedItemForLoan?.quantity || 1));
                                }}
                            />
                        </div>
                        {loanType === 'Empréstimo' && (
                            <div className="space-y-2">
                                <Input
                                    label="Devolver em (dias)"
                                    type="number"
                                    min={1}
                                    value={loanDays}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') setLoanDays('');
                                        else setLoanDays(Math.max(1, parseInt(val)));
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {loanType === 'Empréstimo' && typeof loanDays === 'number' && loanDays > 0 && (
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
                            {!loanPhoto ? (
                                <div className="flex w-full gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => setLoanPhoto(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="loan-photo-upload-camera"
                                        />
                                        <label
                                            htmlFor="loan-photo-upload-camera"
                                            className="flex flex-col items-center justify-center w-full p-3 border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors text-center"
                                        >
                                            <Camera className="w-5 h-5 mb-1 text-secondary-500" />
                                            <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Tirar Foto</span>
                                        </label>
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setLoanPhoto(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="loan-photo-upload-gallery"
                                        />
                                        <label
                                            htmlFor="loan-photo-upload-gallery"
                                            className="flex flex-col items-center justify-center w-full p-3 border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors text-center"
                                        >
                                            <ImageIcon className="w-5 h-5 mb-1 text-secondary-500" />
                                            <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Galeria</span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                                    <span className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center truncate">
                                        <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="truncate">{loanPhoto.name}</span>
                                    </span>
                                    <button 
                                        onClick={() => setLoanPhoto(null)} 
                                        className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 ml-2"
                                        title="Remover foto"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-secondary-500">
                            Registre o estado atual do item antes de retirar.
                        </p>
                    </div>

                        <Button
                            onClick={() => handleLoanRequest(loanType)}
                            disabled={isUploading || !loanPhoto}
                            className="w-full p-6 text-lg"
                        >
                            {isUploading ? (
                                <span className="flex items-center">
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                                    Enviando solicitação...
                                </span>
                            ) : (
                                <span className="flex items-center justify-between w-full">
                                    <span>Confirmar Solicitação</span>
                                    {loanType === 'Empréstimo' && <ArrowUpRight className="h-5 w-5 opacity-70" />}
                                    {loanType === 'Empréstimo Temporário' && <ArrowUpRight className="h-5 w-5 opacity-70" />}
                                    {loanType === 'Uso Contínuo' && <CheckCircle2 className="h-5 w-5 opacity-70" />}
                                </span>
                            )}
                        </Button>
                </div>
            </Modal>
        </div>
    );
}
