import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAgvSummarySlickGirdComponent } from './project-agv-summary-slick-gird.component';

describe('ProjectAgvSummarySlickGirdComponent', () => {
  let component: ProjectAgvSummarySlickGirdComponent;
  let fixture: ComponentFixture<ProjectAgvSummarySlickGirdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAgvSummarySlickGirdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAgvSummarySlickGirdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
