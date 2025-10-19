import { TestBed } from '@angular/core/testing';

import { ProjectMachinePriceService } from './project-machine-price.service';

describe('ProjectMachinePriceService', () => {
  let service: ProjectMachinePriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectMachinePriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
