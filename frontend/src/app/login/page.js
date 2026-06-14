'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/search'); }, [router]);
  return null;
}
