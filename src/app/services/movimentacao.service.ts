import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { AuthStateService } from './auth-state.service';
import { Venda } from '../models/venda/venda.component';
import { Compra } from '../models/compra/compra.component';
import { ProdutoService } from './produto.service';
import { Produto } from '../models/produto/produto.component';

@Injectable({
  providedIn: 'root'
})
export class MovimentacaoService {
  private firestore: Firestore = inject(Firestore);

  constructor(
    private authState: AuthStateService,
    private produtoService: ProdutoService
  ) {}

  // Função para obter todas as movimentações
  async getMovimentacoesByUsuario(): Promise<(Venda | Compra)[]> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const [vendas, compras] = await Promise.all([
      this.getVendasByUsuario(),
      this.getComprasByUsuario()
    ]);

    // Combina e ordena todas as movimentações por data
    return [...vendas, ...compras].sort(
      (a, b) => b.data.getTime() - a.data.getTime()
    );
  }

  // Funções para Vendas
  async createVenda(venda: Omit<Venda, 'id' | 'usuarioId'>): Promise<string> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const novaVenda: Venda = {
      ...venda,
      usuarioId,
      data: new Date(),
      status: 0 // Pendente por padrão
    };

    // Atualiza o estoque dos produtos vendidos
    for (const item of novaVenda.itens) {
      const produto = (await this.produtoService.getProdutosByUsuario())
        .find(p => p.id === item.produtoId);
      
      if (produto) {
        if (produto.estoqueAtual < item.quantidade) {
          throw new Error(`Estoque insuficiente para o produto ${produto.nome}`);
        }
        
        await this.produtoService.updateProduto(produto.id!, {
          estoqueAtual: produto.estoqueAtual - item.quantidade,
          dataAtualizacao: new Date()
        });
      }
    }

    const docRef = await addDoc(collection(this.firestore, 'vendas'), novaVenda);
    return docRef.id;
  }

  async getVendasByUsuario(): Promise<Venda[]> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const vendasRef = collection(this.firestore, 'vendas');
    const q = query(vendasRef, where('usuarioId', '==', usuarioId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data()['data']?.toDate()
    } as Venda));
  }

  async updateVenda(id: string, changes: Partial<Venda>): Promise<void> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    // Se houver alteração nos itens, recalcula o estoque
    if (changes.itens) {
      const vendaAntiga = (await this.getVendasByUsuario()).find(v => v.id === id);
      if (vendaAntiga) {
        // Restaura o estoque dos itens antigos
        for (const item of vendaAntiga.itens) {
          const produto = (await this.produtoService.getProdutosByUsuario())
            .find(p => p.id === item.produtoId);
          
          if (produto) {
            await this.produtoService.updateProduto(produto.id!, {
              estoqueAtual: produto.estoqueAtual + item.quantidade,
              dataAtualizacao: new Date()
            });
          }
        }

        // Deduz o estoque dos novos itens
        for (const item of changes.itens) {
          const produto = (await this.produtoService.getProdutosByUsuario())
            .find(p => p.id === item.produtoId);
          
          if (produto) {
            if (produto.estoqueAtual < item.quantidade) {
              throw new Error(`Estoque insuficiente para o produto ${produto.nome}`);
            }
            
            await this.produtoService.updateProduto(produto.id!, {
              estoqueAtual: produto.estoqueAtual - item.quantidade,
              dataAtualizacao: new Date()
            });
          }
        }
      }
    }

    const vendaRef = doc(this.firestore, `vendas/${id}`);
    await updateDoc(vendaRef, changes);
  }

  async deleteVenda(id: string): Promise<void> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    // Restaura o estoque dos produtos antes de excluir
    const venda = (await this.getVendasByUsuario()).find(v => v.id === id);
    if (venda) {
      for (const item of venda.itens) {
        const produto = (await this.produtoService.getProdutosByUsuario())
          .find(p => p.id === item.produtoId);
        
        if (produto) {
          await this.produtoService.updateProduto(produto.id!, {
            estoqueAtual: produto.estoqueAtual + item.quantidade,
            dataAtualizacao: new Date()
          });
        }
      }
    }

    const vendaRef = doc(this.firestore, `vendas/${id}`);
    await deleteDoc(vendaRef);
  }

  // Funções para Compras
  async createCompra(compra: Omit<Compra, 'id' | 'usuarioId'>): Promise<string> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const novaCompra: Compra = {
      ...compra,
      usuarioId,
      data: new Date(),
      status: 0 // Pendente por padrão
    };

    // Atualiza o estoque dos produtos comprados
    for (const item of novaCompra.itens) {
      const produto = (await this.produtoService.getProdutosByUsuario())
        .find(p => p.id === item.produtoId);
      
      if (produto) {
        await this.produtoService.updateProduto(produto.id!, {
          estoqueAtual: produto.estoqueAtual + item.quantidade,
          dataAtualizacao: new Date()
        });
      }
    }

    const docRef = await addDoc(collection(this.firestore, 'compras'), novaCompra);
    return docRef.id;
  }

  async getComprasByUsuario(): Promise<Compra[]> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const comprasRef = collection(this.firestore, 'compras');
    const q = query(comprasRef, where('usuarioId', '==', usuarioId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data()['data']?.toDate()
    } as Compra));
  }

  async updateCompra(id: string, changes: Partial<Compra>): Promise<void> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    // Se houver alteração nos itens, recalcula o estoque
    if (changes.itens) {
      const compraAntiga = (await this.getComprasByUsuario()).find(c => c.id === id);
      if (compraAntiga) {
        // Remove o estoque dos itens antigos
        for (const item of compraAntiga.itens) {
          const produto = (await this.produtoService.getProdutosByUsuario())
            .find(p => p.id === item.produtoId);
          
          if (produto) {
            await this.produtoService.updateProduto(produto.id!, {
              estoqueAtual: produto.estoqueAtual - item.quantidade,
              dataAtualizacao: new Date()
            });
          }
        }

        // Adiciona o estoque dos novos itens
        for (const item of changes.itens) {
          const produto = (await this.produtoService.getProdutosByUsuario())
            .find(p => p.id === item.produtoId);
          
          if (produto) {
            await this.produtoService.updateProduto(produto.id!, {
              estoqueAtual: produto.estoqueAtual + item.quantidade,
              dataAtualizacao: new Date()
            });
          }
        }
      }
    }

    const compraRef = doc(this.firestore, `compras/${id}`);
    await updateDoc(compraRef, changes);
  }

  async deleteCompra(id: string): Promise<void> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    // Remove o estoque dos produtos antes de excluir
    const compra = (await this.getComprasByUsuario()).find(c => c.id === id);
    if (compra) {
      for (const item of compra.itens) {
        const produto = (await this.produtoService.getProdutosByUsuario())
          .find(p => p.id === item.produtoId);
        
        if (produto) {
          await this.produtoService.updateProduto(produto.id!, {
            estoqueAtual: produto.estoqueAtual - item.quantidade,
            dataAtualizacao: new Date()
          });
        }
      }
    }

    const compraRef = doc(this.firestore, `compras/${id}`);
    await deleteDoc(compraRef);
  }
}
