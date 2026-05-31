// ============================================================
//  P2 Bid Tracker — app logic
//  Firebase (Auth + Firestore) + vanilla JS. No build step.
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ---- Pipeline definition ----
const STAGES = ["Lead", "Pricing", "Priced", "Made", "Sent", "Followed Up", "Won", "Lost", "No-Bid"];
const OUTCOME_STAGES = ["Won", "Lost", "No-Bid"];
const OPEN_STAGES = ["Lead", "Pricing", "Priced", "Made", "Sent", "Followed Up"];

// ---- Init Firebase ----
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const bidsCol = collection(db, "bids");

// ---- DOM helpers ----
const $ = (id) => document.getElementById(id);
const fmtMoney = (n) => (n || n === 0)
  ? "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
  : "—";
const todayStr = () => new Date().toISOString().slice(0, 10);

let BIDS = [];          // live cache of all bids
let unsub = null;       // firestore listener

// ============================================================
//  Auth
// ============================================================
onAuthStateChanged(auth, (user) => {
  $("loading").classList.add("hidden");
  if (user) {
    $("login-screen").classList.add("hidden");
    $("app-screen").classList.remove("hidden");
    $("user-label").textContent = user.email;
    startListening();
  } else {
    $("app-screen").classList.add("hidden");
    $("login-screen").classList.remove("hidden");
    if (unsub) { unsub(); unsub = null; }
  }
});

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("login-error");
  err.classList.add("hidden");
  try {
    await signInWithEmailAndPassword(auth, $("login-email").value.trim(), $("login-password").value);
  } catch (ex) {
    err.textContent = friendlyAuthError(ex.code);
    err.classList.remove("hidden");
  }
});

$("logout-btn").addEventListener("click", () => signOut(auth));

function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-email": return "That email doesn't look right.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Wrong email or password.";
    case "auth/too-many-requests": return "Too many tries. Wait a minute and retry.";
    case "auth/network-request-failed": return "No connection. Check your internet.";
    default: return "Couldn't sign in. Check your config and try again.";
  }
}

