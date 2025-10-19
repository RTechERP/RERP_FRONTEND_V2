/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PositionContractComponent } from './position-contract.component';

describe('PositionContractComponent', () => {
  let component: PositionContractComponent;
  let fixture: ComponentFixture<PositionContractComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PositionContractComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
