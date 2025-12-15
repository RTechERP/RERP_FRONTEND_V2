export class PaymentOrder {
    ID = 0;
    Code = '';

    TypeOrder = 0;
    PaymentOrderTypeID = 0;

    DateOrder = '';
    EmployeeID = 0;
    ReasonOrder = '';
    DatePayment = '';
    ReceiverInfo = '';

    TypePayment = 0;
    AccountNumber = '';
    Bank = '';

    TotalMoney = 0;
    TotalMoneyText = '';
    Unit = '';

    IsDelete = false;
    Note = '';

    TypeBankTransfer = 0;
    ContentBankTransfer = '';
    AccountingNote = '';

    CreatedBy: string | null = null;
    CreatedDate: Date | null = null;
    UpdatedBy: string | null = null;
    UpdatedDate: Date | null = null;

    DeadlinePayment = '';
    IsUrgent = false;

    PONCCID = 0;
    SupplierSaleID = 0;
    CustomerID = 0;

    TypeDocument = 0;
    NumberDocument = '';

    IsSpecialOrder = false;
    ProjectID = 0;
    IsBill = false;

    StartLocation = '';
    EndLocation = '';

    RegisterContractID = 0;

    TypeCode = '';
    TypeName = '';
    FullName = '';
    DepartmentName = '';

    IsIgnoreHR: boolean | null = null;
    PaymentOrderTypeSTT: number | null = null;
    DepartmentID: number | null = null;

    TypeOrderText = '';
    RowNum = 0;

    Step: number | null = null;
    StepName = '';

    IsApproved: boolean | null = null;
    ReasonCancel = '';
    ContentLog = '';
    ApproverName = '';
    IsApprovedText = '';
    TypeBankTransferText: string | null = null;

    POCode = '';
    TotalPayment = 0;
    CustomerName = '';
    TypeDocumentText = '';
    ProjectFullName = '';

    StepNew = 0;
    PaymentOrderTypeName = '';

    TotalPaymentActual = 0;
    SuplierName = '';

    ReasonRequestAppendFileHR = '';
    FullNameEmployee = '';
    DateApprovedEmployee: string | null = null;

    FullNameTBP = '';
    DateApprovedTBP: string | null = null;

    FullNameHR = '';
    DateApprovedHR: string | null = null;

    FullNameKT = '';
    DateApprovedKT: string | null = null;

    FullNameBGD = '';
    DateApprovedBGD: string | null = null;

    ReasonRequestAppendFileAC = '';
    StatusBankSlip = '';

    POCodes: string | null = '';
    BillNumbers: string | null = null;

    StatusContractText = '';
    DocumentName = '';
    UserTeamNameJoin = '';
    PaymentMethodsJoin = '';

    TotalPage = 0;
    ApprovedTBPID = 0;
    ApprovedBGDID = 0;

    // ===== Optional: constructor map từ object =====
    constructor(init?: Partial<PaymentOrder>) {
        Object.assign(this, init);
    }
}


export interface PaymentOrderDetail {
    ID: number;
    PaymentOrderID?: number | null;
    STT?: string | null;
    ContentPayment?: string | null;
    Unit?: string | null;
    Quantity?: number | null;
    UnitPrice: number;
    TotalMoney?: number | null;
    Note?: string | null;
    ParentID?: number | null;
    CreatedBy?: string | null;
    CreatedDate?: Date | null;      // DateTime? → string | null
    UpdatedBy?: string | null;
    UpdatedDate?: Date | null;      // DateTime? → string | null
    PaymentMethods?: number | null;
    PaymentInfor?: string | null;
    EmployeeID?: number | null;
    TotalPaymentAmount?: number | null;
    PaymentPercentage?: number | null;
    IsDeleted?: boolean | null;
}


export interface PaymentOrderFile {
    ID: number;
    PaymentOrderID?: number | null;
    FileName?: string | null;
    OriginPath?: string | null;
    ServerPath?: string | null;
    CreatedBy?: string | null;
    CreatedDate?: Date | null;   // DateTime? → string | null
    UpdatedBy?: string | null;
    UpdatedDate?: Date | null;   // DateTime? → string | null
    IsDeleted?: boolean | null;
}


