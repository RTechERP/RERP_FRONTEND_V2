export class AreaElectricityUsage {
    AreaId: number = 0;
    AreaName: string = '';
    DeviceName?: string = '';
    XAxisValue: string = '';
    YAxisValue: number = 0;

    constructor(init?: Partial<AreaElectricityUsage>) {
        Object.assign(this, init);
    }
}
