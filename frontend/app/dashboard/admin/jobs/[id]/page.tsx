'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage, formatBytes } from '@/lib/utils';
import {
  ArrowLeft, Film, Upload, Download, MessageSquare,
  Loader2, CheckCircle, AlertCircle, User
} from 'lucide-react';

export default function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data.job);
    } catch { toast.error('Job not found'); router.back(); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJob(); }, [id]);

  const ACCEPTED_VIDEO_TYPES = {
    'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    'application/octet-stream': ['.mp4', '.mkv', '.mov', '.avi', '.webm'],
    'application/mp4': ['.mp4'],
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_VIDEO_TYPES,
    maxFiles: 1,
    onDrop: (accepted, rejected) => {
      if (accepted.length > 0) setUploadFile(accepted[0]);
      else if (rejected.length > 0) toast.error('File rejected. Please ensure it is a valid video file.');
    },
  });

  const handleDeliver = async () => {
    if (!uploadFile) return toast.error('Please select the edited video');
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('video', uploadFile);
      await api.post(`/jobs/${id}/deliver`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
      });
      toast.success('Video delivered! User has been notified.');
      setUploadFile(null);
      fetchJob();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setUploading(false); setProgress(0); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="p-6 flex justify-center items-center min-h-64">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    </DashboardLayout>
  );
  if (!job) return null;

  const canDeliver = ['ongoing', 'revision'].includes(job.status);
  const pendingEditReqs = job.editRequests?.filter((r: any) => r.status === 'pending') || [];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{job.description}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {/* Revision alert */}
        {pendingEditReqs.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Revision Requested</p>
              <div className="mt-2 space-y-2">
                {pendingEditReqs.map((req: any, i: number) => (
                  <div key={i} className="text-sm text-gray-300 bg-surface-2 rounded p-2">{req.text}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Deliver video */}
            {canDeliver && (
              <div className="card">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload size={16} className="text-brand-400" />
                  {job.status === 'revision' ? 'Upload Revised Video' : 'Deliver Edited Video'}
                </h2>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-surface-4 hover:border-surface-4/80'
                }`}>
                  <input {...getInputProps()} />
                  <Film size={36} className="mx-auto text-gray-600 mb-3" />
                  {uploadFile ? (
                    <div>
                      <p className="text-white font-medium">{uploadFile.name}</p>
                      <p className="text-gray-500 text-sm">{formatBytes(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-300">Drop the edited video here</p>
                      <p className="text-gray-500 text-sm mt-1">MP4, MOV, MKV · Max 500MB</p>
                    </div>
                  )}
                </div>

                {progress > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Uploading...</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <button onClick={handleDeliver} disabled={!uploadFile || uploading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-4 text-sm">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? `Uploading ${progress}%...` : 'Deliver to Client'}
                </button>
              </div>
            )}

            {/* Delivered */}
            {job.deliveredVideo && (
              <div className="card">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" /> Delivered Video
                </h2>
                <video controls className="w-full rounded-lg bg-black" src={job.deliveredVideo.url} />
                <a href={job.deliveredVideo.url} download target="_blank" rel="noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-2 mt-3 text-sm">
                  <Download size={14} /> Re-download
                </a>
              </div>
            )}

            {/* Source material */}
            {job.sampleVideo && (
              <div className="card">
                <h2 className="font-semibold mb-3">Client's Sample Video</h2>
                <video controls className="w-full rounded-lg bg-black" src={job.sampleVideo.url} />
              </div>
            )}

            {job.clips?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold mb-4">Clips to Edit ({job.clips.length})</h2>
                <div className="space-y-2">
                  {[...job.clips].sort((a: any, b: any) => a.order - b.order).map((clip: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <Film size={14} className="text-brand-400 flex-shrink-0" />
                        <span className="text-sm truncate">{clip.originalName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">#{clip.order + 1}</span>
                        <a href={clip.url} download target="_blank" rel="noreferrer"
                          className="text-gray-500 hover:text-brand-400 transition-colors">
                          <Download size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card space-y-3">
              <h3 className="font-semibold text-sm">Job Info</h3>
              <div className="flex items-center gap-2">
                <User size={13} className="text-gray-500" />
                <span className="text-sm text-gray-300">{job.user?.name}</span>
              </div>
              {job.agreedPrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="text-brand-400 font-medium">{job.agreedPrice} {job.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Created</span>
                <span className="text-gray-300 text-xs">{formatDateTime(job.createdAt)}</span>
              </div>
            </div>

            <Link href={`/chat/${job._id}`}
              className="card flex items-center gap-3 hover:border-brand-500/40 transition-colors group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                <MessageSquare size={18} className="text-brand-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Chat with Client</p>
                <p className="text-xs text-gray-500">Real-time messaging</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
