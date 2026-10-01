import { useState } from 'react';
import { Sparkles, BrainCircuit, ShieldAlert, CopyPlus, ListChecks } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { handleApiError } from '../../services/apiClient';
import { AiAnalysisResult, DuplicateAnalysisResult } from '../../types/ai';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { UrgencyBadge } from './UrgencyBadge';
import { Link } from 'react-router-dom';

interface AiAnalysisPanelProps {
  requestId: number;
  description: string;
}

export function AiAnalysisPanel({ requestId, description }: AiAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [checkingDupes, setCheckingDupes] = useState(false);
  
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateAnalysisResult | null>(null);
  
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const result = await aiService.analyzeRequest({
        request_id: requestId,
        description: description || 'No description provided.',
      });
      setAnalysis(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCheckDuplicates = async () => {
    setCheckingDupes(true);
    setError('');
    try {
      const result = await aiService.checkDuplicate({ request_id: requestId });
      setDuplicates(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setCheckingDupes(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-500" />
            AI Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated urgency assessment and duplicate detection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!analysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              isLoading={analyzing}
              disabled={analyzing || checkingDupes}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Analyze Request
            </Button>
          )}
          {!duplicates && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckDuplicates}
              isLoading={checkingDupes}
              disabled={analyzing || checkingDupes}
            >
              <CopyPlus className="h-4 w-4 mr-1.5" />
              Check Duplicates
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 space-y-4">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              AI Summary & Urgency
            </h3>
            {analysis.urgency && <UrgencyBadge value={analysis.urgency} />}
          </div>
          
          <div className="text-sm text-foreground/80 space-y-1">
            <p>{analysis.summary || 'No summary generated.'}</p>
          </div>

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="pt-3 border-t border-purple-100 space-y-2">
              <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Recommendations
              </p>
              <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Duplicate Results */}
      {duplicates && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className={`h-4 w-4 ${duplicates.is_duplicate ? 'text-destructive' : 'text-success'}`} />
            <h3 className="text-sm font-semibold">
              {duplicates.is_duplicate ? 'Potential Duplicate Detected' : 'No Duplicates Found'}
            </h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {duplicates.reasoning || (duplicates.is_duplicate 
              ? 'This request appears to match existing requests in the system.' 
              : 'This request appears to be unique.')}
          </p>

          {duplicates.is_duplicate && duplicates.duplicate_request_ids && duplicates.duplicate_request_ids.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Similar requests:</span>
              {duplicates.duplicate_request_ids.map((id) => (
                <Link 
                  key={id} 
                  to={`/requests/${id}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  #{id}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
