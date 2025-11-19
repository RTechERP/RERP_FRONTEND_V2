import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAgvSummaryComponent } from './project-agv-summary.component';

describe('ProjectAgvSummaryComponent', () => {
  let component: ProjectAgvSummaryComponent;
  let fixture: ComponentFixture<ProjectAgvSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAgvSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAgvSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
