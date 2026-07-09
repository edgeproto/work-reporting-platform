import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Role, Visibility } from "@/app/generated/prisma/enums";
import {
  canManageUsers,
  isAdmin,
  isManager,
  isManagerOrAbove,
} from "@/lib/rbac";
import { canViewPrivate, visibilityWhereForViewer } from "@/lib/visibility";

const roles = [Role.ADMIN, Role.MANAGER, Role.MEMBER] as const;

describe("isAdmin", () => {
  for (const role of roles) {
    it(`${role} admin check`, () => {
      assert.equal(isAdmin({ role }), role === Role.ADMIN);
    });
  }
});

describe("isManager", () => {
  for (const role of roles) {
    it(`${role} manager check`, () => {
      assert.equal(isManager({ role }), role === Role.MANAGER);
    });
  }
});

describe("isManagerOrAbove", () => {
  for (const role of roles) {
    it(`${role} manager-or-above check`, () => {
      const expected = role === Role.ADMIN || role === Role.MANAGER;
      assert.equal(isManagerOrAbove({ role }), expected);
    });
  }
});

describe("canManageUsers", () => {
  for (const role of roles) {
    it(`${role} can manage users`, () => {
      assert.equal(canManageUsers({ role }), role === Role.ADMIN);
    });
  }
});

describe("canViewPrivate", () => {
  const ownerId = "user-owner";
  const otherId = "user-other";

  for (const role of roles) {
    it(`owner (${role}) can view own private`, () => {
      assert.equal(
        canViewPrivate({ role }, ownerId, ownerId),
        true,
      );
    });

    it(`${role} viewing other's private`, () => {
      const expected = role === Role.ADMIN || role === Role.MANAGER;
      assert.equal(
        canViewPrivate({ role }, ownerId, otherId),
        expected,
      );
    });
  }
});

describe("visibilityWhereForViewer", () => {
  const ownerId = "owner";
  const memberViewer = { role: Role.MEMBER };
  const managerViewer = { role: Role.MANAGER };

  it("member viewing other restricts to PUBLIC", () => {
    assert.deepEqual(
      visibilityWhereForViewer(memberViewer, ownerId, "other"),
      { visibility: Visibility.PUBLIC },
    );
  });

  it("owner sees all visibilities", () => {
    assert.deepEqual(
      visibilityWhereForViewer(memberViewer, ownerId, ownerId),
      {},
    );
  });

  it("manager viewing other sees all", () => {
    assert.deepEqual(
      visibilityWhereForViewer(managerViewer, ownerId, "other"),
      {},
    );
  });

  it("member cannot filter PRIVATE for others", () => {
    assert.deepEqual(
      visibilityWhereForViewer(
        memberViewer,
        ownerId,
        "other",
        Visibility.PRIVATE,
      ),
      { visibility: Visibility.PUBLIC },
    );
  });

  it("manager can filter PRIVATE for others", () => {
    assert.deepEqual(
      visibilityWhereForViewer(
        managerViewer,
        ownerId,
        "other",
        Visibility.PRIVATE,
      ),
      { visibility: Visibility.PRIVATE },
    );
  });

  for (const filter of [Visibility.PUBLIC, Visibility.PRIVATE] as const) {
    it(`owner filter ${filter} passes through`, () => {
      assert.deepEqual(
        visibilityWhereForViewer(memberViewer, ownerId, ownerId, filter),
        { visibility: filter },
      );
    });
  }
});
