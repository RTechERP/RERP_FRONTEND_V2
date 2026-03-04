/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProductProtectiveGearDetailComponent } from './product-protective-gear-detail.component';

describe('ProductProtectiveGearDetailComponent', () => {
  let component: ProductProtectiveGearDetailComponent;
  let fixture: ComponentFixture<ProductProtectiveGearDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ ProductProtectiveGearDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductProtectiveGearDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
