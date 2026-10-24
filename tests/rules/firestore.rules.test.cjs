// Pruebas de firestore.rules con el emulador (npm run test:rules; requiere Java).
const { readFileSync } = require('node:fs');
const { before, after, beforeEach, describe, it } = require('node:test');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const firebase = require('firebase/compat/app');

let env;
const now = () => firebase.firestore.Timestamp.now();
const trial = () => ({ childId: 'k1', sessionId: 's1', word: 'miel', cardType: 'imagen_texto', help: 'ninguna', correct: true, latencyMs: 1200, at: now() });
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
  it('todo lo demás está negado', async () => {
    const db = fam('famA');
    await assertFails(db.doc('families/famA').set({ a: 1 }));
    await assertFails(db.doc('admin/x').get());
  });
});
