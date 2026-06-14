'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded transition-all duration-200 flex items-center justify-center gap-2';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-black text-white hover:bg-[#1a1a1a] active:bg-[#0a0a0a] disabled:bg-gray-400 disabled:cursor-not-allowed',
    secondary: 'bg-white border border-[#e4e4e7] text-black hover:bg-gray-50 active:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed',
    outline: 'bg-transparent border border-black text-black hover:bg-black hover:text-white active:bg-[#1a1a1a] disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-black hover:bg-gray-100 active:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}
