export interface AGVProductGroup {
  ID: number;
  AGVProductGroupNo: string;
  AGVProductGroupName: string;
  NumberOrder: number;
  IsDeleted: boolean;
  CreatedBy: string;
  CreatedDate: Date;
  UpdatedBy: string;
  UpdatedDate: Date;
}

export enum AGVProductGroupFields {
  ID = 'ID',
  AGVProductGroupNo = 'AGVProductGroupNo',
  AGVProductGroupName = 'AGVProductGroupName',
  NumberOrder = 'NumberOrder',
  IsDeleted = 'IsDeleted',
  CreatedBy = 'CreatedBy',
  CreatedDate = 'CreatedDate',
  UpdatedBy = 'UpdatedBy',
  UpdatedDate = 'UpdatedDate',
}
