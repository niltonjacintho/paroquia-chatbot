import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Conhecimento {
  id?: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConhecimentoService {
  private apiUrl = 'http://localhost:3100/conhecimento';

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Conhecimento[]> {
    return this.http.get<Conhecimento[]>(this.apiUrl);
  }

  obterPorId(id: string): Observable<Conhecimento> {
    return this.http.get<Conhecimento>(`${this.apiUrl}/${id}`);
  }

  criar(dados: Conhecimento): Observable<Conhecimento> {
    return this.http.post<Conhecimento>(this.apiUrl, dados);
  }

  atualizar(id: string, dados: Partial<Conhecimento>): Observable<Conhecimento> {
    return this.http.put<Conhecimento>(`${this.apiUrl}/${id}`, dados);
  }

  importarPDF(file: File, categoria: string): Observable<{ success: boolean; count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);
    return this.http.post<{ success: boolean; count: number }>(`${this.apiUrl}/importar-pdf`, formData);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
