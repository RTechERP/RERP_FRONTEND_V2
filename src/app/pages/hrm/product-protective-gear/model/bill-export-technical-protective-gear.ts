export class BillExportTechnicalProtectiveGear {
    ID: number = 0;
    Code: string | null = null;
    BillType: number | null = null;
    CustomerID: number | null = null;
    Receiver: string | null = null;
    Deliver: string | null = null;
    Addres: string | null = null;
    Status: number | null = null;
    WarehouseType: string | null = null;
    Note: string | null = null;
    Image: string | null = null;
    ReceiverID: number | null = null;
    DeliverID: number | null = null;
    SupplierID: number | null = null;
    CustomerName: string | null = null;
    SupplierName: string | null = null;
    CheckAddHistoryProductRTC: boolean | null = null;
    ExpectedDate: Date | null = null;
    ProjectName: string | null = null;
    WarehouseID: number | null = null;
    CreatedBy: string | null = null;
    CreatedDate: Date | null = null;
    UpdatedBy: string | null = null;
    UpdatedDate: Date | null = null;
    SupplierSaleID: number | null = null;
    BillDocumentExportType: number | null = null;
    ApproverID: number | null = null;
    constructor(init?: Partial<BillExportTechnicalProtectiveGear>) {
        Object.assign(this, init);
    }
}
export const BillExportTechnicalProtectiveGearField = {
    ID: { name: 'ID', field: 'ID', type: 'number' },
    Code: { name: 'Mã phiếu', field: 'Code', type: 'string' },
    BillType: { name: 'Loại phiếu', field: 'BillType', type: 'number' },
    CustomerID: { name: 'Khách hàng', field: 'CustomerID', type: 'number' },
    Receiver: { name: 'Người nhận', field: 'Receiver', type: 'string' },
    Deliver: { name: 'Người giao', field: 'Deliver', type: 'string' },
    Addres: { name: 'Địa chỉ', field: 'Addres', type: 'string' },
    Status: { name: 'Trạng thái', field: 'Status', type: 'number' },
    WarehouseType: { name: 'Loại kho', field: 'WarehouseType', type: 'string' },
    Note: { name: 'Ghi chú', field: 'Note', type: 'string' },
    Image: { name: 'Hình ảnh', field: 'Image', type: 'string' },
    ReceiverID: { name: 'ID Người nhận', field: 'ReceiverID', type: 'number' },
    DeliverID: { name: 'ID Người giao', field: 'DeliverID', type: 'number' },
    SupplierID: { name: 'ID Nhà cung cấp', field: 'SupplierID', type: 'number' },
    CustomerName: { name: 'Tên khách hàng', field: 'CustomerName', type: 'string' },
    SupplierName: { name: 'Tên nhà cung cấp', field: 'SupplierName', type: 'string' },
    CheckAddHistoryProductRTC: {
        name: 'Ghi lịch sử RTC',
        field: 'CheckAddHistoryProductRTC',
        type: 'boolean'
    },
    ExpectedDate: { name: 'Ngày dự kiến', field: 'ExpectedDate', type: 'date' },
    ProjectName: { name: 'Dự án', field: 'ProjectName', type: 'string' },
    WarehouseID: { name: 'Kho', field: 'WarehouseID', type: 'number' },
    CreatedBy: { name: 'Người tạo', field: 'CreatedBy', type: 'string' },
    CreatedDate: { name: 'Ngày tạo', field: 'CreatedDate', type: 'date' },
    UpdatedBy: { name: 'Người cập nhật', field: 'UpdatedBy', type: 'string' },
    UpdatedDate: { name: 'Ngày cập nhật', field: 'UpdatedDate', type: 'date' },
    SupplierSaleID: { name: 'NCC bán', field: 'SupplierSaleID', type: 'number' },
    BillDocumentExportType: {
        name: 'Loại chứng từ xuất',
        field: 'BillDocumentExportType',
        type: 'number'
    },
    ApproverID: { name: 'Người duyệt', field: 'ApproverID', type: 'number' },
} as const;
