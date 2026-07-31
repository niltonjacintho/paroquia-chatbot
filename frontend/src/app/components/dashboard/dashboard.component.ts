import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransbordoService, Atendimento } from '../../services/transbordo.service';
import { ConhecimentoService } from '../../services/conhecimento.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalPendentes = signal<number>(0);
  totalConhecimentos = signal<number>(0);
  ultimosPendentes = signal<Atendimento[]>([]);
  statusSistema = signal<'online' | 'offline'>('online');

  private socketSub?: Subscription;

  constructor(
    private transbordoService: TransbordoService,
    private conhecimentoService: ConhecimentoService,
    private socketService: SocketService,
  ) {}

  ngOnInit() {
    this.carregarDados();

    // Atualiza estatísticas em tempo real via WebSocket
    this.socketSub = this.socketService.onNovaDuvida().subscribe((novaDuvida) => {
      this.totalPendentes.update((prev) => prev + 1);
      this.ultimosPendentes.update((prev) => [novaDuvida, ...prev].slice(0, 3));
    });
  }

  carregarDados() {
    this.transbordoService.listarPendentes().subscribe({
      next: (dados) => {
        this.totalPendentes.set(dados.length);
        this.ultimosPendentes.set(dados.slice(0, 3));
      },
      error: () => {
        this.statusSistema.set('offline');
      },
    });

    this.conhecimentoService.listarTodos().subscribe({
      next: (dados) => {
        this.totalConhecimentos.set(dados.length);
      },
      error: () => {
        this.statusSistema.set('offline');
      },
    });
  }

  ngOnDestroy() {
    this.socketSub?.unsubscribe();
  }
}
