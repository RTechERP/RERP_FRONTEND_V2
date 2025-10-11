export interface IUser {
  EmployeeID: number;
  ID: number;
  DepartmentID: number;
  Code: string;
  FullName: string;
  LoginName: string;
  IsAdmin: boolean;
  IsAdminSale: number;
  MainViewID: number;
  DepartmentName: string;
  HeadofDepartment: string;
  AnhCBNV: string;
  StatusEmployee: string;
  StatusUser: string;
  PositionName: string;
  UserGroupID: number;
  PositionID: number;
  GioiTinh: number;
  PositionCode: string;
  DepartmentCode: string;
  IsBusinessCost: boolean;
  IsLeader: number;
  TeamOfUser: number;
  Permissions: string;
  Name: string;
}

export interface ILoginResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}