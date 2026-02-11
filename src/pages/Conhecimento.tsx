import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Download, FileText, Search, FileSpreadsheet, File, Plus, X, Trash2, ExternalLink, UploadCloud } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useStorage } from '../context/StorageContext';
import { toast } from 'sonner';

export default function Conhecimento() {
    const { documents, addDocument, removeDocument, userRole } = useStorage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newDoc, setNewDoc] = useState({
        title: '',
        category: 'Normas',
        url: '',
        type: 'pdf',
        size: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const isAdmin = userRole === 'admin_master';

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'pdf': return <FileText className="h-6 w-6 text-red-500" />;
            case 'xls':
            case 'xlsx': return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
            case 'doc':
            case 'docx': return <FileText className="h-6 w-6 text-blue-500" />;
            default: return <File className="h-6 w-6 text-secondary-500" />;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Auto-fill details
            const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

            setNewDoc(prev => ({
                ...prev,
                title: prev.title || file.name.split('.')[0], // Auto title if empty
                type: ext,
                size: `${sizeInMB} MB`
            }));
        }
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newDoc.title) {
            toast.error('O título é obrigatório');
            return;
        }

        if (!selectedFile && !newDoc.url) {
            toast.error('Adicione um arquivo ou uma URL');
            return;
        }

        await addDocument(newDoc, selectedFile || undefined);

        setIsModalOpen(false);
        setNewDoc({ title: '', category: 'Normas', url: '', type: 'pdf', size: '' });
        setSelectedFile(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
                    <p className="text-secondary-500 dark:text-secondary-400">
                        Acesse documentos, modelos e normas do grupo.
                    </p>
                </div>
                <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                        <Input
                            placeholder="Buscar documentos..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Arquivo
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredDocs.map((doc) => (
                    <Card key={doc.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors group">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                                    {getIcon(doc.type)}
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                                        {doc.title}
                                    </h3>
                                    <p className="text-sm text-secondary-500 flex items-center gap-2">
                                        <span className="bg-secondary-100 dark:bg-secondary-800 px-2 py-0.5 rounded text-xs">
                                            {doc.category}
                                        </span>
                                        {doc.size && (
                                            <>
                                                {/* <span className="w-1 h-1 rounded-full bg-secondary-400" /> */}
                                                <span className="text-xs border border-secondary-200 dark:border-secondary-700 px-1 rounded">{doc.size}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-secondary-500 hover:text-primary-600"
                                    onClick={() => window.open(doc.url, '_blank')}
                                    title="Abrir / Baixar"
                                >
                                    <Download className="h-5 w-5" />
                                </Button>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => removeDocument(doc.id)}
                                        title="Excluir (Admin)"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredDocs.length === 0 && (
                    <div className="text-center py-12 text-secondary-500">
                        Nenhum documento encontrado para "{searchTerm}".
                    </div>
                )}
            </div>

            {/* Modal de Adição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Adicionar Documento</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddDocument} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Upload de Arquivo (Opicional)</label>
                                    <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                        />
                                        <UploadCloud className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                                        <p className="text-sm text-secondary-500">
                                            {selectedFile ? selectedFile.name : 'Clique ou arraste um arquivo aqui'}
                                        </p>
                                    </div>
                                </div>

                                <Input
                                    label="Título do Arquivo"
                                    value={newDoc.title}
                                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                    placeholder="Ex: Estatuto 2024"
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Categoria</label>
                                        <select
                                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                                            value={newDoc.category}
                                            onChange={e => setNewDoc({ ...newDoc, category: e.target.value })}
                                        >
                                            <option>Normas</option>
                                            <option>Modelos</option>
                                            <option>Administrativo</option>
                                            <option>Design</option>
                                            <option>Outros</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tipo</label>
                                        <select
                                            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-secondary-950 dark:border-secondary-700"
                                            value={newDoc.type}
                                            onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                                        >
                                            <option value="pdf">PDF</option>
                                            <option value="doc">Word (DOC/DOCX)</option>
                                            <option value="xls">Excel (XLS/XLSX)</option>
                                            <option value="img">Imagem</option>
                                            <option value="other">Outro</option>
                                        </select>
                                    </div>
                                </div>

                                {!selectedFile && (
                                    <Input
                                        label="URL do Arquivo (Link Externo)"
                                        value={newDoc.url}
                                        onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
                                        placeholder="https://..."
                                        // Required only if no file selected
                                        required={!selectedFile}
                                    />
                                )}

                                <div className="pt-2 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit">
                                        {selectedFile ? 'Fazer Upload e Salvar' : 'Salvar Link'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
