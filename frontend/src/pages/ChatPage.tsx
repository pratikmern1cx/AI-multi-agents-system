import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { Send, Plus, MessageSquare, LogOut, LayoutDashboard, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
    30% { opacity: 1; transform: scale(1); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .message-enter {
    animation: fadeIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default function ChatPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const {
    conversations,
    currentConversation,
    isSending,
    loadConversations,
    createConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
  } = useChatStore();

  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleNewChat = async () => {
    await createConversation('New Conversation');
  };

  const handleDeleteConversation = async () => {
    if (!deleteTarget) return;
    await deleteConversation(deleteTarget.id);
    setDeleteTarget(null);
  };

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    
    const renderContent = (text: string) => {
      if (!text.includes('**')) return text;
      const parts = text.split('**');
      return parts.map((part, i) => 
        i % 2 === 1 ? <strong key={i} style={{ color: '#fff', fontWeight: '700' }}>{part}</strong> : part
      );
    };

    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={index} style={{ height: '8px' }} />;

      // Bullet points
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const bulletText = trimmedLine.substring(2);
        return (
          <div key={index} style={styles.listItem}>
            <span style={{ color: '#4a9eff', marginRight: '8px' }}>•</span>
            {renderContent(bulletText)}
          </div>
        );
      }

      // Numbered lists
      const numberMatch = trimmedLine.match(/^(\d+\.)\s+(.*)/);
      if (numberMatch) {
        return (
          <div key={index} style={styles.listItem}>
            <span style={{ color: '#4a9eff', fontWeight: '700', marginRight: '8px' }}>{numberMatch[1]}</span>
            {renderContent(numberMatch[2])}
          </div>
        );
      }

      // Regular paragraph
      return (
        <div key={index} style={styles.paragraph}>
          {renderContent(line)}
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <Sparkles size={24} color="#4a9eff" />
            <span style={styles.logoText}>AI Chat</span>
          </div>
          <button onClick={handleNewChat} style={styles.newChatButton} title="New Chat">
            <Plus size={20} />
          </button>
        </div>

        <div style={styles.conversationList}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              style={{
                ...styles.conversationItem,
                ...(currentConversation?.id === conv.id ? styles.conversationItemActive : {}),
              }}
            >
              <div style={styles.conversationItemMain}>
                <MessageSquare size={16} />
                <span style={styles.conversationTitle}>
                  {conv.title || 'New Conversation'}
                </span>
              </div>
              <button
                type="button"
                aria-label="Delete conversation"
                onClick={(event) => {
                  event.stopPropagation();
                  setDeleteTarget({ id: conv.id, title: conv.title || 'New Conversation' });
                }}
                style={styles.deleteButton}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <button onClick={() => navigate('/dashboard')} style={styles.footerButton}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button onClick={logout} style={styles.footerButton}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.main}>
        {currentConversation ? (
          <>
            <div style={styles.messages}>
              {currentConversation.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className="message-enter"
                  style={{
                    ...styles.messageWrapper,
                    ...(msg.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper),
                  }}
                >
                  <div style={styles.messageAvatar}>
                    {msg.role === 'user' ? (
                      <div style={styles.userAvatar}>
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div style={styles.aiAvatar}>
                        <Sparkles size={16} />
                      </div>
                    )}
                  </div>
                  <div style={{
                    ...styles.messageContent,
                    textAlign: msg.role === 'user' ? 'right' : 'left'
                  }}>
                    <div style={styles.messageName}>
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div style={{
                      ...styles.messageText,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="message-enter" style={{
                  ...styles.messageWrapper,
                  ...styles.assistantMessageWrapper
                }}>
                  <div style={styles.messageAvatar}>
                    <div style={styles.aiAvatar}>
                      <Sparkles size={16} />
                    </div>
                  </div>
                  <div style={{
                    ...styles.messageContent,
                    textAlign: 'left'
                  }}>
                    <div style={styles.messageName}>AI Assistant</div>
                    <div style={styles.typingContainer}>
                      <span style={styles.typingDot}></span>
                      <span style={{...styles.typingDot, animationDelay: '0.2s'}}></span>
                      <span style={{...styles.typingDot, animationDelay: '0.4s'}}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputContainer}>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Message AI Assistant..."
                  style={styles.input}
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  style={{
                    ...styles.sendButton,
                    ...((!input.trim() || isSending) ? styles.sendButtonDisabled : {}),
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
              <div style={styles.inputHint}>
                AI can make mistakes. Check important info.
              </div>
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Sparkles size={48} />
            </div>
            <h2 style={styles.emptyTitle}>Start a conversation</h2>
            <p style={styles.emptyText}>
              Ask me anything! I'm here to help with information, ideas, and more.
            </p>
            <button onClick={handleNewChat} style={styles.emptyButton}>
              <Plus size={20} />
              New Conversation
            </button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div style={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalTitle}>Delete conversation?</div>
            <div style={styles.modalText}>
              This will remove "{deleteTarget.title}" and all its messages.
            </div>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={styles.modalCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConversation}
                style={styles.modalDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    background: '#0a0a0a',
  },
  sidebar: {
    width: '260px',
    background: '#171717',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #4a9eff 0%, #7b68ee 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  newChatButton: {
    padding: '8px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  conversationItem: {
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '2px',
    transition: 'background 0.2s',
    color: '#a0a0a0',
  },
  conversationItemMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    flex: 1,
  },
  conversationItemActive: {
    background: '#2a2a2a',
    color: '#e0e0e0',
  },
  conversationTitle: {
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteButton: {
    padding: '6px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#a0a0a0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  sidebarFooter: {
    padding: '12px',
    borderTop: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  footerButton: {
    padding: '10px 12px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#a0a0a0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0a',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  messageWrapper: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  userMessageWrapper: {
    flexDirection: 'row-reverse',
    marginLeft: 'auto',
    maxWidth: '85%',
  },
  assistantMessageWrapper: {
    flexDirection: 'row',
    marginRight: 'auto',
    maxWidth: '85%',
  },
  messageAvatar: {
    flexShrink: 0,
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4a9eff 0%, #7b68ee 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
  },
  aiAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#e0e0e0',
  },
  messageText: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#d0d0d0',
  },
  paragraph: {
    marginBottom: '12px',
  },
  listItem: {
    marginBottom: '8px',
    paddingLeft: '4px',
  },
  typingContainer: {
    display: 'flex',
    gap: '4px',
    padding: '8px 0',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4a9eff',
    animation: 'pulse 1.4s infinite ease-in-out',
  },
  inputContainer: {
    padding: '20px 24px',
    borderTop: '1px solid #2a2a2a',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    background: '#171717',
    borderRadius: '24px',
    padding: '4px',
    border: '1px solid #2a2a2a',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    color: '#e0e0e0',
    fontSize: '15px',
    outline: 'none',
  },
  sendButton: {
    padding: '12px 16px',
    background: '#4a9eff',
    borderRadius: '20px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  sendButtonDisabled: {
    background: '#2a2a2a',
    color: '#666',
    cursor: 'not-allowed',
  },
  inputHint: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
    marginTop: '12px',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '40px',
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4a9eff20 0%, #7b68ee20 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4a9eff',
    marginBottom: '8px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#e0e0e0',
    margin: 0,
  },
  emptyText: {
    fontSize: '15px',
    color: '#888',
    maxWidth: '400px',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  emptyButton: {
    padding: '12px 24px',
    background: '#4a9eff',
    borderRadius: '24px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modal: {
    background: '#171717',
    border: '1px solid #2a2a2a',
    borderRadius: '14px',
    padding: '20px',
    width: '360px',
    maxWidth: '90vw',
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '600',
  },
  modalText: {
    fontSize: '14px',
    color: '#b0b0b0',
    lineHeight: '1.5',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  modalCancel: {
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#c0c0c0',
    cursor: 'pointer',
  },
  modalDelete: {
    padding: '8px 14px',
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
  },
};
