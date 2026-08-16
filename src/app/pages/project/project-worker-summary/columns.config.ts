export interface ColDef {
  field: string; header: string; width: string; type?: string;
  filterType?: 'multiselect' | 'text' | 'number' | 'date';
  filterOptions?: any[]; filterValue?: any;
  // Căn lề không cấu hình ở đây: header luôn giữa, cell suy từ `type` (xem cellAlign)
  dateFormat?: string; hidden?: boolean; frozen?: boolean;
}

// Cột bảng báo cáo công việc - lấy từ ProjectListWorkReportComponent
export const WORK_REPORT_COLUMNS: ColDef[] = [
  { field: 'EmployeeCode', header: 'Mã nhân viên', width: '110px', filterType: 'multiselect', frozen: true },
  { field: 'FullName', header: 'Họ tên', width: '160px', filterType: 'multiselect', frozen: true },
  { field: 'DepartmentName', header: 'Phòng ban', width: '150px', filterType: 'multiselect' },
  { field: 'TeamName', header: 'Team', width: '120px', filterType: 'multiselect' },
  { field: 'DateReport', header: 'Ngày', width: '100px', type: 'date', filterType: 'date', dateFormat: 'dd/MM/yyyy' },
  { field: 'ProjectText', header: 'Dự án', width: '220px', filterType: 'multiselect' },
  { field: 'TypeText', header: 'Loại', width: '90px', filterType: 'multiselect' },
  { field: 'Content', header: 'Nội dung', width: '300px', filterType: 'text' },
  { field: 'TimeReality', header: 'Số giờ', width: '90px', type: 'number', filterType: 'number' },
  { field: 'Ratio', header: 'Hệ số', width: '80px', type: 'number', filterType: 'number' },
  { field: 'TotalHours', header: 'Tổng số giờ', width: '110px', type: 'number', filterType: 'number' },
  { field: 'Results', header: 'Kết quả', width: '300px', filterType: 'text' },
  { field: 'Problem', header: 'Vấn đề phát sinh', width: '250px', filterType: 'text' },
  { field: 'ProblemSolve', header: 'Giải pháp', width: '250px', filterType: 'text' },
  { field: 'Backlog', header: 'Tồn đọng', width: '250px', filterType: 'text' },
  { field: 'PlanNextDay', header: 'Kế hoạch ngày tiếp theo', width: '250px', filterType: 'text' },
  { field: 'Note', header: 'Ghi chú', width: '200px', filterType: 'text' },
];

// Cột bảng nhân công dự án - lấy từ ProjectWokerSlickGridComponent
export const PROJECT_WORKER_COLUMNS: ColDef[] = [
  { field: 'TT', header: 'TT', width: '110px', filterType: 'text', frozen: true },
  { field: 'IsApprovedTBPText', header: 'TBP duyệt', width: '100px', filterType: 'multiselect' },
  { field: 'WorkContent', header: 'Nội dung công việc', width: '400px', filterType: 'text', frozen: true },
  { field: 'AmountPeople', header: 'Số người', width: '90px', type: 'number', filterType: 'number' },
  { field: 'NumberOfDay', header: 'Số ngày', width: '90px', type: 'number', filterType: 'number' },
  { field: 'TotalWorkforce', header: 'Tổng nhân công', width: '120px', type: 'number', filterType: 'number' },
  { field: 'Price', header: 'Đơn giá', width: '120px', type: 'number', filterType: 'number' },
  { field: 'TotalPrice', header: 'Thành tiền', width: '140px', type: 'number', filterType: 'number' },
];

export function buildFilterOptions(data: any[], field: string): any[] {
  const set = new Set<string>();
  data.forEach(row => {
    const v = row?.[field];
    if (v !== null && v !== undefined && v !== '') set.add(String(v));
  });
  return Array.from(set).sort().map(v => ({ label: v, value: v }));
}

export function applyFilters(data: any[], columns: ColDef[]): any[] {
  return data.filter(row => {
    return columns.every(col => {
      const fv = col.filterValue;
      if (fv === null || fv === undefined || fv === '' || (Array.isArray(fv) && fv.length === 0)) return true;
      const rv = row[col.field];
      if (col.filterType === 'multiselect') {
        if (!Array.isArray(fv) || fv.length === 0) return true;
        if (col.type === 'boolean') {
          return fv.includes(!!rv);
        }
        return fv.includes(rv) || fv.includes(String(rv));
      }
      if (col.filterType === 'number') {
        return rv != null && String(rv).includes(String(fv));
      }
      return rv != null && String(rv).toLowerCase().includes(String(fv).toLowerCase());
    });
  });
}

export function refreshMultiselectOptions(data: any[], columns: ColDef[]) {
  columns.forEach(col => {
    if (col.filterType === 'multiselect') {
      if (col.type === 'boolean') {
        col.filterOptions = [
          { label: 'Có', value: true },
          { label: 'Không', value: false },
        ];
      } else {
        col.filterOptions = buildFilterOptions(data, col.field);
      }
    }
  });
}
