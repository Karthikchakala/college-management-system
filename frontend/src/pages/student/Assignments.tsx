import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  UploadCloud,
  CheckCircle,
  FileBadge2,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Assignment } from '../../types';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/student/assignments');
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch (err: any) {
      setError('Failed to fetch assignments list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (assignmentId: string) => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    setSubmittingId(assignmentId);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('file', file);

    try {
      const res = await api.post('/student/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        setSuccessMsg('Assignment uploaded and submitted successfully!');
        setFile(null);
        // Refresh assignment list
        await fetchAssignments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload assignment.');
    } finally {
      setSubmittingId(null);
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Assignments</h1>
        <p className="text-sm text-slate-500 font-medium">Download homework requirements and submit your completed documents.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-6">
        {assignments.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 font-medium">
            No assignments assigned to your courses.
          </div>
        ) : (
          assignments.map(assign => {
            const submission = assign.submissions?.[0];
            const isDue = new Date(assign.dueDate) > new Date();
            
            return (
              <div key={assign.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6 hover:shadow-md transition">
                
                {/* Column 1: Details */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider block">
                      {assign.course?.code} • {assign.course?.name}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">{assign.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{assign.description}</p>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Due Date: {new Date(assign.dueDate).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileBadge2 className="w-3.5 h-3.5" /> Max Points: {assign.points}
                    </span>
                    {assign.fileUrl && (
                      <a
                        href={assign.fileUrl}
                        download
                        className="flex items-center gap-1 text-primary-600 hover:underline border border-primary-200 rounded px-2 py-0.5"
                      >
                        <Download className="w-3 h-3" /> Material
                      </a>
                    )}
                  </div>
                </div>

                {/* Column 2: Submission Controls */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-200/50 p-4 flex flex-col justify-between space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission Portal</h4>
                  
                  {submission ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>Work Submitted ({submission.status})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium space-y-1">
                        <p>Uploaded: <span className="text-slate-700 font-semibold">{submission.fileName}</span></p>
                        <p>Timestamp: <span className="text-slate-700 font-semibold">{new Date(submission.submissionDate).toLocaleString()}</span></p>
                      </div>
                      {submission.status === 'GRADED' && (
                        <div className="p-3 bg-indigo-50/80 rounded-lg border border-indigo-100 text-xs leading-normal">
                          <p className="font-bold text-indigo-900">Grade: <span className="text-sm font-black text-primary-600">{submission.grade}</span></p>
                          <p className="text-[10px] text-slate-500 mt-1 italic">Feedback: "{submission.feedback || 'No comments'}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      No submission found
                    </div>
                  )}

                  {/* Submission Form (Only if open, or can update submission) */}
                  {(!submission || submission.status === 'SUBMITTED') && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                      />
                      <button
                        onClick={() => handleUploadSubmit(assign.id)}
                        disabled={submittingId === assign.id || !file}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        {submission ? 'Resubmit Work' : 'Submit Assignment'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
