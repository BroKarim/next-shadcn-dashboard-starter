# Clerk Setup Guide

This project uses Clerk for authentication only: one institution, one tenant. **Clerk Organizations and Clerk Billing are not used** — access levels are application roles (`user`, `admin`), see `docs/nav-rbac.md`.

## 1. Get API keys

Fastest path (keyless mode, no account needed):

```bash
npx clerk@latest init
```

It provisions a development instance and writes the keys to `.env.local`. To use your own instance, copy the keys from <https://dashboard.clerk.com> into `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

## 2. Redirect URLs

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard/overview"
```

- The `*_FALLBACK_REDIRECT_URL` values send users back to the page they originally requested; swap to `*_FORCE_REDIRECT_URL` to always land on a fixed page.
- `/dashboard` is protected in `src/app/dashboard/layout.tsx` with `await auth.protect()`.

## 3. Signup name fields

In the Clerk Dashboard, open User & authentication settings and enable First
name and Last name for sign-up. Mark both fields as required. The prebuilt
`<SignUp />` component renders those fields from the instance configuration;
after signup, the application stores them in `users.first_name`,
`users.last_name`, and the compatibility `users.name` display field.

## 4. Application roles

Roles are stored in the local `users.role` column and are the application's source of truth (D15); Clerk only provides identity. Admins change them on the `/dashboard/access` page.

| Value    | Access                          |
| -------- | ------------------------------- |
| `user`   | Read all data + write comments (default) |
| `admin`  | Full access, user & role management |

Set it in the Clerk Dashboard under **Users → (user) → Metadata → Public**, e.g.:

```json
{ "role": "admin" }
```

The client reads the role for navigation visibility (`src/hooks/use-nav.ts`); server actions must re-check it.

## 5. Webhooks (optional)

Set `WEBHOOK_SECRET` in `.env.local` when you add a webhook endpoint (for example to mirror user changes into the app store). Create the endpoint in the Clerk Dashboard under **Configure → Webhooks**.

## Reference

- [Clerk Next.js SDK](https://clerk.com/docs/references/nextjs)
- [Clerk metadata](https://clerk.com/docs/users/metadata)
- [Navigation access control](./nav-rbac.md)
