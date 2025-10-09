/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { NightShiftComponent } from './night-shift.component';

describe('NightShiftComponent', () => {
  let component: NightShiftComponent;
  let fixture: ComponentFixture<NightShiftComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NightShiftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NightShiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
