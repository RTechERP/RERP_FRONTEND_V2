import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectItemPersonComponent } from './project-item-person.component';

describe('ProjectItemPersonComponent', () => {
  let component: ProjectItemPersonComponent;
  let fixture: ComponentFixture<ProjectItemPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectItemPersonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectItemPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
