# NAZARYA E-Commerce — Full Stack

A GitHub Pages-compatible storefront plus a Supabase backend and protected admin dashboard.

## Included
- Storefront closely matching the supplied NAZARYA design
- Responsive mobile/desktop layout
- Product catalog loaded from database
- Cart + checkout
- Cash on Delivery orders
- Newsletter signup
- Admin authentication
- Admin dashboard overview
- Product create/edit/delete + stock + image upload
- Order list + status changes
- Homepage content editor
- Newsletter subscriber list
- Supabase RLS security policies

## 1) Upload this project to GitHub
Upload the **contents** of this folder to the root of your GitHub repository. Do not upload only the ZIP.

Your repository root should show:
- `index.html`
- `admin.html`
- `assets/`
- `supabase/`
- `manifest.webmanifest`

GitHub Pages settings:
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/(root)`

## 2) Create a Supabase project
Create a Supabase project. In Supabase Dashboard open **SQL Editor**, paste everything from:

`supabase/schema.sql`

Run it once.

## 3) Add your admin email
In Supabase SQL Editor run this separately, replacing the email:

```sql
insert into public.admins(email)
values ('YOUR-EMAIL@example.com')
on conflict do nothing;
```

## 4) Connect the website to Supabase
In Supabase Dashboard go to **Project Settings > API** and copy:
- Project URL
- anon / publishable key

Open `assets/config.js` and replace:

```js
export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

The browser anon/publishable key is intended for client apps. **Never put a Supabase service-role key in this website.**

## 5) Create the first admin account
Open:

`https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO/admin.html`

Enter the same email you inserted into `public.admins`, choose a password, and tap **CREATE ACCOUNT**. If email confirmation is enabled in Supabase, confirm the email. Then sign in.

## 6) Admin controls
From `admin.html` you can:
- Add/edit/delete products
- Upload product images
- Change price and stock
- Activate/deactivate products
- View orders
- Change order status
- Edit homepage announcement/hero/about content
- View newsletter subscribers

## Notes
- The supplied visual was used as the design reference and image source for the included starter assets.
- GitHub Pages hosts the frontend; Supabase provides the database, authentication, storage and API.
- The storefront has fallback demo products so it still renders before Supabase is connected. Checkout/admin require Supabase.
