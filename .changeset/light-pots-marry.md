---
"@api-zero/core": patch
"@api-zero/react": patch
"@api-zero/zod": patch
---

Document the public error and provider surfaces with JSDoc: every field of
`ApiError`, the `ApiProviderProps` props, and the `ZodValidationError` members.
Editors now show a description on hover where they showed a bare type, and the
generated API reference no longer has empty rows.
