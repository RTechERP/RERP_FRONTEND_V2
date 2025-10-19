import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectItemLateComponent } from './project-item-late.component';

describe('ProjectItemLateComponent', () => {
  let component: ProjectItemLateComponent;
  let fixture: ComponentFixture<ProjectItemLateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectItemLateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectItemLateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
