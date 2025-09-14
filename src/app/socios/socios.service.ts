import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Socio {
  id: string;
  nombre: string;
  asociados: number;
  contacto: string;
  cursos?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SociosService {
  private apiUrl = 'http://localhost:3000/api/socios'; // Ajusta tu backend

  constructor(private http: HttpClient) {}

  getSocios(): Observable<Socio[]> {
    return this.http.get<Socio[]>(this.apiUrl);
  }

  getSocioById(id: string): Observable<Socio> {
    return this.http.get<Socio>(`${this.apiUrl}/${id}`);
  }

  createSocio(socio: Socio): Observable<Socio> {
    return this.http.post<Socio>(this.apiUrl, socio);
  }

  updateSocio(id: string, socio: Socio): Observable<Socio> {
    return this.http.put<Socio>(`${this.apiUrl}/${id}`, socio);
  }

  deleteSocio(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}