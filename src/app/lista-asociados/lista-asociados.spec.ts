import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaAsociados } from './lista-asociados';

describe('ListaAsociados', () => {
  let component: ListaAsociados;
  let fixture: ComponentFixture<ListaAsociados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaAsociados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaAsociados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
