/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { InventoryDemoService } from './inventory-demo.service';

describe('Service: InventoryDemo', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InventoryDemoService]
    });
  });

  it('should ...', inject([InventoryDemoService], (service: InventoryDemoService) => {
    expect(service).toBeTruthy();
  }));
});
