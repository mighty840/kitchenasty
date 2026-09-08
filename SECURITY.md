# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.3.x   | Yes       |
| 0.2.x   | Yes       |
| 0.1.x   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in KitchenAsty, please report it responsibly. **Do not open a public GitHub issue.**

### How to Report

Send an email to **sharang@meghsakha.com** with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. The potential impact
4. Any suggested fixes (optional)

### What to Expect

- **Acknowledgment** within 48 hours of your report
- **Assessment** of the vulnerability within 1 week
- **Fix and disclosure** — we aim to patch confirmed vulnerabilities promptly and will coordinate disclosure with you

### Scope

The following are in scope:

- The KitchenAsty API server (`packages/server`)
- Authentication and authorization mechanisms
- Payment processing (Stripe integration)
- Database access and data exposure
- Cross-site scripting (XSS) in admin and storefront
- SQL injection or Prisma query vulnerabilities
- File upload handling

### Out of Scope

- Vulnerabilities in third-party dependencies (report these upstream)
- Issues requiring physical access to the server
- Social engineering attacks
- Denial of service attacks

## Security Best Practices for Self-Hosters

If you are self-hosting KitchenAsty, please ensure:

- All environment variables with secrets (JWT keys, Stripe keys, database URLs) are kept secure
- HTTPS is enabled via a reverse proxy (Nginx, Caddy, etc.)
- The database is not exposed to the public internet
- Regular backups are maintained
- Dependencies are kept up to date

See the [Self-Hosting Guide](https://mighty840.github.io/kitchenasty/self-hosting/overview.html) for detailed setup instructions.
