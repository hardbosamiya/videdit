'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { getErrorMessage, formatBytes } from '@/lib/utils';
import { Upload, Film, X, Plus, GripVertical, Loader2, Check } from 'lucide-react';

interface ClipFile { file: File; order: number; preview?: string; }

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'sample' | 'clips' | 'done'>('details');
  const [jobId, setJobId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [clips, setClips] = useState<ClipFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Step 1: Create job
  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    setUploading(true);
    try {
      const { data } = await api.post('/jobs', { title, description });
      setJobId(data.job._id);
      setStep('sample');
      toast.success('Job created!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const ACCEPTED_VIDEO_TYPES = {
    'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    'application/octet-stream': ['.mp4', '.mkv', '.mov', '.avi', '.webm'],
    'application/mp4': ['.mp4'],
  };

  // Sample video dropzone
  const { getRootProps: getSampleProps, getInputProps: getSampleInput, isDragActive: sampleDrag } = useDropzone({
    accept: ACCEPTED_VIDEO_TYPES,
    maxFiles: 1,
    onDrop: (accepted, rejected) => {
      if (accepted.length > 0) setSampleFile(accepted[0]);
      else if (rejected.length > 0) toast.error('Sample file rejected. Please ensure it is a valid video.');
    },
  });

  // Clips dropzone
  const { getRootProps: getClipsProps, getInputProps: getClipsInput, isDragActive: clipsDrag } = useDropzone({
    accept: ACCEPTED_VIDEO_TYPES,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (acceptedFiles.length > 0) {
        setClips(prev => [
          ...prev,
          ...acceptedFiles.map((f, i) => ({ file: f, order: prev.length + i })),
        ]);
      }
      if (rejectedFiles.length > 0) toast.error(`${rejectedFiles.length} file(s) rejected. Only valid videos are allowed.`);
    },
  });

  // Upload sample
  const uploadSample = async () => {
    if (!sampleFile) return toast.error('Please select a sample video');
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('video', sampleFile);
      await api.post(`/jobs/${jobId}/sample-video`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
      });
      toast.success('Sample video uploaded!');
      setStep('clips');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Upload clips
  const uploadClips = async () => {
    setUploading(true);
    try {
      if (clips.length > 0) {
        const fd = new FormData();
        clips.forEach(c => fd.append('clips', c.file));
        fd.append('orders', JSON.stringify(clips.map(c => c.order)));
        await api.post(`/jobs/${jobId}/clips`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
        });
      }
      toast.success('Job submitted successfully!');
      setStep('done');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeClip = (i: number) => setClips(prev => prev.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, order: idx })));

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">New Project</h1>
          <p className="text-gray-400 text-sm">Upload your footage for professional editing</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {['details', 'sample', 'clips', 'done'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step === s ? 'bg-brand-500 text-white' :
                ['details', 'sample', 'clips', 'done'].indexOf(step) > i ? 'bg-green-500/20 text-green-400' : 'bg-surface-3 text-gray-500'
              }`}>
                {['details', 'sample', 'clips', 'done'].indexOf(step) > i ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-xs text-gray-500 capitalize hidden sm:block">{s}</span>
              {i < 3 && <div className="w-8 h-px bg-surface-3" />}
            </div>
          ))}
        </div>

        {/* Step 1: Details */}
        {step === 'details' && (
          <form onSubmit={createJob} className="card space-y-4">
            <h2 className="font-semibold text-lg">Project Details</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Project Title *</label>
              <input className="input" placeholder="e.g. Wedding Highlight Reel" value={title}
                onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea className="input min-h-[100px] resize-none" placeholder="Describe what you're looking for..." value={description}
                onChange={e => setDescription(e.target.value)} />
            </div>
            <button type="submit" disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : null}
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Sample video */}
        {step === 'sample' && (
          <div className="card space-y-5">
            <h2 className="font-semibold text-lg">Upload Sample Video</h2>
            <div {...getSampleProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              sampleDrag ? 'border-brand-500 bg-brand-500/5' : 'border-surface-4 hover:border-surface-4'
            }`}>
              <input {...getSampleInput()} />
              <Film size={40} className="mx-auto text-gray-600 mb-3" />
              {sampleFile ? (
                <div>
                  <p className="text-white font-medium">{sampleFile.name}</p>
                  <p className="text-gray-500 text-sm">{formatBytes(sampleFile.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300 font-medium">Drop your sample video here</p>
                  <p className="text-gray-500 text-sm mt-1">MP4, MOV, AVI, MKV, WEBM · Max 500MB</p>
                </div>
              )}
            </div>

            {progress > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Uploading...</span><span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={uploadClips} className="btn-secondary flex-1 text-sm" disabled={uploading}>
                Skip (no sample)
              </button>
              <button onClick={uploadSample} disabled={!sampleFile || uploading} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload Sample
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Clips */}
        {step === 'clips' && (
          <div className="card space-y-5">
            <h2 className="font-semibold text-lg">Upload Clips</h2>
            <div {...getClipsProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              clipsDrag ? 'border-brand-500 bg-brand-500/5' : 'border-surface-4 hover:border-surface-4/80'
            }`}>
              <input {...getClipsInput()} />
              <Plus size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-300">Drop clips here or click to browse</p>
              <p className="text-gray-500 text-sm mt-1">Up to 20 clips</p>
            </div>

            {clips.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clips.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                    <GripVertical size={14} className="text-gray-600" />
                    <Film size={14} className="text-brand-400 flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{c.file.name}</span>
                    <span className="text-xs text-gray-500">{formatBytes(c.file.size)}</span>
                    <button onClick={() => removeClip(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {progress > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Uploading {clips.length} clips...</span><span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={uploadClips} className="btn-secondary flex-1 text-sm" disabled={uploading}>
                {clips.length === 0 ? 'Skip Clips' : 'Upload & Submit'}
              </button>
              {clips.length > 0 && (
                <button onClick={uploadClips} disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Submit Job
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="card text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Job Submitted!</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">Our team will review your project and get back to you with pricing details shortly.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => router.push(`/dashboard/user/jobs/${jobId}`)} className="btn-primary text-sm">
                View Job
              </button>
              <button onClick={() => router.push('/dashboard/user')} className="btn-secondary text-sm">
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
