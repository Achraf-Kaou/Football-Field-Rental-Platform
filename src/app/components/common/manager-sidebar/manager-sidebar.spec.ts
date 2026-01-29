import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerSidebar } from './manager-sidebar';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ManagerSidebar', () => {
  let component: ManagerSidebar;
  let fixture: ComponentFixture<ManagerSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerSidebar, TranslateModule.forRoot(), HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
