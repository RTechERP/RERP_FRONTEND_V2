/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PositionInternalComponent } from './position-internal.component';

describe('PositionInternalComponent', () => {
  let component: PositionInternalComponent;
  let fixture: ComponentFixture<PositionInternalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PositionInternalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionInternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
