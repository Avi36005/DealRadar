'use client';

import { motion } from 'framer-motion';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text = '' }: LoadingSpinnerProps) {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size]} border-black border-t-transparent rounded-full`}
      />
      {text && <p className="text-sm text-[#71717a]">{text}</p>}
    </div>
  );
}
