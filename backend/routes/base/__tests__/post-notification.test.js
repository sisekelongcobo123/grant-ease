import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";
import app from "../../../app.js";

// Mock the MySQL library
const mockQuery = vi.fn();

vi.mock("mysql2", () => ({
  default: {
    createConnection: () => ({
      connect: (cb) => cb(),
      query: (sql, params, callback) => mockQuery(params instanceof Function ? params : callback),
    }),
  },
}));

describe("Notification Routes", () => {
  describe("POST /notify", () => {
    it("should create a notification successfully for approved application", async () => {
      mockQuery.mockImplementation((callback) => {
        callback(null, { insertId: 1 });
      });

      const res = await supertest(app)
        .post("/notify")
        .send({ target_user_id: "123", type: "approved application", fund_id: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ message: "Notification created successfully", notificationId: 1 });
    });

    it("should create a notification successfully for new applicant", async () => {
      mockQuery.mockImplementation((callback) => {
        callback(null, { insertId: 1 });
      });

      const res = await supertest(app)
        .post("/notify")
        .send({ type: "new applicant", fund_id: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ message: "Notification created successfully", notificationId: 1 });
    });

    it("should return 400 if required parameters are missing", async () => {
      const res = await supertest(app)
        .post("/notify")
        .send({ type: "approved application" }); // Missing fund_id and target_user_id

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Missing required parameters" });
    });

    it("should handle database insertion errors", async () => {
      mockQuery.mockImplementation((callback) => {
        callback(new Error("Database error"));
      });

      const res = await supertest(app)
        .post("/notify")
        .send({ target_user_id: "123", type: "approved application", fund_id: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal Server Error" });
    });
  });
});
