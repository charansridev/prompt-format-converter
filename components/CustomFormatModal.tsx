import React, { useState, useEffect } from 'react';

interface CustomFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFormat: (name: string, instructions: string) => void;
  existingFormats: string[];
}

export const CustomFormatModal: React.FC<CustomFormatModalProps> = ({ isOpen, onClose, onAddFormat, existingFormats }) => {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setInstructions('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instructions.trim()) {
      setError('Both fields are required.');
      return;
    }
    if (existingFormats.some(f => f.toLowerCase() === name.trim().toLowerCase())) {
      setError('This format name already exists.');
      return;
    }
    onAddFormat(name.trim(), instructions.trim());
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-6 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Add Custom Format
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="format-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format Name
              </label>
              <input
                id="format-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., Markdown Table"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="format-instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instructions for the AI
              </label>
              <textarea
                id="format-instructions"
                value={instructions}
                onChange={(e) => {
                  setInstructions(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., Generate a Markdown table with columns for id, name, and role. The header should be clearly defined."
                className="w-full h-32 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Format
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
