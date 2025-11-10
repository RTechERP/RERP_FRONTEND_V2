/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { KhoBaseService } from './kho-base.service';

describe('Service: KhoBase', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KhoBaseService]
    });
  });

  it('should ...', inject([KhoBaseService], (service: KhoBaseService) => {
    expect(service).toBeTruthy();
  }));
});
