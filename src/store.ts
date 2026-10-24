// Acceso a datos. Árbol por familia: families/{uid}/children/{childId} y families/{uid}/trials/{id}.
// Sin Analytics: solo se importan firebase/app, firebase/auth y firebase/firestore.
import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, reauthenticateWithPopup, deleteUser, User,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, getDocs,
  writeBatch, serverTimestamp, Timestamp, query, where, Firestore, terminate, clearIndexedDbPersistence,
} from 'firebase/firestore';
import { firebaseConfig } from './config';
import type { TrialRecord, SessionRecord } from './engine';

export interface Child { id: string; nickname: string }

export interface Store {
  readonly demo: boolean;
  children(): Promise<Child[]>;
  addChild(nickname: string): Promise<Child>;
  trials(childId?: string): Promise<TrialRecord[]>;
  addTrial(t: TrialRecord): Promise<void>;
  sessions(childId?: string): Promise<SessionRecord[]>;
  addSession(s: SessionRecord): Promise<void>;
  exportAll(): Promise<{ children: Child[]; trials: TrialRecord[]; sessions: SessionRecord[] }>;
  deleteChild(childId: string): Promise<void>;
  deleteEverything(): Promise<void>;
  signOut(): Promise<void>;
}

const rid = () => crypto.getRandomValues(new Uint32Array(3)).reduce((s, n) => s + n.toString(36), '');
export const newId = rid;
export const cleanNickname = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 20);

/** Modo de prueba sin cuenta: todo en memoria, nada se guarda. */
export function demoStore(): Store {
  const kids: Child[] = [{ id: 'demo', nickname: 'Prueba' }];
  const ts: TrialRecord[] = [];
  const ss: SessionRecord[] = [];
  return {
    demo: true,
    children: async () => kids,
    addChild: async n => { const c = { id: rid(), nickname: cleanNickname(n) }; kids.push(c); return c; },
    trials: async id => ts.filter(t => !id || t.childId === id),
    addTrial: async t => { ts.push(t); },
    sessions: async id => ss.filter(x => !id || x.childId === id),
    addSession: async x => { ss.push(x); },
    exportAll: async () => ({ children: kids, trials: ts, sessions: ss }),
    deleteChild: async id => {
      for (let i = ss.length - 1; i >= 0; i--) if (ss[i].childId === id) ss.splice(i, 1);
      for (let i = ts.length - 1; i >= 0; i--) if (ts[i].childId === id) ts.splice(i, 1);
      const k = kids.findIndex(c => c.id === id); if (k >= 0) kids.splice(k, 1);
    },
    deleteEverything: async () => { ts.length = 0; ss.length = 0; },
    signOut: async () => {},
  };
}

let db: Firestore | null = null;
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
function fs() {
  // Persistencia local: la app funciona sin conexión y sincroniza al volver la red.
  db ??= initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  return db;
}

export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const onUser = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

export function familyStore(user: User): Store {
  const base = () => doc(fs(), 'families', user.uid);
  const kidsCol = () => collection(base(), 'children');
  const trialsCol = () => collection(base(), 'trials');
  const sessCol = () => collection(base(), 'sessions');
  const all = async () => {
    const [k, t, s] = await Promise.all([getDocs(kidsCol()), getDocs(trialsCol()), getDocs(sessCol())]);
    return { k, t, s };
  };
  const ms = (v: any) => (v instanceof Timestamp ? v.toMillis() : Number(v));
  const toSession = (id: string, d: any): SessionRecord => ({ ...d, id, startedAt: ms(d.startedAt), endedAt: ms(d.endedAt) });
  const toTrial = (d: any): TrialRecord => ({ ...d, at: d.at instanceof Timestamp ? d.at.toMillis() : Number(d.at) });
  return {
    demo: false,
    async children() { return (await getDocs(kidsCol())).docs.map(d => ({ id: d.id, nickname: d.data().nickname })); },
    async addChild(n) {
      const c = { id: rid(), nickname: cleanNickname(n) };
      // Sin await: con persistencia local la escritura queda en cola aunque no haya red.
      setDoc(doc(kidsCol(), c.id), { nickname: c.nickname, createdAt: serverTimestamp() }).catch(console.error);
      return c;
    },
    async trials(childId) {
      const q = childId ? query(trialsCol(), where('childId', '==', childId)) : trialsCol();
      return (await getDocs(q)).docs.map(d => toTrial(d.data()));
    },
    async addTrial(t) {
      setDoc(doc(trialsCol(), rid()), { ...t, at: Timestamp.fromMillis(t.at) }).catch(console.error);
    },
    async sessions(childId) {
      const q = childId ? query(sessCol(), where('childId', '==', childId)) : sessCol();
      return (await getDocs(q)).docs.map(d => toSession(d.id, d.data()));
    },
    async addSession(x) {
      const { id, ...rest } = x;
      setDoc(doc(sessCol(), id), { ...rest, startedAt: Timestamp.fromMillis(x.startedAt), endedAt: Timestamp.fromMillis(x.endedAt) }).catch(console.error);
    },
    async exportAll() {
      const { k, t, s } = await all();
      return { children: k.docs.map(d => ({ id: d.id, nickname: d.data().nickname })), trials: t.docs.map(d => toTrial(d.data())),
        sessions: s.docs.map(d => toSession(d.id, d.data())) };
    },
    async deleteChild(childId) {
      // Borra los ensayos de ese niño y su perfil; no toca otros perfiles ni la cuenta.
      const [t, ses] = await Promise.all([getDocs(query(trialsCol(), where('childId', '==', childId))), getDocs(query(sessCol(), where('childId', '==', childId)))]);
      const refs = [...t.docs.map(d => d.ref), ...ses.docs.map(d => d.ref), doc(kidsCol(), childId)];
      for (let i = 0; i < refs.length; i += 400) {
        const b = writeBatch(fs());
        refs.slice(i, i + 400).forEach(r => b.delete(r));
        await b.commit(); // requiere conexión: se espera la confirmación del servidor
      }
    },
    async deleteEverything() {
      const { k, t, s } = await all();
      const docs = [...k.docs, ...t.docs, ...s.docs];
      for (let i = 0; i < docs.length; i += 400) {
        const b = writeBatch(fs());
        docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
        await b.commit(); // requiere conexión: se espera la confirmación del servidor
      }
      try { await deleteUser(user); }
      catch (e: any) {
        if (e?.code === 'auth/requires-recent-login') { await reauthenticateWithPopup(user, new GoogleAuthProvider()); await deleteUser(user); }
        else throw e;
      }
      await terminate(fs()); await clearIndexedDbPersistence(fs()); db = null;
    },
    signOut: () => signOut(auth),
  };
}
