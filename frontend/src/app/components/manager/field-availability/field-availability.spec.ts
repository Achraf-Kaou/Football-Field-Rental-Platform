import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldAvailability } from './field-availability';

describe('FieldAvailability', () => {
  let component: FieldAvailability;
  let fixture: ComponentFixture<FieldAvailability>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldAvailability]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldAvailability);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
