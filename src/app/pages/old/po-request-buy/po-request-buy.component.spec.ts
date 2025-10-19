import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoRequestBuyComponent } from './po-request-buy.component';

describe('PoRequestBuyComponent', () => {
  let component: PoRequestBuyComponent;
  let fixture: ComponentFixture<PoRequestBuyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoRequestBuyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoRequestBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
