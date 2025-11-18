import { TestBed } from '@angular/core/testing';

import { ProposeVehicleRepairService } from './propose-vehicle-repair.service';

describe('ProposeVehicleRepairService', () => {
  let service: ProposeVehicleRepairService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProposeVehicleRepairService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
