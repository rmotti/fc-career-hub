import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/test-utils";
import { useCreateSave, useDeleteSave, useUpdateSave } from "@/features/saves/model/useSaves";

const { savesApiMock } = vi.hoisted(() => ({
  savesApiMock: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/api/client", () => ({ savesApi: savesApiMock }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCreateSave", () => {
  it("calls the API and invalidates the saves list on success", async () => {
    savesApiMock.create.mockResolvedValue({ id: "save-9", name: "New save" });
    const { client, Wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCreateSave(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: "New save", club: "Palmeiras", budget: "1000000" });
    });

    expect(savesApiMock.create).toHaveBeenCalledWith({
      name: "New save",
      club: "Palmeiras",
      budget: "1000000",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["saves"] });
  });
});

describe("useUpdateSave", () => {
  it("invalidates the full dependent cascade on success", async () => {
    savesApiMock.update.mockResolvedValue({ id: "save-1" });
    const { client, Wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useUpdateSave(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ saveId: "save-1", data: { budget: "500" } });
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        ["saves"],
        ["saves", "save-1"],
        ["teamStats", "save-1"],
        ["players", "save-1"],
        ["trophies", "save-1"],
      ]),
    );
  });
});

describe("useDeleteSave", () => {
  it("calls the API and invalidates the saves list on success", async () => {
    savesApiMock.delete.mockResolvedValue(undefined);
    const { client, Wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteSave(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync("save-1");
    });

    expect(savesApiMock.delete).toHaveBeenCalledWith("save-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["saves"] });
  });
});
