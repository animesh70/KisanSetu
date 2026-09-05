# KisanSetu — updated project (merged with your latest base)

This package is built on the newer version of your app you last uploaded
(the one with counter-offers, close/delete crop lots, farmer mode, notifications,
net-earnings calculator, hold/sell AI recommendation, etc.) — **all of that is
untouched** — with the Smart Loan and Mandi-vs-Online comparison features added
on top.

## Setup

```
cd backend
npm install
npm run dev        # http://localhost:5000

cd ../frontend
npm install
npm run dev         # http://localhost:5173
```

## What's new (additive only)

**Backend**
- `routes/loanRoutes.js`, `services/loanService.js` — Smart Loan endpoints:
  `GET /api/loans/banks`, `POST /api/loans/recommendation`,
  `POST /api/loans/apply`, `GET /api/loans`, `GET /api/loans/:id`
- `data/sampleData.js` — added `banks` (SBI, Axis Bank, Other Banks/RRB-cooperative),
  `loanApplications`, `onlineStorePrices`. Demo reset now also clears loan
  applications, alongside your existing crop lots/offers/transactions/grievances reset.
- `services/marketService.js`, `routes/marketRoutes.js` — added
  `GET /api/markets/compare` (mandi vs. online store prices, crop-wise)

**Frontend**
- New **Smart Loan** nav item + dashboard section: bank/scheme cards for SBI,
  Axis Bank and Other Banks, plus a business/crop-based recommendation callout
- `components/LoanModal.jsx` — interactive application form
- `components/LoanReceipt.jsx` — receipt with unique ID, matched bank, amount,
  applicant details, date and status, with **Print** and **Download** actions
- `components/PriceComparisonChart.jsx` — Mandi vs. Online Store bar chart,
  crop-wise, interactive hover, styled to match your existing design
- `services/api.js` — added `getPriceComparison`, `getBanks`, `applyForLoan`,
  `getLoanApplication`, using the same request/error pattern as your other calls

## What was verified

- Every backend route (existing + new) was started live and exercised with curl:
  health check, lots (including the auto-generated buyer offer on lot creation),
  offers, transactions, logistics, buyers (with distance), the loan endpoints,
  the price comparison endpoint, and demo reset (confirmed it clears loan
  applications too, without touching anything else).
- All frontend `.jsx`/`.js` files (including the new ones) were parsed with
  Babel's parser — no syntax errors.
- The actual `vite build`/`vite dev` could not be executed in this sandbox
  because the uploaded `node_modules` were installed on Windows and the
  sandbox has no network access to fetch Linux-native binaries. This is
  unrelated to the code changes and resolves itself with a normal
  `npm install` on your machine.

No existing route, component, prop, class name, or piece of state was removed
or renamed — the loan and comparison features are purely additive.
