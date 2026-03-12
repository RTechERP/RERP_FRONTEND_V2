export class DetailCharts {
  XAxisValue: string = '';
  YAxisValue: string = '';
  constructor(init?: Partial<DetailCharts>) {
    Object.assign(this, init);
  }
}
