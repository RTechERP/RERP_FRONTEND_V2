export class Communication {
  Id: number = 0;
  CommunicationName: string = '';
  Description: string = '';

  constructor(init?: Partial<Communication>) {
    Object.assign(this, init);
  }
}
