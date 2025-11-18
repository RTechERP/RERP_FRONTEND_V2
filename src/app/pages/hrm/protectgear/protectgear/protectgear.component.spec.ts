import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtectgearComponent } from './protectgear.component';

describe('ProtectgearComponent', () => {
  let component: ProtectgearComponent;
  let fixture: ComponentFixture<ProtectgearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtectgearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtectgearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
