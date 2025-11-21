import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSurverResultComponent } from './project-surver-result.component';

describe('ProjectSurverResultComponent', () => {
  let component: ProjectSurverResultComponent;
  let fixture: ComponentFixture<ProjectSurverResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSurverResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSurverResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
