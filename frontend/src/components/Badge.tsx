'use client';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'orange' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-[#f5f3f3] text-[#09090b]',
    primary: 'bg-black text-white',
    success: 'bg-[#f0fdf4] text-[#16A34A]',
    warning: 'bg-[#fffbeb] text-[#D97706]',
    orange: 'bg-[#fff7ed] text-[#EA580C]',
    error: 'bg-[#fef2f2] text-[#DC2626]',
    info: 'bg-[#eff6ff] text-[#2563EB]',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-1 text-xs rounded',
    md: 'px-3 py-1.5 text-sm rounded',
    lg: 'px-4 py-2 text-base rounded',
  };

  return (
    <span
      className={`inline-block font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
