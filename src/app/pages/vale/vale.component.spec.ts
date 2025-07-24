import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValeComponent } from './vale.component';

describe('ValeComponent', () => {
  let component: ValeComponent;
  let fixture: ComponentFixture<ValeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
