/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { FoodOrderService } from './food-order.service';

describe('Service: FoodOrder', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FoodOrderService]
    });
  });

  it('should ...', inject([FoodOrderService], (service: FoodOrderService) => {
    expect(service).toBeTruthy();
  }));
});
