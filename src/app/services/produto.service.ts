import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Produto } from '../models/produto/produto.component';
import { AuthStateService } from './auth-state.service';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private firestore: Firestore = inject(Firestore);

  constructor(private authState: AuthStateService) {}

  async createProduto(produto: Omit<Produto, 'id' | 'usuarioId' | 'dataCriacao' | 'dataAtualizacao'>): Promise<string> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const novoProduto: Produto = {
      ...produto,
      usuarioId,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      ativo: true
    };

    const docRef = await addDoc(collection(this.firestore, 'produtos'), novoProduto);
    return docRef.id;
  }

  async getProdutosByUsuario(): Promise<Produto[]> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const produtosRef = collection(this.firestore, 'produtos');
    const q = query(produtosRef, where('usuarioId', '==', usuarioId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dataCriacao: data['dataCriacao']?.toDate(),
        dataAtualizacao: data['dataAtualizacao']?.toDate()
      } as Produto;
    });
  }

  async updateProduto(id: string, changes: Partial<Produto>): Promise<void> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const produtoRef = doc(this.firestore, `produtos/${id}`);
    await updateDoc(produtoRef, {
      ...changes,
      dataAtualizacao: new Date()
    });
  }

  async deleteProduto(id: string): Promise<void> {
    const usuarioId = this.authState.user()?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    const produtoRef = doc(this.firestore, `produtos/${id}`);
    await deleteDoc(produtoRef);
  }
}
