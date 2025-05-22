'use client';

import { useState, useEffect, useCallback } from 'react';
import { UrlInputProps } from './types';
import { isValidUrl } from './utils';
import { DEFAULT_PLACEHOLDER } from './constants';
import { cn } from './styles';

// Íconos de validación
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UrlInput = ({
  value,
  onChange,
  onValidation,
  index,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
  className,
}: UrlInputProps) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState<boolean>(false);

  const validateUrl = useCallback((url: string): boolean => {
    if (!url.trim()) {
      setError('');
      onValidation?.(index, false);
      return false;
    }

    if (!isValidUrl(url)) {
      setError('Por favor, ingresa una URL válida');
      onValidation?.(index, false);
      return false;
    }

    setError('');
    onValidation?.(index, true);
    return true;
  }, [index, onValidation]);

  // Validar cuando el valor cambia y el campo ha sido tocado
  useEffect(() => {
    if (touched) {
      validateUrl(value);
    }
  }, [value, touched, validateUrl]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validateUrl(value);
  }, [value, validateUrl]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className={cn('relative mb-4 group', className)}>
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full border rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200',
            'dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400',
            error 
              ? 'border-red-500 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-700'
              : 'border-gray-300 dark:border-gray-600',
            disabled && 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-70',
            'peer',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${index}-error` : undefined}
        />
        
        {value && value.trim() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {error ? <XIcon /> : <CheckIcon />}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={`${index}-error`} 
          className="mt-1 text-sm text-red-500 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {!error && value && value.trim() && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          URL válida
        </p>
      )}
    </div>
  );
};

export default UrlInput;
