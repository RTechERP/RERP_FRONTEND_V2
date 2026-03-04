export class BillImportDetailTechnicalProtectiveGear {
    ID: number = 0;

    STT?: number | null;
    BillImportTechID?: number | null;
    ProductID?: number | null;

    Quantity?: number | null;
    TotalQuantity?: number | null;
    Price?: number | null;
    TotalPrice?: number | null;

    UnitID?: number | null;
    UnitName?: string | null;

    ProjectID?: number | null;
    ProjectCode?: string | null;
    ProjectName?: string | null;

    SomeBill?: string | null;

    CreatedBy?: string | null;
    CreatedDate?: Date | null;
    UpdatedBy?: string | null;
    UpdatedDate?: Date | null;

    Note?: string | null;
    InternalCode?: string | null;

    HistoryProductRTCID?: number | null;
    ProductRTCQRCodeID?: number | null;

    WarehouseID?: number | null;
    IsBorrowSupplier?: number | null;

    QtyRequest?: number | null;
    PONCCDetailID?: number | null;
    BillCodePO?: string | null;

    EmployeeIDBorrow?: number | null;

    DeadlineReturnNCC?: Date | null;
    DateSomeBill?: Date | null;

    COFormE?: number | null;
    TaxReduction?: number | null;
    DueDate?: Date | null;
    DPO?: number | null;

    IsDeleted?: boolean | null;

    ProductName?: string | null;
    ProductCode?: string | null;
    UnitCountName?: string | null;
    WarehouseType?: string | null;
    ProductCodeRTC?: string | null;
    Maker?: string | null;
    ProductQRCode?: string | null;

    constructor(init?: Partial<BillImportDetailTechnicalProtectiveGear>) {
        Object.assign(this, init);
    }
}
