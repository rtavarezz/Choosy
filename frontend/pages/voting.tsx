import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function VotingPage() {
  const router = useRouter();
  const { planId, creator } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    const dest = planId ? `/vote/${planId}${creator ? '?creator=true' : ''}` : '/';
    router.replace(dest);
  }, [router.isReady, planId, creator, router]);

  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Redirecting to the latest voting experience…</p>
    </div>
  );
}