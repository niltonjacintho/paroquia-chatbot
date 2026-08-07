import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Atendimento {
  id: string;
  telefoneFiel: string;
  nomeFiel?: string;
  pergunta: string;
  respostaHumanizada?: string;
  status: 'PENDENTE' | 'RESPONDIDO' | 'IGNORADO';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransbordoService {
  private apiUrl = `${environment.apiUrl}/transbordo`;

  constructor(private http: HttpClient) {}

  listarPendentes(): Observable<Atendimento[]> {
    return this.http.get<Atendimento[]>(`${this.apiUrl}/pendentes`);
  }

  responderDuvida(id: string, resposta: string): Observable<Atendimento> {
    return this.http.post<Atendimento>(`${this.apiUrl}/responder/${id}`, { resposta });
  }

  ignorarDuvida(id: string): Observable<Atendimento> {
    return this.http.post<Atendimento>(`${this.apiUrl}/ignorar/${id}`, {});
  }
}
