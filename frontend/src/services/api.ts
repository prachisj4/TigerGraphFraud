import { casesData, type CaseRecord } from '../data/casesData';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');



export interface HealthStatus {
  status: string;
  backend: string;
  dataset: string;
  agent: string;
  tigergraph: string;
}

export interface AgentTraceEntry {
  step: number;
  tool: string;
  status: 'completed' | 'failed';
  summary: string;
  input?: Record<string, any>;
  output?: any;
  timestamp: string;
}


export interface AgentAssessment {
  recommendation: 'CLEAR' | 'REVIEW' | 'ESCALATE';
  confidence: number;
  summary: string;
  risk_factors: string[];
  supporting_evidence: string[];
  contradicting_evidence: string[];
  graph_findings: string[];
  historical_findings: string[];
  suggested_action: string;
  limitations: string[];
  tools_used: string[];
}

export interface InvestigationResult {
  case: CaseRecord;
  transaction: {
    transaction_id?: number;
    amount?: number;
    customer_id?: string;
    channel?: string;
    risk_score?: number | null;
    region?: number | null;
    error?: string;
  };
  customer_behavior: {
    customer_id: string;
    total_transactions: number;
    average_amount: number;
    maximum_amount: number;
  };
  region_history: {
    region: number | null;
    times_used: number;
    seen_before: boolean;
  };
  device_identity: {
    identity_found: boolean;
    device_type?: string | null;
    device_info?: string | null;
    message?: string;
  };
  graph_evidence: {
    status: string;
    summary?: any;
    nodes?: any[];
    edges?: any[];
    findings?: string[];
  };
  historical_case_analysis: {
    total_matches?: number;
    confirmed_fraud_count?: number;
    cleared_count?: number;
    historical_fraud_rate?: number;
    sample_cases?: any[];
    status?: string;
  };
  agent_trace?: AgentTraceEntry[];
  agent_assessment?: AgentAssessment | null;
  model_used?: string;
}


export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch {
    return {
      status: 'offline',
      backend: 'not_connected',
      dataset: 'available',
      agent: 'not_connected',
      tigergraph: 'not_connected',
    };
  }
}

export async function fetchAllCases(): Promise<CaseRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}/cases`);
    if (!res.ok) throw new Error('Failed to fetch cases');
    const data = await res.json();
    return data.cases || casesData;
  } catch {
    console.warn('Backend API unavailable; using local case_pack fallback.');
    return casesData;
  }
}

export async function fetchSingleCase(caseId: string): Promise<CaseRecord | null> {
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(caseId)}`);
    if (!res.ok) throw new Error('Case not found');
    return await res.json();
  } catch {
    const fallback = casesData.find((c) => c.case_id.toUpperCase() === caseId.toUpperCase());
    return fallback || null;
  }
}

export async function runInvestigation(caseId: string): Promise<InvestigationResult> {
  const res = await fetch(`${BASE_URL}/investigate/${encodeURIComponent(caseId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Investigation API failed' }));
    throw new Error(err.detail || 'Investigation API error');
  }

  return await res.json();
}
