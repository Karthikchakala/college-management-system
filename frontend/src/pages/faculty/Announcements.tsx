import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Megaphone, PlusCircle, Calendar, FileText } from 'lucide-react';
import { Course, Announcement } from '../../types';

export default function FacultyAnnouncements() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncementsAndCourses = async () => {
    try {
      const [coursesRes, announcementsRes] = await Promise.all([
        api.get('/faculty/courses'),
        api.get('/faculty/dashboard'), // dashboard contains announcements
      ]);
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data);
        if (coursesRes.data.data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(coursesRes.data.data[0].id);
        }
      }
      if (announcementsRes.data.success) {
        setAnnouncements(announcementsRes.data.data.announcements);
      }
    } catch (err) {
      console.error('Failed to load portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncementsAndCourses();
  }, []);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.post('/faculty/announcements', {
        title,
        content,
        type,
        courseId: selectedCourseId,
      });
      if (res.data.success) {
        setSuccess(true);
        setTitle('');
        setContent('');
        await fetchAnnouncementsAndCourses();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Post Announcement</h1>
        <p className="text-sm text-slate-500 font-medium">Broadcast notices and critical alerts directly to your course rosters.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ Announcement posted and students notified successfully!
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Create Notice form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-600" /> Create Broadcast Announcement
          </h3>

          <form onSubmit={handlePostAnnouncement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Broadcast Classification</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="EXAM">Examination Details</option>
                  <option value="EVENT">Event Schedule</option>
                  <option value="ASSIGNMENT">Homework / Task Brief</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headline Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update for Lab Classes"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs text-slate-700 font-semibold transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message description here..."
                rows={5}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs text-slate-700 font-semibold transition"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary-900/10"
            >
              {submitting ? 'Broadcasting notice...' : 'Broadcast Notice'}
            </button>
          </form>
        </div>

        {/* Right Side: Log summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Published Feeds
          </h3>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No announcements published yet.</p>
            ) : (
              announcements.map(notice => (
                <div key={notice.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1">
                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-extrabold uppercase">
                    <span className="text-primary-600">{notice.type}</span>
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 leading-snug">{notice.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed truncate">{notice.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
