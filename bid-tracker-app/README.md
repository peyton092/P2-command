# P2 Bid Tracker — Web App

A real, mobile-first web app for your bid pipeline: **Lead → Pricing → Priced → Made → Sent → Followed Up → Won / Lost / No-Bid.**
Your whole team logs in from their phone, adds bids, moves them through stages, and sees which follow-ups are overdue.

- **Database:** Firebase Firestore (real-time — everyone sees the same data instantly)
- **Login:** Firebase Authentication (email + password per team member)
- **Hosting:** Firebase Hosting (free, gives you a live `https://…web.app` URL)
- **No build step, no servers to manage.** It's plain HTML/CSS/JS.

---

## What you get

| Screen | What it does |
|--------|--------------|
| **Login** | Each team member signs in with their own email/password |
| **Snapshot** | Open bids, $ in pipeline, $ sent & awaiting, follow-ups due today, hit %, wins |
| **Board** | Bids grouped by stage as tappable cards; overdue follow-ups turn red |
| **New / Edit** | Add a bid or tap any card to update stage, dates, $, estimator, notes |
| **Won/Lost** | Picking Won/Lost/No-Bid reveals a reason + converted Job # field |

Each new bid gets an auto number (BID-001, BID-002, …). Bid numbers, follow-up logic, and reason codes mirror the documents in `../10-estimating-bid-pipeline/`.

---

## One-time setup (about 15 minutes)

You only do this once. After that, updating the app is a single command.

### 1. Create a Firebase project
1. Go to **https://console.firebase.google.com** and sign in with a Google account.
2. Click **Add project** → name it `p2-bid-tracker` → accept defaults (you can skip Google Analytics).

### 2. Turn on Authentication (team logins)
1. In the left menu: **Build → Authentication → Get started**.
2. Click **Email/Password**, toggle it **Enabled**, and **Save**.
3. Go to the **Users** tab → **Add user** → create one for each team member
   (e.g. `peyton@p2electricalcontracting.com` + a password). They sign in with these.

### 3. Turn on the database
1. Left menu: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (our security rules handle access) → pick the closest location → **Enable**.

### 4. Connect the app to your project
1. In Firebase, click the **gear icon → Project settings**.
2. Scroll to **Your apps** → click the **web icon `</>`** → register an app named "Bid Tracker".
3. Firebase shows a `firebaseConfig = { … }` block. **Copy those 6 values.**
4. Open **`public/firebase-config.js`** in this folder and paste your values in.
5. Open **`.firebaserc`** and replace `YOUR_PROJECT_ID` with your real Project ID
   (shown in Project settings, e.g. `p2-bid-tracker`).

### 5. Install the Firebase tool & deploy
On your computer (Mac or Windows), open a terminal in this `bid-tracker-app` folder and run:

```bash
# Install the Firebase command-line tool (one time)
npm install -g firebase-tools

# Sign in to the same Google account
firebase login

# Push the app live
firebase deploy
```

When it finishes it prints a **Hosting URL** like:

```
https://p2-bid-tracker.web.app
```

**That's your app.** Open it on any phone or computer, sign in with a user you created in step 2, and start tracking bids.

> Don't have Node/npm? Install it once from **https://nodejs.org** (the "LTS" button), then the commands above will work.

---

## Daily use

- **Add a bid:** tap **+ New Bid**, fill in project, GC, $, stage → Save.
- **Move a stage:** tap a card → change **Stage** → Save. (Won/Lost reveals a reason + Job # field.)
- **Follow-ups:** set a **Next Follow-Up** date on every bid you send. If it's past due, the card turns **red** and shows in the "Follow-ups due" count — work those first.
- **Add a teammate later:** Firebase console → Authentication → Users → Add user. No redeploy needed.

## Updating the app later
Make changes, then from this folder run `firebase deploy` again. Live in ~30 seconds.

---

## Put it on the home screen (acts like a real app)
On a phone, open the URL in the browser, then:
- **iPhone (Safari):** Share → **Add to Home Screen**.
- **Android (Chrome):** ⋮ menu → **Add to Home screen**.

---

## Files in this folder
```
bid-tracker-app/
├─ public/
│  ├─ index.html          # screens & layout
│  ├─ styles.css          # mobile-first styling
│  ├─ app.js              # all the logic (auth + Firestore + UI)
│  └─ firebase-config.js  # <- paste YOUR Firebase keys here
├─ firebase.json          # hosting + Firestore config
├─ firestore.rules        # security: only signed-in team members
├─ firestore.indexes.json
├─ .firebaserc            # <- put YOUR project ID here
└─ README.md              # this file
```

## Security note
The included `firestore.rules` only let **signed-in** users read or write bids, and `firebase deploy` publishes them. The keys in `firebase-config.js` are *meant* to be public (that's how all Firebase web apps work) — your data is protected by the login + rules, not by hiding those keys.
