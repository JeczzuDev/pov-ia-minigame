"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function UserSyncer() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          username: user.username || user.firstName || user.id,
        }),
      });
    }
  }, [isLoaded, user]);

  return null;
}
