/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabulatorTableSingleComponent } from './tabulator-tables.component';

describe('TabulatorTableSingleComponent', () => {
  let component: TabulatorTableSingleComponent;
  let fixture: ComponentFixture<TabulatorTableSingleComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ TabulatorTableSingleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabulatorTableSingleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
