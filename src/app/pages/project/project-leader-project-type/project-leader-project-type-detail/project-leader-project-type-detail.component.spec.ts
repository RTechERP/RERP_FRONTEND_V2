/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProjectLeaderProjectTypeDetailComponent } from './project-leader-project-type-detail.component';

describe('ProjectLeaderProjectTypeDetailComponent', () => {
  let component: ProjectLeaderProjectTypeDetailComponent;
  let fixture: ComponentFixture<ProjectLeaderProjectTypeDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectLeaderProjectTypeDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectLeaderProjectTypeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
