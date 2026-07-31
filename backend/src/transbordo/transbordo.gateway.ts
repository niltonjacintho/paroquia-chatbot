import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class TransbordoGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger(TransbordoGateway.name);

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway inicializado para Transbordo.');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado via WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado do WebSocket: ${client.id}`);
  }

  /**
   * Notifica todos os painéis conectados sobre uma nova dúvida pendente
   */
  notificarNovaDuvida(atendimento: any) {
    if (this.server) {
      this.logger.log(`Emitindo evento nova_duvida_pendente para o ID: ${atendimento.id}`);
      this.server.emit('nova_duvida_pendente', atendimento);
    }
  }
}
