import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Phone, MapPin, Building, Shield, Clipboard } from 'lucide-react';

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  dateOfBirth: string;
  phone?: string;
  address?: string;
  admissionDate: string;
  department: {
    name: string;
    code: string;
  };
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        const studentData = res.data.data.user.student;
        setProfile(studentData);
        setPhone(studentData.phone || '');
        setAddress(studentData.address || '');
      }
    } catch (err: any) {
      setError('Failed to load profile.');
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
    setSuccess(false);

    try {
      const res = await api.put('/student/profile', { phone, address });
      if (res.data.success) {
        setSuccess(true);
        await fetchProfile();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
        {error || 'Profile is currently unavailable.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-500 font-medium">Verify your university details and keep your contact details updated.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-2xl">
            {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">{profile.firstName} {profile.lastName}</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full mt-1 inline-block">
              {profile.enrollmentNumber}
            </span>
          </div>
          <div className="pt-4 border-t border-slate-100 text-left space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile.department.name} ({profile.department.code})</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
              <Clipboard className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Admitted: {new Date(profile.admissionDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form & Read-only display */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            ✏️ Edit Personal Information
          </h3>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-xs text-slate-700 font-semibold transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter residential address"
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-xs text-slate-700 font-semibold transition"
                ></textarea>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                <Shield className="w-3.5 h-3.5" /> Administrative locks prevent editing name or department details
              </span>
              <button
                type="submit"
                disabled={updating}
                className="py-2 px-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary-900/10"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
