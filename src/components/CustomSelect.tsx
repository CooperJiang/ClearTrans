'use client';

import { useState } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Language[];
  placeholder?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(option => option.code === value);

  return (
    <div className="relative w-full min-w-[140px]">
      <button
        type="button"
        className="w-full min-w-[140px] bg-gray-50 border border-gray-200 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-100 transition-colors flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          {selectedOption ? (
            <>
              <span className="mr-2">{selectedOption.flag}</span>
              <span>{selectedOption.name}</span>
            </>
          ) : (
            placeholder || '选择语言'
          )}
        </span>
        <i className={`fas fa-chevron-down text-xs ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto w-full">
            {options.map((option) => (
              <button
                key={option.code}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center transition-colors"
                onClick={() => {
                  onChange(option.code);
                  setIsOpen(false);
                }}
              >
                <span className="mr-2">{option.flag}</span>
                <span>{option.name}</span>
                {value === option.code && (
                  <i className="fas fa-check text-blue-500 ml-auto text-xs"></i>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 