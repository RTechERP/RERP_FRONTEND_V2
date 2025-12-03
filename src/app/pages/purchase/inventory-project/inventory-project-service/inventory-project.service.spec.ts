import { TestBed } from '@angular/core/testing';

import { InventoryProjectService } from './inventory-project.service';

describe('InventoryProjectService', () => {
  let service: InventoryProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventoryProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
