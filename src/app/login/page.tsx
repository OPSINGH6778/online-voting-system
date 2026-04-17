import { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
