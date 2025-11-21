/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { DepartmentServiceService } from './department-service.service';

describe('Service: DepartmentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DepartmentServiceService]
    });
  });

  it('should ...', inject([DepartmentServiceService], (service: DepartmentServiceService) => {
    expect(service).toBeTruthy();
  }));
});
