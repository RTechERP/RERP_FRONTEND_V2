export class CommunicationParam {
  Id: number = 0;
  SortOrder: number = 0;
  CommunicationId: number = 0;
  ParamKey: string = '';
  DataType: string = '';
  IsRequired: boolean | undefined | null;
  Description: string = '';

  constructor(init?: Partial<CommunicationParam>) {
    Object.assign(this, init);
  }
}
