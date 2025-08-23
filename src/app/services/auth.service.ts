import { Injectable, inject } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, UserCredential, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';
import { Firestore, doc, docData, getDoc, setDoc, DocumentReference } from '@angular/fire/firestore';
import { Observable, from, switchMap, of, map } from 'rxjs';
import { Usuario } from '../models/usuario/usuario.component';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth: Auth = inject(Auth);
    private firestore: Firestore = inject(Firestore);

    user$: Observable<Usuario | null>;

    constructor() {
        this.user$ = authState(this.auth).pipe(
            switchMap(user => {
                if (user) {
                    const userDocRef = doc(this.firestore, `usuarios/${user.uid}`) as DocumentReference<Usuario>;
                    return docData<Usuario>(userDocRef, { idField: 'id' }).pipe(
                        map(dbUser => dbUser || null)
                    );
                } else {
                    return of(null);
                }
            })
        );
    }

    async login(email: string, senha: string): Promise<UserCredential> {
        try {
            const result = await signInWithEmailAndPassword(this.auth, email, senha);
            console.log('Login bem sucedido:', result.user?.email);
            return result;
        } catch (error: any) {
            console.error('Erro no login:', error.message);
            throw this.handleAuthError(error);
        }
    }

    async register(usuario: { nome: string; email: string; senha: string }): Promise<UserCredential> {
        try {
            console.log('Iniciando registro de usuário:', usuario.email);
            const credential = await createUserWithEmailAndPassword(this.auth, usuario.email, usuario.senha);

            if (credential.user) {
                console.log('Usuário criado com sucesso:', credential.user.uid);
                await setDoc(doc(this.firestore, `usuarios/${credential.user.uid}`), {
                    id: credential.user.uid,
                    nome: usuario.nome,
                    email: usuario.email,
                    senha: '' // Não armazenamos a senha no Firestore por segurança
                });
            }
            return credential;
        } catch (error: any) {
            throw this.handleAuthError(error);
        }
    }

    async logout(): Promise<void> {
        try {
            await signOut(this.auth);
        } catch (error: any) {
            throw this.handleAuthError(error);
        }
    }

    async loginWithGoogle(): Promise<UserCredential> {
        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(this.auth, provider);

            if (credential.user) {
                const { uid, displayName, email } = credential.user;
                const userDocRef = doc(this.firestore, `usuarios/${uid}`);

                const userSnapshot = await getDoc(userDocRef);

                if (!userSnapshot.exists() && displayName && email) {
                    await setDoc(userDocRef, {
                        id: uid,
                        nome: displayName,
                        email: email,
                        senha: ''
                    });
                }
            }
            return credential;
        } catch (error: any) {
            throw this.handleAuthError(error);
        }
    }

    isAuthenticated(): Observable<boolean> {
        return authState(this.auth).pipe(
            map(user => !!user)
        );
    }

    getCurrentUserId(): Observable<string | null> {
        return authState(this.auth).pipe(
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

    /**
     * Exclui a conta do usuário atual no Firebase Authentication
     * Nota: O usuário deve ter feito login recentemente. 
     * Em caso de sessão expirada, será necessário reautenticar.
     */
    async deleteAccount(): Promise<void> {
        try {
            const user = this.auth.currentUser;
            if (user) {
                await deleteUser(user);
            } else {
                throw new Error('Nenhum usuário autenticado para exclusão');
            }
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                throw new Error('Por motivos de segurança, faça login novamente antes de excluir sua conta.');
            }
            throw this.handleAuthError(error);
        }
    }
}
