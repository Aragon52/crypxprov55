import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { X, Send, HeadphonesIcon, Minus, MessageCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

export const SupportChatModal = ({ isOpen, onClose }: SupportChatModalProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user || !isOpen) return;

    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
      }
    };
    
    loadMessages();

    // Subscribe to both PostgreSQL changes and instant WebSocket broadcast events
    const channel = supabase
      .channel('support-chat-broadcast')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages', 
        filter: `user_id=eq.${user.id}` 
      }, payload => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          const isDuplicate = prev.some(m => 
            m.id === newMsg.id || 
            (m.id.toString().startsWith('temp-') && m.message === newMsg.message && m.sender_type === newMsg.sender_type)
          );
          if (isDuplicate) {
            // Replace our local optimistic temp message with the actual database-persisted message
            return prev.map(m => (m.id.toString().startsWith('temp-') && m.message === newMsg.message && m.sender_type === newMsg.sender_type) ? newMsg : m);
          }
          return [...prev, newMsg];
        });
      })
      .on('broadcast', { event: 'new_msg' }, payload => {
        const newMsg = payload.payload as Message;
        if (newMsg.user_id === user.id) {
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
      })
      .subscribe();

    channelRef.current = channel;

    // Fast fallback polling interval (1.5s) to guarantee absolute reliability even under spotty network connections
    const pollInterval = setInterval(loadMessages, 1500);

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      clearInterval(pollInterval);
    };
  }, [user, isOpen]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    const msgTemplate: Message = {
      id: 'temp-' + Date.now(),
      user_id: user.id,
      sender_type: 'user',
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    
    setNewMessage('');
    // Render the message instantly for a seamless, ultra-fast chat experience
    setMessages(prev => [...prev, msgTemplate]);
    
    try {
      const { data, error } = await supabase.from('support_messages').insert({
        user_id: msgTemplate.user_id,
        sender_type: msgTemplate.sender_type,
        message: msgTemplate.message,
        created_at: msgTemplate.created_at
      }).select().single();
      
      if (error) throw error;
      
      if (data) {
        setMessages(prev => prev.map(m => m.id === msgTemplate.id ? (data as Message) : m));
        
        // Instantly broadcast the message so the administrator receives it with sub-millisecond latency
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'new_msg',
            payload: data
          }).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Failed to send', error);
      // Clean up the optimistic message if database persistence fails
      setMessages(prev => prev.filter(m => m.id !== msgTemplate.id));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/support_${Math.random().toString(36).substring(2)}.${fileExt}`;
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
        user_id: user.id,
        sender_type: 'user',
        message: `[IMAGE]:${imageUrl}`,
        created_at: new Date().toISOString()
      }).select().single();

      if (insertError) throw insertError;
      if (insertedMsg) {
        setMessages(prev => [...prev, insertedMsg as Message]);
        
        // Instantly broadcast the image message to the admin portal
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

  if (!isOpen) return null;

  return (
    <div className={`fixed z-[100] transition-all duration-300 ease-in-out ${
      isMinimized 
        ? 'bottom-20 right-4 w-14 h-14 rounded-full overflow-hidden shadow-2xl'
        : 'bottom-0 right-0 sm:bottom-20 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[600px] sm:rounded-2xl shadow-2xl flex flex-col bg-card border border-border'
    }`}>
      {isMinimized ? (
        <button 
          onClick={() => setIsMinimized(false)}
          className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <MessageCircle size={24} />
        </button>
      ) : (
        <>
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground sm:rounded-t-2xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <HeadphonesIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">CrypX-Pro Support</h3>
                <div className="text-[11px] opacity-90 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>admin@crypxpro.com</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 rounded-full hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              >
                <Minus size={18} />
              </button>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-muted/30 space-y-4">
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-card text-foreground border border-border p-3 rounded-2xl rounded-tl-none shadow-sm space-y-1">
                <p className="text-sm font-semibold">Welcome to CrypX-Pro Support</p>
                <p className="text-xs text-muted-foreground">
                  How can we assist you today? Inquiries are tracked in real-time or answered via our official desk at <span className="text-primary font-medium">admin@crypxpro.com</span>.
                </p>
              </div>
            </div>
            
            {messages.map(m => {
              const isImage = m.message.startsWith('[IMAGE]:');
              const messageContent = isImage ? m.message.substring(8) : m.message;
              
              return (
                <div key={m.id} className={`flex ${m.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                    m.sender_type === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card text-foreground border border-border rounded-tl-none'
                  }`}>
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
                      <p className="text-sm break-words">{m.message}</p>
                    )}
                    <span className={`text-[9px] mt-1 block text-right ${m.sender_type === 'user' ? 'opacity-80' : 'text-muted-foreground'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border shrink-0">
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
                className="w-12 h-12 flex-shrink-0 bg-muted border border-border text-foreground hover:bg-muted/80 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                title="Attach Image"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin text-primary" /> : <ImageIcon size={18} />}
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 flex-shrink-0 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
