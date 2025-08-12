import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectListWorkReportComponent } from './project-list-work-report.component';

describe('ProjectListWorkReportComponent', () => {
  let component: ProjectListWorkReportComponent;
  let fixture: ComponentFixture<ProjectListWorkReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectListWorkReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectListWorkReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
