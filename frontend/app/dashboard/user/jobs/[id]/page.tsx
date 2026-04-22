'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage, badgeLabel } from '@/lib/utils';
import {
  ArrowLeft, Download, MessageSquare, CheckCircle,
  Film, Upload, X, Loader2, Image as ImageIcon, Plus
} from 'lucide-react';

export default function UserJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [editText, setEditText] = useState('');
  const [editImages, setEditImages] = useState<File[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConfirmSettle, setShowConfirmSettle] = useState(false);
  const [acceptingPrice, setAcceptingPrice] = useState(false);

  const fetchJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data.job);
    } catch { toast.error('Job not found'); router.push('/dashboard/user/jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJob(); }, [id]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 5,
    onDrop: files => setEditImages(prev => [...prev, ...files].slice(0, 5)),
  });

  const handleSettle = async () => {
    if (!showConfirmSettle) {
      setShowConfirmSettle(true);
      return;
    }
    setSettling(true);
    try {
      await api.post(`/jobs/${id}/settle`);
      toast.success('Job settled successfully!');
      fetchJob();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSettling(false); }
  };

  const handleAcceptPrice = async () => {
    setAcceptingPrice(true);
    try {
      await api.patch(`/jobs/${id}/accept-price`);
      toast.success('Price accepted!');
      fetchJob();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAcceptingPrice(false); }
  };

  const handleEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return toast.error('Please describe the changes needed');
    setSubmittingEdit(true);
    try {
      const fd = new FormData();
      fd.append('text', editText);
      editImages.forEach(img => fd.append('images', img));
      await api.post(`/jobs/${id}/edit-request`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Edit request submitted!');
      setEditText('');
      setEditImages([]);
      setShowEditForm(false);
      fetchJob();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmittingEdit(false); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    </DashboardLayout>
  );

  if (!job) return null;

  const canReview = ['review', 'revision'].includes(job.status);
  const isCompleted = job.status === 'completed';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to jobs
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{job.description}</p>
            <p className="text-gray-600 text-xs mt-1">Created {formatDateTime(job.createdAt)}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Delivered Video */}
            {job.deliveredVideo && (
              <div className="card">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Film size={16} className="text-brand-400" /> Edited Video
                </h2>
                <video controls className="w-full rounded-lg bg-black" src={job.deliveredVideo.url}>
                  Your browser does not support video.
                </video>
                <a href={job.deliveredVideo.url} download target="_blank" rel="noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-2 mt-3 text-sm">
                  <Download size={14} /> Download Video
                </a>
              </div>
            )}

            {/* Actions */}
            {canReview && (
              <div className="card border-brand-500/20 bg-brand-500/5">
                <h2 className="font-semibold mb-3">Review Your Video</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Please review the delivered video. You can request changes or settle the job if you're satisfied.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setShowEditForm(!showEditForm)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                    <Upload size={14} /> Request Changes
                  </button>
                  <div className="flex-1 flex gap-2">
                    {showConfirmSettle && (
                      <button onClick={() => setShowConfirmSettle(false)} className="btn-secondary text-sm px-3">
                        Cancel
                      </button>
                    )}
                    <button onClick={handleSettle} disabled={settling}
                      className={`${showConfirmSettle ? 'bg-green-600 hover:bg-green-500 text-white' : 'btn-primary'} flex-1 flex items-center justify-center gap-2 text-sm rounded-lg transition-colors font-medium`}>
                      {settling ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      {showConfirmSettle ? 'Confirm Settle' : 'Settle Job'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Price Proposal */}
            {job.status === 'price_discussion' && (
              <div className="card border-brand-500/20 bg-brand-500/5">
                <h2 className="font-semibold mb-3">Price Proposal</h2>
                <p className="text-gray-400 text-sm mb-4">
                  The admin has proposed a price of <strong className="text-brand-400 whitespace-nowrap">{job.agreedPrice} {job.currency}</strong> for this job.
                  {job.userAcceptedPrice ? ' You have accepted this price. Waiting for an editor to be assigned.' : ' Please accept this price to proceed, or discuss via chat.'}
                </p>
                {!job.userAcceptedPrice && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/chat/${job._id}`} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                      <MessageSquare size={14} /> Discuss in Chat
                    </Link>
                    <button onClick={handleAcceptPrice} disabled={acceptingPrice}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                      {acceptingPrice ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Accept Price
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Edit request form */}
            {showEditForm && (
              <form onSubmit={handleEditRequest} className="card space-y-4 animate-slide-up">
                <h2 className="font-semibold">Request Changes</h2>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Describe the changes needed</label>
                  <textarea className="input min-h-[100px] resize-none text-sm"
                    placeholder="Please change... At 0:30 I want..." value={editText}
                    onChange={e => setEditText(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Reference images (optional)</label>
                  <div {...getRootProps()} className="border border-dashed border-surface-4 rounded-lg p-4 text-center cursor-pointer hover:border-brand-500/40 transition-colors">
                    <input {...getInputProps()} />
                    <ImageIcon size={20} className="mx-auto text-gray-600 mb-1" />
                    <p className="text-gray-500 text-xs">Drop images here</p>
                  </div>
                  {editImages.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {editImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(img)} alt="" className="w-16 h-16 object-cover rounded" />
                          <button type="button" onClick={() => setEditImages(p => p.filter((_,j)=>j!==i))}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <X size={9} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEditForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                  <button type="submit" disabled={submittingEdit} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                    {submittingEdit ? <Loader2 size={14} className="animate-spin" /> : null}
                    Submit Request
                  </button>
                </div>
              </form>
            )}

            {/* Settled */}
            {isCompleted && (
              <div className="card border-green-500/20 bg-green-500/5 text-center py-8">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <h2 className="font-semibold text-lg">Job Completed</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Settled on {formatDateTime(job.settledAt)}
                </p>
              </div>
            )}

            {/* Edit requests history */}
            {job.editRequests?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold mb-4">Edit Requests</h2>
                <div className="space-y-3">
                  {job.editRequests.map((req: any, i: number) => (
                    <div key={i} className="p-3 bg-surface-2 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{formatDateTime(req.createdAt)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${req.status === 'done' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{req.text}</p>
                      {req.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {req.images.map((img: any, j: number) => (
                            <img key={j} src={img.url} alt="" className="w-14 h-14 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded clips */}
            {job.clips?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold mb-4">Uploaded Clips ({job.clips.length})</h2>
                <div className="space-y-2">
                  {[...job.clips].sort((a: any,b: any) => a.order - b.order).map((clip: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                      <Film size={14} className="text-brand-400" />
                      <span className="text-sm flex-1 truncate">{clip.originalName}</span>
                      <span className="text-xs text-gray-500">#{clip.order + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Info */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-sm">Job Info</h3>
              {job.agreedPrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="font-medium text-brand-400">{job.agreedPrice} {job.currency}</span>
                </div>
              )}
              {job.admin && (
                <div>
                  <span className="text-gray-400 text-sm block mb-1">Assigned Editor</span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-brand-400">
                      {job.admin.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{job.admin.name}</p>
                      {job.admin.badge !== 'none' && (
                        <span className={`text-xs badge-${job.admin.badge} px-1.5 py-0.5 rounded`}>
                          {badgeLabel[job.admin.badge]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {job.superAdminNotes && (
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Notes</span>
                  <p className="text-sm text-gray-300 bg-surface-2 rounded p-2">{job.superAdminNotes}</p>
                </div>
              )}
            </div>

            {/* Chat */}
            {((job.admin && !isCompleted) || job.status === 'price_discussion') && (
              <Link href={`/chat/${job._id}`} className="card flex items-center gap-3 hover:border-brand-500/40 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                  <MessageSquare size={18} className="text-brand-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {job.status === 'price_discussion' ? 'Chat with Admin' : 'Chat with Editor'}
                  </p>
                  <p className="text-xs text-gray-500">Send messages & images</p>
                </div>
                <ArrowLeft size={14} className="ml-auto rotate-180 text-gray-600 group-hover:text-gray-300" />
              </Link>
            )}

            {/* Sample video */}
            {job.sampleVideo && (
              <div className="card">
                <h3 className="font-semibold text-sm mb-3">Sample Video</h3>
                <video controls className="w-full rounded bg-black" src={job.sampleVideo.url} />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
