import { useState, useEffect, useCallback } from 'react';
import { requestService } from '../services/requestService';
import { BloodRequest, RequestListParams } from '../types/request';
import { handleApiError } from '../services/apiClient';

// ── List hook ─────────────────────────────────────────────────────────────────
interface UseRequestsReturn {
  requests: BloodRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: (params?: RequestListParams) => void;
}

export function useRequests(initialParams?: RequestListParams): UseRequestsReturn {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (params?: RequestListParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await requestService.listRequests(params);
      setRequests(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { requests, isLoading, error, refetch: fetch };
}

// ── Single request hook ────────────────────────────────────────────────────────
interface UseRequestReturn {
  request: BloodRequest | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRequest(id: number): UseRequestReturn {
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await requestService.getRequest(id);
      setRequest(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { request, isLoading, error, refetch: fetch };
}
