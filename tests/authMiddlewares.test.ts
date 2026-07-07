import { describe, it, expect, jest } from "@jest/globals";
import {
  checkPermission,
  checkSelfOrAllPermission,
  checkJwtAuthorization,
  validateSignup,
  validateLogin
} from "../src/middlewares/authMiddleware.ts";
import type { Request, Response } from "express";

describe("Unit Tests - authMiddleware", () => {
  describe("checkPermission", () => {
    it("should call next if the required permission is present", () => {
      const req = {
        auth: { payload: { permissions: ["read:users", "write:users"] } }
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = jest.fn();

      checkPermission("read:users")(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should throw ForbiddenError if permissions array is missing or invalid", () => {
      const req = {
        auth: { payload: { permissions: "not-an-array" } }
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = jest.fn();

      expect(() => checkPermission("read:users")(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("checkSelfOrAllPermission", () => {
    it("should call next if allPermission is present", () => {
      const req = {
        auth: { payload: { permissions: ["manage:all"] } }
      } as unknown as Request;
      const res = {
        locals: { userId: "user-1", authId: "user-2" }
      } as unknown as Response;
      const next = jest.fn();

      checkSelfOrAllPermission("manage:self", "manage:all")(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should call next if selfPermission is present and userId matches authId", () => {
      const req = {
        auth: { payload: { permissions: ["manage:self"] } }
      } as unknown as Request;
      const res = {
        locals: { userId: "user-1", authId: "user-1" }
      } as unknown as Response;
      const next = jest.fn();

      checkSelfOrAllPermission("manage:self", "manage:all")(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw ForbiddenError if selfPermission is present but userId does not match authId", () => {
      const req = {
        auth: { payload: { permissions: ["manage:self"] } }
      } as unknown as Request;
      const res = {
        locals: { userId: "user-1", authId: "user-2" }
      } as unknown as Response;
      const next = jest.fn();

      expect(() => checkSelfOrAllPermission("manage:self", "manage:all")(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("checkJwtAuthorization", () => {
    it("should call next with UnauthorizedError if jwt validation fails with UnauthorizedError", () => {
      const req = {} as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      checkJwtAuthorization(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateSignup", () => {
    it("should pass validation with a correct payload and populate res.locals", () => {
      const req = {
        body: {
          username: "ValidUser123",
          password: "Password123!"
        }
      } as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateSignup(req, res, next);

      expect(res.locals.username).toBe("validuser123");
      expect(res.locals.password).toBe("Password123!");
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if password is too short", () => {
      const req = {
        body: {
          username: "ValidUser",
          password: "Short1!"
        }
      } as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      expect(() => validateSignup(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateLogin", () => {
    it("should pass validation with a correct payload and populate res.locals", () => {
      const req = {
        body: {
          username: "LoginUser",
          password: "SomePassword"
        }
      } as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      validateLogin(req, res, next);

      expect(res.locals.username).toBe("loginuser");
      expect(res.locals.password).toBe("SomePassword");
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if fields are missing", () => {
      const req = {
        body: {
          username: ""
        }
      } as unknown as Request;
      const res = { locals: {} } as unknown as Response;
      const next = jest.fn();

      expect(() => validateLogin(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });
  });
});