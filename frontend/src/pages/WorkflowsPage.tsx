import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowService, Workflow } from '../services/workflow.service';
import { Plus, Play, Edit, Trash2, ArrowLeft, Clock, Zap } from 'lucide-react';

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await workflowService.executeWorkflow(id);
      alert('Workflow execution started!');
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Failed to execute workflow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await workflowService.deleteWorkflow(id);
      setWorkflows(workflows.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (filter === 'all') return true;
    if (filter === 'active') return w.is_active;
    if (filter === 'inactive') return !w.is_active;
    return w.trigger_type === filter;
  });

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'scheduled':
        return <Clock size={16} />;
      case 'manual':
        return <Play size={16} />;
      default:
        return <Zap size={16} />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/chat')} style={styles.backButton}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 style={styles.title}>Workflows</h1>
        <button onClick={() => navigate('/workflows/create')} style={styles.createButton}>
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      <div style={styles.filters}>
        {['all', 'active', 'inactive', 'manual', 'scheduled', 'event'].map((f) => (
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

      <div style={styles.workflowList}>
        {isLoading ? (
          <div style={styles.loading}>Loading workflows...</div>
        ) : filteredWorkflows.length === 0 ? (
          <div style={styles.empty}>
            <p>No workflows found</p>
            <button onClick={() => navigate('/workflows/create')} style={styles.emptyButton}>
              Create your first workflow
            </button>
          </div>
        ) : (
          filteredWorkflows.map((workflow) => (
            <div key={workflow.id} style={styles.workflowCard}>
              <div style={styles.workflowHeader}>
                <div style={styles.workflowTitle}>
                  {getTriggerIcon(workflow.trigger_type)}
                  <span>{workflow.name}</span>
                  {!workflow.is_active && (
                    <span style={styles.inactiveBadge}>Inactive</span>
                  )}
                </div>
                <div style={styles.workflowActions}>
                  {workflow.trigger_type === 'manual' && (
                    <button
                      onClick={() => handleExecute(workflow.id)}
                      style={styles.actionButton}
                      title="Execute"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                    style={styles.actionButton}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    style={styles.actionButton}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {workflow.description && (
                <div style={styles.workflowDescription}>{workflow.description}</div>
              )}

              <div style={styles.workflowMeta}>
                <span style={styles.triggerType}>
                  {workflow.trigger_type.charAt(0).toUpperCase() +
                    workflow.trigger_type.slice(1)}
                </span>
                <span>{workflow.steps?.length || 0} steps</span>
                {workflow.last_run_at && (
                  <span>Last run: {new Date(workflow.last_run_at).toLocaleString()}</span>
                )}
              </div>

              {workflow.trigger_type === 'scheduled' && workflow.trigger_config?.cron && (
                <div style={styles.cronInfo}>
                  Cron: <code>{workflow.trigger_config.cron}</code>
                </div>
              )}
            </div>
          ))
        )}
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
    flexWrap: 'wrap',
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
  workflowList: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  workflowCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px',
  },
  workflowHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  workflowTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    fontWeight: '500',
  },
  inactiveBadge: {
    padding: '4px 8px',
    background: '#88888820',
    border: '1px solid #888',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#888',
  },
  workflowActions: {
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
  workflowDescription: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '12px',
  },
  workflowMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#666',
  },
  triggerType: {
    textTransform: 'capitalize',
    color: '#4a9eff',
  },
  cronInfo: {
    marginTop: '12px',
    padding: '8px 12px',
    background: '#4a9eff10',
    border: '1px solid #4a9eff40',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
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
};
