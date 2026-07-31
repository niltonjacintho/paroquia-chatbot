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

  // Estados de Importação de PDF
  exibirModalPDF = signal<boolean>(false);
  processandoPDF = signal<boolean>(false);
  arquivoSelecionado = signal<File | null>(null);
  categoriaPDF = signal<string>('Missas');
  mensagemSucessoPDF = signal<string>('');
  mensagemErroPDF = signal<string>('');

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

  abrirModalPDF() {
    this.arquivoSelecionado.set(null);
    this.categoriaPDF.set('Missas');
    this.exibirModalPDF.set(true);
    this.mensagemSucessoPDF.set('');
    this.mensagemErroPDF.set('');
  }

  fecharModalPDF() {
    this.exibirModalPDF.set(false);
  }

  selecionarArquivo(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        this.mensagemErroPDF.set('Por favor, selecione apenas arquivos do tipo PDF.');
        this.arquivoSelecionado.set(null);
        return;
      }
      this.arquivoSelecionado.set(file);
      this.mensagemErroPDF.set('');
    }
  }

  fazerUploadPDF() {
    const file = this.arquivoSelecionado();
    const categoria = this.categoriaPDF();
    if (!file) {
      this.mensagemErroPDF.set('Selecione um arquivo PDF para importar.');
      return;
    }

    this.processandoPDF.set(true);
    this.mensagemSucessoPDF.set('');
    this.mensagemErroPDF.set('');

    this.conhecimentoService.importarPDF(file, categoria).subscribe({
      next: (res) => {
        this.processandoPDF.set(false);
        this.mensagemSucessoPDF.set(`✓ PDF importado com sucesso! Foram criados ${res.count} blocos de conhecimento.`);
        this.carregarConhecimentos();
        setTimeout(() => this.fecharModalPDF(), 2500);
      },
      error: (err) => {
        this.processandoPDF.set(false);
        this.mensagemErroPDF.set('Erro ao processar o PDF. Certifique-se de que o arquivo não está protegido por senha.');
        console.error(err);
      },
    });
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
