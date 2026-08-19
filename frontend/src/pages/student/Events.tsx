import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, MapPin, Clock, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { Event } from '../../types';

export default function StudentEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/student/dashboard');
      if (res.data.success) {
        // Map registered status inside the events
        setEvents(res.data.data.upcomingEvents);
      }
    } catch (err: any) {
      setError('Failed to fetch campus events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: string) => {
    setActionLoadingId(eventId);
    setError(null);
    try {
      const res = await api.post('/student/events/register', { eventId });
      if (res.data.success) {
        alert('Successfully registered for the event!');
        await fetchEvents();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelRegistration = async (registrationId: string, eventId: string) => {
    setActionLoadingId(eventId);
    setError(null);
    try {
      const res = await api.delete(`/student/events/cancel/${registrationId}`);
      if (res.data.success) {
        alert('Event registration cancelled successfully.');
        await fetchEvents();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setActionLoadingId(null);
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Campus Events</h1>
        <p className="text-sm text-slate-500 font-medium">Join seminars, workshops, and hackathons to enrich your skill set.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.length === 0 ? (
          <div className="md:col-span-2 p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 font-medium">
            No upcoming events posted.
          </div>
        ) : (
          events.map(event => {
            const registration = event.registrations?.[0];
            const isRegistered = !!registration;
            const isActionLoading = actionLoadingId === event.id;

            return (
              <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-800 text-base leading-snug">{event.title}</h3>
                    {isRegistered && (
                      <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                        Registered
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{event.description}</p>
                  
                  {/* Event Schedule Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] text-slate-400 font-bold pt-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {event.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {event.location}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  {isRegistered ? (
                    <button
                      onClick={() => handleCancelRegistration(registration.id, event.id)}
                      disabled={isActionLoading}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      {isActionLoading ? 'Processing...' : 'Cancel Registration'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={isActionLoading}
                      className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary-900/10 flex items-center justify-center gap-2"
                    >
                      {isActionLoading ? 'Processing...' : 'Register For Event'}
                    </button>
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
