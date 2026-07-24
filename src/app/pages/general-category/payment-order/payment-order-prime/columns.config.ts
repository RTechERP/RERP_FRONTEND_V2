export interface ColDef {
  field: string; header: string; width: string; type?: string;
  filterType?: 'multiselect' | 'text' | 'number' | 'date';
  filterOptions?: any[]; filterValue?: any;
  align?: string; dateFormat?: string; hidden?: boolean; uppercase?: boolean; frozen?: boolean;
}

export const MAIN_COLUMNS: ColDef[] = [
  { field: 'RowNum', header: 'STT', width: '80px', type: 'number', filterType: 'number', align: 'center', frozen: true },
  { field: 'DateOrder', header: 'Ngày đề nghị', width: '100px', type: 'date', filterType: 'date', dateFormat: 'dd/MM/yyyy', align: 'center', frozen: true },
  { field: 'FullName', header: 'Người đề nghị', width: '200px', filterType: 'multiselect', frozen: true },
  { field: 'ProjectFullName', header: 'Dự án', width: '200px', filterType: 'text', frozen: true },
  { field: 'TypeName', header: 'Nội dung chính của đề nghị', width: '250px', filterType: 'multiselect' },
  { field: 'ReasonOrder', header: 'Lý do thanh toán', width: '250px', filterType: 'text' },
  { field: 'TotalMoneyAdvance', header: 'Số tiền tạm ứng', width: '150px', type: 'number', filterType: 'number', align: 'right' },
  { field: 'TotalPayment', header: 'Số tiền thanh toán', width: '150px', type: 'number', filterType: 'number', align: 'right' },
  { field: 'TotalPaymentActual', header: 'Chênh lệch', width: '150px', type: 'number', filterType: 'number', align: 'right' },
  { field: 'TotalPaymentWithInvoice', header: 'Tổng tiền có HĐ', width: '150px', type: 'number', filterType: 'number', align: 'right' },
  { field: 'Unit', header: 'ĐVT', width: '80px', filterType: 'multiselect', uppercase: true },
  { field: 'StepName', header: 'Tình trạng phiếu', width: '200px', filterType: 'multiselect' },
  { field: 'IsUrgent', header: 'Thanh toán gấp', width: '80px', type: 'boolean', filterType: 'multiselect', align: 'center' },
  { field: 'DeadlinePayment', header: 'Deadline', width: '150px', type: 'date', filterType: 'date', dateFormat: 'dd/MM/yyyy HH:mm', align: 'center' },
  { field: 'Code', header: 'Số đề nghị', width: '170px', filterType: 'multiselect' },
  { field: 'DepartmentName', header: 'Bộ phận', width: '200px', filterType: 'multiselect' },
  { field: 'TypeOrderText', header: 'Phân loại chính', width: '200px', filterType: 'multiselect' },
  { field: 'IsIgnoreHR', header: 'Bỏ qua HR', width: '100px', type: 'boolean', filterType: 'multiselect', align: 'center' },
  { field: 'TypeBankTransferText', header: 'Hình thức TT', width: '170px', filterType: 'multiselect' },
  { field: 'ContentBankTransfer', header: 'Nội dung CK', width: '200px', filterType: 'text' },
  { field: 'SuplierName', header: 'Nhà cung cấp', width: '200px', filterType: 'text' },
  { field: 'CostCategory', header: 'Nhóm chi phí', width: '200px', filterType: 'text' },
  {
    field: 'AccountingAccount', header: 'Tài khoản hạch toán', width: '200px', filterType: 'text', hidden: true // Ẩn cột này đi do c gái Hà yc
  },
  { field: 'SupplierAccCode', header: 'Mã NCC', width: '200px', filterType: 'text' },
  { field: 'InvoiceAccNumber', header: 'Số hóa đơn', width: '200px', filterType: 'text' },
  { field: 'StatusContractText', header: 'Trạng thái HĐ', width: '200px', filterType: 'multiselect' },
  { field: 'DocumentName', header: 'Số hợp đồng', width: '200px', filterType: 'multiselect' },
  { field: 'TaxCompanyName', header: 'Công ty', width: '150px', filterType: 'multiselect' },
  { field: 'IsBill', header: 'Có hóa đơn', width: '80px', type: 'boolean', filterType: 'multiselect', align: 'center' },
  { field: 'StartLocation', header: 'Điểm đi', width: '200px', filterType: 'text' },
  { field: 'EndLocation', header: 'Điểm đến', width: '200px', filterType: 'text' },
  { field: 'StatusBankSlip', header: 'TT Bank Slip', width: '170px', filterType: 'multiselect' },
  { field: 'ContentLog', header: 'Lịch sử duyệt', width: '200px', filterType: 'text' },
  { field: 'ReasonCancel', header: 'Lý do hủy duyệt', width: '200px', filterType: 'text' },
  { field: 'Note', header: 'Ghi chú / Chứng từ', width: '300px', filterType: 'text' },
  { field: 'AccountingNote', header: 'Ghi chú kế toán', width: '200px', filterType: 'text' },
  { field: 'AccountingLeaderNote', header: 'Ghi chú kế toán trưởng', width: '200px', filterType: 'text' },
  { field: 'HRNote', header: 'Ghi chú HR', width: '200px', filterType: 'text' },
  { field: 'POCode', header: 'Số PO', width: '200px', filterType: 'multiselect' },
  { field: 'ReasonRequestAppendFileAC', header: 'Lý do KT Y/c bổ sung', width: '200px', filterType: 'text' },
  { field: 'ReasonRequestAppendFileHR', header: 'Lý do HR Y/c bổ sung', width: '200px', filterType: 'text' },
];

