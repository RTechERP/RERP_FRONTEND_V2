import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPartlistDetailComponent } from './project-partlist-detail.component';

describe('ProjectPartlistDetailComponent', () => {
  let component: ProjectPartlistDetailComponent;
  let fixture: ComponentFixture<ProjectPartlistDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPartlistDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPartlistDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
