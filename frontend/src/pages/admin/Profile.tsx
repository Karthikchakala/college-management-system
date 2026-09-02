import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, MapPin, Building, Shield, Activity, Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminProfile() {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [userId, setUserId] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      setError(null);
      const res = await api.get('/auth/profile');
      if (res.data.success && res.data.data.user) {
        const u = res.data.data.user;
        setEmail(u.email);
        setName(u.name || 'System Administrator');
        setPhone(u.phone || '');
        setRole(u.role || 'ADMIN');
        setUserId(u.id);
        setAvatarPreview(u.avatarUrl || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve administrator profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put('/auth/profile', {
        name,
        phone,
      });

      if (res.data.success) {
        setSuccess('Administrator profile updated successfully.');
        await fetchProfile();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update administrator profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be under 5 MB.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setAvatarPreview(res.data.data.avatarUrl);
        setSuccess('Administrator photo uploaded to AWS S3 successfully.');
        await fetchProfile();
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Profile</h1>
        <p className="text-sm text-slate-500 font-medium">System administrator profile settings and identity credentials.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & System Role */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 bg-purple-100 flex items-center justify-center text-purple-700 text-3xl font-black shadow-inner">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{name?.charAt(0) || 'A'}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition disabled:opacity-50"
              title="Change Photo"
            >
              {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">{name}</h2>
            <span className="inline-block px-2.5 py-0.5 mt-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              SUPER ADMINISTRATOR
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 space-y-3 text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Administrator ID</span>
              <span className="text-xs font-bold text-slate-700 font-mono break-all">{userId}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Email</span>
              <span className="text-xs font-semibold text-slate-700 break-all">{email}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Level</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Full Cluster Governance
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Contact & Identity Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Administrator Identity Settings</span>
            <span className="text-[11px] text-slate-400 font-normal">Stored in AWS RDS PostgreSQL</span>
          </h3>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Display Name (Editable)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number (Editable)</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Cognito Verified Email (Read-Only)</label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Administrator Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
