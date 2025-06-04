Here's a breakdown of the client-side terminal output and the related API log
issues:

**Client-Side Log (`deno run ... crud-showcase.ts`) Analysis:**

1. **Successful Operations (CREATE, FindOne):**
   - The `POST /account/profile` (CREATE) works.
   - The `GET /account/profile?id=...` (FindOne via `profileOps.findOne`) works.
   - This indicates that basic interaction with the `account.profile` resource
     is fine for single-record operations.

2. **HTTP 500 on `findMany` (Client Error Point 1):**
   - **Client Output:**
     ```
     5. READ (FindMany): Fetching active profiles, ordered by username...
     ❌ An error occurred during CRUD operations: PrismError: HTTP error 500: Internal Server Error
         at BaseClient.request (...)
         ... { code: "HTTP_ERROR", status: 500, details: null, name: "PrismError" }
        Error message: HTTP error 500: Internal Server Error
     ```
   - **Corresponding API Log:**
     ```
     INFO: ... "GET /account/profile?status=active&username=showcase_user_7ne5vb&order_by=username&order_dir=asc&limit=5 HTTP/1.1" 500 Internal Server Error
     ERROR: Exception in ASGI application
     Traceback (most recent call last):
     ... (Python traceback)
     ```
   - **Explanation:**
     - Your `prism-ts` client (`profileOps.findMany`) constructed a GET request
       with query parameters for filtering (`status`, `username`), ordering
       (`order_by`, `order_dir`), and pagination (`limit`).
     - The `prism-py` server received this request but encountered an unhandled
       error internally while trying to process it (likely when building or
       executing the SQL query based on these parameters). This resulted in the
       server sending back an HTTP 500 status code.
     - `prism-ts`'s `BaseClient` correctly identified the 500 status as an error
       and threw a `PrismError`.
     - The `details: null` in the `PrismError` object suggests that `prism-py`
       did not return a JSON body with error details for this 500 error (which
       is common for unhandled exceptions; FastAPI's default 500 error page is
       HTML).
   - **`prism-ts` Focus (for now, before `prism-py` fix):**
     - The client is behaving correctly by reporting the server error.
     - For the _showcase script to proceed_ without fixing `prism-py`
       immediately, you would have to make the `findMany` call simpler, using
       only query parameters that you know `prism-py` currently handles
       correctly for the `account.profile` resource. This might mean removing
       `orderBy` and `orderDir`, or even some `where` clauses, until you find a
       combination that doesn't cause a 500.
     - **Example temporary change in `crud-showcase.ts` to bypass this for
       further client testing:**
       ```typescript
       const activeProfiles = await profileOps.findMany({
       	where: { username: `showcase_user_${uniqueSuffix}` }, // Try with just one filter
       	limit: 5,
       	// orderBy: "username", // Temporarily comment out
       	// orderDir: "asc",    // Temporarily comment out
       });
       ```

3. **Connection Error on `delete` (Client Error Point 2):**
   - **Client Output:**
     ```
     8. DELETE: Deleting profile with ID "c3fd659c-ffd5-44ba-8041-1ac71fca6ac8" (cleanup)...
     ❌ Failed to delete profile ... TypeError: error sending request ... connection error: An established connection was aborted by the software in your host machine. (os error 10053)
     ...
     Caused by Error: An established connection was aborted by the software in your host machine. (os error 10053)
     ```
   - **Corresponding API Log (shows the request _before_ the problematic GET,
     and _after_ if the server recovered):** The API log shows the `PUT` was
     successful (200 OK), then the problematic `GET` (500 Internal Server
     Error), then the `DELETE` request.
     ```
     INFO: ... "PUT /account/profile?id=... HTTP/1.1" 200 OK  // Update before the problematic GET
     INFO: ... "GET /account/profile?status=active&username=...&order_by=username&order_dir=asc&limit=5 HTTP/1.1" 500 Internal Server Error // <<< SERVER CRASH/RESTART LIKELY HERE
     INFO: ... "DELETE /account/profile?id=... HTTP/1.1" 200 OK // <<< This is interesting. Server *did* process it.
     ```
   - **Explanation:**
     - The "connection aborted" error (OS error 10053 on Windows) means that the
       TCP connection between your Deno client and the `prism-py` server was
       suddenly terminated by the server side.
     - This almost certainly happened because the 500 Internal Server Error
       during the preceding `findMany` call caused the Uvicorn worker process
       handling those requests to crash and restart.
     - When your `prism-ts` script immediately tried to send the `DELETE`
       request, the new (or restarting) server process might not have been fully
       ready, or the specific connection the client was using was severed.
     - **Intriguingly, the API log shows the `DELETE` request _eventually_
       received a `200 OK`**. This suggests:
       1. The server worker did restart quickly.
       2. Deno's `fetch` might have retried, or a new connection was established
          for the DELETE.
       3. However, the _initial_ attempt from the client's perspective within
          that `try...catch` block for the DELETE failed at the connection level
          before it could even get a response from the (potentially restarted)
          server.
   - **`prism-ts` Focus (for now):**
     - The client-side error handling for the DELETE is okay; it caught a
       low-level network error.
     - The root cause is the server instability triggered by the 500 error in
       the `findMany` call. Fixing the 500 error in `prism-py` is the real
       solution to prevent this cascade.
     - For the showcase script, if you simplify the `findMany` call to avoid the
       500 error, this DELETE error should also disappear.

**Summary of Immediate `prism-ts` Focus (for the `crud-showcase.ts` example to
run further):**

The main thing to do in `prism-ts` _right now_ (specifically within
`examples/crud-showcase-profile.ts`) to allow the script to run more completely
(while acknowledging `prism-py` needs fixes) is to **simplify the
`profileOps.findMany()` call.**

You need to find out what parameters `prism-py` _can_ handle for
`GET /account/profile` without throwing a 500.

1. **Try `findMany` with minimal parameters:**
   ```typescript
   // In examples/crud-showcase-profile.ts
   console.log(
   	"5. READ (FindMany): Fetching profiles (simplified to debug)...",
   );
   const profiles = await profileOps.findMany({
   	limit: 5,
   });
   console.log(`   ✅ Found ${profiles.length} profile(s):`);
   profiles.forEach(/* ... */);
   ```
   If this works, `prism-py`'s basic fetching for `account.profile` is okay.

2. **Then, add back `where` clauses one by one:**
   ```typescript
   const profiles = await profileOps.findMany({
   	where: { status: "active" },
   	limit: 5,
   });
   ```
   If this fails, the `status` filter is problematic on the server for this
   table/view. Then try:
   ```typescript
   const profiles = await profileOps.findMany({
   	where: { username: `showcase_user_${uniqueSuffix}` },
   	limit: 5,
   });
   ```
   If this fails, the `username` filter is problematic.

3. **Then, try adding `orderBy` (if basic filters work):**
   ```typescript
   const profiles = await profileOps.findMany({
   	// working where clause here, or none
   	limit: 5,
   	orderBy: "username",
   	orderDir: "asc",
   });
   ```
   If this fails, the `orderBy` logic in `prism-py` for `account.profile` is the
   culprit.

By doing this step-by-step simplification in the `crud-showcase.ts`, you'll
identify exactly which part of the `findMany` query parameters is triggering the
500 error in `prism-py`. You can then temporarily remove that problematic part
from the showcase script to allow the rest of the script (like UPDATE and
DELETE) to run against a stable server.
