import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSlickGrid2Component } from './project-slick-grid2.component';

describe('ProjectSlickGrid2Component', () => {
  let component: ProjectSlickGrid2Component;
  let fixture: ComponentFixture<ProjectSlickGrid2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSlickGrid2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSlickGrid2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
