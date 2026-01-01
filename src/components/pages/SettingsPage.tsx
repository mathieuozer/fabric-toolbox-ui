import { useState } from 'react';
import { MoreHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClientConfig } from '@/contexts/ClientConfigContext';
import { validateClientConfig, type ClientConfigFormData, type ClientConfig } from '@/types';
import { toast } from 'sonner';

const emptyFormData: ClientConfigFormData = {
  name: '',
  tenantId: '',
  applicationId: '',
  displayName: '',
};

export function SettingsPage() {
  const { state, activeConfig, addConfiguration, updateConfiguration, deleteConfiguration, setActiveConfig } = useClientConfig();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<ClientConfig | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientConfigFormData>(emptyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const validation = validateClientConfig(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (editingId) {
      updateConfiguration(editingId, formData);
      toast.success('Configuration updated');
      setEditingId(null);
    } else {
      addConfiguration(formData);
      toast.success('Configuration added');
    }

    setFormData(emptyFormData);
    setErrors({});
    setIsAddDialogOpen(false);
  };

  const handleEdit = (config: ClientConfig) => {
    setFormData({
      name: config.name,
      tenantId: config.azureAD.tenantId,
      applicationId: config.azureAD.applicationId,
      displayName: config.azureAD.displayName,
    });
    setEditingId(config.id);
    setIsAddDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteConfig) {
      deleteConfiguration(deleteConfig.id);
      toast.success('Configuration deleted');
      setDeleteConfig(null);
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingId(null);
    setFormData(emptyFormData);
    setErrors({});
  };

  return (
    <div>
      {/* Breadcrumb */}
      <p
        className="font-mono uppercase mb-6"
        style={{
          fontSize: 'var(--text-label)',
          color: 'var(--text-faint)',
          letterSpacing: 'var(--letter-spacing-caps)'
        }}
      >
        settings / configurations
      </p>

      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-mono font-medium mb-2"
          style={{
            fontSize: 'var(--text-h1)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--letter-spacing-tight)',
            lineHeight: 'var(--line-height-tight)'
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
          Manage your Azure AD configurations
        </p>
      </div>

      {/* Configurations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 'var(--text-tag)',
              color: 'var(--text-faint)',
              letterSpacing: 'var(--letter-spacing-caps)'
            }}
          >
            Configurations
          </p>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="font-mono transition-colors"
            style={{
              fontSize: 'var(--text-label)',
              color: 'var(--accent)',
              transitionDuration: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
          >
            + Add new
          </button>
        </div>

        {state.configurations.length === 0 ? (
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full py-12 border border-dashed text-center transition-colors"
            style={{
              borderColor: 'var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              transitionDuration: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <p className="font-mono mb-1" style={{ fontSize: 'var(--text-small)', color: 'var(--text-primary)' }}>
              No configurations yet
            </p>
            <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}>
              Click to add your first Azure AD configuration
            </p>
          </button>
        ) : (
          <div
            className="border"
            style={{
              borderColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {state.configurations.map((config, index) => {
              const isActive = activeConfig?.id === config.id;

              return (
                <div
                  key={config.id}
                  className="card-accent group flex items-center justify-between gap-4 transition-colors"
                  style={{
                    padding: 'var(--card-padding)',
                    paddingLeft: '20px',
                    borderBottom: index < state.configurations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transitionDuration: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveConfig(config.id);
                      toast.success(`Switched to ${config.name}`);
                    }}
                    className="flex items-center gap-3 text-left min-w-0 flex-1"
                  >
                    <div
                      className="w-5 h-5 border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isActive ? 'var(--accent)' : 'var(--border-medium)',
                        background: isActive ? 'var(--bg-selected)' : 'transparent',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {isActive && <Check className="w-3 h-3" style={{ color: 'var(--accent)' }} />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-mono truncate"
                        style={{
                          fontSize: 'var(--text-small)',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {config.name}
                      </p>
                      <p
                        className="font-mono truncate"
                        style={{
                          fontSize: 'var(--text-tag)',
                          color: 'var(--text-faint)'
                        }}
                      >
                        {config.azureAD.tenantId}
                      </p>
                    </div>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-2 opacity-0 group-hover:opacity-100 transition-all"
                        style={{
                          color: 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                          transitionDuration: 'var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[120px]"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-strong)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <DropdownMenuItem
                        onClick={() => handleEdit(config)}
                        style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteConfig(config)}
                        style={{ color: '#ef4444', fontSize: 'var(--text-small)' }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent
          className="sm:max-w-md"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-strong)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {editingId ? 'Edit configuration' : 'Add configuration'}
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              Enter your Azure AD app registration details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="font-mono uppercase"
                style={{
                  fontSize: 'var(--text-tag)',
                  color: 'var(--text-muted)',
                  letterSpacing: 'var(--letter-spacing-caps)'
                }}
              >
                Name
              </Label>
              <Input
                id="name"
                placeholder="Production"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: errors.name ? '#ef4444' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-small)'
                }}
              />
              {errors.name && <p style={{ fontSize: 'var(--text-small)', color: '#ef4444' }}>{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tenantId"
                className="font-mono uppercase"
                style={{
                  fontSize: 'var(--text-tag)',
                  color: 'var(--text-muted)',
                  letterSpacing: 'var(--letter-spacing-caps)'
                }}
              >
                Tenant ID
              </Label>
              <Input
                id="tenantId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.tenantId}
                onChange={(e) => {
                  setFormData({ ...formData, tenantId: e.target.value });
                  if (errors.tenantId) setErrors({ ...errors, tenantId: undefined });
                }}
                className="font-mono"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: errors.tenantId ? '#ef4444' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-small)'
                }}
              />
              {errors.tenantId && <p style={{ fontSize: 'var(--text-small)', color: '#ef4444' }}>{errors.tenantId}</p>}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="applicationId"
                className="font-mono uppercase"
                style={{
                  fontSize: 'var(--text-tag)',
                  color: 'var(--text-muted)',
                  letterSpacing: 'var(--letter-spacing-caps)'
                }}
              >
                Application (Client) ID
              </Label>
              <Input
                id="applicationId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.applicationId}
                onChange={(e) => {
                  setFormData({ ...formData, applicationId: e.target.value });
                  if (errors.applicationId) setErrors({ ...errors, applicationId: undefined });
                }}
                className="font-mono"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: errors.applicationId ? '#ef4444' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-small)'
                }}
              />
              {errors.applicationId && <p style={{ fontSize: 'var(--text-small)', color: '#ef4444' }}>{errors.applicationId}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              style={{
                background: 'transparent',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {editingId ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfig} onOpenChange={(open) => !open && setDeleteConfig(null)}>
        <AlertDialogContent
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-strong)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono" style={{ color: 'var(--text-primary)' }}>
              Delete configuration?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
              This will delete "{deleteConfig?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                background: 'transparent',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
