import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ClipboardList,
  PlusCircle,
  Clock,
  User,
  Download,
  CheckCircle,
  FileSpreadsheet,
  FileBadge,
} from 'lucide-react';
import { Course, Assignment, AssignmentSubmission } from '../../types';

export default function FacultyAssignments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  
  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState('100');
  const [file, setFile] = useState<File | null>(null);
  
  // Grading State
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [grade, setGrade] = useState('A');
  const [feedback, setFeedback] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoursesAndAssignments = async () => {
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        api.get('/faculty/courses'),
        api.get('/student/assignments'), // reuse assignment search logic
      ]);
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data);
        if (coursesRes.data.data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(coursesRes.data.data[0].id);
        }
      }
      if (assignmentsRes.data.success) {
        setAssignments(assignmentsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndAssignments();
  }, []);

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const res = await api.get(`/faculty/assignments/${assignmentId}/submissions`);
      if (res.data.success) {
        setSubmissions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
    }
  };

  const handleSelectAssignment = async (assign: Assignment) => {
    setSelectedAssignment(assign);
    await fetchSubmissions(assign.id);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('dueDate', new Date(dueDate).toISOString());
    formData.append('points', points);
    formData.append('courseId', selectedCourseId);
    if (file) {
      formData.append('file', file);
    }

    try {
      const res = await api.post('/faculty/assignments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        setSuccess(true);
        setCreateModalOpen(false);
        // Clear form
        setTitle('');
        setDescription('');
        setDueDate('');
        setFile(null);
        await fetchCoursesAndAssignments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;
    setGrading(true);

    try {
      const res = await api.post('/faculty/submissions/grade', {
        submissionId: gradingSubmissionId,
        grade,
        feedback,
      });
      if (res.data.success) {
        setGradingSubmissionId(null);
        setFeedback('');
        if (selectedAssignment) await fetchSubmissions(selectedAssignment.id);
      }
    } catch (err) {
      console.error('Failed to grade submission', err);
    } finally {
      setGrading(false);
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Assignment Management</h1>
          <p className="text-sm text-slate-500 font-medium">Configure homework, review student uploads, and evaluate grades.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-primary-900/10"
        >
          <PlusCircle className="w-4 h-4" /> Create Assignment
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ Assignment published successfully!
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: List of assignments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-600" /> Active Assignments
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No assignments published.</p>
            ) : (
              assignments.map(assign => {
                const selected = selectedAssignment?.id === assign.id;
                return (
                  <div
                    key={assign.id}
                    onClick={() => handleSelectAssignment(assign)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                      selected
                        ? 'bg-sky-50/40 border-primary-500'
                        : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">{assign.course?.code}</span>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug truncate">{assign.title}</h4>
                    <span className="inline-block text-[8px] text-slate-400 font-bold mt-2">
                      Due: {new Date(assign.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected assignment submissions portal */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedAssignment ? (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 space-y-2">
                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{selectedAssignment.course?.code}</span>
                <h2 className="text-xl font-bold text-slate-800 leading-snug">{selectedAssignment.title}</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{selectedAssignment.description}</p>
              </div>

              {/* Submissions list */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  📬 Submissions Received ({submissions.length})
                </h3>

                {submissions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    No submissions received for this assignment yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {submissions.map(sub => (
                      <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" /> {sub.student?.firstName} {sub.student?.lastName}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold">
                            <span>Uploaded: {sub.fileName}</span>
                            <span>• {new Date(sub.submissionDate).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Download and Grade Controls */}
                        <div className="flex items-center gap-2.5">
                          <a
                            href={sub.fileUrl}
                            download
                            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition"
                            title="Download Submission"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {sub.status === 'GRADED' ? (
                            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                              Graded: {sub.grade}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setGradingSubmissionId(sub.id);
                                setGrade('A');
                              }}
                              className="py-1.5 px-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Grade Work
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium italic">
              Select an assignment from the sidebar to review submissions.
            </div>
          )}
        </div>

      </div>

      {/* 4. Create Assignment Modal overlay */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl relative">
            <h3 className="font-black text-slate-800 text-lg">📝 Create Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  >
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Points</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-semester Essay"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instructions</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write clear steps or questions..."
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attachments (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {submitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Grading Modal overlay */}
      {gradingSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl relative">
            <h3 className="font-black text-slate-800 text-lg">📝 Grade Student Submission</h3>
            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Letter Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Comments</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide guidance or score reasons..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmissionId(null)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="py-2 px-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {grading ? 'Submitting...' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
