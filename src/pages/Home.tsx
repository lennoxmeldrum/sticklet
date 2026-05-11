import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LogIn, Plus } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Home() {
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    setIsLoading(true);
    // Generate a simple 6-character alphanumeric code for room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      await setDoc(doc(db, 'rooms', roomId), {
        createdAt: serverTimestamp()
      });
      navigate(`/room/${roomId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      navigate(`/room/${joinCode.toUpperCase()}`);
    } else {
      alert('Room code must be 6 characters');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-indigo-600 px-8 py-10 text-center">
          <div className="mx-auto bg-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center rotate-3 mb-4 shadow-sm border border-indigo-400">
            <span className="text-3xl text-white font-bold tracking-tighter">Sb.</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">StickyBoard</h1>
          <p className="text-indigo-200 mt-2 text-sm font-medium">Collaborate freely. No login required.</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Create Room */}
          <div>
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-sm shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              {isLoading ? 'Creating Room...' : 'Create New Room'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-semibold tracking-wider">Or</span>
            </div>
          </div>

          {/* Join Room */}
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-slate-700 mb-1">
                Have a code?
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3"
                  maxLength={6}
                  className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-lg tracking-widest text-center transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={joinCode.length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
