---
"@api-zero/core": patch
---

Correct the documented default for `retry.retryMethods`. The JSDoc claimed
`['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']`, but the actual default is
`['GET', 'PUT', 'DELETE']` and `HttpMethod` accepts neither `HEAD` nor
`OPTIONS`. The README example carried the same mistake and would not have
compiled.
