/**
 * Helper function to map new product data to match the original grid data structure
 * 
 * Original structure (from getBillImportDetail API):
 * - Has BillImportTechID, STT, ProductID, Quantity, TotalQuantity, Price, TotalPrice, etc.
 * 
 * New structure (from product selection):
 * - Has ProductCode, ProductName, Unit, Quantity, ProductCodeRTC, Maker, etc.
 */

export interface OriginalGridData {
    ID: number;
    STT: number;
    BillImportTechID: number;
    ProductID: number;
    Quantity: number;
    TotalQuantity: number;
    Price: number;
    TotalPrice: number;
    UnitID: number;
    UnitName: string;
    ProjectID: number;
    ProjectCode: string;
    ProjectName: string;
    SomeBill: string;
    CreatedBy: string;
    CreatedDate: string;
    UpdatedBy: string;
    UpdatedDate: string;
    Note: string;
    InternalCode: string;
    HistoryProductRTCID: number;
    ProductRTCQRCodeID: number;
    WarehouseID: number;
    IsBorrowSupplier: number;
    QtyRequest: number;
    PONCCDetailID: number;
    BillCodePO: string;
    EmployeeIDBorrow: number;
    DeadlineReturnNCC: string | null;
    DateSomeBill: string | null;
    COFormE: number;
    TaxReduction: number;
    DueDate: string | null;
    DPO: number;
    IsDeleted: boolean | null;
    ProductName: string;
    ProductCode: string;
    UnitCountName: string | null;
    WarehouseType: string;
    ProductCodeRTC: string;
    Maker: string;
    ProductQRCode: string | null;
    EmployeeBorrowName: string;
}

export interface NewProductData {
    ProductNewCode: string;
    ProductCode: string;
    TotalInventory: number;
    ProductName: string;
    ProductFullName: string;
    Unit: string;
    Qty: number;
    Quantity: number;
    ProductGroupName: string;
    ProductTypeText: string;
    Note: string;
    UnitPricePOKH: number;
    UnitPricePurchase: number;
    BillCode: string;
    ProjectCodeExport: string;
    ProjectNameText: string;
    IsNotKeep: boolean;
    SerialNumber: string;
    DPO: number;
    TaxReduction: number;
    COFormE: number;
    ProjectID: number;
    ProductID: number;
    ProductCodeRTC: string;
    Maker: string;
    UnitCountName: string;
    UnitCountID: number;
}

/**
 * Maps new product data to the original grid data structure
 * @param newData - The new product data from product selection
 * @param billImportTechID - The bill import tech ID (optional, defaults to 0)
 * @param warehouseID - The warehouse ID (optional, defaults to 5)
 * @param currentUser - The current user name (optional, defaults to 'AdminSW')
 * @returns Mapped data matching the original grid structure
 */
export function mapNewDataToOriginalStructure(
    newData: NewProductData,
    billImportTechID: number = 0,
    warehouseID: number = 5,
    currentUser: string = 'AdminSW'
): OriginalGridData {
    const now = new Date().toISOString();

    return {
        ID: 0, // New record, will be assigned by backend
        STT: 0, // Will be assigned based on position in array
        BillImportTechID: billImportTechID,
        ProductID: newData.ProductID || 0,
        Quantity: newData.Quantity || 0,
        TotalQuantity: 0,
        Price: newData.UnitPricePurchase || 0,
        TotalPrice: (newData.Quantity || 0) * (newData.UnitPricePurchase || 0),
        UnitID: newData.UnitCountID || 0,
        UnitName: newData.Unit || newData.UnitCountName || '',
        ProjectID: newData.ProjectID || 0,
        ProjectCode: newData.ProjectCodeExport || '',
        ProjectName: newData.ProjectNameText || '',
        SomeBill: newData.BillCode || '',
        CreatedBy: currentUser,
        CreatedDate: now,
        UpdatedBy: currentUser,
        UpdatedDate: now,
        Note: newData.Note || '',
        InternalCode: '',
        HistoryProductRTCID: 0,
        ProductRTCQRCodeID: 0,
        WarehouseID: warehouseID,
        IsBorrowSupplier: 0,
        QtyRequest: 0,
        PONCCDetailID: 0,
        BillCodePO: '',
        EmployeeIDBorrow: 0,
        DeadlineReturnNCC: null,
        DateSomeBill: null,
        COFormE: newData.COFormE || 0,
        TaxReduction: newData.TaxReduction || 0,
        DueDate: null,
        DPO: newData.DPO || 0,
        IsDeleted: null,
        ProductName: newData.ProductName || '',
        ProductCode: newData.ProductCode || '',
        UnitCountName: newData.UnitCountName || null,
        WarehouseType: newData.ProductGroupName || 'Đồ bảo hộ',
        ProductCodeRTC: newData.ProductCodeRTC || '',
        Maker: newData.Maker || '',
        ProductQRCode: null,
        EmployeeBorrowName: ''
    };
}

/**
 * Maps an array of new product data to the original grid data structure
 * @param newDataArray - Array of new product data
 * @param billImportTechID - The bill import tech ID (optional, defaults to 0)
 * @param warehouseID - The warehouse ID (optional, defaults to 5)
 * @param currentUser - The current user name (optional, defaults to 'AdminSW')
 * @returns Array of mapped data matching the original grid structure
 */
export function mapNewDataArrayToOriginalStructure(
    newDataArray: NewProductData[],
    billImportTechID: number = 0,
    warehouseID: number = 5,
    currentUser: string = 'AdminSW'
): OriginalGridData[] {
    return newDataArray.map((item, index) => {
        const mapped = mapNewDataToOriginalStructure(item, billImportTechID, warehouseID, currentUser);
        mapped.STT = index + 1; // Assign sequential STT
        return mapped;
    });
}
