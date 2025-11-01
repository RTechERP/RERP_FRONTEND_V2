/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TsAssetSourceComponent } from './ts-asset-source.component';

describe('TsAssetSourceComponent', () => {
  let component: TsAssetSourceComponent;
  let fixture: ComponentFixture<TsAssetSourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsAssetSourceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsAssetSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
