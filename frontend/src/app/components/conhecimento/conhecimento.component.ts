import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConhecimentoService, Conhecimento } from '../../services/conhecimento.service';

@Component({
  selector: 'app-conhecimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conhecimento.component.html',
  styleUrls: ['./conhecimento.component.css'],
})
export class ConhecimentoComponent implements OnInit {
  conhecimentos = signal<Conhecimento[]>([]);
  exibirFormulario = signal<boolean>(false);
  editando = signal<boolean>(false);
  salvando = signal<boolean>(false);

  // Campos do formulário
  idForm = signal<string | null>(null);
  tituloForm = signal<string>('');
  conteudoForm = signal<string>('');
  categoriaForm = signal<string>('Missas');
  ativoForm = signal<boolean>(true);

  mensagemSucesso = signal<string>('');
  mensagemErro = signal<string>('');

  constructor(private conhecimentoService: ConhecimentoService) {}

  ngOnInit() {
    this.carregarConhecimentos();
  }

  carregarConhecimentos() {
    this.conhecimentoService.listarTodos().subscribe({
      next: (dados) => this.conhecimentos.set(dados),
      error: (err) => console.error('Erro ao carregar base de conhecimento:', err),
    });
  }

  abrirNovoForm() {
    this.idForm.set(null);
    this.tituloForm.set('');
    this.conteudoForm.set('');
    this.categoriaForm.set('Missas');
    this.ativoForm.set(true);
    
    this.editando.set(false);
    this.exibirFormulario.set(true);
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');
  }

  abrirEditarForm(item: Conhecimento) {
    this.idForm.set(item.id || null);
    this.tituloForm.set(item.titulo);
    this.conteudoForm.set(item.conteudo);
    this.categoriaForm.set(item.categoria);
    this.ativoForm.set(item.ativo !== false);

    this.editando.set(true);
    this.exibirFormulario.set(true);
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');
  }

  fecharForm() {
    this.exibirFormulario.set(false);
  }

  salvar() {
    const dados: Conhecimento = {
      titulo: this.tituloForm().trim(),
      conteudo: this.conteudoForm().trim(),
      categoria: this.categoriaForm().trim(),
      ativo: this.ativoForm(),
    };

    if (!dados.titulo || !dados.conteudo || !dados.categoria) {
      this.mensagemErro.set('Preencha todos os campos obrigatórios.');
      return;
    }

    this.salvando.set(true);
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');

    const id = this.idForm();
    if (id) {
      this.conhecimentoService.atualizar(id, dados).subscribe({
        next: () => {
          this.salvando.set(false);
          this.mensagemSucesso.set('✓ Conhecimento atualizado com sucesso e embedding recalculado!');
          this.carregarConhecimentos();
          setTimeout(() => this.fecharForm(), 1500);
        },
        error: (err) => {
          this.salvando.set(false);
          this.mensagemErro.set('Erro ao atualizar registro. Verifique a API.');
          console.error(err);
        },
      });
    } else {
      this.conhecimentoService.criar(dados).subscribe({
        next: () => {
          this.salvando.set(false);
          this.mensagemSucesso.set('✓ Novo conhecimento criado e embedding indexado!');
          this.carregarConhecimentos();
          setTimeout(() => this.fecharForm(), 1500);
        },
        error: (err) => {
          this.salvando.set(false);
          this.mensagemErro.set('Erro ao cadastrar. Verifique a conexão com a API.');
          console.error(err);
        },
      });
    }
  }

  deletar(id?: string) {
    if (!id) return;

    if (!confirm('Tem certeza que deseja remover esta regra de RAG? A IA não terá mais acesso a esta regra.')) {
      return;
    }

    this.conhecimentoService.remover(id).subscribe({
      next: () => {
        this.carregarConhecimentos();
      },
      error: (err) => console.error('Erro ao remover conhecimento:', err),
    });
  }
}
