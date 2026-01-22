export class BillExportDetailTechnicalProtectiveGear {
    ID: number = 0;

    STT?: number | null;
    BillExportTechID?: number | null;
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

    ProductName?: string | null;
    ProductCode?: string | null;
    UnitCountName?: string | null;
    WarehouseType?: string | null;
    ProductCodeRTC?: string | null;
    Maker?: string | null;
    ProductQRCode?: string | null;

    IsDeleted?: boolean | null;

    constructor(init?: Partial<BillExportDetailTechnicalProtectiveGear>) {
        Object.assign(this, init);
    }
}
