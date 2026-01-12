// src/app/models/purchase-request.model.ts
export interface ProjectPartlistPurchaseRequestParam {
  DateStart?: string | Date;
  DateEnd?: string | Date;
  StatusRequest?: number;
  ProjectID?: number;
  Keyword?: string;
  SupplierSaleID?: number;
  IsApprovedTBP?: number;
  IsApprovedBGD?: number;
  IsCommercialProduct?: number;
  POKHID?: number;
  ProductRTCID?: number;
  IsDeleted?: number;
  IsTechBought?: number;
  IsJobRequirement?: number;
  EmployeeID?: number;
  IsRequestApproved?: number;
}

export interface RequestType {
  ID: number;
  RequestTypeName: string;
  RequestTypeCode: string;
  IsIgnoreBGD: boolean;
}

export interface Currency {
  ID: number;
  Code: string;
  CurrencyRate: number;
  DateStart: string | Date
  DateExpried: string | Date
}