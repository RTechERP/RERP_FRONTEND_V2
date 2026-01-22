export class ProductProtectiveGear {
    ID: number = 0;
    ProductGroupID: number | null = null;
    ProductGroupRTCID: number | null = null;
    ProductGroupNo: string | null = '';
    ProductGroupName: string | null = '';
    ProductCode: string | null = '';
    ProductCodeRTC: string | null = '';
    ProductName: string | null = '';
    UnitID: number | null = null;
    UnitCountID: number | null = null;
    UnitCountName: string | null = '';
    Maker: string | null = '';
    FirmID: number | null = null;
    FirmName: string | null = '';
    LocationID: number | null = null;
    ProductLocationID: number | null = null;
    LocationName: string | null = '';
    LocationCode: string | null = '';
    Size: string | null = '';
    Note: string | null = '';
    ImagePath: string | null = '';
    LocationImg: string | null = '';

    // Additional fields from API
    Number: number = 0;
    AddressBox: string | null = '';
    StatusProduct: boolean = false;
    CreateDate: string | null = null;
    Serial: string | null = '';
    SerialNumber: string | null = '';
    PartNumber: string | null = '';
    BorrowCustomer: boolean = false;
    BorrowCustomerText: string | null = '';
    SLKiemKe: number = 0;
    InventoryReal: number = 0;
    NumberBorrowing: number = 0;
    NumberInStore: number = 0;
    STT: number = 0;

    CreatedBy: string | null = null;
    CreatedDate: Date | null = null;
    UpdatedBy: string | null = null;
    UpdatedDate: Date | null = null;
    IsDeleted: boolean = false;

    constructor(init?: Partial<ProductProtectiveGear>) {
        Object.assign(this, init);
    }
}

export const ProductProtectiveGearField = {
    ID: { name: 'ID', field: 'ID', type: 'number' },
    ProductGroupRTCID: { name: 'Mã nhóm', field: 'ProductGroupRTCID', type: 'number' },
    ProductGroupNo: { name: 'Mã nhóm', field: 'ProductGroupNo', type: 'string' },
    ProductGroupName: { name: 'Tên nhóm', field: 'ProductGroupName', type: 'string' },
    ProductCode: { name: 'Mã sản phẩm', field: 'ProductCode', type: 'string' },
    ProductName: { name: 'Tên sản phẩm', field: 'ProductName', type: 'string' },
    UnitCountID: { name: 'Đơn vị tính', field: 'UnitCountID', type: 'number' },
    UnitCountName: { name: 'Đơn vị tính', field: 'UnitCountName', type: 'string' },
    FirmID: { name: 'Hãng', field: 'FirmID', type: 'number' },
    ProductLocationID: { name: 'Vị trí', field: 'ProductLocationID', type: 'number' },
    LocationName: { name: 'Vị trí', field: 'LocationName', type: 'string' },
    Size: { name: 'Size', field: 'Size', type: 'string' },
    Note: { name: 'Ghi chú', field: 'Note', type: 'string' },
    ImagePath: { name: 'Ảnh', field: 'ImagePath', type: 'string' },
    CreatedBy: { name: 'Người tạo', field: 'CreatedBy', type: 'string' },
    CreatedDate: { name: 'Ngày tạo', field: 'CreatedDate', type: 'date' },
    UpdatedBy: { name: 'Người cập nhật', field: 'UpdatedBy', type: 'string' },
    UpdatedDate: { name: 'Ngày cập nhật', field: 'UpdatedDate', type: 'date' },
    IsDeleted: { name: 'Đã xóa', field: 'IsDeleted', type: 'boolean' },
} as const;
