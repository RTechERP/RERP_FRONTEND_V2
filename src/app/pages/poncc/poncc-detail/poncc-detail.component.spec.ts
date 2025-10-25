/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PonccDetailComponent } from './poncc-detail.component';

describe('PonccDetailComponent', () => {
  let component: PonccDetailComponent;
  let fixture: ComponentFixture<PonccDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ PonccDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PonccDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
