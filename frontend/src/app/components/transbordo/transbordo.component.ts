import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransbordoService, Atendimento } from '../../services/transbordo.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transbordo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transbordo.component.html',
  styleUrls: ['./transbordo.component.css'],
})
export class TransbordoComponent implements OnInit, OnDestroy {
  atendimentos = signal<Atendimento[]>([]);
  atendimentoSelecionado = signal<Atendimento | null>(null);
  respostaTexto = signal<string>('');
  enviando = signal<boolean>(false);
  mensagemSucesso = signal<string>('');
  mensagemErro = signal<string>('');

  private socketSub?: Subscription;

  constructor(
    private transbordoService: TransbordoService,
    private socketService: SocketService,
  ) {}

  ngOnInit() {
    this.carregarFila();

    // Escuta novas mensagens em tempo real via WebSocket
    this.socketSub = this.socketService.onNovaDuvida().subscribe((novaDuvida) => {
      // Adiciona na fila se já não existir
      this.atendimentos.update((prev) => {
        if (prev.some((item) => item.id === novaDuvida.id)) {
          return prev;
        }
        const novaFila = [novaDuvida, ...prev];
        // Se não houver nada selecionado, seleciona o novo automaticamente
        if (!this.atendimentoSelecionado()) {
          this.selecionarAtendimento(novaDuvida);
        }
        return novaFila;
      });
    });
  }

  carregarFila() {
    this.transbordoService.listarPendentes().subscribe({
      next: (dados) => {
        this.atendimentos.set(dados);
        if (dados.length > 0 && !this.atendimentoSelecionado()) {
          this.selecionarAtendimento(dados[0]);
        }
      },
      error: (err) => {
        console.error('Erro ao buscar fila de transbordo:', err);
      },
    });
  }

  selecionarAtendimento(atendimento: Atendimento) {
    this.atendimentoSelecionado.set(atendimento);
    this.respostaTexto.set('');
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');
  }

  enviarResposta() {
    const active = this.atendimentoSelecionado();
    const texto = this.respostaTexto().trim();

    if (!active || !texto) return;

    this.enviando.set(true);
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');

    this.transbordoService.responderDuvida(active.id, texto).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensagemSucesso.set('✓ Resposta enviada! A IA foi treinada com esta resposta.');
        
        // Remove do array local
        this.atendimentos.update((prev) => prev.filter((item) => item.id !== active.id));

        // Limpa ou seleciona o próximo
        setTimeout(() => {
          this.mensagemSucesso.set('');
          const restantes = this.atendimentos();
          if (restantes.length > 0) {
            this.selecionarAtendimento(restantes[0]);
          } else {
            this.atendimentoSelecionado.set(null);
          }
        }, 1500);
      },
      error: (err) => {
        this.enviando.set(false);
        this.mensagemErro.set('Erro ao enviar resposta. Verifique as credenciais ou a conexão da API.');
        console.error(err);
      },
    });
  }

  ignorarAtendimento() {
    const active = this.atendimentoSelecionado();
    if (!active) return;

    if (!confirm('Deseja ignorar esta pergunta? Ela sairá da fila e não treinará a IA.')) {
      return;
    }

    this.transbordoService.ignorarDuvida(active.id).subscribe({
      next: () => {
        this.atendimentos.update((prev) => prev.filter((item) => item.id !== active.id));
        const restantes = this.atendimentos();
        if (restantes.length > 0) {
          this.selecionarAtendimento(restantes[0]);
        } else {
          this.atendimentoSelecionado.set(null);
        }
      },
      error: (err) => {
        console.error('Erro ao ignorar atendimento:', err);
      },
    });
  }

  ngOnDestroy() {
    this.socketSub?.unsubscribe();
  }
}