export const PaymentOrderField = {
    ID: { name: '', field: 'ID', type: 'number' },
    Code: { name: '', field: 'Code', type: 'string' },
    TypeOrder: { name: '', field: 'TypeOrder', type: 'number' },
    PaymentOrderTypeID: { name: '', field: 'PaymentOrderTypeID', type: 'number' },
    DateOrder: { name: '', field: 'DateOrder', type: 'string' },
    EmployeeID: { name: '', field: 'EmployeeID', type: 'number' },
    ReasonOrder: { name: '', field: 'ReasonOrder', type: 'string' },
    DatePayment: { name: '', field: 'DatePayment', type: 'string' },
    ReceiverInfo: { name: '', field: 'ReceiverInfo', type: 'string' },
    TypePayment: { name: '', field: 'TypePayment', type: 'number' },
    AccountNumber: { name: '', field: 'AccountNumber', type: 'string' },
    Bank: { name: '', field: 'Bank', type: 'string' },
    TotalMoney: { name: '', field: 'TotalMoney', type: 'number' },
    TotalMoneyText: { name: '', field: 'TotalMoneyText', type: 'string' },
    Unit: { name: '', field: 'Unit', type: 'string' },
    IsDelete: { name: '', field: 'IsDelete', type: 'boolean' },
    Note: { name: '', field: 'Note', type: 'string' },
    TypeBankTransfer: { name: '', field: 'TypeBankTransfer', type: 'number' },
    ContentBankTransfer: { name: '', field: 'ContentBankTransfer', type: 'string' },
    AccountingNote: { name: '', field: 'AccountingNote', type: 'string' },
    CreatedBy: { name: '', field: 'CreatedBy', type: 'string' },
    CreatedDate: { name: '', field: 'CreatedDate', type: 'string' },
    UpdatedBy: { name: '', field: 'UpdatedBy', type: 'string' },
    UpdatedDate: { name: '', field: 'UpdatedDate', type: 'string' },
    DeadlinePayment: { name: '', field: 'DeadlinePayment', type: 'string' },
    IsUrgent: { name: '', field: 'IsUrgent', type: 'boolean' },
    PONCCID: { name: '', field: 'PONCCID', type: 'number' },
    SupplierSaleID: { name: '', field: 'SupplierSaleID', type: 'number' },
    CustomerID: { name: '', field: 'CustomerID', type: 'number' },
    TypeDocument: { name: '', field: 'TypeDocument', type: 'number' },
    NumberDocument: { name: '', field: 'NumberDocument', type: 'string' },
    IsSpecialOrder: { name: '', field: 'IsSpecialOrder', type: 'boolean' },
    ProjectID: { name: '', field: 'ProjectID', type: 'number' },
    IsBill: { name: '', field: 'IsBill', type: 'boolean' },
    StartLocation: { name: '', field: 'StartLocation', type: 'string' },
    EndLocation: { name: '', field: 'EndLocation', type: 'string' },
    RegisterContractID: { name: '', field: 'RegisterContractID', type: 'number' },
    TypeCode: { name: '', field: 'TypeCode', type: 'string' },
    TypeName: { name: '', field: 'TypeName', type: 'string' },
    FullName: { name: '', field: 'FullName', type: 'string' },
    DepartmentName: { name: '', field: 'DepartmentName', type: 'string' },
    IsIgnoreHR: { name: '', field: 'IsIgnoreHR', type: 'boolean' },
    PaymentOrderTypeSTT: { name: '', field: 'PaymentOrderTypeSTT', type: 'number' },
    DepartmentID: { name: '', field: 'DepartmentID', type: 'number' },
    TypeOrderText: { name: '', field: 'TypeOrderText', type: 'string' },
    RowNum: { name: '', field: 'RowNum', type: 'number' },
    Step: { name: '', field: 'Step', type: 'number' },
    StepName: { name: '', field: 'StepName', type: 'string' },
    IsApproved: { name: '', field: 'IsApproved', type: 'boolean' },
    ReasonCancel: { name: '', field: 'ReasonCancel', type: 'string' },
    ContentLog: { name: '', field: 'ContentLog', type: 'string' },
    ApproverName: { name: '', field: 'ApproverName', type: 'string' },
    IsApprovedText: { name: '', field: 'IsApprovedText', type: 'string' },
    TypeBankTransferText: { name: '', field: 'TypeBankTransferText', type: 'string' },
    POCode: { name: '', field: 'POCode', type: 'string' },
    TotalPayment: { name: '', field: 'TotalPayment', type: 'number' },
    CustomerName: { name: '', field: 'CustomerName', type: 'string' },
    TypeDocumentText: { name: '', field: 'TypeDocumentText', type: 'string' },
    ProjectFullName: { name: '', field: 'ProjectFullName', type: 'string' },
    StepNew: { name: '', field: 'StepNew', type: 'number' },
    PaymentOrderTypeName: { name: '', field: 'PaymentOrderTypeName', type: 'string' },
    TotalPaymentActual: { name: '', field: 'TotalPaymentActual', type: 'number' },
    SuplierName: { name: '', field: 'SuplierName', type: 'string' },
    ReasonRequestAppendFileHR: { name: '', field: 'ReasonRequestAppendFileHR', type: 'string' },
    FullNameEmployee: { name: '', field: 'FullNameEmployee', type: 'string' },
    DateApprovedEmployee: { name: '', field: 'DateApprovedEmployee', type: 'string' },
    FullNameTBP: { name: '', field: 'FullNameTBP', type: 'string' },
    DateApprovedTBP: { name: '', field: 'DateApprovedTBP', type: 'string' },
    FullNameHR: { name: '', field: 'FullNameHR', type: 'string' },
    DateApprovedHR: { name: '', field: 'DateApprovedHR', type: 'string' },
    FullNameKT: { name: '', field: 'FullNameKT', type: 'string' },
    DateApprovedKT: { name: '', field: 'DateApprovedKT', type: 'string' },
    FullNameBGD: { name: '', field: 'FullNameBGD', type: 'string' },
    DateApprovedBGD: { name: '', field: 'DateApprovedBGD', type: 'string' },
    ReasonRequestAppendFileAC: { name: '', field: 'ReasonRequestAppendFileAC', type: 'string' },
    StatusBankSlip: { name: '', field: 'StatusBankSlip', type: 'string' },
    POCodes: { name: '', field: 'POCodes', type: 'string' },
    BillNumbers: { name: '', field: 'BillNumbers', type: 'string' },
    StatusContractText: { name: '', field: 'StatusContractText', type: 'string' },
    DocumentName: { name: '', field: 'DocumentName', type: 'string' },
    UserTeamNameJoin: { name: '', field: 'UserTeamNameJoin', type: 'string' },
    PaymentMethodsJoin: { name: '', field: 'PaymentMethodsJoin', type: 'string' },
    TotalPage: { name: '', field: 'TotalPage', type: 'number' },
    ApprovedTBPID: { name: 'TBP duyệt', field: 'ApprovedTBPID', type: 'number' },
    ApprovedBGDID: { name: 'BGĐ duyệt', field: 'ApprovedBGDID', type: 'number' }
} as const