// ============================================================
//  Live data
// ============================================================
function startListening() {
  if (unsub) return;
  const q = query(bidsCol, orderBy("updatedAt", "desc"));
  unsub = onSnapshot(q, (snap) => {
    BIDS = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => {
    console.error(err);
    alert("Couldn't load bids. Make sure Firestore is enabled and rules allow signed-in users.");
  });
}

// ============================================================
//  Rendering
// ============================================================
function render() {
  renderStageFilter();
  renderStats();
  renderBoard();
}

function isOverdue(b) {
  return OPEN_STAGES.includes(b.stage) && b.nextFollowup && b.nextFollowup < todayStr();
}

function renderStats() {
  const open = BIDS.filter((b) => OPEN_STAGES.includes(b.stage));
  const pipelineTotal = open.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const sentAwaiting = BIDS
    .filter((b) => b.stage === "Sent" || b.stage === "Followed Up")
    .reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const overdue = BIDS.filter(isOverdue).length;
  const won = BIDS.filter((b) => b.stage === "Won").length;
  const lost = BIDS.filter((b) => b.stage === "Lost").length;
  const hitRate = (won + lost) ? Math.round((won / (won + lost)) * 100) : null;

  const stats = [
    { num: open.length, lbl: "Open bids" },
    { num: fmtMoney(pipelineTotal), lbl: "In pipeline" },
    { num: fmtMoney(sentAwaiting), lbl: "Sent · awaiting" },
    { num: overdue, lbl: "Follow-ups due", alert: overdue > 0 },
    { num: hitRate === null ? "—" : hitRate + "%", lbl: "Hit rate" },
    { num: won, lbl: "Won" },
  ];
  $("stats").innerHTML = stats.map((s) =>
    `<div class="stat${s.alert ? " alert" : ""}"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`
  ).join("");
}

function renderStageFilter() {
  const sel = $("stage-filter");
  if (sel.options.length > 1) return; // build once
  STAGES.forEach((s) => {
    const o = document.createElement("option");
    o.value = s; o.textContent = s;
    sel.appendChild(o);
  });
}

function renderBoard() {
  const term = $("search").value.trim().toLowerCase();
  const stageFilter = $("stage-filter").value;

  let list = BIDS.filter((b) => {
    if (stageFilter && b.stage !== stageFilter) return false;
    if (!term) return true;
    return [b.project, b.gc, b.estimator, b.bidNumber, b.notes]
      .filter(Boolean).join(" ").toLowerCase().includes(term);
  });

  const board = $("board");
  board.innerHTML = "";
  $("empty-state").classList.toggle("hidden", BIDS.length !== 0);

  const stagesToShow = stageFilter ? [stageFilter] : STAGES;
  stagesToShow.forEach((stage) => {
    const items = list.filter((b) => b.stage === stage);
    if (items.length === 0) return;
    const group = document.createElement("div");
    group.className = "stage-group";
    group.innerHTML =
      `<div class="stage-header">${stage}<span class="count">${items.length}</span></div>
       <div class="cards"></div>`;
    const cards = group.querySelector(".cards");
    items.forEach((b) => cards.appendChild(cardEl(b)));
    board.appendChild(group);
  });
}

function cardEl(b) {
  const el = document.createElement("div");
  const overdue = isOverdue(b);
  let cls = "card";
  if (b.stage === "Won") cls += " won";
  else if (b.stage === "Lost" || b.stage === "No-Bid") cls += " lost";
  else if (overdue) cls += " overdue";
  el.className = cls;

  const chips = [];
  if (b.bidNumber) chips.push(`<span class="chip bid-id">${b.bidNumber}</span>`);
  if (b.type) chips.push(`<span class="chip">${b.type}</span>`);
  if (b.due) chips.push(`<span class="chip due">Due ${shortDate(b.due)}</span>`);
  if (b.nextFollowup && OPEN_STAGES.includes(b.stage)) {
    chips.push(`<span class="chip followup${overdue ? " overdue" : ""}">Follow-up ${shortDate(b.nextFollowup)}</span>`);
  }
  if (b.convertedJob) chips.push(`<span class="chip">${b.convertedJob}</span>`);

  el.innerHTML =
    `<div class="card-top">
       <span class="card-title">${escapeHtml(b.project || "Untitled")}</span>
       <span class="card-amount">${fmtMoney(b.amount)}</span>
     </div>
     <div class="card-sub">${escapeHtml(b.gc || "—")}${b.estimator ? " · " + escapeHtml(b.estimator) : ""}</div>
     <div class="card-meta">${chips.join("")}</div>`;
  el.addEventListener("click", () => openModal(b));
  return el;
}

function shortDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${Number(m)}/${Number(day)}`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ============================================================
//  Modal / editor
// ============================================================
const modal = $("modal");

function buildStageSelect() {
  const sel = $("f-stage");
  if (sel.options.length) return;
  STAGES.forEach((s) => {
    const o = document.createElement("option");
    o.value = s; o.textContent = s;
    sel.appendChild(o);
  });
}

function nextBidNumber() {
  const nums = BIDS
    .map((b) => (b.bidNumber || "").match(/BID-(\d+)/))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "BID-" + String(next).padStart(3, "0");
}

function openModal(bid) {
  buildStageSelect();
  const isNew = !bid;
  $("modal-title").textContent = isNew ? "New Bid" : (bid.bidNumber ? bid.bidNumber + " · Edit" : "Edit Bid");
  $("f-id").value = isNew ? "" : bid.id;
  $("f-project").value = bid?.project || "";
  $("f-gc").value = bid?.gc || "";
  $("f-type").value = bid?.type || "Commercial";
  $("f-amount").value = bid?.amount ?? "";
  $("f-stage").value = bid?.stage || "Lead";
  $("f-estimator").value = bid?.estimator || "";
  $("f-due").value = bid?.due || "";
  $("f-next").value = bid?.nextFollowup || "";
  $("f-reason").value = bid?.reason || "";
  $("f-job").value = bid?.convertedJob || "";
  $("f-notes").value = bid?.notes || "";
  $("delete-btn").classList.toggle("hidden", isNew);
  toggleOutcomeFields();
  modal.classList.remove("hidden");
  $("f-project").focus();
}

function closeModal() { modal.classList.add("hidden"); }

function toggleOutcomeFields() {
  const show = OUTCOME_STAGES.includes($("f-stage").value);
  $("outcome-fields").classList.toggle("hidden", !show);
}

$("add-btn").addEventListener("click", () => openModal(null));
$("modal-close").addEventListener("click", closeModal);
$("cancel-btn").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
$("f-stage").addEventListener("change", toggleOutcomeFields);
$("search").addEventListener("input", renderBoard);
$("stage-filter").addEventListener("change", renderBoard);

$("bid-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("f-id").value;
  const stage = $("f-stage").value;
  const amountRaw = $("f-amount").value;

  const data = {
    project: $("f-project").value.trim(),
    gc: $("f-gc").value.trim(),
    type: $("f-type").value,
    amount: amountRaw === "" ? null : Number(amountRaw),
    stage,
    estimator: $("f-estimator").value.trim(),
    due: $("f-due").value || null,
    nextFollowup: $("f-next").value || null,
    reason: OUTCOME_STAGES.includes(stage) ? ($("f-reason").value || null) : null,
    convertedJob: OUTCOME_STAGES.includes(stage) ? ($("f-job").value.trim() || null) : null,
    notes: $("f-notes").value.trim(),
    updatedAt: serverTimestamp(),
  };

  try {
    if (id) {
      await updateDoc(doc(db, "bids", id), data);
    } else {
      data.bidNumber = nextBidNumber();
      data.createdAt = serverTimestamp();
      await addDoc(bidsCol, data);
    }
    closeModal();
  } catch (ex) {
    console.error(ex);
    alert("Couldn't save. Check your connection and try again.");
  }
});

$("delete-btn").addEventListener("click", async () => {
  const id = $("f-id").value;
  if (!id) return;
  if (!confirm("Delete this bid? This can't be undone.")) return;
  try {
    await deleteDoc(doc(db, "bids", id));
    closeModal();
  } catch (ex) {
    console.error(ex);
    alert("Couldn't delete. Try again.");
  }
});
