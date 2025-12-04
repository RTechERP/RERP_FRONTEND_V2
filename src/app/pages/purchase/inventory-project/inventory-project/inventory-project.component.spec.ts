import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryProjectComponent } from './inventory-project.component';

describe('InventoryProjectComponent', () => {
  let component: InventoryProjectComponent;
  let fixture: ComponentFixture<InventoryProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
