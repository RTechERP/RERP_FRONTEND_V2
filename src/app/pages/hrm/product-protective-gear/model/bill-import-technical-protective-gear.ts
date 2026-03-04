export class BillImportTechnicalProtectiveGear {
  ID: number = 0;
  BillCode: string | null = '';
  CreatDate: Date | null = null;

  Deliver: string | null = '';
  Receiver: string | null = '';
  Status: boolean = false;

  Suplier: string | null = '';
  BillType: boolean = false;
  WarehouseType: string | null = '';

  DeliverID: number | null = null;
  ReceiverID: number | null = null;
  SuplierID: number | null = null;
  GroupTypeID: number | null = null;

  CreatedBy: string | null = null;
  CreatedDate: Date | null = null;
  UpdatedBy: string | null = null;
  UpdatedDate: Date | null = null;

  Image: string | null = '';
  WarehouseID: number | null = null;
  SupplierSaleID: number | null = null;
  BillTypeNew: number | null = null;

  IsBorrowSupplier: boolean | null = null;
  CustomerID: number | null = null;
  BillDocumentImportType: number | null = null;
  DateRequestImport: Date | null = null;
  RulePayID: number | null = null;
  IsNormalize: boolean = false;
  ApproverID: number | null = null;
  IsDeleted: boolean = false;

  constructor(init?: Partial<BillImportTechnicalProtectiveGear>) {
    Object.assign(this, init);
  }
}
export const BillImportTechnicalProtectiveGearField = {
  ID: { name: 'ID', field: 'ID', type: 'number' },
  BillCode: { name: 'Mã phiếu', field: 'BillCode', type: 'string' },
  CreatDate: { name: 'Ngày tạo phiếu', field: 'CreatDate', type: 'date' },

  Deliver: { name: 'Người giao', field: 'Deliver', type: 'string' },
  Receiver: { name: 'Người nhận', field: 'Receiver', type: 'string' },
  Status: { name: 'Trạng thái', field: 'Status', type: 'boolean' },

  Suplier: { name: 'Nhà cung cấp', field: 'Suplier', type: 'string' },
  BillType: { name: 'Loại phiếu cũ', field: 'BillType', type: 'boolean' },
  WarehouseType: { name: 'Loại kho', field: 'WarehouseType', type: 'string' },

  DeliverID: { name: 'ID Người giao', field: 'DeliverID', type: 'number' },
  ReceiverID: { name: 'ID Người nhận', field: 'ReceiverID', type: 'number' },
  SuplierID: { name: 'ID NCC', field: 'SuplierID', type: 'number' },
  GroupTypeID: { name: 'Nhóm phiếu', field: 'GroupTypeID', type: 'number' },

  CreatedBy: { name: 'Người tạo', field: 'CreatedBy', type: 'string' },
  CreatedDate: { name: 'Ngày tạo', field: 'CreatedDate', type: 'date' },
  UpdatedBy: { name: 'Người cập nhật', field: 'UpdatedBy', type: 'string' },
  UpdatedDate: { name: 'Ngày cập nhật', field: 'UpdatedDate', type: 'date' },

  Image: { name: 'Hình ảnh', field: 'Image', type: 'string' },
  WarehouseID: { name: 'Kho', field: 'WarehouseID', type: 'number' },
  SupplierSaleID: { name: 'NCC bán', field: 'SupplierSaleID', type: 'number' },
  BillTypeNew: { name: 'Loại phiếu', field: 'BillTypeNew', type: 'number' },

  IsBorrowSupplier: { name: 'Mượn NCC', field: 'IsBorrowSupplier', type: 'boolean' },
  CustomerID: { name: 'Khách hàng', field: 'CustomerID', type: 'number' },
  BillDocumentImportType: { name: 'Loại nhập', field: 'BillDocumentImportType', type: 'number' },
  DateRequestImport: { name: 'Ngày yêu cầu', field: 'DateRequestImport', type: 'date' },
  RulePayID: { name: 'Điều khoản', field: 'RulePayID', type: 'number' },
  IsNormalize: { name: 'Chuẩn hóa', field: 'IsNormalize', type: 'boolean' },
  ApproverID: { name: 'Người duyệt', field: 'ApproverID', type: 'number' },
  IsDeleted: { name: 'Đã xóa', field: 'IsDeleted', type: 'boolean' },
} as const;
