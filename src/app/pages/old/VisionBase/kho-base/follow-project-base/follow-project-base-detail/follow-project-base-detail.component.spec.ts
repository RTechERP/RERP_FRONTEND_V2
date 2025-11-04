/* tslint:disable:no-unused-variable */
import {ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FollowProjectBaseDetailComponent } from './follow-project-base-detail.component';

describe('FollowProjectBaseDetailComponent', () => {
  let component: FollowProjectBaseDetailComponent;
  let fixture: ComponentFixture<FollowProjectBaseDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ FollowProjectBaseDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowProjectBaseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
