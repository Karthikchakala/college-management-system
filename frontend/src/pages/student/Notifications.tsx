import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Check, MailOpen } from 'lucide-react';

export default function StudentNotifications() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Notifications</h1>
          <p className="text-sm text-slate-500 font-medium">Keep track of academic alerts, exam grading notices, and event registrations.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            <MailOpen className="w-4 h-4 text-slate-400" /> Mark All as Read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 font-medium">
            📭 No alerts or notifications found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0 ${
                  !notif.isRead ? 'bg-sky-50/20 px-4 rounded-xl border border-sky-100/40 my-1' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${!notif.isRead ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 leading-normal">{notif.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{notif.message}</p>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Received: {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="flex items-center gap-1 py-1 px-2.5 border border-primary-200 hover:bg-primary-50 text-primary-600 font-bold rounded-lg text-[10px] transition shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" /> Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
