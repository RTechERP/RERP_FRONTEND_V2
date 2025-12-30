import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoRequestBuySlickgridComponent } from './po-request-buy-slickgrid.component';

describe('PoRequestBuySlickgridComponent', () => {
  let component: PoRequestBuySlickgridComponent;
  let fixture: ComponentFixture<PoRequestBuySlickgridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoRequestBuySlickgridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoRequestBuySlickgridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
