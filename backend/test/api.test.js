import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Track } from "../src/models/Track.js";

// Le test ne charge pas .env : le secret par défaut de app.js est donc utilisé.
const TEST_SECRET = process.env.JWT_SECRET || "tp1-development-secret";
const userToken = jwt.sign(
  { sub: new mongoose.Types.ObjectId().toString(), email: "test@example.com" },
  TEST_SECRET,
  { expiresIn: "1h" },
);

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("health sans dépendre de MongoDB", async () => {
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});

test("schémas Mongoose et relation", () => {
  const u = new User({
    name: "Test",
    email: "TEST@example.com",
    password: "12345678",
  });

  assert.equal(u.email, "test@example.com");
  const t = new Track({
    ownerId: new mongoose.Types.ObjectId(),
    title: "Blues",
    originalName: "b.mp3",
    storedName: "x.mp3",
    mimeType: "audio/mpeg",
    size: 42,
  });
  
  assert.equal(t.title, "Blues");
  assert.equal(Track.schema.path("ownerId").options.ref, "User");
});

test("une route protégée refuse une requête sans JWT", async () => {
  const r = await fetch(base + "/api/users/me");
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Authentification requise");
});

test("une route protégée refuse un JWT invalide", async () => {
  const r = await fetch(base + "/api/users/me", {
    headers: { Authorization: "Bearer jeton.invalide" },
  });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).message, "Jeton invalide ou expiré");
});

test("un upload sans fichier est refusé en 400", async () => {
  const form = new FormData();
  form.append("title", "Sans fichier");

  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: form,
  });

  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, "Fichier audio requis");
});

test("un type MIME non audio est refusé en 400", async () => {
  const form = new FormData();
  form.append("audio", new Blob(["pas de l'audio"], { type: "text/plain" }), "test.txt");
  form.append("title", "Fichier texte");

  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: form,
  });

  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, "Format audio non accepté");
});
