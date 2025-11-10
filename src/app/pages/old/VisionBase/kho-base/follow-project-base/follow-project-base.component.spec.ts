/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FollowProjectBaseComponent } from './follow-project-base.component';

describe('FollowProjectBaseComponent', () => {
  let component: FollowProjectBaseComponent;
  let fixture: ComponentFixture<FollowProjectBaseComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ FollowProjectBaseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowProjectBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
