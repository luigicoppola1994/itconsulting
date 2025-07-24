import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulenzaComponent } from './consulenza.component';

describe('ConsulenzaComponent', () => {
  let component: ConsulenzaComponent;
  let fixture: ComponentFixture<ConsulenzaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsulenzaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulenzaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
