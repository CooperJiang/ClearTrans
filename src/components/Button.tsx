'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  loading = false
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: disabled || loading 
      ? 'bg-gray-100 text-gray-400' 
      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-md hover:-translate-y-0.5 focus:ring-blue-500',
    secondary: disabled || loading
      ? 'bg-gray-100 text-gray-400 border border-gray-200'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-sm hover:-translate-y-0.5 focus:ring-gray-500',
    danger: disabled || loading
      ? 'bg-gray-100 text-gray-400'
      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-md hover:-translate-y-0.5 focus:ring-red-500',
    success: disabled || loading
      ? 'bg-gray-100 text-gray-400'
      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-md hover:-translate-y-0.5 focus:ring-green-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <i className="fas fa-spinner fa-spin mr-2 text-sm"></i>
      )}
      {children}
    </button>
  );
} 