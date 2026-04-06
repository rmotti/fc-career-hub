import { describe, it, expect } from "vitest";
import { ApiError, extractErrorMessage } from "@/services/api";

describe("ApiError", () => {
  it("cria erro com propriedades corretas", () => {
    const err = new ApiError("mensagem", 404, { error: "NOT_FOUND" });
    expect(err.message).toBe("mensagem");
    expect(err.status).toBe(404);
    expect(err.data).toEqual({ error: "NOT_FOUND" });
    expect(err.name).toBe("ApiError");
    expect(err.isNetworkError).toBeUndefined();
  });

  it("cria network error", () => {
    const err = new ApiError("Failed to fetch", undefined, undefined, true);
    expect(err.isNetworkError).toBe(true);
    expect(err.status).toBeUndefined();
  });

  it("é instância de Error", () => {
    expect(new ApiError("x")).toBeInstanceOf(Error);
  });
});

describe("extractErrorMessage", () => {
  describe("erros de rede", () => {
    it("retorna mensagem de conexão quando isNetworkError é true", () => {
      const err = new ApiError("Failed to fetch", undefined, undefined, true);
      expect(extractErrorMessage(err)).toBe(
        "Não foi possível conectar ao servidor. Verifique sua conexão."
      );
    });

    it("retorna mensagem de conexão para 'Failed to fetch'", () => {
      expect(extractErrorMessage({ message: "Failed to fetch" })).toBe(
        "Não foi possível conectar ao servidor. Verifique sua conexão."
      );
    });

    it("retorna mensagem de conexão quando message contém 'NetworkError'", () => {
      expect(extractErrorMessage({ message: "A NetworkError occurred" })).toBe(
        "Não foi possível conectar ao servidor. Verifique sua conexão."
      );
    });
  });

  describe("conflito de número de camisa", () => {
    it("retorna a mensagem da API para SHIRT_NUMBER_CONFLICT", () => {
      const err = {
        data: {
          error: "SHIRT_NUMBER_CONFLICT",
          message: "Número 10 já está em uso.",
        },
      };
      expect(extractErrorMessage(err)).toBe("Número 10 já está em uso.");
    });
  });

  describe("erros 4xx", () => {
    it("retorna apiError para status 400", () => {
      const err = { status: 400, data: { error: "INVALID_DATA" }, message: "Bad Request" };
      expect(extractErrorMessage(err)).toBe("INVALID_DATA");
    });

    it("retorna apiError para status 404", () => {
      const err = { status: 404, data: { error: "NOT_FOUND" }, message: "Not Found" };
      expect(extractErrorMessage(err)).toBe("NOT_FOUND");
    });

    it("retorna apiError para status 409", () => {
      const err = { status: 409, data: { error: "CONFLICT" }, message: "Conflict" };
      expect(extractErrorMessage(err)).toBe("CONFLICT");
    });

    it("usa err.message como fallback quando não há apiError", () => {
      const err = { status: 404, data: {}, message: "Not Found" };
      expect(extractErrorMessage(err)).toBe("Not Found");
    });
  });

  describe("erros 5xx", () => {
    it("retorna mensagem genérica para status 500", () => {
      const err = { status: 500, data: { error: "INTERNAL_ERROR" } };
      expect(extractErrorMessage(err)).toBe("Erro interno. Tente novamente em instantes.");
    });

    it("retorna mensagem genérica para status 503", () => {
      const err = { status: 503 };
      expect(extractErrorMessage(err)).toBe("Erro interno. Tente novamente em instantes.");
    });
  });

  describe("fallback", () => {
    it("retorna mensagem padrão para erros sem status conhecido", () => {
      expect(extractErrorMessage({})).toBe("Erro inesperado. Tente novamente.");
    });

    it("usa err.message quando disponível no fallback", () => {
      expect(extractErrorMessage({ message: "Algo deu errado" })).toBe("Algo deu errado");
    });

    it("lida com null/undefined sem lançar erro", () => {
      expect(() => extractErrorMessage(null)).not.toThrow();
      expect(() => extractErrorMessage(undefined)).not.toThrow();
    });
  });
});
