export interface KpiSummaryValue {
  goal: number;
  result: number;
  score: number;
  achievedPercent: number;
}

export interface PeriodInfo {
  periodId: number;
  periodCode: string;
  periodName: string;
  periodType: string;
  sortOrder: number;
}

export interface KpiSummaryRow {
  indexId: number;
  parentId: number | null;
  indexCode: string;
  indexName: string;
  indexType: string;
  weightPercent: number;
  isBold: boolean;
  sortOrder: number;
  depth: number;
  hasChildren: boolean;
  monthlyValues: KpiSummaryValue[];
  quarterValue: KpiSummaryValue;
  reportScoreAdjustmentType: number;
  reportScoreValue: number;
}

export interface KpiSummaryPerformance {
  month1Score: number;
  month2Score: number;
  month3Score: number;
  quarterScore: number;
}

export interface KpiSummaryResponse {
  quarterPeriodId: number;
  quarterCode: string;
  quarterName: string;
  periods: PeriodInfo[];
  items: KpiSummaryRow[];
  summary: KpiSummaryPerformance;
  warnings: string[];
}

// ====== APPROVAL WORKFLOW ======

export type ApprovalScope = 'EMPLOYEE' | 'TEAM';

export type ApprovalCurrentStep =
  | 'PENDING'
  | 'P0_APPROVED'
  | 'P1_APPROVED'
  | 'P2_APPROVED'
  | 'P3_APPROVED'
  | 'P4_APPROVED'
  | 'DONE';

export interface KPISaleApprovalDto {
  ApprovalScope: ApprovalScope;
  EmployeeID?: number | null;
  TeamID?: number | null;
  PeriodID: number;
  CurrentStep: ApprovalCurrentStep;

  IsAdminApproved: boolean;
  AdminApprovedBy?: string | null;
  AdminApprovedDate?: string | null;

  IsSalesManagerApproved: boolean;
  SalesManagerApprovedBy?: string | null;
  SalesManagerApprovedDate?: string | null;

  IsAccountantApproved: boolean;
  AccountantApprovedBy?: string | null;
  AccountantApprovedDate?: string | null;

  IsSeniorAccountantApproved: boolean;
  SeniorAccountantApprovedBy?: string | null;
  SeniorAccountantApprovedDate?: string | null;

  IsDirectorApproved: boolean;
  DirectorApprovedBy?: string | null;
  DirectorApprovedDate?: string | null;

  IsHRDisbursed: boolean;
  HRDisbursedBy?: string | null;
  HRDisbursedDate?: string | null;
}

export interface KPISaleApprovalStepRequest {
  // Vẫn giữ camelCase để khớp các controller khác đang dùng cho request DTO này.
  approvalScope: ApprovalScope;
  employeeID?: number | null;
  teamID?: number | null;
  periodID: number;
  note?: string | null;
}

export interface ApprovalStepDef {
  code: ApprovalCurrentStep;
  shortLabel: string;
  longLabel: string;
  approverRole: string;
  icon: string;
  isLockStep: boolean;
  /**
   * Mã quyền yêu cầu để duyệt/hủy bước này.
   * Nhiều mã cách nhau bởi dấu phẩy. Hệ thống luôn cho phép N1
   * bỏ qua check quyền.
   */
  permissionCode: string;
}

export const APPROVAL_STEPS: ApprovalStepDef[] = [
  {
    code: 'P0_APPROVED',
    shortLabel: 'Admin',
    longLabel: 'Admin duyệt (khóa tính KPI)',
    approverRole: 'ADMIN',
    icon: 'safety',
    isLockStep: true,
    permissionCode: 'N27,N1',
  },
  {
    code: 'P1_APPROVED',
    shortLabel: 'Sales Manager',
    longLabel: 'Sales Manager duyệt',
    approverRole: 'SALES_MANAGER',
    icon: 'user',
    isLockStep: false,
    permissionCode: 'N51,N1',
  },
  {
    code: 'P2_APPROVED',
    shortLabel: 'Kế toán',
    longLabel: 'Kế toán duyệt',
    approverRole: 'ACCOUNTANT',
    icon: 'audit',
    isLockStep: false,
    permissionCode: 'N36,N1',
  },
  {
    code: 'P3_APPROVED',
    shortLabel: 'Trưởng Kế Toán',
    longLabel: 'Trưởng kế toán duyệt',
    approverRole: 'SENIOR_ACCOUNTANT',
    icon: 'crown',
    isLockStep: false,
    permissionCode: 'N52,N1',
  },
  {
    code: 'P4_APPROVED',
    shortLabel: 'Giám đốc',
    longLabel: 'Giám đốc duyệt',
    approverRole: 'DIRECTOR',
    icon: 'star',
    isLockStep: false,
    permissionCode: 'N58,N1',
  },
  {
    code: 'DONE',
    shortLabel: 'HR chi thưởng',
    longLabel: 'HR chi thưởng',
    approverRole: 'HR',
    icon: 'gift',
    isLockStep: false,
    permissionCode: 'N34,N1',
  },
];
