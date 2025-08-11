import { Produto } from "../produto/produto.component";

export type TipoMovimentacao = 'venda' | 'compra' | 'ajuste' | 'perda' | 'devolucao';

export interface MovimentacaoEstoque {
    id?: string;
    produto: Produto;
    quantidade: number;
    tipo: TipoMovimentacao;
    data: Date;
    referencia?: string; // ID da Venda ou Compra quando aplicável
    observacoes?: string;
    criadoPor: string;
    estoqueAnterior: number;
    estoqueNovo: number;
}