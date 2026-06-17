import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  extractErrorMessage,
  fc26PlayersApi,
  registerRetryHandler,
  savedSearchesApi,
  scoutingApi,
  shortlistApi,
} from "@/shared/api/client";

const SAVE_ID = "11111111-1111-4111-8111-111111111111";

// A fetch stub that records calls and returns the given JSON body. Defaults to a
// 200; pass `status: 204` for no-content responses.
function stubFetch(body: unknown, init?: { status?: number }) {
  const status = init?.status ?? 200;
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// /auth/csrf is fetched lazily before the first write. Stub it so the real write
// is always the *last* recorded call.
function stubFetchWithCsrf(body: unknown, init?: { status?: number }) {
  const status = init?.status ?? 200;
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    if (String(input).includes("/auth/csrf")) {
      return new Response(JSON.stringify({ csrfToken: "csrf-test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  const calls = fetchMock.mock.calls;
  return calls[calls.length - 1] as [RequestInfo | URL, RequestInit | undefined];
}

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
    it("returns connection message when isNetworkError is true", () => {
      const err = new ApiError("Failed to fetch", undefined, undefined, true);
      expect(extractErrorMessage(err)).toBe(
        "Could not connect to the server. Check your connection."
      );
    });

    it("returns connection message for 'Failed to fetch'", () => {
      expect(extractErrorMessage({ message: "Failed to fetch" })).toBe(
        "Could not connect to the server. Check your connection."
      );
    });

    it("returns connection message when message contains 'NetworkError'", () => {
      expect(extractErrorMessage({ message: "A NetworkError occurred" })).toBe(
        "Could not connect to the server. Check your connection."
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

    it("retorna apiError para status 401", () => {
      const err = { status: 401, data: { error: "Não autenticado." }, message: "Unauthorized" };
      expect(extractErrorMessage(err)).toBe("Não autenticado.");
    });

    it("retorna apiError para status 403", () => {
      const err = { status: 403, data: { error: "Acesso negado." }, message: "Forbidden" };
      expect(extractErrorMessage(err)).toBe("Acesso negado.");
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
    it("returns generic message for status 500", () => {
      const err = { status: 500, data: { error: "INTERNAL_ERROR" } };
      expect(extractErrorMessage(err)).toBe("Internal error. Try again in a moment.");
    });

    it("returns transient message for status 503", () => {
      const err = { status: 503 };
      expect(extractErrorMessage(err)).toBe("Service temporarily unavailable. Try again in a moment.");
    });

    it("returns API message for SERVICE_UNAVAILABLE error code", () => {
      const err = {
        status: 503,
        data: {
          error: "SERVICE_UNAVAILABLE",
          message: "Banco de dados temporariamente indisponível. Tente novamente em instantes.",
        },
      };
      expect(extractErrorMessage(err)).toBe(
        "Banco de dados temporariamente indisponível. Tente novamente em instantes.",
      );
    });
  });

  describe("fallback", () => {
    it("returns default message for errors without known status", () => {
      expect(extractErrorMessage({})).toBe("Unexpected error. Try again.");
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

describe("fc26PlayersApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("envia saveId e objective na busca do scout com contexto de save", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ players: [], total: 0, limit: 20, offset: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await fc26PlayersApi.list({
      saveId: "11111111-1111-4111-8111-111111111111",
      objective: "youth",
      positions: ["MC"],
      limit: 20,
      offset: 0,
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(requestUrl.pathname).toBe("/api/fc26-players");
    expect(requestUrl.searchParams.get("saveId")).toBe("11111111-1111-4111-8111-111111111111");
    expect(requestUrl.searchParams.get("objective")).toBe("youth");
    expect(requestUrl.searchParams.get("positions")).toBe("MC");
  });

  it("não envia sortBy=fitScore para o backend", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ players: [], total: 0, limit: 20, offset: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await fc26PlayersApi.list({
      saveId: "11111111-1111-4111-8111-111111111111",
      sortBy: "fitScore",
      sortOrder: "desc",
      limit: 20,
      offset: 0,
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(requestUrl.searchParams.get("sortBy")).toBeNull();
    expect(requestUrl.searchParams.get("sortOrder")).toBeNull();
  });
});

describe("shortlistApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lista a shortlist do save e devolve o envelope { items }", async () => {
    const fetchMock = stubFetch({ items: [{ id: "s1", fc26PlayerId: 7 }] });

    const res = await shortlistApi.list(SAVE_ID);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe(`/api/saves/${SAVE_ID}/shortlist`);
    expect(lastCall(fetchMock)[1]?.method ?? "GET").toBe("GET");
    expect(res.items).toHaveLength(1);
  });

  it("adiciona um jogador via POST com o corpo correto", async () => {
    const fetchMock = stubFetchWithCsrf({ id: "s1", fc26PlayerId: 7, notes: "alvo", priority: "HIGH" });

    await shortlistApi.add(SAVE_ID, { fc26PlayerId: 7, notes: "alvo", priority: "HIGH" });

    const [input, init] = lastCall(fetchMock);
    expect(new URL(String(input)).pathname).toBe(`/api/saves/${SAVE_ID}/shortlist`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ fc26PlayerId: 7, notes: "alvo", priority: "HIGH" });
  });

  it("atualiza um item via PATCH no itemId", async () => {
    const fetchMock = stubFetchWithCsrf({ id: "item-9", priority: "LOW" });

    await shortlistApi.update(SAVE_ID, "item-9", { priority: "LOW" });

    const [input, init] = lastCall(fetchMock);
    expect(new URL(String(input)).pathname).toBe(`/api/saves/${SAVE_ID}/shortlist/item-9`);
    expect(init?.method).toBe("PATCH");
  });

  it("remove um item via DELETE e resolve para undefined em 204", async () => {
    const fetchMock = stubFetchWithCsrf(null, { status: 204 });

    const res = await shortlistApi.remove(SAVE_ID, "item-9");

    const [input, init] = lastCall(fetchMock);
    expect(new URL(String(input)).pathname).toBe(`/api/saves/${SAVE_ID}/shortlist/item-9`);
    expect(init?.method).toBe("DELETE");
    expect(res).toBeUndefined();
  });
});

describe("savedSearchesApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lista as buscas salvas e devolve o envelope { items }", async () => {
    const fetchMock = stubFetch({ items: [] });

    const res = await savedSearchesApi.list(SAVE_ID);

    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe(
      `/api/saves/${SAVE_ID}/saved-searches`,
    );
    expect(res.items).toEqual([]);
  });

  it("cria uma busca via POST com name + filters", async () => {
    const fetchMock = stubFetchWithCsrf({ id: "q1", name: "Pontas jovens" });

    await savedSearchesApi.create(SAVE_ID, {
      name: "Pontas jovens",
      filters: { positions: ["PE", "PD"], maxAge: 23 },
    });

    const [input, init] = lastCall(fetchMock);
    expect(new URL(String(input)).pathname).toBe(`/api/saves/${SAVE_ID}/saved-searches`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Pontas jovens",
      filters: { positions: ["PE", "PD"], maxAge: 23 },
    });
  });
});

describe("503 retry behavior", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    registerRetryHandler(null);
  });

  it("retries a GET on 503 and resolves on second attempt", async () => {
    vi.useFakeTimers();
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      callCount++;
      if (callCount < 2) {
        return new Response(
          JSON.stringify({ error: "SERVICE_UNAVAILABLE", message: "down", statusCode: 503 }),
          { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "1" } },
        );
      }
      return new Response(JSON.stringify({ gaps: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const promise = scoutingApi.gaps("save-1");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(callCount).toBe(2);
    expect(result).toEqual({ gaps: [] });
  });

  it("fires the retry notification callback on each 503 retry", async () => {
    vi.useFakeTimers();
    const notifications: { status: number; attempt: number }[] = [];
    registerRetryHandler((info) => notifications.push(info));

    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      callCount++;
      if (callCount < 3) {
        return new Response(
          JSON.stringify({ error: "SERVICE_UNAVAILABLE", statusCode: 503 }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ gaps: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const promise = scoutingApi.gaps("save-1");
    await vi.runAllTimersAsync();
    await promise;

    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toMatchObject({ status: 503, attempt: 0 });
    expect(notifications[1]).toMatchObject({ status: 503, attempt: 1 });
  });

  it("throws with retriesExhausted=true after 3 failed attempts", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(
        JSON.stringify({ error: "SERVICE_UNAVAILABLE", statusCode: 503 }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      )
    ));

    const assertion = expect(scoutingApi.gaps("save-1")).rejects.toMatchObject({
      status: 503,
      retriesExhausted: true,
    });
    await vi.runAllTimersAsync();
    await assertion;
  });

  it("uses Retry-After header delay on 503", async () => {
    vi.useFakeTimers();
    const delays: number[] = [];
    registerRetryHandler(({ delayMs }) => delays.push(delayMs));

    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      callCount++;
      if (callCount < 3) {
        return new Response(
          JSON.stringify({ error: "SERVICE_UNAVAILABLE", statusCode: 503 }),
          { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "3" } },
        );
      }
      return new Response(JSON.stringify({ gaps: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const promise = scoutingApi.gaps("save-1");
    await vi.runAllTimersAsync();
    await promise;

    expect(delays).toEqual([3000, 3000]);
  });

  it("falls back to exponential backoff when Retry-After is absent", async () => {
    vi.useFakeTimers();
    const delays: number[] = [];
    registerRetryHandler(({ delayMs }) => delays.push(delayMs));

    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      callCount++;
      if (callCount < 3) {
        return new Response(
          JSON.stringify({ error: "SERVICE_UNAVAILABLE", statusCode: 503 }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ gaps: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const promise = scoutingApi.gaps("save-1");
    await vi.runAllTimersAsync();
    await promise;

    expect(delays).toEqual([1000, 2000]);
  });

  it("retries a POST on 503 (write not applied per contract)", async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetchWithCsrf(null); // will be overridden below
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/auth/csrf")) {
        return new Response(JSON.stringify({ csrfToken: "csrf-test" }), { status: 200 });
      }
      callCount++;
      if (callCount < 2) {
        return new Response(
          JSON.stringify({ error: "SERVICE_UNAVAILABLE", statusCode: 503 }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ id: "s1", fc26PlayerId: 7, notes: null, priority: null, createdAt: "" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    void fetchMock; // unused but satisfies linter

    const SAVE_ID = "11111111-1111-4111-8111-111111111111";
    const promise = shortlistApi.add(SAVE_ID, { fc26PlayerId: 7 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(callCount).toBe(2);
    expect(result).toMatchObject({ fc26PlayerId: 7 });
  });
});

describe("scoutingApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("busca gaps do elenco com a formação na query", async () => {
    const fetchMock = stubFetch({ gaps: [] });

    await scoutingApi.gaps(SAVE_ID, "4-2-3-1");

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe(`/api/scouting/saves/${SAVE_ID}/gaps`);
    expect(url.searchParams.get("formation")).toBe("4-2-3-1");
  });

  it("omite a query de formação quando não informada", async () => {
    const fetchMock = stubFetch({ gaps: [] });

    await scoutingApi.gaps(SAVE_ID);

    expect(String(fetchMock.mock.calls[0][0])).not.toContain("formation");
  });

  it("monta a query de transfer-targets só com os parâmetros numéricos definidos", async () => {
    const fetchMock = stubFetch({ players: [], total: 0, limit: 20, offset: 0 });

    await scoutingApi.transferTargets({ position: "ZAG", minOverall: 80, saveId: SAVE_ID });

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/scouting/transfer-targets");
    expect(url.searchParams.get("position")).toBe("ZAG");
    expect(url.searchParams.get("minOverall")).toBe("80");
    expect(url.searchParams.get("saveId")).toBe(SAVE_ID);
    expect(url.searchParams.has("maxAge")).toBe(false);
    expect(url.searchParams.has("maxValue")).toBe(false);
  });

  it("avalia o encaixe de um sofifaId no save", async () => {
    const fetchMock = stubFetch({ verdict: "strong" });

    await scoutingApi.evaluate(SAVE_ID, 231747);

    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe(
      `/api/scouting/saves/${SAVE_ID}/evaluate/231747`,
    );
  });
});
