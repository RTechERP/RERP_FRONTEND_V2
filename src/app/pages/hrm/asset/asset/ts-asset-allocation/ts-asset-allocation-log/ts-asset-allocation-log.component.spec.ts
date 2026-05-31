import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsAssetAllocationLogComponent } from './ts-asset-allocation-log.component';

describe('TsAssetAllocationLogComponent', () => {
  let component: TsAssetAllocationLogComponent;
  let fixture: ComponentFixture<TsAssetAllocationLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TsAssetAllocationLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TsAssetAllocationLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
