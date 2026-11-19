import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Company {
  id: string;
  name: string;
  slug: string;
  crypto_id_code: string;
  logo_url: string | null;
  primary_color: string | null;
  default_currency: string;
  status: string;
}

interface UseCompanyReturn {
  company: Company | null;
  isLoading: boolean;
  viewingCompanyId: string | null;
  setViewingCompanyId: (id: string | null) => void;
  currentCompanyId: string | null;
}

export const useCompany = (): UseCompanyReturn => {
  const { companyId, isPlatformOwner } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCompanyId, setViewingCompanyId] = useState<string | null>(null);

  // For platform owners in impersonation mode, use viewingCompanyId; otherwise use their own companyId
  const currentCompanyId = isPlatformOwner ? (viewingCompanyId || companyId) : companyId;

  useEffect(() => {
    const fetchCompany = async () => {
      if (!currentCompanyId) {
        setCompany(null);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', currentCompanyId)
        .maybeSingle();

      if (data) {
        setCompany(data as Company);
      }
      setIsLoading(false);
    };

    fetchCompany();
  }, [currentCompanyId]);

  return {
    company,
    isLoading,
    viewingCompanyId,
    setViewingCompanyId,
    currentCompanyId,
  };
};
