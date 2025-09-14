import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { SociosService, Socio } from '../socios.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-socios',
  standalone: true,                         
  imports: [CommonModule, FormsModule],           
  templateUrl: './lista-socios.component.html',
  styleUrls: ['./lista-socios.component.css']
})
export class ListaSociosComponent implements OnInit {
  socios: Socio[] = [];
  searchTerm = '';

  constructor(
    private sociosService: SociosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sociosService.getSocios().subscribe(data => {
      this.socios = data;
    });
  }

  verSocio(id: string) {
    this.router.navigate(['/socios', id]);
  }

  agregarSocio() {
    this.router.navigate(['/socios/registrar']);
  }

  buscar() {
    return this.socios.filter(s =>
      s.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}