export const SPECIAL_COLUMNS: ColDef[] = [
  { field: 'RowNum', header: 'STT', width: '80px', type: 'number', filterType: 'number', align: 'center' },
  { field: 'IsUrgent', header: 'TT gấp', width: '80px', type: 'boolean', filterType: 'multiselect', align: 'center' },
  { field: 'DateOrder', header: 'Ngày đề nghị', width: '100px', type: 'date', filterType: 'date', dateFormat: 'dd/MM/yyyy', align: 'center' },
  { field: 'DeadlinePayment', header: 'Deadline TT', width: '150px', type: 'date', filterType: 'date', dateFormat: 'dd/MM/yyyy HH:mm', align: 'center' },
  { field: 'Code', header: 'Số đề nghị', width: '200px', filterType: 'multiselect' },
  { field: 'FullName', header: 'Người đề nghị', width: '200px', filterType: 'multiselect' },
  { field: 'UserTeamNameJoin', header: 'Team KD', width: '200px', filterType: 'multiselect' },
  { field: 'OrderType', header: 'Phân loại TT', width: '250px', filterType: 'multiselect' },
  { field: 'CustomerName', header: 'Khách hàng', width: '250px', filterType: 'text' },
  { field: 'POCodes', header: 'Số PO', width: '80px', filterType: 'text' },
  { field: 'BillNumbers', header: 'Số hóa đơn', width: '200px', filterType: 'multiselect' },
  { field: 'CostCategory', header: 'Nhóm chi phí', width: '200px', filterType: 'text' },
  { field: 'AccountingAccount', header: 'Tài khoản hạch toán', width: '200px', filterType: 'text' },
  { field: 'SupplierAccCode', header: 'Mã NCC', width: '200px', filterType: 'text' },
  { field: 'InvoiceAccNumber', header: 'Số hóa đơn', width: '200px', filterType: 'text' },
  { field: 'TotalMoney', header: 'Số tiền', width: '150px', type: 'number', filterType: 'number', align: 'right' },
  { field: 'Unit', header: 'ĐVT', width: '80px', filterType: 'multiselect', uppercase: true },
  { field: 'PaymentMethodsJoin', header: 'Hình thức TT', width: '170px', filterType: 'multiselect' },
  { field: 'StepName', header: 'Tình trạng phiếu', width: '200px', filterType: 'multiselect' },
  { field: 'ContentLog', header: 'Lịch sử duyệt', width: '200px', filterType: 'text' },
  { field: 'ReasonCancel', header: 'Lý do hủy duyệt', width: '200px', filterType: 'text' },
  { field: 'Note', header: 'Ghi chú / Chứng từ', width: '300px', filterType: 'text' },
];

export const DETAIL_COLUMNS: ColDef[] = [
  { field: 'Stt', header: 'STT', width: '70px', align: 'center' },
  { field: 'ContentPayment', header: 'Nội dung thanh toán', width: '300px' },
  { field: 'Unit', header: 'ĐVT', width: '70px' },
  { field: 'Quantity', header: 'Số lượng', width: '80px', type: 'number', align: 'right' },
  { field: 'UnitPrice', header: 'Đơn giá', width: '100px', type: 'number', align: 'right' },
  { field: 'TotalMoney', header: 'Thành tiền', width: '150px', type: 'number', align: 'right' },
  { field: 'PaymentPercentage', header: '% Thanh toán', width: '100px', type: 'number', align: 'right' },
  { field: 'TotalPaymentAmount', header: 'Tổng tiền TT', width: '150px', type: 'number', align: 'right' },
  { field: 'TotalMoneyWithInvoice', header: 'Tổng tiền có HĐ', width: '150px', type: 'number', align: 'right' },
  { field: 'Note', header: 'Ghi chú / Chứng từ', width: '300px' },
];

export const SPECIAL_DETAIL_COLUMNS: ColDef[] = [
  { field: 'Stt', header: 'STT', width: '70px', align: 'center' },
  { field: 'ContentPayment', header: 'Đối tượng nhận COM', width: '250px' },
  { field: 'TotalMoney', header: 'Số tiền', width: '150px', type: 'number', align: 'right' },
  { field: 'PaymentMethodsText', header: 'Hình thức TT', width: '100px' },
  { field: 'PaymentInfor', header: 'Thông tin TT', width: '300px' },
  { field: 'UserTeamName', header: 'Team KD', width: '150px' },
  { field: 'Note', header: 'Ghi chú / Chứng từ', width: '300px' },
];

export const LOG_COLUMNS: ColDef[] = [
  { field: 'Step', header: 'Bước', width: '50px' },
  { field: 'StepName', header: 'Tên bước', width: '250px' },
  { field: 'IsApprovedText', header: 'Trạng thái', width: '130px' },
  { field: 'FullNameDefault', header: 'Người phụ trách', width: '150px' },
  { field: 'FullName', header: 'Người thực hiện', width: '150px' },
  { field: 'DateApproved', header: 'Ngày duyệt', width: '130px', type: 'date', dateFormat: 'dd/MM/yyyy HH:mm' },
  { field: 'ReasonCancel', header: 'Lý do hủy', width: '200px' },
  { field: 'ReasonRequestAppendFileHR', header: 'Ghi chú HR', width: '200px' },
  { field: 'ReasonRequestAppendFileAC', header: 'Ghi chú KT', width: '200px' },
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
          // fv contains true/false values
          return fv.includes(!!rv);
        }
        return fv.includes(rv) || fv.includes(String(rv));
      }
      if (col.filterType === 'number') {
        return rv != null && String(rv).includes(String(fv));
      }
      // text
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
