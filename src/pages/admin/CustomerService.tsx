import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser, filterUsersByAdminGroup, syncUserReferralsWithSupabase } from '@/lib/adminPermissions';
import { Search, Send, User, MessageCircle, Image, Loader2 } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

interface Message {
  id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

interface ChatUser {
  id: string;
  email: string;
  username: string;
  lastMessage: string;
  lastMessageTime: string;
}

const CustomerService = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadChatUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch conversations (users with existing messages)
      const { data: allMessages, error: msgError } = await supabase
        .from('support_messages')
        .select('user_id, message, created_at')
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      const latestPerUser = new Map();
      allMessages?.forEach(msg => {
        if (!latestPerUser.has(msg.user_id)) {
          latestPerUser.set(msg.user_id, msg);
        }
      });

      const messageUserIds = Array.from(latestPerUser.keys());
      
      // Sync referrals to ensure the admin has the latest mapping for filtering
      await syncUserReferralsWithSupabase();

      // 2. Fetch profiles (either those with messages OR matching search term)
      const query = supabase.from('profiles').select('id, email, username');
      
      if (searchTerm) {
        // If searching, include users matching the term
        // For simplicity in mock/real, we'll fetch profiles matching search and combine
        const { data: searchProfiles, error: sError } = await supabase
          .from('profiles')
          .select('id, email, username')
          .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
          
        if (sError) console.error("Search profiles error:", sError);
        
        // Merge with existing message users
        const searchIds = (searchProfiles || []).map(p => p.id);
        const combinedIds = Array.from(new Set([...messageUserIds, ...searchIds]));
        
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, email, username')
          .in('id', combinedIds);
          
        if (profError) throw profError;
        
        const results = (profiles || []).map(p => ({
          id: p.id,
          email: p.email || 'Unknown',
          username: p.username || 'Unknown',
          lastMessage: latestPerUser.get(p.id)?.message || 'No messages yet',
          lastMessageTime: latestPerUser.get(p.id)?.created_at || new Date().toISOString()
        }));
        const adminId = getAdminIdForCurrentUser(currentUser?.email);
        setUsers(filterUsersByAdminGroup(results, adminId));
      } else {
        // If no search term, show users with messages OR just some profiles if no messages yet
        if (messageUserIds.length > 0) {
          const { data: profiles, error: profError } = await supabase
            .from('profiles')
            .select('id, email, username')
            .in('id', messageUserIds);
            
          if (profError) throw profError;
          
          const results = (profiles || []).map(p => ({
            id: p.id,
            email: p.email || 'Unknown',
            username: p.username || 'Unknown',
            lastMessage: latestPerUser.get(p.id)?.message || 'No messages yet',
            lastMessageTime: latestPerUser.get(p.id)?.created_at || new Date().toISOString()
          }));
          const adminId = getAdminIdForCurrentUser(currentUser?.email);
          setUsers(filterUsersByAdminGroup(results, adminId));
        } else {
          // Fallback: Show all profiles so admin can start a chat
          const { data: allProfs, error: allErr } = await supabase
            .from('profiles')
            .select('id, email, username')
            .limit(50);
            
          if (allErr) throw allErr;
          
          const results = (allProfs || []).map(p => ({
            id: p.id,
            email: p.email || 'Unknown',
            username: p.username || 'Unknown',
            lastMessage: 'No messages yet',
            lastMessageTime: new Date().toISOString()
          }));
          const adminId = getAdminIdForCurrentUser(currentUser?.email);
          setUsers(filterUsersByAdminGroup(results, adminId));
        }
      }
    } catch (error) {
      console.error("Chat users load error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [searchTerm, currentUser?.email]);

  const selectedUserRef = useRef<ChatUser | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadChatUsers();

    // Fallback polling to reload the sidebar conversations list silently every 6 seconds
    const listPollInterval = setInterval(() => {
      loadChatUsers(true);
    }, 6000);

    return () => {
      clearInterval(listPollInterval);
    };
  }, [loadChatUsers]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    // Setup unified instant broadcast channel
    const channel = supabase
      .channel('support-chat-broadcast')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages' 
      }, payload => {
        const newMsg = payload.new as Message;
        
        // 1. If message belongs to active user, append it safely
        if (selectedUserRef.current && newMsg.user_id === selectedUserRef.current.id) {
          setMessages(prev => {
            const isDuplicate = prev.some(m => 
              m.id === newMsg.id || 
              (m.id.toString().startsWith('temp-') && m.message === newMsg.message && m.sender_type === newMsg.sender_type)
            );
            if (isDuplicate) {
              return prev.map(m => (m.id.toString().startsWith('temp-') && m.message === newMsg.message && m.sender_type === newMsg.sender_type) ? newMsg : m);
            }
            return [...prev, newMsg];
          });
        }

        // 2. Instantly sort or update sidebar list
        setUsers(prev => {
          const userIdx = prev.findIndex(u => u.id === newMsg.user_id);
          if (userIdx !== -1) {
            const updatedUsers = [...prev];
            updatedUsers[userIdx] = {
              ...updatedUsers[userIdx],
              lastMessage: newMsg.message,
              lastMessageTime: newMsg.created_at
            };
            return updatedUsers.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
          } else {
            loadChatUsers(true);
            return prev;
          }
        });
      })
      .on('broadcast', { event: 'new_msg' }, payload => {
        const newMsg = payload.payload as Message;
        
        // 1. If message belongs to active user, append it safely
        if (selectedUserRef.current && newMsg.user_id === selectedUserRef.current.id) {
          setMessages(prev => {
            const isDuplicate = prev.some(m => 
              m.id === newMsg.id || 
              (m.id.toString().startsWith('temp-') && m.message === newMsg.message && m.sender_type === newMsg.sender_type)
            );
            if (isDuplicate) {
              return prev.map(m => (m.id.toString().startsWith('temp-') && m.message === newMsg.message && m.sender_type === newMsg.sender_type) ? newMsg : m);
            }
            return [...prev, newMsg];
          });
        }

        // 2. Instantly sort or update sidebar list
        setUsers(prev => {
          const userIdx = prev.findIndex(u => u.id === newMsg.user_id);
          if (userIdx !== -1) {
            const updatedUsers = [...prev];
            updatedUsers[userIdx] = {
              ...updatedUsers[userIdx],
              lastMessage: newMsg.message,
              lastMessageTime: newMsg.created_at
            };
            return updatedUsers.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
          } else {
            loadChatUsers(true);
            return prev;
          }
        });
      })
      .subscribe();

    channelRef.current = channel;

    // Fast fallback polling interval (1.5s) to guarantee absolute reliability even under spotty network connections
    const activeChatPollInterval = setInterval(() => {
      if (selectedUserRef.current) {
        loadMessages(selectedUserRef.current.id);
      }
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      clearInterval(activeChatPollInterval);
    };
  }, [loadChatUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    
    const msgTemplate = {
      user_id: selectedUser.id,
      sender_type: 'admin' as const,
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    
    const tempId = 'temp-' + Date.now();
    setNewMessage('');
    // Optimistically add to list
    setMessages(prev => [...prev, { id: tempId, ...msgTemplate }]);
    
    try {
      const { data, error } = await supabase.from('support_messages').insert({
        user_id: msgTemplate.user_id,
        sender_type: msgTemplate.sender_type,
        message: msgTemplate.message,
        created_at: msgTemplate.created_at
      }).select().single();

      if (error) throw error;

      // Swap temp message with real database row immediately
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? (data as Message) : m));

        // Instantly broadcast the admin message to the user modal
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'new_msg',
            payload: data
          }).catch(console.error);
        }
      }
    } catch (error: any) {
      console.error('Failed to send', error);
      alert('Failed to send message: ' + error.message);
      // Clean up the optimistic message if database persistence fails
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedUser.id}/support_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const bucketName = 'support-attachments';

      let imageUrl = '';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { upsert: true });

      if (error) {
        console.error('Storage Upload Error:', error);
        console.warn('Saving support attachment to base64 due to bucket issues.');
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        imageUrl = publicUrl;
      }

      const { data: insertedMsg, error: insertError } = await supabase.from('support_messages').insert({
        user_id: selectedUser.id,
        sender_type: 'admin',
        message: `[IMAGE]:${imageUrl}`,
        created_at: new Date().toISOString()
      }).select().single();

      if (insertError) throw insertError;
      
      if (insertedMsg) {
        setMessages(prev => [...prev, insertedMsg as Message]);

        // Instantly broadcast the admin image message to the user modal
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'new_msg',
            payload: insertedMsg
          }).catch(console.error);
        }
      }
    } catch (err) {
      console.error('Support upload error:', err);
      alert('Failed to send image attachment.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Customer Service</h1>
        <p className="text-sm text-muted-foreground mt-1">Live support terminal for user inquiries.</p>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border flex overflow-hidden min-h-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
             <CubeSpinner label="Loading active chats..." />
          </div>
        ) : (
          <>
            {/* Sidebar */}
            <div className="w-full md:w-80 border-r border-border flex flex-col">
              <div className="p-4 border-b border-border">
                 <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                   <div className="p-6 text-center text-muted-foreground text-sm">No active chats found.</div>
                ) : (
                  filteredUsers.map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)}
                      className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${selectedUser?.id === u.id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-foreground truncate">{u.username}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {new Date(u.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1 truncate">{u.email}</div>
                      <div className="text-xs text-foreground/80 truncate">{u.lastMessage}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-background/50 hidden md:flex">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{selectedUser.username}</div>
                      <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {messages.map(m => {
                      const isImage = m.message.startsWith('[IMAGE]:');
                      const messageContent = isImage ? m.message.substring(8) : m.message;
                      
                      return (
                        <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl p-3 ${m.sender_type === 'admin' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                             {isImage ? (
                               <div className="relative overflow-hidden rounded-lg">
                                 <img 
                                   src={messageContent} 
                                   alt="Support Attachment" 
                                   className="max-w-[200px] max-h-48 rounded-lg object-contain cursor-zoom-in hover:opacity-95 transition-all" 
                                   referrerPolicy="no-referrer"
                                   onClick={() => window.open(messageContent, '_blank')}
                                 />
                               </div>
                             ) : (
                               <p className="text-sm">{m.message}</p>
                             )}
                             <span className="text-[9px] opacity-70 mt-1 block text-right">
                               {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-card border-t border-border">
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-muted border border-border text-foreground hover:bg-muted/85 rounded-xl transition-colors disabled:opacity-50"
                        title="Attach Image"
                      >
                        {isUploading ? <Loader2 size={18} className="animate-spin text-primary" /> : <Image size={18} />}
                      </button>

                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your reply here..." 
                        className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                      <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                         <Send size={18} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                   <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                     <MessageCircle size={32} className="opacity-50" />
                   </div>
                   <p className="font-medium text-sm">Select a user to start chatting</p>
                </div>
              )}
            </div>
            
            {/* Mobile View Toggle Logic... for simplicity just visible above */}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerService;
