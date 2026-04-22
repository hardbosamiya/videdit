'use client';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';
import { dashboardPath } from '@/lib/utils';
import { Play, Upload, MessageSquare, CheckCircle, ArrowRight, Star, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-surface-3 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-2xl tracking-widest text-brand-500">VIDEDIT</span>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href={dashboardPath(user.role)} className="btn-primary text-sm">
                Dashboard <ArrowRight size={14} className="inline ml-1" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
                <Link href="/auth/signup" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-400 text-sm mb-8 animate-fade-in">
            <Zap size={12} /> Professional video editing on demand
          </div>
          <h1 className="font-display text-7xl md:text-9xl tracking-widest text-white mb-6 leading-none animate-slide-up">
            YOUR VISION.<br/>
            <span className="text-brand-500">OUR EDIT.</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Upload your footage, discuss your vision, and receive professionally edited videos. Real-time communication, transparent workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/signup" className="btn-primary px-8 py-3 text-base">
              Start Your Project <ArrowRight size={16} className="inline ml-2" />
            </Link>
            <Link href="/contact" className="btn-secondary px-8 py-3 text-base">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-surface-3">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-5xl tracking-widest text-center mb-16 text-white">HOW IT WORKS</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Upload, step: '01', title: 'Upload Your Footage', desc: 'Submit your sample video and clips with sequence instructions.' },
              { icon: MessageSquare, step: '02', title: 'Collaborate in Real-Time', desc: 'Chat with your dedicated editor, request revisions with images and text.' },
              { icon: CheckCircle, step: '03', title: 'Review & Settle', desc: 'Review the final edit, request any changes, then settle when satisfied.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="card group hover:border-brand-500/40 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <span className="font-display text-4xl text-brand-500/30 group-hover:text-brand-500/60 transition-colors">{step}</span>
                  <Icon size={24} className="text-brand-500 mt-2 flex-shrink-0" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 px-6 border-t border-surface-3 bg-surface-1">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-5xl tracking-widest mb-4">WHY VIDEDIT</h2>
          <p className="text-gray-400 mb-12">Built for creators who demand quality and transparency.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Secure Workflow', desc: 'Role-based access. Your footage stays private.' },
              { icon: Star, title: 'Vetted Editors', desc: 'Admins earn badges based on performance.' },
              { icon: Zap, title: 'Fast Turnaround', desc: 'Real-time chat and instant status updates.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-500" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-surface-3">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-6xl tracking-widest mb-6">READY TO <span className="text-brand-500">EDIT?</span></h2>
          <Link href="/auth/signup" className="btn-primary px-10 py-4 text-lg inline-flex items-center gap-2">
            <Play size={18} /> Start Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-3 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <span className="font-display tracking-widest text-brand-500">VIDEDIT</span>
          <div className="flex gap-6">
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <span>© {new Date().getFullYear()} VidEdit. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
