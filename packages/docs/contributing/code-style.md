# 🎨 Code Style

## 📘 TypeScript

- **Strict mode** is enabled in `tsconfig.json`
- All code is written in TypeScript (`.ts` and `.tsx` files)
- No `any` types unless absolutely necessary

## 📛 Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| 📄 Files | kebab-case | `order.controller.ts` |
| 🔤 Variables & functions | camelCase | `createOrder` |
| 🏷️ Classes & types | PascalCase | `OrderStatus` |
| 🔠 Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 🗄️ Database tables | snake_case | `menu_items` (via Prisma `@@map`) |
| 🌐 API routes | kebab-case | `/api/automation-rules` |

## 🏗️ Controller Pattern

All API controllers follow the same pattern:

```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function listItems(req: Request, res: Response) {
  try {
    const items = await prisma.menuItem.findMany();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
}
```

Key patterns:

- ✅ Export named async functions (not classes)
- 🛡️ Use `try/catch` for error handling
- 📦 Return `{ success: true, data }` or `{ success: false, error }`
- 🗄️ Use Prisma client directly in controllers

## 📂 Route Organization

Routes are organized by domain in `packages/server/src/routes/`:

- 📄 One file per domain (e.g., `order.routes.ts`)
- 🔗 Routes registered in `app.ts`
- 🔧 Middleware applied per-route, not globally

## 🔄 Shared Types

Types shared between server and frontend packages live in `packages/shared/src/types/`. Import them as:

```typescript
import { OrderStatus } from '@kitchenasty/shared';
```

## ✨ Formatting

- 🛠️ Use your editor's built-in formatter or Prettier
- 📏 2-space indentation
- ✏️ Single quotes for strings
- ❗ Semicolons required
- ➡️ Trailing commas in multi-line structures
