import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokhDetailPrimengComponent } from './pokh-detail-primeng.component';

describe('PokhDetailPrimengComponent', () => {
  let component: PokhDetailPrimengComponent;
  let fixture: ComponentFixture<PokhDetailPrimengComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokhDetailPrimengComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokhDetailPrimengComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
