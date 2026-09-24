export interface MetricItem {
  title: string;
  value: number | string;
  iconName: string;
  subtitle: string;
  change?: string;
  isPositive?: boolean;
}

export interface RiskDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface RecentCaseItem {
  id: string;
  customerId: string;
  trigger: string;
  riskScore: number | null;
  status: 'Investigated' | 'Under Review' | 'Escalated' | 'Closed';
  date: string;
}

export interface ActivityItem {
  id: string;
  caseId: string;
  event: string;
  timestamp: string;
  type: 'opened' | 'analyzed' | 'checked' | 'requested' | 'review';
}

export const summaryMetrics: MetricItem[] = [
  {
    title: 'Total Cases',
    value: 20,
    iconName: 'FolderArchive',
    subtitle: '20 real fraud dataset cases',
  },
  {
    title: 'High Risk Scored',
    value: 6,
    iconName: 'AlertTriangle',
    subtitle: 'Model risk score >= 0.70',
  },
  {
    title: 'Medium Risk Scored',
    value: 5,
    iconName: 'Clock',
    subtitle: 'Model risk score 0.40 - 0.69',
  },
  {
    title: 'Customer Disputes',
    value: 9,
    iconName: 'UserCheck',
    subtitle: 'Customer dispute reports',
  },
];

export const riskDistributionData: RiskDistributionItem[] = [
  { name: 'High Risk (>= 0.70)', value: 6, color: '#ef4444' }, // red-500
  { name: 'Medium Risk (0.40-0.69)', value: 5, color: '#f59e0b' }, // amber-500
  { name: 'Customer Disputes', value: 9, color: '#6366f1' }, // indigo-500
];

export const recentCasesData: RecentCaseItem[] = [
  {
    id: 'HHG-001',
    customerId: 'C12382',
    trigger: 'Real-time model scored transaction 3514030 ($77.07, in billing region 444.0) at 0.61. Review and decide.',
    riskScore: 0.61,
    status: 'Under Review',
    date: '2016-12-05',
  },
  {
    id: 'HHG-002',
    customerId: 'C11891',
    trigger: 'Real-time model scored transaction 3478782 ($292.36, online) at 0.79. Review and decide.',
    riskScore: 0.79,
    status: 'Escalated',
    date: '2016-11-22',
  },
  {
    id: 'HHG-003',
    customerId: 'C08623',
    trigger: "Customer C08623 message: 'I never made this $49.00 purchase. Please check my card.' Refers to 3530164.",
    riskScore: null,
    status: 'Under Review',
    date: '2016-12-10',
  },
  {
    id: 'HHG-004',
    customerId: 'C08106',
    trigger: "Customer C08106 message: 'I never made this $128.33 purchase. Please check my card.' Refers to 3583227.",
    riskScore: null,
    status: 'Investigated',
    date: '2016-12-29',
  },
  {
    id: 'HHG-005',
    customerId: 'C02923',
    trigger: 'Real-time model scored transaction 3523199 ($100.07, online) at 0.54. Review and decide.',
    riskScore: 0.54,
    status: 'Closed',
    date: '2016-12-08',
  },
];

export const recentActivityData: ActivityItem[] = [
  {
    id: 'act-1',
    caseId: 'HHG-001',
    event: 'Case opened by triage engine',
    timestamp: '2016-12-05',
    type: 'opened',
  },
  {
    id: 'act-2',
    caseId: 'HHG-002',
    event: 'Transaction score pattern logged',
    timestamp: '2016-11-22',
    type: 'analyzed',
  },
  {
    id: 'act-3',
    caseId: 'HHG-003',
    event: 'Customer dispute message logged',
    timestamp: '2016-12-10',
    type: 'checked',
  },
  {
    id: 'act-4',
    caseId: 'HHG-001',
    event: 'TigerGraph relationship check complete',
    timestamp: '2016-12-05',
    type: 'requested',
  },
  {
    id: 'act-5',
    caseId: 'HHG-004',
    event: 'Gemini agent investigation report generated',
    timestamp: '2016-12-29',
    type: 'review',
  },
];
