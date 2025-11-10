/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProjectTypeBaseDetailComponent } from './project-type-base-detail.component';

describe('ProjectTypeBaseDetailComponent', () => {
  let component: ProjectTypeBaseDetailComponent;
  let fixture: ComponentFixture<ProjectTypeBaseDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectTypeBaseDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectTypeBaseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
