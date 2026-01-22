export class ProductLocationTech {
    ID: number = 0;
    LocationCode: string | null = '';
    OldLocationName: string | null = '';
    LocationName: string | null = '';
    WarehouseID: number | null = null;
    LocationTypeText: string | null = '';
    CoordinatesX: string | null = '';
    CoordinatesY: string | null = '';
    STT: number = 0;
    LocationType: number | null = null;
    CreatedBy: string | null = null;
    CreatedDate: Date | null = null;
    UpdatedBy: string | null = null;
    UpdatedDate: Date | null = null;
    IsDeleted: boolean = false;

    constructor(init?: Partial<ProductLocationTech>) {
        Object.assign(this, init);
    }
}

export const ProductLocationTechField = {
    ID: { name: 'ID', field: 'ID', type: 'number' },
    LocationCode: { name: 'Mã vị trí', field: 'LocationCode', type: 'string' },
    OldLocationName: { name: 'Vị trí cũ', field: 'OldLocationName', type: 'string' },
    LocationName: { name: 'Tên vị trí', field: 'LocationName', type: 'string' },    
    LocationTypeText: { name: 'Loại vị trí', field: 'LocationTypeText', type: 'string' },
    WarehouseID: { name: 'Kho', field: 'WarehouseID', type: 'number' },
    CoordinatesX: { name: 'Tọa độ X', field: 'CoordinatesX', type: 'string' },
    CoordinatesY: { name: 'Tọa độ Y', field: 'CoordinatesY', type: 'string' },
    STT: { name: 'STT', field: 'STT', type: 'number' },
    LocationType: { name: 'Loại vị trí', field: 'LocationType', type: 'number' },
    CreatedBy: { name: 'Người tạo', field: 'CreatedBy', type: 'string' },
    CreatedDate: { name: 'Ngày tạo', field: 'CreatedDate', type: 'date' },
    UpdatedBy: { name: 'Người cập nhật', field: 'UpdatedBy', type: 'string' },
    UpdatedDate: { name: 'Ngày cập nhật', field: 'UpdatedDate', type: 'date' },
    IsDeleted: { name: 'Đã xóa', field: 'IsDeleted', type: 'boolean' },
} as const;
