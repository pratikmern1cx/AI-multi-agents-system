import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { Plus, RefreshCw, X, ArrowLeft, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function TasksPage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  
  const { tasks, isLoading, loadTasks, createTask, cancelTask, retryTask, updateTaskStatus } =
    useTaskStore();
  
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    loadTasks();
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'task_update') {
      updateTaskStatus(lastMessage.taskId, lastMessage.status, lastMessage.data);
    }
  }, [lastMessage]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} style={{ color: '#888' }} />;
      case 'running':
        return <Loader size={16} style={{ color: '#4a9eff' }} className="spinning" />;
      case 'completed':
        return <CheckCircle size={16} style={{ color: '#4ade80' }} />;
      case 'failed':
        return <XCircle size={16} style={{ color: '#ff4a4a' }} />;
      case 'cancelled':
        return <X size={16} style={{ color: '#888' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#888';
      case 'running':
        return '#4a9eff';
      case 'completed':
        return '#4ade80';
      case 'failed':
        return '#ff4a4a';
      case 'cancelled':
        return '#888';
      default:
        return '#888';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/chat')} style={styles.backButton}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 style={styles.title}>Tasks</h1>
        <button onClick={() => setShowCreateModal(true)} style={styles.createButton}>
          <Plus size={20} />
          New Task
        </button>
      </div>

      <div style={styles.filters}>
        {['all', 'pending', 'running', 'completed', 'failed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterButton,
              ...(filter === f ? styles.filterButtonActive : {}),
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.taskList}>
        {isLoading && tasks.length === 0 ? (
          <div style={styles.loading}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={styles.empty}>
            <p>No tasks found</p>
            <button onClick={() => setShowCreateModal(true)} style={styles.emptyButton}>
              Create your first task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskHeader}>
                <div style={styles.taskTitle}>
                  {getStatusIcon(task.status)}
                  <span>{task.title}</span>
                </div>
                <div style={styles.taskActions}>
                  {task.status === 'failed' && (
                    <button
                      onClick={() => retryTask(task.id)}
                      style={styles.actionButton}
                      title="Retry"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  {(task.status === 'pending' || task.status === 'running') && (
                    <button
                      onClick={() => cancelTask(task.id)}
                      style={styles.actionButton}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {task.description && (
                <div style={styles.taskDescription}>{task.description}</div>
              )}

              <div style={styles.taskMeta}>
                <span style={{ ...styles.taskStatus, color: getStatusColor(task.status) }}>
                  {task.status}
                </span>
                <span style={styles.taskType}>{task.type}</span>
                <span style={styles.taskPriority}>Priority: {task.priority}</span>
                <span style={styles.taskTime}>
                  {new Date(task.created_at).toLocaleString()}
                </span>
              </div>

              {task.error_message && (
                <div style={styles.taskError}>{task.error_message}</div>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            await createTask(data);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('execution');
  const [priority, setPriority] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate({ title, description, type, priority });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Create New Task</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...styles.input, minHeight: '80px' }}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={styles.input}>
              <option value="planning">Planning</option>
              <option value="research">Research</option>
              <option value="execution">Execution</option>
              <option value="analysis">Analysis</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Priority (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={styles.submitButton}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0f0f0f',
    padding: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px',
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
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
  },
  createButton: {
    padding: '10px 20px',
    background: '#4a9eff',
    borderRadius: '8px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px',
  },
  filterButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#888',
    fontSize: '14px',
  },
  filterButtonActive: {
    background: '#4a9eff20',
    borderColor: '#4a9eff',
    color: '#4a9eff',
  },
  taskList: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  taskCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px',
  },
  taskHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  taskTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    fontWeight: '500',
  },
  taskActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
  },
  taskDescription: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '12px',
  },
  taskMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#666',
  },
  taskStatus: {
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  taskType: {
    textTransform: 'capitalize',
  },
  taskPriority: {},
  taskTime: {},
  taskError: {
    marginTop: '12px',
    padding: '12px',
    background: '#ff4a4a20',
    border: '1px solid #ff4a4a',
    borderRadius: '8px',
    color: '#ff4a4a',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#888',
  },
  emptyButton: {
    marginTop: '16px',
    padding: '12px 24px',
    background: '#4a9eff',
    borderRadius: '8px',
    color: 'white',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    padding: '12px',
    background: '#0f0f0f',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  cancelButton: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e0e0e0',
  },
  submitButton: {
    padding: '10px 20px',
    background: '#4a9eff',
    borderRadius: '8px',
    color: 'white',
  },
};
