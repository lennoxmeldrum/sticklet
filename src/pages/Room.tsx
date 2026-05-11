import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Copy, Check, Trash2, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: string;
  text: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  color: string;
  createdAt: any;
  x: number;
  y: number;
}

interface RoomDoc {
  createdAt: any;
  createdByUid: string;
  createdByEmail: string;
  createdByName: string;
}

const COLORS = [
  { id: 'yellow', value: 'bg-yellow-100 border-yellow-200 text-slate-800', raw: 'yellow' },
  { id: 'blue', value: 'bg-blue-100 border-blue-200 text-slate-800', raw: 'blue' },
  { id: 'green', value: 'bg-emerald-100 border-emerald-200 text-slate-800', raw: 'green' },
  { id: 'pink', value: 'bg-pink-100 border-pink-200 text-slate-800', raw: 'pink' },
  { id: 'purple', value: 'bg-violet-100 border-violet-200 text-slate-800', raw: 'purple' },
];

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [roomDoc, setRoomDoc] = useState<RoomDoc | null>(null);
  const [isValidRoom, setIsValidRoom] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draftNotes, setDraftNotes] = useState<Note[]>([]);
  const [copied, setCopied] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Fixed canvas height = 3 viewports worth of vertical space below the header.
  // The board is overflow-auto, so users scroll within it to reach further notes.
  const CANVAS_HEIGHT_CSS = 'calc((100vh - 80px) * 3)';

  useEffect(() => {
    if (!roomId) return;

    const checkRoom = async () => {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        const snap = await getDoc(roomRef);
        if (snap.exists()) {
          setRoomDoc(snap.data() as RoomDoc);
          setIsValidRoom(true);
        } else {
          setIsValidRoom(false);
        }
      } catch (err) {
        console.error('Failed to load room', err);
        setIsValidRoom(false);
      }
    };

    checkRoom();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !isValidRoom) return;

    const q = query(collection(db, 'rooms', roomId, 'notes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsed = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Note[];
      parsed.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return ta - tb;
      });
      setNotes(parsed);
    }, (error) => {
      console.error('Failed to subscribe to notes', error);
    });

    return () => unsubscribe();
  }, [roomId, isValidRoom]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingMode || !roomId || !user) return;
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const noteId = uuidv4();
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].raw;

    setIsAddingMode(false);

    setDraftNotes(prev => [...prev, {
      id: noteId,
      text: '',
      authorUid: user.uid,
      authorEmail: user.email ?? '',
      authorName: user.displayName ?? user.email ?? 'Unknown',
      color: randomColor,
      createdAt: null,
      x: px,
      y: py
    }]);
  };

  const handleSaveDraft = async (draft: Note, newText: string) => {
    setDraftNotes(prev => prev.filter(n => n.id !== draft.id));
    if (!newText.trim() || !user) return;

    try {
      await setDoc(doc(db, 'rooms', roomId!, 'notes', draft.id), {
        text: newText.trim(),
        authorUid: user.uid,
        authorEmail: user.email ?? '',
        authorName: user.displayName ?? user.email ?? 'Unknown',
        color: draft.color,
        createdAt: serverTimestamp(),
        x: draft.x,
        y: draft.y
      });
    } catch (err) {
      console.error('Failed to save note', err);
    }
  };

  const handleDiscardDraft = (id: string) => {
    setDraftNotes(prev => prev.filter(n => n.id !== id));
  };

  if (isValidRoom === null) {
    return <div className="min-h-screen bg-neutral-100 flex items-center justify-center">Loading room...</div>;
  }

  if (isValidRoom === false) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Room not found</h2>
        <p className="text-neutral-500 mb-6">This room might have been deleted or the code is incorrect.</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pt-20">
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-slate-800">StickyBoard Room</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              {notes.length} Notes · Created by {roomDoc?.createdByName ?? '…'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end cursor-pointer group" onClick={copyCode} title="Copy code">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
              Access Code {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </span>
            <span className="font-mono text-xl font-bold text-indigo-600">{roomId}</span>
          </div>
          <button
            onClick={() => setIsAddingMode(!isAddingMode)}
            className={cn(
              "px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm text-sm border-2",
              isAddingMode
                ? "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 cursor-alias"
                : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
            )}
          >
            {isAddingMode ? 'Cancel Placement' : '+ New Note'}
          </button>
        </div>
      </header>

      <div
        ref={boardRef}
        className={cn(
          "flex-1 relative overflow-auto touch-manipulation",
          isAddingMode ? "m-4 rounded-3xl ring-4 ring-indigo-100 ring-inset" : ""
        )}
      >
        <div
          ref={canvasRef}
          className={cn("relative w-full", isAddingMode ? "cursor-crosshair" : "")}
          style={{
            height: CANVAS_HEIGHT_CSS,
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
          onClick={handleCanvasClick}
        >
          <AnimatePresence>
            {notes.map(note => (
              <StickyNote
                key={note.id}
                note={note}
                roomId={roomId!}
                canEdit={note.authorUid === user?.uid}
                canDelete={note.authorUid === user?.uid || isAdmin}
                canvasRef={canvasRef}
              />
            ))}
            {draftNotes.map(draft => (
              <StickyNote
                key={draft.id}
                note={draft}
                roomId={roomId!}
                canEdit={true}
                canDelete={true}
                isDraft={true}
                onSaveDraft={handleSaveDraft}
                onDiscardDraft={handleDiscardDraft}
                canvasRef={canvasRef}
              />
            ))}
          </AnimatePresence>
        </div>

        {isAddingMode && (
          <div
            className="fixed left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-40"
            style={{ top: 'calc(80px + 1rem)' }}
          >
            <span className="bg-indigo-900/80 text-white px-6 py-3 rounded-full font-medium backdrop-blur-sm shadow-xl flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-indigo-400 animate-ping"></span>
              Click anywhere to place a note
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface StickyNoteProps {
  note: Note;
  roomId: string;
  canEdit: boolean;
  canDelete: boolean;
  isDraft?: boolean;
  onSaveDraft?: (note: Note, text: string) => void;
  onDiscardDraft?: (id: string) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  roomId,
  canEdit,
  canDelete,
  isDraft = false,
  onSaveDraft,
  onDiscardDraft,
  canvasRef
}) => {
  const [isEditing, setIsEditing] = useState(isDraft);
  const [text, setText] = useState(note.text);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag: ref holds the latest delta for pointerup (no stale closures);
  // state mirror drives re-renders so the visual position follows the pointer.
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);
  const [optimisticPos, setOptimisticPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const styleClass = COLORS.find(c => c.raw === note.color)?.value || COLORS[0].value;

  // Drop optimistic override once Firestore catches up.
  useEffect(() => {
    if (optimisticPos &&
        Math.abs(note.x - optimisticPos.x) < 0.01 &&
        Math.abs(note.y - optimisticPos.y) < 0.01) {
      setOptimisticPos(null);
    }
  }, [note.x, note.y, optimisticPos]);

  const effective = optimisticPos ?? { x: note.x, y: note.y };

  const left = dragOffset
    ? `calc(${effective.x}% - 120px + ${dragOffset.dx}px)`
    : `calc(${effective.x}% - 120px)`;
  const top = dragOffset
    ? `calc(${effective.y}% - 80px + ${dragOffset.dy}px)`
    : `calc(${effective.y}% - 80px)`;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing || isDraft) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName === 'TEXTAREA') return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = { dx: 0, dy: 0 };
    setDragOffset({ dx: 0, dy: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const next = {
      dx: e.clientX - dragStartRef.current.x,
      dy: e.clientY - dragStartRef.current.y,
    };
    dragOffsetRef.current = next;
    setDragOffset(next);
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    const offset = dragOffsetRef.current;
    if (!dragStartRef.current || !offset) {
      dragStartRef.current = null;
      dragOffsetRef.current = null;
      setDragOffset(null);
      return;
    }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured */ }

    const moved = Math.abs(offset.dx) > 4 || Math.abs(offset.dy) > 4;
    dragStartRef.current = null;
    dragOffsetRef.current = null;
    setDragOffset(null);

    if (!moved || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const baseX = optimisticPos?.x ?? note.x;
    const baseY = optimisticPos?.y ?? note.y;
    const newX = Math.max(0, Math.min(100, baseX + (offset.dx / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, baseY + (offset.dy / rect.height) * 100));
    setOptimisticPos({ x: newX, y: newY });

    try {
      await updateDoc(doc(db, 'rooms', roomId, 'notes', note.id), { x: newX, y: newY });
    } catch (err) {
      console.error('Failed to move note', err);
      setOptimisticPos(null);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      if (isDraft) onDiscardDraft?.(note.id);
      return;
    }

    if (isDraft) {
      setIsEditing(false);
      onSaveDraft?.(note, text.trim());
      return;
    }

    setIsEditing(false);
    if (text.trim() === note.text) return;

    try {
      await updateDoc(doc(db, 'rooms', roomId, 'notes', note.id), { text: text.trim() });
    } catch (err) {
      console.error('Failed to update note', err);
    }
  };

  const handleCancelEditing = () => {
    if (isDraft) {
      onDiscardDraft?.(note.id);
    } else {
      setIsEditing(false);
      setText(note.text);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'rooms', roomId, 'notes', note.id));
    } catch (err) {
      setIsDeleting(false);
      console.error('Failed to delete note', err);
    }
  };

  const isDragging = !!dragOffset && (Math.abs(dragOffset.dx) > 4 || Math.abs(dragOffset.dy) > 4);
  const canDrag = !isEditing && !isDraft;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, rotate: note.id.charCodeAt(0) % 5 === 0 ? -1.5 : note.id.charCodeAt(0) % 3 === 0 ? 2 : -0.5, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "absolute w-[260px] min-h-[224px] p-6 shadow-lg border-t-4 flex flex-col transform-gpu group select-none",
        styleClass,
        isDeleting ? "opacity-50 pointer-events-none" : "",
        canDrag ? (isDragging ? "cursor-grabbing z-50" : "cursor-grab") : "cursor-default",
      )}
      style={{ left, top }}
      onPointerDown={canDrag ? handlePointerDown : undefined}
      onPointerMove={canDrag ? handlePointerMove : undefined}
      onPointerUp={canDrag ? handlePointerUp : undefined}
      onPointerCancel={canDrag ? handlePointerUp : undefined}
    >
      <div className="flex-1 flex flex-col">
        {isEditing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelEditing();
              }
            }}
            placeholder=""
            className="w-full flex-1 bg-transparent border-none resize-none focus:ring-0 p-0 m-0 outline-none placeholder:text-slate-400 text-slate-800 font-medium text-base leading-relaxed"
            maxLength={250}
          />
        ) : (
          <div className="flex-1 text-slate-800 font-medium whitespace-pre-wrap text-base leading-relaxed break-words">
            {note.text}
          </div>
        )}
      </div>

      {!isDraft && (
        <div className="text-[10px] uppercase tracking-wider text-slate-500/80 mt-2 truncate" title={note.authorEmail}>
          {note.authorName}
        </div>
      )}

      {isEditing && (
        <div className="flex justify-end gap-2 mt-4 opacity-100">
          <button
            onClick={handleCancelEditing}
            className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {!isEditing && (canEdit || canDelete) && (
        <div className="flex items-center justify-end mt-2 opacity-60 text-xs font-semibold text-slate-800">
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-black/10 rounded transition-colors text-slate-600 hover:text-slate-900"
                title="Edit note"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-600 hover:text-red-700"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
