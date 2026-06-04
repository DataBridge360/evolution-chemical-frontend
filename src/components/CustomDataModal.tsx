'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CustomDataField } from '@/src/modules/chromatography/types';

interface CustomDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomDataField) => void;
  initialData?: CustomDataField;
  mode: 'add' | 'edit';
}

export function CustomDataModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}: CustomDataModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setValue(initialData.value);
      setUnit(initialData.unit);
    } else {
      setName('');
      setValue('');
      setUnit('');
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    onSave({ name: name.trim(), value: value.trim(), unit: unit.trim() });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Agregar Dato Personalizado' : 'Editar Dato'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Temperatura ambiente"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Valor</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ej: 25"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Unidad</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ej: °C, mbar, etc."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {mode === 'add' ? 'Agregar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
