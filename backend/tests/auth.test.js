const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("../src/routes/authRoutes");

// Create express app for testing
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

// Mock MongoDB connection
beforeAll(async () => {
  // Use in-memory MongoDB for testing
  await mongoose.connect("mongodb://localhost:27017/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        lastPeriod: "2023-01-01",
        cycleLength: 28,
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("name", userData.name);
      expect(response.body).toHaveProperty("username", userData.username);
      expect(response.body).toHaveProperty("email", userData.email);
      expect(response.body).toHaveProperty("token");
    });

    it("should not register user with existing email", async () => {
      const userData = {
        name: "Test User",
        username: "testuser2",
        email: "test@example.com", // Same email as previous test
        password: "password123",
        lastPeriod: "2023-01-01",
        cycleLength: 28,
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login existing user", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("username");
      expect(response.body).toHaveProperty("email");
      expect(response.body).toHaveProperty("token");
    });

    it("should not login with wrong credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });
});
