'use client';

/*
 * ============================================================================
 * SETUP REQUIRED: Run the SQL below in Supabase SQL Editor before using
 * the messaging feature. Without this table, messages will not persist.
 * ============================================================================
 *
 * Supabase table schema for `messages`:
 *
 * CREATE TABLE messages (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   conversation_id uuid NOT NULL,  -- references engagement_requests.id
 *   sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 *   receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 *   content text NOT NULL,
 *   read boolean DEFAULT false,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
 * CREATE INDEX idx_messages_receiver_unread ON messages(receiver_id, read) WHERE read = false;
 *
 * -- RLS policies:
 * ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can read messages they sent or received"
 *   ON messages FOR SELECT
 *   USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
 *
 * CREATE POLICY "Users can insert messages in their accepted conversations"
 *   ON messages FOR INSERT
 *   WITH CHECK (
 *     auth.uid() = sender_id
 *     AND EXISTS (
 *       SELECT 1 FROM engagement_requests
 *       WHERE id = conversation_id
 *       AND status = 'accepted'
 *       AND (user_id = auth.uid() OR target_id = auth.uid())
 *     )
 *   );
 *
 * CREATE POLICY "Receivers can mark messages as read"
 *   ON messages FOR UPDATE
 *   USING (auth.uid() = receiver_id)
 *   WITH CHECK (auth.uid() = receiver_id);
 *
 * -- Enable Realtime:
 * ALTER PUBLICATION supabase_realtime ADD TABLE messages;
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Loader2,
  Inbox,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

interface ConversationProfile {
  display_name: string;
  trust_score: number;
  trust_level: string;
  avatar_url: string | null;
}

interface Conversation {
  id: string; // engagement_request id = conversation_id
  other_user_id: string;
  profile: ConversationProfile;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conversation view state
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations list
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get all accepted engagement requests involving the user
    const { data: requests, error: reqError } = await supabase
      .from('engagement_requests')
      .select('id, user_id, target_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},target_id.eq.${user.id}`);

    if (reqError) {
      console.error('Failed to load conversations:', reqError.message);
      setError('Failed to load conversations. Please refresh the page.');
      setLoading(false);
      return;
    }

    if (!requests || requests.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // For each request, get the other user's profile + last message + unread count
    const convos: Conversation[] = [];

    for (const req of requests) {
      const otherId = req.user_id === user.id ? req.target_id : req.user_id;

      const [profileRes, lastMsgRes, unreadRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, trust_score, trust_level, avatar_url')
          .eq('id', otherId)
          .single(),
        supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', req.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', req.id)
          .eq('receiver_id', user.id)
          .eq('read', false),
      ]);

      const lastMsg = lastMsgRes.data?.[0];

      convos.push({
        id: req.id,
        other_user_id: otherId,
        profile: profileRes.data || {
          display_name: 'Unknown User',
          trust_score: 0,
          trust_level: 'new',
          avatar_url: null,
        },
        last_message: lastMsg?.content || null,
        last_message_at: lastMsg?.created_at || null,
        unread_count: unreadRes.count || 0,
      });
    }

    // Sort: conversations with recent messages first, then by unread
    convos.sort((a, b) => {
      if (a.last_message_at && b.last_message_at) {
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      }
      if (a.last_message_at) return -1;
      if (b.last_message_at) return 1;
      return b.unread_count - a.unread_count;
    });

    setConversations(convos);
    setLoading(false);
  }

  // Open a conversation
  async function openConversation(convo: Conversation) {
    setActiveConversation(convo);
    setMessagesLoading(true);
    setMessages([]);
    setMessageText('');

    // Load messages
    const { data, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Failed to load messages:', msgError.message);
      setError('Failed to load messages.');
    }

    setMessages((data as Message[]) || []);
    setMessagesLoading(false);

    // Mark unread messages as read
    if (convo.unread_count > 0) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', convo.id)
        .eq('receiver_id', currentUserId)
        .eq('read', false);

      // Update local unread count
      setConversations((prev) =>
        prev.map((c) => (c.id === convo.id ? { ...c, unread_count: 0 } : c))
      );
    }

    // Subscribe to new messages in this conversation
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${convo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convo.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If we received this message, mark it as read
          if (newMsg.receiver_id === currentUserId) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
              .then();
          }

          // Update conversation's last message
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convo.id
                ? {
                    ...c,
                    last_message: newMsg.content,
                    last_message_at: newMsg.created_at,
                  }
                : c
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send a message
  async function sendMessage() {
    if (!messageText.trim() || !activeConversation || sending) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    const { error: sendError } = await supabase.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: currentUserId,
      receiver_id: activeConversation.other_user_id,
      content,
    });

    if (sendError) {
      console.error('Failed to send message:', sendError.message);
      setError('Failed to send message. Please try again.');
      toast('Failed to send message', 'error');
      setMessageText(content); // Restore the message text
    }

    setSending(false);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function formatMessageTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ---- Render: Conversation View ----
  if (activeConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
          <button
            onClick={() => {
              setActiveConversation(null);
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
              }
            }}
            className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center overflow-hidden">
            {activeConversation.profile.avatar_url ? (
              <img
                src={activeConversation.profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-text-muted">
                {activeConversation.profile.display_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-sm">
              {activeConversation.profile.display_name}
            </h2>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Shield className="w-3 h-3" />
              Trust: {activeConversation.profile.trust_score}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeConversation.profile.trust_level === 'trusted' ||
                  activeConversation.profile.trust_level === 'exemplary'
                    ? 'bg-success/10 text-success'
                    : 'bg-bg-elevated text-text-muted'
                }`}
              >
                {activeConversation.profile.trust_level}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
            {error}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-text-muted mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
              <p className="text-text-muted text-sm max-w-sm">
                You&apos;re matched with {activeConversation.profile.display_name}.
                Send a message to begin your introduction.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-accent text-white rounded-br-md'
                          : 'bg-bg-card border border-border text-text rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMine ? 'text-white/60' : 'text-text-muted'
                        }`}
                      >
                        {formatMessageTime(msg.created_at)}
                        {isMine && msg.read && ' \u2022 Read'}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message input */}
        <div className="pt-4 border-t border-border mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-3 text-text text-sm resize-none focus:outline-none focus:border-accent max-h-32"
              style={{ minHeight: '44px' }}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="bg-accent hover:bg-accent-bright text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- Render: Conversations List ----
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Messages</h1>
      <p className="text-text-muted mb-8">
        Secure conversations with your accepted matches. End-to-end privacy by design.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-12 text-center">
          <Inbox className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Once you accept a match (or someone accepts yours), you can start messaging here.
            All conversations require mutual opt-in.
          </p>
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-bright text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            View Matches
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => openConversation(convo)}
              className="w-full bg-bg-card border border-border rounded-2xl p-4 hover:border-border-bright transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                  {convo.profile.avatar_url ? (
                    <img
                      src={convo.profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-text-muted">
                      {convo.profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-semibold text-sm truncate ${
                        convo.unread_count > 0 ? 'text-text' : 'text-text'
                      }`}
                    >
                      {convo.profile.display_name}
                    </h3>
                    {convo.last_message_at && (
                      <span className="text-[11px] text-text-muted shrink-0 ml-2">
                        {formatTime(convo.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        convo.unread_count > 0
                          ? 'text-text font-medium'
                          : 'text-text-muted'
                      }`}
                    >
                      {convo.last_message || 'No messages yet'}
                    </p>
                    {convo.unread_count > 0 && (
                      <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                        {convo.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
