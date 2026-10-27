## PayU Europe Integration

When implementing or modifying PayU payment functionality:

- Use the official PayU Europe documentation: https://developers.payu.com/europe/docs/get-started/
- Use the PayU Europe REST API v2.1, not PayU India APIs or the legacy Classic API.
- Consult `docs/payu-api-ref.yaml` for endpoint definitions, request schemas, response schemas, and authentication details.
- Verify API endpoints, required headers, payloads, and response formats against the official documentation.
- Use the PayU sandbox for testing.
- Never hardcode merchant credentials, client secrets, or access tokens. Load secrets from environment variables or the project's existing secret-management mechanism.
- Reuse the project's existing architecture and coding conventions.
- If the documentation and the local OpenAPI specification differ, flag the discrepancy rather than guessing.