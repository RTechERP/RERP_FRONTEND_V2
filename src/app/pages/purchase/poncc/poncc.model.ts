export interface PONCCFilter {
  DateStart?: string;
  DateEnd?: string;
  Status?: number; // -1 all
  SupplierID?: number;
  EmployeeID?: number;
  Keyword?: string;
  PageNumber?: number;
  PageSize?: number;
  POType?: number; // 0=Commercial, 1=Borrow
}

export interface PONCCSummary {
  ID: number;
  IsApproved?: boolean;
  StatusText?: string;
  POCode?: string;
  TotalMoneyPO?: number;
  NameNCC?: string;
  RequestDate?: string;
  FullName?: string;
  CurrencyText?: string;
  DeliveryDate?: string;
  BillCode?: string;
  RulePayName?: string;
  CompanyText?: string;
  CurrencyRate?: number;
  POTypeText?: string;
}

export interface PONCCDetail {
  ID: number;
  ProductCode?: string;
  ProductName?: string;
  ProductNewCode?: string;
  Unit?: string;
  QtyRequest?: number;
  UnitPrice?: number;
  TotalPrice?: number;
  VAT?: number;
  VATMoney?: number;
  PriceHistory?: number;
  ProjectCode?: string;
  ProjectName?: string;
  DeadlineDelivery?: string;
  Note?: string;
}

// Master PONCC data for create/edit
export interface PONCCMaster {
  ID?: number;
  SupplierSaleID: number;
  POCode: string;
  BillCode: string;
  EmployeeID: number;
  Company?: number;
  POType: number; // 0=Commercial, 1=Borrow
  RequestDate: string;
  DeliveryDate: string;
  CurrencyID: number;
  CurrencyRate?: number;
  TotalMoneyPO?: number;
  Note?: string;
  AddressDelivery?: string;
  OtherTerms?: string;
  AccountNumberSupplier?: string;
  BankCharge?: string;
  FedexAccount?: string;
  ShippingPoint?: string;
  Status?: number;
  IsApproved?: boolean;
  IsDeleted?: boolean;
}

// Detail line item for create/edit
export interface PONCCDetailDTO {
  ID?: number;
  PONCCID?: number;
  STT?: number;
  ProductSaleID?: number;
  ProductRTCID?: number;
  ProductCode?: string;
  ProductName?: string;
  ProductCodeOfSupplier?: string;
  Unit?: string;
  Quantity?: number;
  UnitPrice?: number;
  ThanhTien?: number; // Quantity * UnitPrice
  VAT?: number;
  VATMoney?: number;
  DiscountPercent?: number;
  Discount?: number;
  FeeShip?: number;
  TotalPrice?: number; // ThanhTien + VATMoney + FeeShip - Discount
  CurrencyExchange?: number; // TotalPrice * CurrencyRate
  ExpectedDate?: string;
  ActualDate?: string;
  PriceSale?: number;
  PriceHistory?: number;
  BiddingPrice?: number;
  Note?: string;
  ProjectID?: number;
  ProjectName?: string;
  ProjectPartlistPurchaseRequestID?: number;
  ProjectPartListID?: number;
  DeadlineDelivery?: string;
  IsBill?: boolean;
  ProductType?: number;
  DateReturnEstimated?: string;
  IsStock?: boolean;
  PONCCDetailRequestBuyID?: string;
}

// Save request payload
export interface PONCCSaveRequest {
  PONCC: PONCCMaster;
  Details: PONCCDetailDTO[];
  RulePayIDs?: number[];
  DeletedDetailIDs?: number[];
}

// Purchase request data từ ProjectPartlistPurchaseRequest
export interface PurchaseRequestForPO {
  ID: number;
  ProductSaleID?: number;
  ProductRTCID?: number;
  Quantity?: number;
  UnitPrice?: number;
  SupplierSaleID?: number;
  ProjectPartListID?: number;
  EmployeeID?: number;
  ProjectID?: number;
  ProjectName?: string;
  Deadline?: string;
  ProductCode?: string;
  ProductNewCode?: string;
  VAT?: number;
  GuestCode?: string;
  IsCommercialProduct?: boolean;
  HistoryPrice?: number;
  DateReturnEstimated?: string;
  TicketType?: number; // 0=buy, 1=borrow
  IsStock?: boolean;
  ProductGroupID?: number;
  UnitName?: string;
  SpecialCode?: string;
  CurrencyID?: number;
}