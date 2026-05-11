import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Trash2, ExternalLink, LogOut } from 'lucide-react';

interface RoomRow {
  id: string;
  createdAt: any;
  createdByName: string;
  createdByEmail: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { signOutUser } = useAuth();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    }, (err) => {
      console.error('Failed to list rooms', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (roomId: string) => {
    if (!confirm(`Delete room ${roomId} and all its notes? This cannot be undone.`)) return;
    setBusyId(roomId);
    try {
      // Firestore won't cascade-delete subcollections from the client.
      // Fetch notes and delete them one by one before deleting the room.
      const notesSnap = await getDocs(collection(db, 'rooms', roomId, 'notes'));
      await Promise.all(notesSnap.docs.map(n => deleteDoc(doc(db, 'rooms', roomId, 'notes', n.id))));
      await deleteDoc(doc(db, 'rooms', roomId));
    } catch (err) {
      console.error('Failed to delete room', err);
      alert('Failed to delete room. See console for details.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors"
              title="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Admin</h1>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{rooms.length} room{rooms.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button
            onClick={signOutUser}
            className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-slate-500">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="text-slate-500">No rooms yet.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Code</th>
                  <th className="text-left px-6 py-3 font-semibold">Created by</th>
                  <th className="text-left px-6 py-3 font-semibold">Created</th>
                  <th className="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{r.id}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-medium">{r.createdByName ?? '—'}</div>
                      <div className="text-xs text-slate-500">{r.createdByEmail ?? '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/room/${r.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {busyId === r.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
