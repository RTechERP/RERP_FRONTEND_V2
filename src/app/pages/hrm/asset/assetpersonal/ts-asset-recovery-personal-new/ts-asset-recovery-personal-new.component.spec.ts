import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsAssetRecoveryPersonalNewComponent } from './ts-asset-recovery-personal-new.component';

describe('TsAssetRecoveryPersonalNewComponent', () => {
  let component: TsAssetRecoveryPersonalNewComponent;
  let fixture: ComponentFixture<TsAssetRecoveryPersonalNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TsAssetRecoveryPersonalNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TsAssetRecoveryPersonalNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
