/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TsAssetTranferChoseAssetComponent } from './ts-asset-tranfer-chose-asset.component';

describe('TsAssetTranferChoseAssetComponent', () => {
  let component: TsAssetTranferChoseAssetComponent;
  let fixture: ComponentFixture<TsAssetTranferChoseAssetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsAssetTranferChoseAssetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsAssetTranferChoseAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
