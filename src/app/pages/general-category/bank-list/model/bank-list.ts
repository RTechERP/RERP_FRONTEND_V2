export class BankList {
    ID: number = 0;
    STT: number | null = null;
    BankName: string | null = '';
    IsDeleted: boolean | null = false;
    CreatedDate: Date | null = null;
    CreatedBy: string | null = null;
    UpdatedBy: string | null = null;
    UpdatedDate: Date | null = null;

    constructor(init?: Partial<BankList>) {
        Object.assign(this, init);
    }
}

export const BankListField = {
    ID: { name: 'ID', field: 'ID', type: 'number' },
    STT: { name: 'STT', field: 'STT', type: 'number' },
    BankName: { name: 'Tên ngân hàng', field: 'BankName', type: 'string' },
    IsDeleted: { name: 'Đã xóa', field: 'IsDeleted', type: 'boolean' },
    CreatedDate: { name: 'Ngày tạo', field: 'CreatedDate', type: 'date' },
    CreatedBy: { name: 'Người tạo', field: 'CreatedBy', type: 'string' },
    UpdatedBy: { name: 'Người cập nhật', field: 'UpdatedBy', type: 'string' },
    UpdatedDate: { name: 'Ngày cập nhật', field: 'UpdatedDate', type: 'date' },
} as const;
