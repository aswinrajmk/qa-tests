import { expect, mergeTests } from "@playwright/test";
import { test as apiFixtures } from "./api.fixture.ts";
import { test as authFixtures } from "./auth.fixture.ts";
import { test as observability } from "./observability.fixture.ts";

/** For UI specs: page objects, signed-in state, log capture and failure screenshots. */
export const test = mergeTests(authFixtures, observability);

/** For API specs: endpoint clients only. No browser is started. */
export const apiTest = apiFixtures;

export { expect };
