'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface LegalDocumentDialogProps {
  title: string;
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LegalDocumentDialog({ title, content, isOpen, onClose }: LegalDocumentDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  // Función para formatear el contenido con títulos en negrita
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Detectar títulos principales (MAYÚSCULAS)
      if (
        line.trim() === line.trim().toUpperCase() &&
        line.trim().length > 0 &&
        line.trim().length < 50
      ) {
        return (
          <h2 key={index} className="mb-3 mt-6 text-base font-bold text-gray-900 first:mt-0">
            {line}
          </h2>
        );
      }
      // Detectar títulos numerados (1. 2. etc)
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <h3 key={index} className="mb-2 mt-4 text-sm font-semibold text-gray-800">
            {line}
          </h3>
        );
      }
      // Detectar línea separadora
      if (line.includes('═══')) {
        return <div key={index} className="my-6 border-t-2 border-gray-300"></div>;
      }
      // Líneas de contenido normales
      if (line.trim().length > 0) {
        return (
          <p key={index} className="mb-2 text-sm leading-relaxed text-gray-600">
            {line}
          </p>
        );
      }
      // Línea vacía (espaciado)
      return <div key={index} className="h-1"></div>;
    });
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative my-auto max-h-[55vh] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(55vh - 55px)' }}>
          <div className="space-y-1">{formatContent(content)}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
