import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTypeLinkDetailComponent } from './project-type-link-detail.component';

describe('ProjectTypeLinkDetailComponent', () => {
  let component: ProjectTypeLinkDetailComponent;
  let fixture: ComponentFixture<ProjectTypeLinkDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTypeLinkDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTypeLinkDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
