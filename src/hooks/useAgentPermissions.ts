import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_PERMISSION_KEYS } from '@/data/agentPermissions';

export function useAgentPermissions(agentId: string | undefined) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!agentId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_permissions')
        .select('permission_key, enabled')
        .eq('agent_id', agentId);

      if (error) throw error;

      const permsMap: Record<string, boolean> = {};
      ALL_PERMISSION_KEYS.forEach(k => { permsMap[k] = false; });
      (data || []).forEach(row => {
        permsMap[row.permission_key] = row.enabled;
      });
      setPermissions(permsMap);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const togglePermission = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllPermissions = (enabled: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_PERMISSION_KEYS.forEach(k => { updated[k] = enabled; });
    setPermissions(updated);
  };

  const savePermissions = async () => {
    if (!agentId) return false;
    setIsSaving(true);
    setSaveError(null);

    try {
      // Get the agent's company_id to include in permission rows
      const { data: agentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', agentId)
        .maybeSingle();

      if (profileError) throw profileError;

      const companyId = agentProfile?.company_id;
      if (!companyId) {
        throw new Error('Agent not linked to a company. Assign the agent to a company first.');
      }

      const rows = ALL_PERMISSION_KEYS.map(key => ({
        agent_id: agentId,
        permission_key: key,
        enabled: permissions[key] ?? false,
        company_id: companyId,
      }));

      // Upsert avoids duplicate key errors on (agent_id, permission_key)
      const { error } = await supabase
        .from('agent_permissions')
        .upsert(rows, { onConflict: 'agent_id,permission_key' });

      if (error) throw error;
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to save permissions';
      setSaveError(message);
      console.error('Error saving permissions:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    permissions,
    isLoading,
    isSaving,
    saveError,
    togglePermission,
    setAllPermissions,
    savePermissions,
    refetch: fetchPermissions,
  };
}
