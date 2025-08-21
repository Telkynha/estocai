import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, switchMap, of, map } from 'rxjs';
import { Usuario } from '../models/usuario/usuario.component';
import { GoogleAuthProvider } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user$: Observable<Usuario | null>;

    constructor(
        private auth: AngularFireAuth,
        private firestore: AngularFirestore
    ) {
        this.user$ = this.auth.authState.pipe(
            switchMap(user => {
                if (user) {
                    return this.firestore.doc<Usuario>(`usuarios/${user.uid}`).valueChanges().pipe(
                        map(dbUser => dbUser || null) // Converte undefined para null
                    );
                } else {
                    return of(null);
                }
            })
        );
    }

    async login(email: string, senha: string): Promise<void> {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, senha);
            console.log('Login bem sucedido:', result.user?.email);
        } catch (error: any) {
            console.error('Erro no login:', error.message);
            throw this.handleAuthError(error);
        }
    }

    async register(usuario: { nome: string; email: string; senha: string }): Promise<void> {
        try {
            console.log('Iniciando registro de usuário:', usuario.email);
            const credential = await this.auth.createUserWithEmailAndPassword(usuario.email, usuario.senha);

            if (credential.user) {
                console.log('Usuário criado com sucesso:', credential.user.uid);
                // Criar documento do usuário no Firestore
                await this.firestore.doc(`usuarios/${credential.user.uid}`).set({
                    id: credential.user.uid,
                    nome: usuario.nome,
                    email: usuario.email,
                    senha: '' // Não armazenamos a senha no Firestore por segurança
                });
            }
        } catch (error: any) {
            throw this.handleAuthError(error);
        }
    }

    async logout(): Promise<void> {
        try {
            await this.auth.signOut();
        } catch (error: any) {
            throw this.handleAuthError(error);
        }
    }

    async loginWithGoogle(): Promise<void> {
        try {
            const provider = new GoogleAuthProvider();
            const credential = await this.auth.signInWithPopup(provider);

            if (credential.user) {
                const { uid, displayName, email } = credential.user;
                const userDoc = this.firestore.doc<Usuario>(`usuarios/${uid}`);

                const userSnapshot = await userDoc.get().toPromise();

                if (!userSnapshot?.exists && displayName && email) {
                    await userDoc.set({
                        id: uid,
                        nome: displayName,
                        email: email,
                        senha: ''
                    });
                }
            }
        } catch (error: any) {
            throw this.handleAuthError(error);
        }
    }

    isAuthenticated(): Observable<boolean> {
        return this.auth.authState.pipe(
            map(user => !!user)
        );
    }

    getCurrentUserId(): Observable<string | null> {
        return this.auth.authState.pipe(
            map(user => user ? user.uid : null)
        );
    }

    private handleAuthError(error: any): Error {
        let message = 'Ocorreu um erro na autenticação';

        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'Este email já está sendo usado';
                break;
            case 'auth/invalid-email':
                message = 'Email inválido';
                break;
            case 'auth/operation-not-allowed':
                message = 'Operação não permitida';
                break;
            case 'auth/weak-password':
                message = 'Senha muito fraca';
                break;
            case 'auth/user-disabled':
                message = 'Usuário desativado';
                break;
            case 'auth/user-not-found':
                message = 'Usuário não encontrado';
                break;
            case 'auth/wrong-password':
                message = 'Senha incorreta';
                break;
        }

        return new Error(message);
    }
}
