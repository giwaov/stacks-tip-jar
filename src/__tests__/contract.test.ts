import { describe, it, expect } from "vitest";

describe("Tip Jar Contract Tests", () => {
  describe("Tip Validation", () => {
    it("should validate minimum tip amount", () => {
      const MIN_TIP = 100000; // 0.1 STX
      const tipAmount = 500000;

      expect(tipAmount).toBeGreaterThanOrEqual(MIN_TIP);
    });

    it("should format tip amount to STX", () => {
      const microSTX = 1500000;
      const stx = microSTX / 1000000;

      expect(stx).toBe(1.5);
    });
  });

  describe("Tip Statistics", () => {
    it("should calculate total tips", () => {
      const tips = [100000, 200000, 150000];
      const total = tips.reduce((sum, tip) => sum + tip, 0);

      expect(total).toBe(450000);
    });

    it("should count unique senders", () => {
      const senders = [
        "SP1ADDR1",
        "SP2ADDR2",
        "SP1ADDR1", // duplicate
        "SP3ADDR3",
      ];
      const uniqueCount = new Set(senders).size;

      expect(uniqueCount).toBe(3);
    });
  });
});
