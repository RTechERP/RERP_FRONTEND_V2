/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TsAssetManagemnetPersonalComponent } from './ts-asset-managemnet-personal.component';

describe('TsAssetManagemnetPersonalComponent', () => {
  let component: TsAssetManagemnetPersonalComponent;
  let fixture: ComponentFixture<TsAssetManagemnetPersonalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsAssetManagemnetPersonalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsAssetManagemnetPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
