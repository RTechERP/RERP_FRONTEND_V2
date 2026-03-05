/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { ProductProtectiveGearService } from './product-protective-gear.service';

describe('Service: ProductProtectiveGear', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductProtectiveGearService]
    });
  });

  it('should ...', inject([ProductProtectiveGearService], (service: ProductProtectiveGearService) => {
    expect(service).toBeTruthy();
  }));
});
