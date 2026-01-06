import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWokerSlickGridComponent } from './project-woker-slick-grid.component';

describe('ProjectWokerSlickGridComponent', () => {
  let component: ProjectWokerSlickGridComponent;
  let fixture: ComponentFixture<ProjectWokerSlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWokerSlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWokerSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
