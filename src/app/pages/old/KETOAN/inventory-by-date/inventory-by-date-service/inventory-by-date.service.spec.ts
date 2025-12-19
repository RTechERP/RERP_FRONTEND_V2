import { TestBed } from '@angular/core/testing';

import { InventoryByDateService } from './inventory-by-date.service';

describe('InventoryByDateService', () => {
  let service: InventoryByDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventoryByDateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
