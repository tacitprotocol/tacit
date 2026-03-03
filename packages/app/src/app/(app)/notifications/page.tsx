'use client';

/*
 * ============================================================================
 * SETUP REQUIRED: Run the SQL below in Supabase SQL Editor to create the
 * notifications table. Without this table, notifications will not persist.
 * ============================================================================
 *
 * CREATE TABLE notifications (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 *   type text NOT NULL CHECK (type IN (
 *     'introduction_received', 'match_accepted', 'match_declined',
 *     'message_received', 'credential_verified', 'trust_score_change'
 *   )),
 *   actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
 *   title text NOT NULL,
 *   body text,
 *   action_url text,
 *   read boolean DEFAULT false,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
 * CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
 *
 * ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can read their own notifications"
 *   ON notifications FOR SELECT
 *   USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can update their own notifications"
 *   ON notifications FOR UPDATE
 *   USING (auth.uid() = user_id)
 *   WITH CHECK (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can delete their own notifications"
 *   ON notifications FOR DELETE
 *   USING (auth.uid() = user_id);
 *
 * -- System can insert notifications for any user
 * CREATE POLICY "Service role can insert notifications"
 *   ON notifications FOR INSERT
 *   WITH CHECK (true);
 *
 * ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
 */

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  Users,
  MessageSquare,
  Shield,
  TrendingUp,
  CheckCheck,
  Trash2,
  Loader2,
  UserPlus,
  UserX,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  actor_id: string | null;
  title: string;
  body: string | null;
  action_url: string | null;
  read: boolean;
  created_at: string;
  actor_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  introduction_received: UserPlus,
  match_accepted: Users,
  match_declined: UserX,
  message_received: MessageSquare,
  credential_verified: Shield,
  trust_score_change: TrendingUp,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  introduction_received: 'text-accent',
  match_accepted: 'text-success',
  match_declined: 'text-danger',
  message_received: 'text-accent-bright',
  credential_verified: 'text-success',
  trust_score_change: 'text-warning',
};

export default function NotificationsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    loadNotifications();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: loadErr } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (loadErr) {
      console.error('Failed to load notifications:', loadErr.message);
      setError('Failed to load notifications. Please refresh the page.');
      setLoading(false);
      return;
    }

    // Fetch actor profiles for notifications that have an actor_id
    const actorIds = [...new Set((data || []).filter(n => n.actor_id).map(n => n.actor_id))];
    let actorProfiles: Record<string, { display_name: string; avatar_url: string | null }> = {};

    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', actorIds);

      if (profiles) {
        actorProfiles = Object.fromEntries(
          profiles.map(p => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
        );
      }
    }

    const enriched = (data || []).map(n => ({
      ...n,
      actor_profile: n.actor_id ? actorProfiles[n.actor_id] : undefined,
    }));

    setNotifications(enriched);
    setLoading(false);

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  async function markAsRead(id: string) {
    const { error: updateErr } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (updateErr) {
      console.error('Failed to mark as read:', updateErr.message);
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateErr } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (updateErr) {
      console.error('Failed to mark all as read:', updateErr.message);
      toast('Failed to mark all as read', 'error');
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast('All notifications marked as read', 'success');
    }
    setMarkingAll(false);
  }

  async function deleteNotification(id: string) {
    const { error: delErr } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.error('Failed to delete notification:', delErr.message);
      toast('Failed to delete notification', 'error');
      return;
    }

    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function groupByDate(notifs: Notification[]) {
    const groups: { label: string; items: Notification[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayItems: Notification[] = [];
    const yesterdayItems: Notification[] = [];
    const thisWeekItems: Notification[] = [];
    const olderItems: Notification[] = [];

    for (const n of notifs) {
      const d = new Date(n.created_at);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() >= today.getTime()) todayItems.push(n);
      else if (d.getTime() >= yesterday.getTime()) yesterdayItems.push(n);
      else if (d.getTime() >= weekAgo.getTime()) thisWeekItems.push(n);
      else olderItems.push(n);
    }

    if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
    if (thisWeekItems.length) groups.push({ label: 'This Week', items: thisWeekItems });
    if (olderItems.length) groups.push({ label: 'Older', items: olderItems });

    return groups;
  }

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;
  const groups = groupByDate(filtered);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-bright transition-colors disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all read
          </button>
        )}
      </div>
      <p className="text-text-muted mb-6">
        Stay updated on matches, messages, and trust score changes.
      </p>

      {error && (
        <div className="mb-6 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'unread'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-accent/10 text-accent-bright'
                : 'text-text-muted hover:text-text hover:bg-bg-elevated'
            }`}
          >
            {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-12 text-center">
          <BellOff className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {filter === 'unread' ? 'All caught up' : 'No notifications yet'}
          </h3>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            {filter === 'unread'
              ? 'You have no unread notifications. Check back later.'
              : 'When someone sends you an introduction request, accepts a match, or messages you, it will appear here.'}
          </p>
          {filter === 'unread' && (
            <button
              onClick={() => setFilter('all')}
              className="text-accent hover:text-accent-bright text-sm font-medium transition-colors"
            >
              View all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.items.map(notif => {
                  const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                  const color = NOTIFICATION_COLORS[notif.type] || 'text-text-muted';

                  const content = (
                    <div
                      className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors group ${
                        notif.read
                          ? 'bg-bg-card border-border hover:border-border-bright'
                          : 'bg-accent/5 border-accent/20 hover:border-accent/40'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.read ? 'bg-bg-elevated' : 'bg-accent/10'
                      }`}>
                        {notif.actor_profile?.avatar_url ? (
                          <img
                            src={notif.actor_profile.avatar_url}
                            alt=""
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <Icon className={`w-5 h-5 ${color}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.read ? 'text-text' : 'text-text font-medium'}`}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-xs text-text-muted mt-0.5 truncate">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-[11px] text-text-muted mt-1">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notif.id); }}
                            className="p-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-4 h-4 text-text-muted" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(notif.id); }}
                          className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-text-muted hover:text-danger" />
                        </button>
                      </div>

                      {/* Unread dot */}
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
                      )}
                    </div>
                  );

                  if (notif.action_url) {
                    return (
                      <Link
                        key={notif.id}
                        href={notif.action_url}
                        onClick={() => { if (!notif.read) markAsRead(notif.id); }}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={notif.id}
                      onClick={() => { if (!notif.read) markAsRead(notif.id); }}
                      className="cursor-pointer"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
