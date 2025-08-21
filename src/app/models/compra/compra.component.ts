import { Item } from "../produto/produto.component";
import { status } from "../produto/produto.component";

export interface Compra {
    id?: string;
    itens: Item[];
    valorTotal: number;
    fornecedor: string;
    numeroNota?: string;
    data: Date;
    observacoes?: string;
    status: status; // 0: Pendente, 1: Concluída, 2: Cancelada
    usuarioId: string;
}