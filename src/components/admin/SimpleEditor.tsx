import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Type, RotateCcw } from 'lucide-react';

interface SimpleEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SimpleEditor({ value, onChange, placeholder }: SimpleEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isThinking, setIsThinking] = useState(false); // Debounce state if needed

    // Initial load of content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            // Only update if significantly different to avoid cursor jumps
            // A simple check is usually enough for initial load or external resets
            if (value === '' && editorRef.current.innerHTML === '<br>') return;
            editorRef.current.innerHTML = value;
        }
    }, []); // Run once on mount, or we handle updates carefully

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const content = e.currentTarget.innerHTML;
        onChange(content);
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    return (
        <div className="border border-secondary-300 dark:border-secondary-700 rounded-md overflow-hidden bg-white dark:bg-secondary-950 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-secondary-50 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800">
                <ToolbarButton
                    onClick={() => execCommand('bold')}
                    icon={<Bold className="w-4 h-4" />}
                    title="Negrito"
                />
                <ToolbarButton
                    onClick={() => execCommand('italic')}
                    icon={<Italic className="w-4 h-4" />}
                    title="Itálico"
                />
                <ToolbarButton
                    onClick={() => execCommand('underline')}
                    icon={<Underline className="w-4 h-4" />}
                    title="Sublinhado"
                />
                <div className="w-px h-4 bg-secondary-300 dark:bg-secondary-700 mx-1" />
                <ToolbarButton
                    onClick={() => execCommand('insertUnorderedList')}
                    icon={<List className="w-4 h-4" />}
                    title="Lista com Marcadores"
                />
                <ToolbarButton
                    onClick={() => execCommand('insertOrderedList')}
                    icon={<ListOrdered className="w-4 h-4" />}
                    title="Lista Numerada"
                />
                <div className="w-px h-4 bg-secondary-300 dark:bg-secondary-700 mx-1" />
                <ToolbarButton
                    onClick={() => execCommand('formatBlock', 'h3')}
                    icon={<Type className="w-4 h-4" />}
                    title="Título (H3)"
                />
                <ToolbarButton
                    onClick={() => execCommand('removeFormat')}
                    icon={<RotateCcw className="w-4 h-4" />}
                    title="Limpar Formatação"
                />
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="p-3 min-h-[150px] focus:outline-none text-sm prose dark:prose-invert max-w-none"
                data-placeholder={placeholder}
            />

            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                }
            `}</style>
        </div>
    );
}

function ToolbarButton({ onClick, icon, title }: { onClick: () => void; icon: React.ReactNode; title: string }) {
    return (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className="p-1.5 rounded hover:bg-secondary-200 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-300 transition-colors"
            title={title}
        >
            {icon}
        </button>
    );
}
