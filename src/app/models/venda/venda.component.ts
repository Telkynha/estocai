import { Produto } from "../produto/produto.component";

export interface ItemVenda {
    produto: Produto;
    quantidade: number;
    precoNoMomento: number;
    subtotal: number;
}

export interface Venda {
    id?: string;
    itens: ItemVenda[];
    valorTotal: number;
    plataforma: 'loja' | 'online' | 'outro';
    formaPagamento: string;
    data: Date;
    nomeCliente?: string;
    contatoCliente?: string;
    observacoes?: string;
    criadoPor: string;
    status: 'pendente' | 'concluido' | 'cancelado';
}