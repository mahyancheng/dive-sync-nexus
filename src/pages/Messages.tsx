import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MoreVertical, Plus, Search as SearchIcon, Send } from "lucide-react";

// Simple, reliable Messages page rebuild
// - Auto DM creation via ?u=<userId>
// - Deep link via ?c=<conversationId>
// - Realtime message inserts
// - Robust auth/session init

interface ConversationListItem {
  id: string;
  name: string;
  avatar?: string | null;
  lastMessage?: string;
  lastTimestamp?: string;
  unread?: number;
}

interface UiMessage {
  id: string;
  senderId: 'me' | 'other';
  text: string;
  timestamp: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sessionReady, setSessionReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");

  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // SEO: title
  useEffect(() => {
    document.title = "Messages | Dive Community";
  }, []);

  // Init auth listener first, then fetch existing session (best practice)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setUserId(s?.user?.id ?? null);
      setSessionReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helpers to read URL/state params - only update when location.search changes
  const navParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const fromState = (location as any)?.state || {};
    return {
      c: params.get('c') as string | null,
      u: (fromState.targetUserId as string | null) || (params.get('u') as string | null),
    };
  }, [location.search]);

  // Auto-create/get a DM when ?u is present, then switch URL to ?c
  useEffect(() => {
    if (!sessionReady || !userId) return;

    const boot = async () => {
      const params = new URLSearchParams(location.search);
      const u = params.get('u');
      const c = params.get('c');
      
      console.log('[Messages:boot]', { u, c, userId });
      
      if (c && c !== selectedConversation) {
        setSelectedConversation(c);
        return;
      }
      if (u) {
        const { data, error } = await supabase.rpc('create_or_get_direct_conversation', {
          target_user_id: u,
        });
        if (error) {
          console.error('[Messages] RPC error create_or_get_direct_conversation', error);
          return;
        }
        if (data) {
          setSelectedConversation(data as string);
          navigate(`/messages?c=${data}`, { replace: true, state: { conversationId: data } });
        }
        return;
      }
    };

    boot();
  }, [sessionReady, userId, location.search]);

  // Load conversations for current user
  useEffect(() => {
    if (!sessionReady || !userId) return;

    const loadConversations = async () => {
      // Get all conversation ids where user is a participant
      const { data: cps, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);
      if (error) {
        console.error('[Messages] error fetching conversation_participants', error);
        return;
      }
      const ids = (cps || []).map((r) => r.conversation_id);
      if (!ids.length) {
        setConversations([]);
        return;
      }

      // For each conversation: fetch other participant profile + last message
      const items: ConversationListItem[] = [];
      for (const id of ids) {
        // Find the other participant's user_id first (no FK join available)
        const { data: otherRow, error: otherErr } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', id)
          .neq('user_id', userId)
          .limit(1)
          .single();

        let otherProfile: any = null;
        if (!otherErr && otherRow?.user_id) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', otherRow.user_id)
            .single();
          otherProfile = prof as any;
        }

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('id, content, created_at')
          .eq('conversation_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        items.push({
          id,
          name: otherProfile?.full_name || otherProfile?.username || 'Conversation',
          avatar: otherProfile?.avatar_url ?? null,
          lastMessage: lastMsg?.content ?? undefined,
          lastTimestamp: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined,
          unread: 0,
        });
      }

      // Sort by lastTimestamp desc
      items.sort((a, b) => {
        const tA = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
        const tB = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
        return tB - tA;
      });

      setConversations(items);

      // Only auto-open first conversation if there's no conversation ID in URL and no selection
      const params = new URLSearchParams(location.search);
      const hasExplicitConversation = params.get('c') || params.get('u');
      if (!selectedConversation && items.length > 0 && !hasExplicitConversation) {
        const first = items[0].id;
        setSelectedConversation(first);
        navigate(`/messages?c=${first}`, { replace: true, state: { conversationId: first } });
      }
    };

    loadConversations();
  }, [sessionReady, userId]);

  // Load messages whenever selectedConversation changes
  useEffect(() => {
    const load = async () => {
      if (!selectedConversation || !userId) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('[Messages] error fetch messages', error);
        return;
      }
      setMessages(
        (data || []).map((m) => ({
          id: m.id as string,
          senderId: m.sender_id === userId ? 'me' : 'other',
          text: m.content as string,
          timestamp: new Date(m.created_at as string).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
      );
    };
    load();
  }, [selectedConversation, userId]);

  // Subscribe to realtime INSERTs for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    // Cleanup any previous channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const channel = supabase
      .channel(`messages-ch:${selectedConversation}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`,
      }, (payload) => {
        const row = payload.new as any;
        setMessages((prev) => ([
          ...prev,
          {
            id: row.id,
            senderId: row.sender_id === userId ? 'me' : 'other',
            text: row.content,
            timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]));
      })
      .subscribe((status) => {
        console.log('[Messages] realtime status', status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedConversation, userId]);

  // Sending messages
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !selectedConversation || !userId) return;
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation,
      sender_id: userId,
      content: text,
    });
    if (error) {
      console.error('[Messages] send error', error);
      return;
    }
    setMessageText("");
  };

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q)
    );
  }, [search, conversations]);

  const selectedMeta = useMemo(() => conversations.find(c => c.id === selectedConversation), [conversations, selectedConversation]);

  return (
    <AuthGuard>
      <div className="h-screen bg-background pt-4 pb-20 overflow-hidden">
        {!selectedConversation ? (
          // Conversations List View
          <div className="h-full flex flex-col">
            <div className="mb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">Messages</h1>
                <Button size="icon" variant="ghost" aria-label="New">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-muted-foreground">Connect with your dive buddies</p>
            </div>

            {/* Search */}
            <div className="mb-4 px-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 px-4">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start a chat from a profile.</p>
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {filteredConversations.map((c) => (
                    <Card
                      key={c.id}
                      className="p-4 cursor-pointer hover:bg-accent/5 transition-colors border-accent/20"
                      onClick={() => {
                        setSelectedConversation(c.id);
                        navigate(`/messages?c=${c.id}`, { replace: true, state: { conversationId: c.id } });
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={c.avatar || undefined} />
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            {c.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <h3 className="font-semibold truncate">{c.name}</h3>
                            {c.lastTimestamp && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">{c.lastTimestamp}</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{c.lastMessage || 'No messages yet'}</p>
                        </div>

                        {c.unread && c.unread > 0 && (
                          <Badge className="bg-coral text-white flex-shrink-0">{c.unread}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          // Chat View
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 pb-4 border-b flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedConversation(null)}
                className="flex-shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedMeta?.avatar || undefined} />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {(selectedMeta?.name ?? '??').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{selectedMeta?.name ?? 'Conversation'}</h2>
                <p className="text-xs text-muted-foreground">Direct messages</p>
              </div>

              <Button size="icon" variant="ghost" className="flex-shrink-0" aria-label="More">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Say hi 👋</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          m.senderId === 'me' ? 'bg-accent text-accent-foreground' : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{m.text}</p>
                        <p className="text-xs opacity-70 mt-1">{m.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t flex-shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!messageText.trim()} className="flex-shrink-0" aria-label="Send">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default Messages;
