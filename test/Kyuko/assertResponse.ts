import { DeployWorker } from "../../dev_deps.ts";

/**
 * Calls the supplied `asserts` function.
 * Calls `script.close()` regardless of assertion result.
 * **MUST** `await` this function when called.
 */
export async function assertResponse(
  script: DeployWorker,
  asserts: () => Promise<void> | void,
) {
  try {
    await asserts();
  } catch (err) {
    throw err;
  } finally {
    await script.close();
  }
}
