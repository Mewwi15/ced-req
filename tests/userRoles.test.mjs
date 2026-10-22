import assert from "node:assert/strict";
import test from "node:test";
import { getRegistrationRoles } from "../src/lib/userRoles.js";

test("FTE accounts register as admins regardless of the email prefix", () => {
  assert.deepEqual(getRegistrationRoles("jiraphan.s@fte.kmutnb.ac.th"), ["admin"]);
  assert.deepEqual(getRegistrationRoles("s123@fte.kmutnb.ac.th"), ["admin"]);
});

test("both student domains register as students regardless of the prefix", () => {
  for (const email of [
    "person@kmutnb.ac.th",
    "s123@kmutnb.ac.th",
    "person@email.kmutnb.ac.th",
    "s123@email.kmutnb.ac.th",
  ]) {
    assert.deepEqual(getRegistrationRoles(email), ["student"]);
  }
});

test("FTE role matching tolerates email casing and surrounding whitespace", () => {
  assert.deepEqual(getRegistrationRoles(" PERSON@FTE.KMUTNB.AC.TH "), ["admin"]);
});

test("similar domains and invalid values never receive admin", () => {
  for (const email of [
    "person@fte.kmutnb.ac.th.evil.test",
    "person@sub.fte.kmutnb.ac.th",
    "person@fakefte.kmutnb.ac.th",
    "person@gmail.com",
    "person@other@fte.kmutnb.ac.th",
    "@fte.kmutnb.ac.th",
    "",
    null,
    undefined,
  ]) {
    assert.deepEqual(getRegistrationRoles(email), ["student"]);
  }
});
