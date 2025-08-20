import { Produto } from "../produto/produto.component";

export interface ItemCompra {
    produto: Produto;
    quantidade: number;
    custoNoMomento: number;
    subtotal: number;
}

export interface Compra {
    id?: string;
    itens: ItemCompra[];
    valorTotal: number;
    fornecedor: string;
    numeroNota?: string;
    data: Date;
    observacoes?: string;
    status: 'pendente' | 'recebido' | 'cancelado';
}