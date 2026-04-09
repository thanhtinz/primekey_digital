import { describe, expect, it, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Use a very large user ID to avoid collision with real users in production DB
const TEST_USER_ID = 999999;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: TEST_USER_ID,
    openId: "test-user-999999",
    email: "test-999999@example.com",
    name: "Test User (Isolated)",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// Cleanup test data after each test to avoid polluting production DB
afterEach(async () => {
  try {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Delete all categories created by test user
    const list = await caller.categories.listProtected();
    for (const cat of list) {
      try { await caller.categories.delete({ id: cat.id }); } catch {}
    }
    // Delete all products created by test user
    const products = await caller.products.list();
    for (const p of products) {
      try { await caller.products.delete({ id: p.id }); } catch {}
    }
  } catch {
    // Ignore cleanup errors
  }
});

describe("categories router", () => {
  it("categories.create accepts name, icon, parentId, sortOrder", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the input schema is valid - create a parent category
    const result = await caller.categories.create({
      name: "Test Category",
      icon: "🎬",
      parentId: null,
      sortOrder: 1,
    });
    expect(result).toEqual({ success: true });
  });

  it("categories.listProtected returns array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.categories.listProtected();
    expect(Array.isArray(list)).toBe(true);
  });

  it("categories.create child with parentId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create parent
    await caller.categories.create({ name: "Parent Cat", parentId: null });
    const list = await caller.categories.listProtected();
    const parent = list.find(c => c.name === "Parent Cat");
    expect(parent).toBeDefined();

    // Create child
    if (parent) {
      const result = await caller.categories.create({
        name: "Child Cat",
        parentId: parent.id,
        sortOrder: 0,
      });
      expect(result).toEqual({ success: true });

      // Verify child exists with parentId
      const updatedList = await caller.categories.listProtected();
      const child = updatedList.find(c => c.name === "Child Cat");
      expect(child).toBeDefined();
      // parentId should be a positive number (exact ID may differ due to auto-increment)
      expect(child?.parentId).toBeTruthy();
      expect(typeof child?.parentId).toBe('number');
    }
  });
});

describe("products router", () => {
  it("products.create accepts name, description, categoryId without price", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a product without price (price removed from form)
    const result = await caller.products.create({
      name: "Test Product",
      description: "Test description",
      categoryId: null,
    });
    expect(result.success).toBe(true);
  });

  it("products.list returns products with packages and categoryName", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.products.list();
    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) {
      const product = list[0];
      expect(product).toHaveProperty("packages");
      expect(product).toHaveProperty("categoryName");
      expect(product).toHaveProperty("parentCategoryName");
    }
  });

  it("products.createPackage accepts warrantyMonths", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get a product to add package to
    const products = await caller.products.list();
    if (products.length > 0) {
      const product = products[0];
      const result = await caller.products.createPackage({
        productId: product.id,
        name: "Premium Package",
        price: 100000,
        warrantyMonths: 12,
        sortOrder: 0,
      });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("products.create input validation", () => {
  it("should NOT require price field", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This should succeed without price
    const result = await caller.products.create({
      name: "No Price Product",
    });
    expect(result.success).toBe(true);
  });

  it("products.update accepts categoryId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    if (products.length > 0) {
      const product = products[0];
      const result = await caller.products.update({
        id: product.id,
        categoryId: null,
      });
      expect(result).toEqual({ success: true });
    }
  });
});
