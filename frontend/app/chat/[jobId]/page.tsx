'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/authStore';
import { getSocket, disconnectSocket } from '@/lib/socket';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage } from '@/lib/utils';
import {
  ArrowLeft, Send, Image as ImageIcon, X, Loader2,
  AlertCircle, Shield
} from 'lucide-react';

interface Message {
  _id: string; type: string; content: string; imageUrl?: string;
  sender: { _id: string; name: string; role: string; badge?: string };
  createdAt: string; filtered?: boolean;
}

export default function ChatPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [job, setJob] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();
  const fileRef = useRef<HTMLInputElement>(null);

  // Load job + messages
  useEffect(() => {
    const load = async () => {
      try {
        const [jobRes, msgRes] = await Promise.all([
          api.get(`/jobs/${jobId}`),
          api.get(`/chat/${jobId}`),
        ]);
        setJob(jobRes.data.job);
        setMessages(msgRes.data.messages);
      } catch { toast.error('Could not load chat'); router.back(); }
      finally { setLoading(false); }
    };
    load();
  }, [jobId]);

  // Socket setup
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    socket.emit('join_job', jobId);

    socket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user_typing', ({ name }: { name: string }) => {
      setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
    });

    socket.on('stop_typing', ({ userId }: { userId: string }) => {
      // Just clear all typing (simple approach)
      setTypingUsers([]);
    });

    socket.on('job_updated', () => {
      api.get(`/jobs/${jobId}`).then(r => setJob(r.data.job));
    });

    return () => {
      socket.emit('leave_job', jobId);
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('stop_typing');
      socket.off('job_updated');
    };
  }, [token, jobId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleTyping = () => {
    if (!token) return;
    const socket = getSocket(token);
    socket.emit('typing', { jobId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing', { jobId });
    }, 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFile) {
      await sendImage();
    } else {
      if (!text.trim()) return;
      await sendText();
    }
  };

  const sendText = async () => {
    setSending(true);
    try {
      await api.post(`/chat/${jobId}`, { content: text });
      setText('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  const sendImage = async () => {
    if (!imageFile) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      if (text.trim()) fd.append('caption', text);
      await api.post(`/chat/${jobId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setText('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const isMine = (msg: Message) => msg.sender._id === user?._id;

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-400" />
    </div>
  );

  const isSettled = job?.status === 'completed';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="border-b border-surface-3 bg-surface-1 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{job?.title}</p>
          <p className="text-xs text-gray-500">
            {job?.user?.name}
            {job?.admin && <> · {job.admin.name}</>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-surface-2 px-2 py-1 rounded-full">
          <Shield size={10} className="text-brand-400" />
          Monitored
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-yellow-500/5 border-b border-yellow-500/20 px-4 py-2 flex items-center gap-2 text-xs text-yellow-400/80">
        <AlertCircle size={11} />
        Phone numbers, emails and external contact info are automatically filtered
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12 text-sm">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg, i) => {
          const mine = isMine(msg);
          const showDate = i === 0 || new Date(messages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

          return (
            <div key={msg._id}>
              {showDate && (
                <div className="text-center my-2">
                  <span className="text-xs text-gray-600 bg-surface-2 px-3 py-1 rounded-full">
                    {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              {msg.type === 'system' ? (
                <div className="text-center">
                  <span className="text-xs text-gray-500 bg-surface-2 px-3 py-1 rounded-full">{msg.content}</span>
                </div>
              ) : (
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {!mine && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-xs font-medium text-gray-400">{msg.sender.name}</span>
                        <span className="text-xs text-gray-600 capitalize">{msg.sender.role}</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      mine
                        ? 'bg-brand-500 text-white rounded-br-sm'
                        : 'bg-surface-2 text-gray-100 rounded-bl-sm'
                    }`}>
                      {msg.type === 'image' && msg.imageUrl && (
                        <img src={msg.imageUrl} alt="shared" className="rounded-lg mb-2 max-w-full max-h-60 object-cover" />
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.filtered && (
                        <p className="text-xs opacity-60 mt-1 flex items-center gap-1">
                          <Shield size={9} /> Content filtered
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-surface-2 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1 items-center">
                <span className="text-xs text-gray-400">{typingUsers[0]} is typing</span>
                <span className="flex gap-0.5">
                  {[0,1,2].map(i => <span key={i} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isSettled ? (
        <div className="border-t border-surface-3 bg-surface-1 p-4 text-center text-sm text-gray-500">
          Chat is closed — this job has been settled
        </div>
      ) : (
        <form onSubmit={handleSend} className="border-t border-surface-3 bg-surface-1 p-3">
          {imagePreview && (
            <div className="relative inline-block mb-2 ml-2">
              <img src={imagePreview} alt="" className="h-16 w-16 object-cover rounded-lg" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <X size={10} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="p-2.5 text-gray-500 hover:text-brand-400 transition-colors rounded-lg hover:bg-surface-2 flex-shrink-0">
              <ImageIcon size={18} />
            </button>
            <input
              className="input flex-1 text-sm"
              placeholder="Type a message..."
              value={text}
              onChange={e => { setText(e.target.value); handleTyping(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            />
            <button type="submit" disabled={sending || (!text.trim() && !imageFile)}
              className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-40">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
