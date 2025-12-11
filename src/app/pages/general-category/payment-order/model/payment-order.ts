export interface PaymentOrder {
    ID: number;
    Code: string;
    TypeOrder: number;
    PaymentOrderTypeID: number;
    DateOrder: string;
    EmployeeID: number;
    ReasonOrder: string;
    DatePayment: string;
    ReceiverInfo: string;
    TypePayment: number;
    AccountNumber: string;
    Bank: string;
    TotalMoney: number;
    TotalMoneyText: string;
    Unit: string;
    IsDelete: boolean;
    Note: string;
    TypeBankTransfer: number;
    ContentBankTransfer: string;
    AccountingNote: string;
    CreatedBy: string;
    CreatedDate: string;
    UpdatedBy: string;
    UpdatedDate: string;
    DeadlinePayment: string;
    IsUrgent: boolean;
    PONCCID: number;
    SupplierSaleID: number;
    CustomerID: number;
    TypeDocument: number;
    NumberDocument: string;
    IsSpecialOrder: boolean;
    ProjectID: number;
    IsBill: boolean;
    StartLocation: string;
    EndLocation: string;
    RegisterContractID: number;
    TypeCode: string;
    TypeName: string;
    FullName: string;
    DepartmentName: string;
    IsIgnoreHR: boolean | null;
    PaymentOrderTypeSTT: number | null;
    DepartmentID: number | null;
    TypeOrderText: string;
    RowNum: number;
    Step: number | null;
    StepName: string;
    IsApproved: boolean | null;
    ReasonCancel: string;
    ContentLog: string;
    ApproverName: string;
    IsApprovedText: string;
    TypeBankTransferText: string | null;
    POCode: string;
    TotalPayment: number;
    CustomerName: string;
    TypeDocumentText: string;
    ProjectFullName: string;
    StepNew: number;
    PaymentOrderTypeName: string;
    TotalPaymentActual: number;
    SuplierName: string;
    ReasonRequestAppendFileHR: string;
    FullNameEmployee: string;
    DateApprovedEmployee: string | null;
    FullNameTBP: string;
    DateApprovedTBP: string | null;
    FullNameHR: string;
    DateApprovedHR: string | null;
    FullNameKT: string;
    DateApprovedKT: string | null;
    FullNameBGD: string;
    DateApprovedBGD: string | null;
    ReasonRequestAppendFileAC: string;
    StatusBankSlip: string;
    POCodes: string | null;
    BillNumbers: string | null;
    StatusContractText: string;
    DocumentName: string;
    UserTeamNameJoin: string;
    PaymentMethodsJoin: string;
    TotalPage: number;
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
