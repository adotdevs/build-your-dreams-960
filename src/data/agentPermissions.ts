export interface PermissionItem {
  key: string;
  label: string;
}

export interface PermissionCategory {
  id: string;
  label: string;
  icon: string;
  permissions: PermissionItem[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'client_management',
    label: 'Client Management',
    icon: 'Users',
    permissions: [
      { key: 'view_assigned_clients', label: 'Can view assigned clients' },
      { key: 'edit_client_profile', label: 'Can edit client profile information' },
      { key: 'modify_available_balance', label: 'Can modify available balance' },
      { key: 'modify_blocked_balance', label: 'Can modify blocked balance' },
      { key: 'change_kyc_status', label: 'Can change KYC status (pending / approved / rejected)' },
    ],
  },
  {
    id: 'wallet_management',
    label: 'Wallet Management',
    icon: 'Wallet',
    permissions: [
      { key: 'add_wallet_address', label: 'Can add wallet address' },
      { key: 'edit_wallet_address', label: 'Can edit wallet address' },
      { key: 'delete_wallet_address', label: 'Can delete wallet address' },
    ],
  },
  {
    id: 'recovery_actions',
    label: 'Required Actions / Recovery',
    icon: 'FileText',
    permissions: [
      { key: 'create_required_action_template', label: 'Can create required action (template)' },
      { key: 'create_custom_required_action', label: 'Can create custom required action' },
      { key: 'edit_required_action_amount', label: 'Can edit required action amount' },
      { key: 'change_required_action_currency', label: 'Can change required action currency' },
      { key: 'mark_required_action_completed', label: 'Can mark required action as completed' },
      { key: 'delete_required_action', label: 'Can delete required action' },
      { key: 'change_recovery_case_status', label: 'Can change recovery case status' },
      { key: 'set_urgency_level', label: 'Can set urgency level' },
      { key: 'set_deadline_step', label: 'Can set deadline for a step' },
      { key: 'simulate_fund_release', label: 'Can simulate fund release' },
      { key: 'request_fund_release', label: 'Can request fund release' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'MessageSquare',
    permissions: [
      { key: 'view_assigned_tickets', label: 'Can view tickets of assigned clients' },
      { key: 'reply_to_tickets', label: 'Can reply to tickets' },
      { key: 'change_ticket_status', label: 'Can change ticket status' },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_CATEGORIES.flatMap(c => c.permissions.map(p => p.key));

export type PermissionAccessLevel = 'full_access' | 'restricted' | 'limited';

export function getAccessLevel(permissions: Record<string, boolean>): PermissionAccessLevel {
  const total = ALL_PERMISSION_KEYS.length;
  const enabled = ALL_PERMISSION_KEYS.filter(k => permissions[k]).length;
  
  if (enabled === total) return 'full_access';
  if (enabled >= total * 0.5) return 'restricted';
  return 'limited';
}

export function getAccessBadgeProps(level: PermissionAccessLevel): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (level) {
    case 'full_access':
      return { label: 'Full Access', variant: 'default' };
    case 'restricted':
      return { label: 'Restricted', variant: 'secondary' };
    case 'limited':
      return { label: 'Limited', variant: 'outline' };
  }
}
