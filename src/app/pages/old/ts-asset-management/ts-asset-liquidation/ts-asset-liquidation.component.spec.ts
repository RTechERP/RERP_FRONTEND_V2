/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TsAssetLiquidationComponent } from './ts-asset-liquidation.component';

describe('TsAssetLiquidationComponent', () => {
  let component: TsAssetLiquidationComponent;
  let fixture: ComponentFixture<TsAssetLiquidationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsAssetLiquidationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsAssetLiquidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
