# FurniVision Firebase setup

The storefront runs in demo mode until a Firebase web app is connected. Demo
mode keeps browsing, the visualizer, wishlist, saved rooms, bag, and order
confirmation usable without pretending that a payment was collected.

## 1. Create the Firebase services

In Firebase Console:

1. Create a project and register a Web app.
2. Enable Email/Password and Google under Authentication.
3. Create a Firestore database.
4. Enable Storage.
5. Deploy the repository rules:

```bash
firebase deploy --only firestore:rules,storage
```

## 2. Add the web configuration

Copy `.env.example` to the FurniVision environment and fill in the Web app
configuration values. In Replit, add them as environment variables rather
than committing a `.env` file:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

The app initializes Firebase only when all six values are present.

## 3. Admin ownership and security model

- Sign in with the verified `furnivisionsupport@gmail.com` account, then open `/admin`.
- The app only grants admin access to that verified email. Other customer accounts cannot claim or manage the storefront.
- The verified owner is recorded at `adminConfig/primary`; the owner can claim or recover that record, and it cannot be deleted from the public app.
- Regular signed-in users can read and write only their own `users/{uid}/...` data.
- Review creation and edits are scoped to the signed-in review owner.
- Room uploads are scoped to the owner, limited to images under 10 MB.

Customer sign-in and Google sign-in do not grant admin access by themselves.
If the rules have not been published to Firebase, the owner record may not be
read or claimed. A Render website build does not publish Firestore rules. Deploy
the rules separately with:

`firebase deploy --only firestore:rules,storage`

The admin panel manages products and stock, order status and delivery proof,
homepage copy and imagery, store contact details, delivery windows, and
delivery/returns policies.

## 4. Direct admin order and delivery workflow

Orders are managed directly by the storefront owner from /admin. There are no worker accounts or assignment steps.

Use the **Orders** panel to search orders, filter by status, and move each order through:

- New
- Confirmed
- Preparing
- Ready for delivery
- Out for delivery
- Delivered
- Issue or Cancelled

Status changes are recorded in the order activity timeline. The admin can also upload an optional delivery proof photo and add completion notes from the same order card.

Only the verified store-owner account can manage products, orders, homepage content, and delivery proof uploads.
