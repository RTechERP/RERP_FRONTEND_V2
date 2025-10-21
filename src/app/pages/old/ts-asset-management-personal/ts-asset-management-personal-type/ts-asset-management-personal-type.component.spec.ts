import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsAssetManagementPersonalTypeComponent } from './ts-asset-management-personal-type.component';

describe('TsAssetManagementPersonalTypeComponent', () => {
  let component: TsAssetManagementPersonalTypeComponent;
  let fixture: ComponentFixture<TsAssetManagementPersonalTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TsAssetManagementPersonalTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TsAssetManagementPersonalTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
