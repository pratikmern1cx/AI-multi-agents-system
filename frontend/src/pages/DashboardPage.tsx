import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { MessageSquare, ArrowLeft, Activity, Clock } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { conversations, loadConversations } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, []);

  const totalMessages = conversations.reduce(
    (sum, conv) => sum + (conv.messages?.length || 0),
    0
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/chat')} style={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Chat
        </button>
        <div style={styles.userInfo}>
          <span>{user?.email}</span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Overview of your AI assistant activity</p>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <MessageSquare size={24} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{conversations.length}</div>
              <div style={styles.statLabel}>Conversations</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Activity size={24} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{totalMessages}</div>
              <div style={styles.statLabel}>Total Messages</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Clock size={24} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>4</div>
              <div style={styles.statLabel}>Active Agents</div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Conversations</h2>
          <div style={styles.conversationsList}>
            {conversations.slice(0, 5).map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate('/chat')}
                style={styles.conversationCard}
              >
                <div style={styles.conversationHeader}>
                  <MessageSquare size={18} />
                  <span style={styles.conversationTitle}>
                    {conv.title || 'New Conversation'}
                  </span>
                </div>
                <div style={styles.conversationMeta}>
                  <span>{conv.messages?.length || 0} messages</span>
                  <span>•</span>
                  <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Available Agents</h2>
          <div style={styles.agentsGrid}>
            {[
              { name: 'Planner Agent', type: 'Strategic planning and task decomposition' },
              { name: 'Research Agent', type: 'Information gathering and synthesis' },
              { name: 'Execution Agent', type: 'Action execution and API calls' },
              { name: 'Review Agent', type: 'Quality assurance and validation' },
            ].map((agent) => (
              <div key={agent.name} style={styles.agentCard}>
                <div style={styles.agentName}>{agent.name}</div>
                <div style={styles.agentType}>{agent.type}</div>
                <div style={styles.agentStatus}>
                  <div style={styles.statusDot} />
                  Active
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0f0f0f',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: '10px 16px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '14px',
    color: '#888',
  },
  logoutButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    marginBottom: '40px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    background: '#4a9eff20',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4a9eff',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#888',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  conversationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  conversationCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  conversationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  conversationTitle: {
    fontSize: '16px',
    fontWeight: '500',
  },
  conversationMeta: {
    fontSize: '14px',
    color: '#666',
    display: 'flex',
    gap: '8px',
  },
  agentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  agentCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px',
  },
  agentName: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  agentType: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '12px',
  },
  agentStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4ade80',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    background: '#4ade80',
    borderRadius: '50%',
  },
};
