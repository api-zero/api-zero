---
"@api-zero/core": patch
"@api-zero/zod": patch
---

Allow asynchronous `transformRequest` and `transformResponse`.

The pipeline has always awaited transforms, but their public types did not admit
a `Promise` return. That made the documented adapter pattern
`{ ...zodResponse(schema) }` fail to typecheck against a plain `ApiClient`, and
forced `@api-zero/zod` to cast internally to compensate. The types now match the
behaviour, and those casts are gone.
