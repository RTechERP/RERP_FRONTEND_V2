import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetLogComponent } from './asset-log.component';

describe('AssetLogComponent', () => {
  let component: AssetLogComponent;
  let fixture: ComponentFixture<AssetLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
