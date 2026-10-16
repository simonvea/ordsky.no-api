import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../app.ts";
import { runMigrations } from "../db/migrate.ts";

let server: Server;
let baseUrl: string;

beforeAll(() => {
  runMigrations();
  server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://localhost:${port}/api/felles`;
});

afterAll(() => {
  server.close();
});

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const submitWords = (id: string, words: string[]): Promise<Response> =>
  fetch(`${baseUrl}/${id}/words`, json("PUT", words));

const saveCloud = (id: string): Promise<Response> =>
  fetch(
    `${baseUrl}/${id}`,
    json("PATCH", {
      cloud: [{ text: "EPLE", value: 2 }],
      wordCount: [{ text: "EPLE", count: 2 }],
    }),
  );

const clearCloud = (id: string): Promise<Response> =>
  fetch(`${baseUrl}/${id}/cloud`, { method: "DELETE" });

describe("DELETE /api/felles/:id/cloud", () => {
  describe("given a session with a saved cloud", () => {
    it("when the cloud is cleared, then cloud and wordCount are gone and the words and entry count are kept", async () => {
      // Arrange
      await submitWords("aaaaa", ["eple", "pære"]);
      await submitWords("aaaaa", ["eple"]);
      const saved = await saveCloud("aaaaa");
      expect((await saved.json()).cloud).toBeDefined();

      // Act
      const response = await clearCloud("aaaaa");

      // Assert
      expect(response.status).toBe(200);
      const returned = await response.json();
      const stored = await (await fetch(`${baseUrl}/aaaaa`)).json();
      for (const session of [returned, stored]) {
        expect(session.cloud).toBeUndefined();
        expect(session.wordCount).toBeUndefined();
        expect(session.words).toEqual(["eple", "pære", "eple"]);
        expect(session.numberOfEntries).toBe(2);
      }
    });
  });

  describe("given a session without a cloud", () => {
    it("when the cloud is cleared, then it answers 200 and the words and entry count are kept", async () => {
      // Arrange
      await submitWords("bbbbb", ["sol"]);

      // Act
      const response = await clearCloud("bbbbb");

      // Assert
      expect(response.status).toBe(200);
      const session = await response.json();
      expect(session.words).toEqual(["sol"]);
      expect(session.numberOfEntries).toBe(1);
    });
  });

  describe("given no session with that id", () => {
    it("when the cloud is cleared, then it answers 404", async () => {
      // Act
      const response = await clearCloud("zzzzz");

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe("given an id that is not 5 characters", () => {
    it("when the cloud is cleared, then it answers 404", async () => {
      // Act
      const response = await clearCloud("abc");

      // Assert
      expect(response.status).toBe(404);
    });
  });
});
