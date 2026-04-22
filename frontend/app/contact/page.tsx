'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Phone, Mail, MessageSquare, Send, ArrowLeft, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="border-b border-surface-3 bg-surface-1">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl tracking-widest text-brand-500">VIDEDIT</Link>
          <Link href="/auth/login" className="btn-ghost text-sm">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1 className="font-display text-6xl tracking-widest mb-3">CONTACT US</h1>
          <p className="text-gray-400 max-w-xl">
            Have a question or need help? Reach out via the form or use our direct contact info below.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="card flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold mb-1">Phone</p>
                <p className="text-gray-400 text-sm">Available during business hours</p>
                <a href="tel:+1234567890" className="text-brand-400 hover:text-brand-300 transition-colors text-sm">
                  +1 (234) 567-8900
                </a>
              </div>
            </div>

            <div className="card flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold mb-1">Email</p>
                <p className="text-gray-400 text-sm">We reply within 24 hours</p>
                <a href="mailto:hello@videdit.com" className="text-brand-400 hover:text-brand-300 transition-colors text-sm">
                  hello@videdit.com
                </a>
              </div>
            </div>

            <div className="card flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={18} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold mb-1">Live Chat</p>
                <p className="text-gray-400 text-sm">After you submit a job, you can chat directly with your assigned editor in real time.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-green-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Message Sent!</h2>
                <p className="text-gray-400 text-sm">We'll get back to you at {form.email} as soon as possible.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}
                  className="btn-secondary text-sm mt-5">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-semibold text-lg mb-1">Send a Message</h2>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Your Name</label>
                  <input className="input" placeholder="John Doe" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input type="email" className="input" placeholder="you@example.com" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Message</label>
                  <textarea className="input min-h-[130px] resize-none" placeholder="How can we help?"
                    value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
