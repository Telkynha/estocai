import { Item } from "../produto/produto.component";
import { status } from "../produto/produto.component";

export interface Venda {
    id?: string;
    itens: Item[];
    valorTotal: number;
    plataforma: plataforma; 
    formaPagamento: formaPagamento; 
    data: Date;
    nomeCliente?: string;
    contatoCliente?: string;
    observacoes?: string;
    status: status; // 0: Pendente, 1: Concluída, 2: Cancelada
    usuarioId: string;
}

export enum plataforma {
    SHOPEE = 0,
    AMAZON = 1,
    MERCADO_LIVRE = 2,
    OLX = 3,
    MAGALU = 4,
    APLICATIVO = 5,
    LOJA_FISICA = 6,
    OUTRO = 7
}

export enum formaPagamento {
    DINHEIRO = 0,
    CARTAO_CREDITO = 1,
    CARTAO_DEBITO = 2,
    PIX = 3,
    BOLETO = 4,
    OUTROS = 5
}
