import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket: Socket;
  private newTicketSubject = new Subject<any>();

  constructor() {
    // Conecta ao backend NestJS (porta 3100 por padrão)
    this.socket = io('http://localhost:3100');

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WebSocket da Paróquia.');
    });

    this.socket.on('nova_duvida_pendente', (data: any) => {
      console.log('📬 Nova dúvida pendente recebida via WS:', data);
      this.newTicketSubject.next(data);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor WebSocket.');
    });
  }

  /**
   * Retorna um Observable que emite quando uma nova dúvida pendente chega
   */
  onNovaDuvida(): Observable<any> {
    return this.newTicketSubject.asObservable();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
