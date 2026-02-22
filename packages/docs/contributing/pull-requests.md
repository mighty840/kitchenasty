# 🔀 Pull Requests

## 🌿 Branch Naming

Use descriptive branch names with a prefix:

| Prefix | Use |
|--------|-----|
| 🆕 `feat/` | New feature |
| 🐛 `fix/` | Bug fix |
| 📝 `docs/` | Documentation changes |
| ♻️ `refactor/` | Code refactoring |
| 🧪 `test/` | Adding or updating tests |
| 🔧 `chore/` | Maintenance, dependency updates |

Examples: `feat/table-reservations`, `fix/order-total-calculation`, `docs/api-reference`

## 📝 Conventional Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
feat: add table reservation system
fix: correct order total calculation with coupons
docs: add API reference for loyalty endpoints
refactor: extract payment processing into service
test: add integration tests for coupon validation
chore: update Prisma to v5.22
```

Include a scope when helpful:

```
feat(reservations): add availability check endpoint
fix(payments): handle Stripe webhook signature verification
```

## ✅ PR Checklist

Before submitting a pull request, ensure:

- [ ] 🔨 Code compiles (`npx tsc --noEmit`)
- [ ] 🧩 Unit tests pass (`npm run test:unit`)
- [ ] 🔗 Integration tests pass (`npm run test:integration`)
- [ ] 🧪 New features have tests
- [ ] 📚 API changes are documented
- [ ] 🚫 No `console.log` statements left in
- [ ] 📋 Environment variables are documented in `.env.example`

## 👀 Review Process

1. 📤 Open a PR against `main`
2. 🤖 CI pipeline runs automatically
3. ✅ At least one approval is required
4. 🟢 All CI checks must pass
5. 🔀 Merge with squash or rebase (keep a clean history)

## 📄 What to Include in a PR Description

- 📌 **What** — Brief description of the change
- 💡 **Why** — Motivation or issue being solved
- 🔧 **How** — Key implementation decisions
- 🧪 **Testing** — How the change was tested
- 📸 **Screenshots** — For UI changes

## 🔀 Squash Merge Convention

We use **squash merges** to keep `main` history clean. Because of this:

- 📝 **PR title must be a conventional commit** — It becomes the squash commit message (e.g., `feat: add table reservation system`)
- 📋 **PR description becomes the commit body** — Write it as a meaningful commit description, not just a review checklist
- 🏷️ Include a scope in the title when helpful (e.g., `fix(payments): handle webhook retries`)

Example PR title and body that produce a clean squash commit:

```
Title: feat(reservations): add availability check with party size validation

Body:
Add real-time table availability checking that considers party size,
existing reservations, and restaurant hours. Includes admin UI for
managing table configurations per location.

- Add GET /api/reservations/availability endpoint
- Add table management UI in admin panel
- Add integration tests for availability logic
```
