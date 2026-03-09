import { describe, it, expect } from "vitest";
import {
  orderConfirmationEmail,
  orderStatusEmail,
  reservationConfirmationEmail,
  getSiteName,
} from "../../lib/email.js";

describe("Email Templates", () => {
  describe("orderConfirmationEmail", () => {
    it("generates correct subject", () => {
      const result = orderConfirmationEmail({
        orderNumber: "KA-123",
        orderType: "DELIVERY",
        total: 29.99,
        items: [{ name: "Pizza", quantity: 2, subtotal: 29.98 }],
      });
      expect(result.subject).toBe("Order Confirmed - #KA-123");
    });

    it("includes order number in html", () => {
      const result = orderConfirmationEmail({
        orderNumber: "KA-456",
        orderType: "PICKUP",
        total: 15.0,
        items: [{ name: "Burger", quantity: 1, subtotal: 15.0 }],
      });
      expect(result.html).toContain("KA-456");
      expect(result.html).toContain("PICKUP");
      expect(result.html).toContain("$15.00");
    });

    it("includes item details", () => {
      const result = orderConfirmationEmail({
        orderNumber: "KA-789",
        orderType: "DELIVERY",
        total: 45.0,
        items: [
          { name: "Pizza", quantity: 2, subtotal: 30.0 },
          { name: "Salad", quantity: 1, subtotal: 15.0 },
        ],
      });
      expect(result.html).toContain("2x Pizza");
      expect(result.html).toContain("1x Salad");
    });
  });

  describe("orderStatusEmail", () => {
    it("generates correct subject", () => {
      const result = orderStatusEmail({
        orderNumber: "KA-123",
        status: "PREPARING",
      });
      expect(result.subject).toBe("Order #KA-123 - PREPARING");
    });

    it("includes status message", () => {
      const result = orderStatusEmail({
        orderNumber: "KA-123",
        status: "OUT_FOR_DELIVERY",
      });
      expect(result.html).toContain("OUT FOR DELIVERY");
      expect(result.html).toContain("on its way");
    });

    it("handles cancelled status", () => {
      const result = orderStatusEmail({
        orderNumber: "KA-123",
        status: "CANCELLED",
      });
      expect(result.html).toContain("cancelled");
    });
  });

  describe("reservationConfirmationEmail", () => {
    it("generates correct subject", () => {
      const result = reservationConfirmationEmail({
        date: "2026-03-15",
        time: "19:00",
        partySize: 4,
        locationName: "Downtown Kitchen",
      });
      expect(result.subject).toBe("Reservation Confirmed - Downtown Kitchen");
    });

    it("includes reservation details", () => {
      const result = reservationConfirmationEmail({
        date: "2026-03-15",
        time: "19:00",
        partySize: 4,
        locationName: "Downtown Kitchen",
      });
      expect(result.html).toContain("2026-03-15");
      expect(result.html).toContain("19:00");
      expect(result.html).toContain("4 guests");
      expect(result.html).toContain("Downtown Kitchen");
    });
  });
});

describe("getSiteName", () => {
  it("fetches the siteName from the database and kithenasty if not configured", async () => {
    expect(await getSiteName("nameNotInDB")).toBe("KitchenAsty");
  });
});
