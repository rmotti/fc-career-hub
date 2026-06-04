import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/test-utils";
import { useCreateTransfer, useDeleteTransfer } from "@/features/transfers/model/useTransfers";

const { transfersApiMock } = vi.hoisted(() => ({
  transfersApiMock: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/api/client", () => ({ transfersApi: transfersApiMock }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCreateTransfer", () => {
  it("links the player, patches the save budget, and refreshes save queries", async () => {
    transfersApiMock.create.mockResolvedValue({ id: "t1", save: { budget: 50 } });

    const { client, Wrapper } = createQueryWrapper();
    client.setQueryData(["saves", "save-1"], { id: "save-1", budget: 100 });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCreateTransfer(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        saveId: "save-1",
        data: { playerName: "Endrick", type: "BUY", from: "A", to: "B", season: "2026/27", playerId: "p1" },
      });
    });

    expect(transfersApiMock.create).toHaveBeenCalledWith("save-1", expect.objectContaining({ playerId: "p1" }));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        ["transfers", "save-1"],
        ["players", "save-1"],
        ["saves"],
        ["saves", "save-1"],
      ]),
    );

    // res.save is merged into the cached save (the budget footgun guard).
    expect(client.getQueryData(["saves", "save-1"])).toEqual({ id: "save-1", budget: 50 });
  });
});

describe("useDeleteTransfer", () => {
  it("calls the API and refreshes transfers + saves on success", async () => {
    transfersApiMock.delete.mockResolvedValue(undefined);

    const { client, Wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteTransfer(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ saveId: "save-1", transferId: "t1" });
    });

    expect(transfersApiMock.delete).toHaveBeenCalledWith("save-1", "t1");

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([["transfers", "save-1"], ["saves"], ["saves", "save-1"]]),
    );
  });
});
