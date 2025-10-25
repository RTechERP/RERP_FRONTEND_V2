export interface PONCC {
  ID: number;
  IsApproved?: boolean;
  POCode: string;
  UserNCC?: string;
  BillCode: string;
  ReceivedDatePO?: Date;
  TotalMoneyPO: number;
  RequestDate: Date;
  DeliveryDate: Date;
  EmployeeID: number;
  DeliveryTime?: string;
  POType?: number;
  ShippingPoint?: string;
  OrderQualityNotMet?: boolean;
  ReasonForFailure?: string;
  SupplierSaleID: number;
  Note?: string;
  Company: number;
  Status: number;
  CurrencyID: number;
  CurrencyRate?: number;
  AddressDelivery?: string;
  OtherTerms?: string;
  AccountNumberSupplier?: string;
  BankCharge?: string;
  FedexAccount?: string;
  OriginItem?: string;
  SupplierVoucher?: string;
  BankSupplier?: string;
  RuleIncoterm?: string;
  OrderTargets?: string;
  NCCNew?: boolean;
  DeptSupplier?: boolean;
  CreatedBy?: number;
  CreatedDate?: Date;
  UpdatedBy?: number;
  UpdatedDate?: Date;
  IsDeleted?: boolean;
}

export interface PONCCDetail {
  ID: number;
  STT: number;
  PONCCID: number;
  ProductID: number;
  Qty: number;
  UnitPrice: number;
  IntoMoney: number;
  CodeBill?: string;
  NameBill?: string;
  RequestDate?: Date;
  ActualDate?: Date;
  QtyRequest: number;
  QtyReal?: number;
  VAT?: number;
  ThanhTien?: number;
  TotalPrice?: number;
  ProductCode?: string;
  ProductName?: string;
  ProductNewCode?: string;
  ProductGroupName?: string;
  ProductCodeOfSupplier?: string;
  ProjectCode?: string;
  ProjectName?: string;
  Unit?: string;
  QuantityReturn?: number;
  VATMoney?: number;
  DiscountPercent?: number;
  Discount?: number;
  FeeShip?: number;
  CurrencyExchange?: number;
  DeadlineDelivery?: Date;
  ExpectedDate?: Date;
  PriceSale?: number;
  PriceHistory?: number;
  BiddingPrice?: number;
  Note?: string;
}

export interface PONCCRulePay {
  ID: number;
  PONCCID: number;
  RulePayID: number;
  RulePayName?: string;
}

export interface DocumentImportPONCC {
  ID: number;
  PONCCID: number;
  DocumentName: string;
  DocumentPath?: string;
  IsSelected?: boolean;
}

export interface PONCCDTO extends PONCC {
  lstPONCCDetail: PONCCDetail[];
  lstPONCCRulePay: PONCCRulePay[];
  lstDocumentImportPONCC: DocumentImportPONCC[];
  lstPONCCDetailRequestBuy?: any[];
  lstBillImportDetail?: any[];
  lstPONCCDetailLog?: any[];
}