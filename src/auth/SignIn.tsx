import { useAuth } from './AuthContext';
import { LogIn } from 'lucide-react';
import { ALLOWED_DOMAIN } from '../firebase/config';

export default function SignIn() {
  const { signIn, domainError } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-center">
          <div className="mx-auto bg-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center rotate-3 mb-4 shadow-sm border border-indigo-400">
            <span className="text-3xl text-white font-bold tracking-tighter">Sb.</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">StickyBoard</h1>
          <p className="text-indigo-200 mt-2 text-sm font-medium">Sign in with your @{ALLOWED_DOMAIN} account</p>
        </div>

        <div className="p-8 space-y-4">
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-sm shadow-indigo-200"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          {domainError && (
            <p className="text-sm text-red-600 text-center">{domainError}</p>
          )}
          <p className="text-xs text-slate-400 text-center">
            School accounts only. You'll be visible to other users as the creator of any room or note you make.
          </p>
        </div>
      </div>
    </div>
  );
}
