import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardSummary, BloodGroupStat } from '../services/dashboardService';
import { handleApiError } from '../services/apiClient';

interface DashboardData {
  summary: DashboardSummary | null;
  bloodGroups: BloodGroupStat[];
}

interface UseDashboardReturn {
  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData>({ summary: null, bloodGroups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [summaryRes, bloodGroupsRes] = await Promise.allSettled([
      dashboardService.getSummary(),
      dashboardService.getBloodGroups(),
    ]);

    setData({
      summary: summaryRes.status === 'fulfilled' ? summaryRes.value : null,
      bloodGroups: bloodGroupsRes.status === 'fulfilled' ? bloodGroupsRes.value : [],
    });

    // Only surface an error if summary also failed
    if (summaryRes.status === 'rejected') {
      setError(handleApiError(summaryRes.reason));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
