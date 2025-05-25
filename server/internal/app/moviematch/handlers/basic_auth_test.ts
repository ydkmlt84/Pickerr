import { assert, assertEquals } from "/deps.ts";
import {
  isAuthorized,
  respondRequiringAuth,
} from "/internal/app/moviematch/handlers/basic_auth.ts";

Deno.test("basicAuth -> isAuthorized", () => {
  const req = new Request("http://localhost", {
    headers: {
      Authorization: "Basic Zm9vOmJhcg==", // foo:bar
    },
  });

  assert(isAuthorized({ userName: "foo", password: "bar" }, req));

  assert(!isAuthorized({ userName: "foo", password: "baz" }, req));
});

Deno.test("basicAuth -> respondRequiringAuth", () => {
  const response = respondRequiringAuth();

  assert(!!response);
  assertEquals(response.status, 401);
  assert(response.headers.get("WWW-Authenticate"));
});
