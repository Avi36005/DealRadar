'use client';

import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = true,
  ...props
}) {
  const variantClasses = {
    default: 'bg-white border border-[#e4e4e7] rounded',
    elevated: 'bg-white border border-[#e4e4e7] rounded shadow-card',
    outlined: 'bg-transparent border border-[#e4e4e7] rounded',
  };

  return (
    <motion.div
      whileHover={hover ? { boxShadow: '0 8px 40px rgba(0,0,0,0.10)' } : {}}
      transition={{ duration: 0.2 }}
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
