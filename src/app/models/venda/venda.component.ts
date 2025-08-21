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
    LOJA_FISICA = 0,
    E_COMMERCE = 1,
    APLICATIVO = 2,
    OUTRO = 3
}

export enum formaPagamento {
    DINHEIRO = 0,
    CARTAO_CREDITO = 1,
    CARTAO_DEBITO = 2,
    PIX = 3,
    BOLETO = 4,
    OUTROS = 5
}
