/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ProjectItemService } from './project-item.service';

describe('Service: ProjectItem', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectItemService]
    });
  });

  it('should ...', inject([ProjectItemService], (service: ProjectItemService) => {
    expect(service).toBeTruthy();
  }));
});
