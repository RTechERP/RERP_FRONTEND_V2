/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { InventoryDemoProtectiveGearComponent } from './inventory-demo-protective-gear.component';

describe('InventoryDemoProtectiveGearComponent', () => {
  let component: InventoryDemoProtectiveGearComponent;
  let fixture: ComponentFixture<InventoryDemoProtectiveGearComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [InventoryDemoProtectiveGearComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryDemoProtectiveGearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
