// Pruebas de firestore.rules con el emulador (npm run test:rules; requiere Java).
const { readFileSync } = require('node:fs');
const { before, after, beforeEach, describe, it } = require('node:test');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const firebase = require('firebase/compat/app');

let env;
const now = () => firebase.firestore.Timestamp.now();
const trial = () => ({ childId: 'k1', sessionId: 's1', word: 'miel', cardType: 'imagen_estimulo', help: 'ninguna', correct: true, latencyMs: 1200, at: now() });
const sess = () => ({ childId: 'k1', mode: 'independiente', deck: 'abejas-jardin', startedAt: now(), endedAt: now(), durationMs: 240000, trials: 8 });
const kid = () => ({ nickname: 'Abejita', createdAt: now() });
const fam = uid => env.authenticatedContext(uid).firestore();

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-mis-palabras', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

describe('firestore.rules', () => {
  it('la familia lee y escribe su árbol', async () => {
    const db = fam('famA');
    await assertSucceeds(db.doc('families/famA/children/k1').set(kid()));
    await assertSucceeds(db.doc('families/famA/trials/t1').set(trial()));
    await assertSucceeds(db.collection('families/famA/trials').get());
    await assertSucceeds(db.doc('families/famA/trials/t1').delete());
    await assertSucceeds(db.doc('families/famA/children/k1').delete());
  });
  it('otra familia no puede leer ni escribir', async () => {
    await env.withSecurityRulesDisabled(c => c.firestore().doc('families/famA/trials/t1').set(trial()));
    const b = fam('famB');
    await assertFails(b.doc('families/famA/trials/t1').get());
    await assertFails(b.collection('families/famA/trials').get());
    await assertFails(b.collectionGroup('trials').get());
    await assertFails(b.doc('families/famA/trials/t2').set(trial()));
    await assertFails(b.doc('families/famA/trials/t1').delete());
  });
  it('sin sesión no hay acceso', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(db.doc('families/famA/children/k1').get());
    await assertFails(db.doc('families/famA/children/k1').set(kid()));
  });
  it('rechaza campos extra o inválidos', async () => {
    const db = fam('famA');
    await assertFails(db.doc('families/famA/children/k1').set({ ...kid(), realName: 'x' }));
    await assertFails(db.doc('families/famA/children/k1').set({ ...kid(), nickname: 'x'.repeat(21) }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), photo: 'x' }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), help: 'Z' }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), latencyMs: -1 }));
  });
  it('los ensayos no se editan', async () => {
    const db = fam('famA');
    await db.doc('families/famA/trials/t1').set(trial());
    await assertFails(db.doc('families/famA/trials/t1').update({ correct: false }));
  });
  it('borrar un perfil: solo el dueño borra el niño y sus ensayos; otros perfiles quedan', async () => {
    await env.withSecurityRulesDisabled(async c => {
      const d = c.firestore();
      await d.doc('families/famA/children/k1').set(kid());
      await d.doc('families/famA/children/k2').set(kid());
      await d.doc('families/famA/trials/t1').set(trial());
      await d.doc('families/famA/trials/t2').set({ ...trial(), childId: 'k2' });
    });
    const b = fam('famB');
    await assertFails(b.doc('families/famA/children/k1').delete());
    await assertFails(b.collection('families/famA/trials').where('childId', '==', 'k1').get());
    const a = fam('famA');
    const q = await assertSucceeds(a.collection('families/famA/trials').where('childId', '==', 'k1').get());
    const batch = a.batch();
    q.docs.forEach(d => batch.delete(d.ref));
    batch.delete(a.doc('families/famA/children/k1'));
    await assertSucceeds(batch.commit());
    const left = await a.collection('families/famA/trials').get();
    if (left.size !== 1 || left.docs[0].data().childId !== 'k2') throw new Error('se borró de más');
    if (!(await a.doc('families/famA/children/k2').get()).exists) throw new Error('se borró otro perfil');
  });
  it('D13: la familia crea y lee sus sesiones; ensayos con modo y ayudas', async () => {
    const db = fam('famA');
    await assertSucceeds(db.doc('families/famA/sessions/s1').set(sess()));
    await assertSucceeds(db.collection('families/famA/sessions').where('childId', '==', 'k1').get());
    await assertSucceeds(db.doc('families/famA/trials/t9').set({ ...trial(), mode: 'independiente', helps: 1 }));
    await assertSucceeds(db.doc('families/famA/trials/t10').set({ ...trial(), mode: 'tutor', level: 4, miss: true }));
    await assertFails(db.doc('families/famA/sessions/s1').update({ trials: 9 }));
    await assertSucceeds(db.doc('families/famA/sessions/s1').delete());
  });
  it('D13: otra familia no ve ni escribe sesiones ajenas', async () => {
    await env.withSecurityRulesDisabled(c => c.firestore().doc('families/famA/sessions/s1').set(sess()));
    const b = fam('famB');
    await assertFails(b.doc('families/famA/sessions/s1').get());
    await assertFails(b.collection('families/famA/sessions').get());
    await assertFails(b.collectionGroup('sessions').get());
    await assertFails(b.doc('families/famA/sessions/s2').set(sess()));
    await assertFails(env.unauthenticatedContext().firestore().doc('families/famA/sessions/s1').get());
  });
  it('Mazos nuevos: acepta sesiones de Animales, Cumpleaños y Navidad', async () => {
    const db = fam('famA');
    for (const deck of ['animales', 'cumpleanos', 'navidad']) await assertSucceeds(db.doc(`families/famA/sessions/m-${deck}`).set({ ...sess(), deck }));
  });
  it('D13: rechaza sesiones y ensayos inválidos', async () => {
    const db = fam('famA');
    await assertFails(db.doc('families/famA/sessions/s1').set({ ...sess(), nickname: 'x' }));
    await assertFails(db.doc('families/famA/sessions/s1').set({ ...sess(), mode: 'otro' }));
    await assertFails(db.doc('families/famA/sessions/s1').set({ ...sess(), deck: 'x' }));
    await assertFails(db.doc('families/famA/sessions/s1').set({ ...sess(), durationMs: 3600001 }));
    await assertFails(db.doc('families/famA/sessions/s1').set({ ...sess(), startedAt: firebase.firestore.Timestamp.fromMillis(Date.now() + 1e6) }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), mode: 'x' }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), helps: 11 }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), level: 6 }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), level: 0 }));
    await assertFails(db.doc('families/famA/trials/t1').set({ ...trial(), miss: 'si' }));
  });
  it('todo lo demás está negado', async () => {
    const db = fam('famA');
    await assertFails(db.doc('families/famA').set({ a: 1 }));
    await assertFails(db.doc('admin/x').get());
  });
});
