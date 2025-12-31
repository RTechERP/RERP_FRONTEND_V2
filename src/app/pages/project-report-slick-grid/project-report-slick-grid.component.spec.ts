import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectReportSlickGridComponent } from './project-report-slick-grid.component';

describe('ProjectReportSlickGridComponent', () => {
  let component: ProjectReportSlickGridComponent;
  let fixture: ComponentFixture<ProjectReportSlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectReportSlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectReportSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
