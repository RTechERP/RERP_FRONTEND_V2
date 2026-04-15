import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPartListSlickGridComponent } from './project-part-list-slick-grid.component';

describe('ProjectPartListSlickGridComponent', () => {
  let component: ProjectPartListSlickGridComponent;
  let fixture: ComponentFixture<ProjectPartListSlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPartListSlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPartListSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
