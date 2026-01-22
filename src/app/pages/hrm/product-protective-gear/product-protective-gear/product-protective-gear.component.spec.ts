/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProductProtectiveGearComponent } from './product-protective-gear.component';

describe('ProductProtectiveGearComponent', () => {
  let component: ProductProtectiveGearComponent;
  let fixture: ComponentFixture<ProductProtectiveGearComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ ProductProtectiveGearComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductProtectiveGearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
