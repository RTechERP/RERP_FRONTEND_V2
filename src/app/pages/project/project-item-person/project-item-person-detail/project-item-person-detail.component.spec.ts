import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectItemPersonDetailComponent } from './project-item-person-detail.component';

describe('ProjectItemPersonDetailComponent', () => {
  let component: ProjectItemPersonDetailComponent;
  let fixture: ComponentFixture<ProjectItemPersonDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectItemPersonDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectItemPersonDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