export const PaymentOrderDetailField = {
    ID: { name: '', field: 'ID', type: 'number' },
    PaymentOrderID: { name: '', field: 'PaymentOrderID', type: 'number' },
    STT: { name: 'STT', field: 'STT', type: 'string' },
    ContentPayment: { name: 'Nội dung thanh toán', field: 'ContentPayment', type: 'string' },
    Unit: { name: 'ĐVT', field: 'Unit', type: 'string' },
    Quantity: { name: 'Số lượng', field: 'Quantity', type: 'number' },
    UnitPrice: { name: 'Đơn giá', field: 'UnitPrice', type: 'number' },
    TotalMoney: { name: 'Thành tiền', field: 'TotalMoney', type: 'number' },
    Note: { name: 'Ghi chú / Chứng từ kèm theo', field: 'Note', type: 'string' },
    ParentID: { name: '', field: 'ParentID', type: 'number' },
    CreatedBy: { name: '', field: 'CreatedBy', type: 'string' },
    CreatedDate: { name: '', field: 'CreatedDate', type: 'date' },
    UpdatedBy: { name: '', field: 'UpdatedBy', type: 'string' },
    UpdatedDate: { name: '', field: 'UpdatedDate', type: 'date' },
    PaymentMethods: { name: '', field: 'PaymentMethods', type: 'number' },
    PaymentInfor: { name: '', field: 'PaymentInfor', type: 'string' },
    EmployeeID: { name: '', field: 'EmployeeID', type: 'number' },
    TotalPaymentAmount: { name: 'Tổng tiền thanh toán', field: 'TotalPaymentAmount', type: 'number' },
    PaymentPercentage: { name: '% Thanh toán', field: 'PaymentPercentage', type: 'number' },
    IsDeleted: { name: '', field: 'IsDeleted', type: 'boolean' },
} as const
