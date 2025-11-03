/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TsAssetProposeLiquidationFormComponent } from './ts-asset-propose-liquidation-form.component';

describe('TsAssetProposeLiquidationFormComponent', () => {
  let component: TsAssetProposeLiquidationFormComponent;
  let fixture: ComponentFixture<TsAssetProposeLiquidationFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsAssetProposeLiquidationFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsAssetProposeLiquidationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
