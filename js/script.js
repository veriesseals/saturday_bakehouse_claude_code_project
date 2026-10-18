// ---- Edit these to update the site ----
const IG_HANDLE = "saturdaybakehouse";
const CURRENCY = "$";
const MENU = [
  { group: "Loaves", items: [
    { id: "country", name: "Country Loaf", price: 11, desc: "Our everyday sourdough. Wheat, a little rye, water, salt — 36 hours slow.", tag: ["sells", "sells out"] },
    { id: "seeded", name: "Seeded Rye", price: 12, desc: "Dense, dark and nutty with sunflower, flax and toasted pumpkin seeds.", tag: ["vegan", "vegan"] },
    { id: "olive", name: "Olive & Rosemary", price: 13, desc: "Kalamata olives and garden rosemary folded through an open crumb." },
    { id: "baguette", name: "Sourdough Baguette", price: 5, desc: "Shatter-crisp crust. Best eaten in the car on the way home." }
  ]},
  { group: "Pastries", items: [
    { id: "croissant", name: "Butter Croissant", price: 4.5, desc: "Three days, 27 layers, a lot of cultured butter.", tag: ["sells", "sells out"] },
    { id: "painchoc", name: "Pain au Chocolat", price: 5, desc: "Two batons of dark chocolate, because one is never enough." },
    { id: "cardamom", name: "Cardamom Knot", price: 5, desc: "Swedish-style, twisted by hand, rolled in cardamom sugar." },
    { id: "danish", name: "Pear & Brown Butter Danish", price: 5.5, desc: "This month’s fruit pastry. Changes with whatever’s ripe.", tag: ["new", "october"] },
    { id: "bun", name: "Morning Bun", price: 5, desc: "Croissant dough coiled with orange zest and brown sugar." }
  ]}
];

const $ = (s, el = document) => el.querySelector(s);
const money = n => CURRENCY + n.toFixed(2);
const qty = {};
const allItems = MENU.flatMap(g => g.items);
allItems.forEach(i => qty[i.id] = 0);

// Next Saturday + whether this week's list is still open (closes Thu 8pm)
function bakeInfo(now = new Date()) {
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const open = day >= 1 && (day < 4 || (day === 4 && now.getHours() < 20));
  let add = (6 - day + 7) % 7;          // days until the coming Saturday
  if (!open && day !== 0) add += 7;     // Thu night–Sat: that bake is full, so next week's
  const sat = new Date(now);
  sat.setDate(now.getDate() + add);
  return { open, sat };
}
const { open, sat } = bakeInfo();
const satLabel = sat.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
$("#bake-date").textContent = "Bake for " + satLabel;
$("#status-text").textContent = open ? "Taking orders for this Saturday" : "Orders open Monday for Saturday " + sat.toLocaleDateString(undefined, { day: "numeric", month: "short" });
if (!open) $("#ribbon").classList.add("closed");
$("#yr").textContent = new Date().getFullYear();

// Menu sheet
$("#menu-cols").innerHTML = MENU.map(g => `
  <div class="menu-group">
    <h3>${g.group}</h3>
    ${g.items.map(i => `
      <div class="item">
        <div class="item-row">
          <span class="item-name">${i.name}${i.tag ? ` <span class="tag ${i.tag[0]}">${i.tag[1]}</span>` : ""}</span>
          <span class="leader"></span>
          <span class="price">${money(i.price)}</span>
        </div>
        <p>${i.desc}</p>
      </div>`).join("")}
  </div>`).join("");

// Order pickers
$("#picks").innerHTML = MENU.map(g => `
  <fieldset>
    <legend>${g.group}</legend>
    ${g.items.map(i => `
      <div class="pick" data-id="${i.id}">
        <div><span class="nm">${i.name}</span><span class="pr">${money(i.price)}</span></div>
        <div class="step">
          <button type="button" data-d="-1" aria-label="Remove one ${i.name}">−</button>
          <output aria-live="polite" aria-label="${i.name} quantity">0</output>
          <button type="button" data-d="1" aria-label="Add one ${i.name}">+</button>
        </div>
      </div>`).join("")}
  </fieldset>`).join("");

$("#picks").addEventListener("click", e => {
  const b = e.target.closest("button[data-d]"); if (!b) return;
  const row = b.closest(".pick"), id = row.dataset.id;
  qty[id] = Math.max(0, Math.min(12, qty[id] + Number(b.dataset.d)));
  $("output", row).textContent = qty[id];
  row.classList.toggle("has", qty[id] > 0);
  render();
});
$("#order-form").addEventListener("input", render);

function buildMessage() {
  const f = $("#order-form");
  const name = f.name.value.trim();
  const slot = f.slot.value;
  const notes = f.notes.value.trim();
  const handle = f.handle.value.trim();
  const lines = allItems.filter(i => qty[i.id]).map(i => `• ${qty[i.id]} × ${i.name}`);
  const total = allItems.reduce((s, i) => s + qty[i.id] * i.price, 0);
  let msg = `Hi Saturday Bakehouse! I'd like to order for ${satLabel}:\n\n`;
  msg += lines.length ? lines.join("\n") : "• (nothing yet — tap + on the left)";
  msg += `\n\nPickup: ${slot}`;
  msg += `\nName: ${name || "—"}`;
  if (handle) msg += ` (${handle.startsWith("@") ? handle : "@" + handle})`;
  if (notes) msg += `\nNotes: ${notes}`;
  msg += `\n\nEstimated total ${money(total)}. Thank you!`;
  return { msg, total, count: lines.length, name };
}

function render() {
  const { msg, total } = buildMessage();
  $("#dm-text").textContent = msg;
  $("#dm-total").textContent = money(total);
  $("#err").textContent = "";
}

function toast(t) {
  const el = $("#toast"); el.textContent = t; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600);
}

async function copyMessage() {
  const { msg, count, name } = buildMessage();
  if (!count) { $("#err").textContent = "Add at least one item first."; return false; }
  if (!name) { $("#err").textContent = "Add a name so we know whose bag it is."; $("#name").focus(); return false; }
  try { await navigator.clipboard.writeText(msg); }
  catch {
    const ta = document.createElement("textarea"); ta.value = msg; document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); ta.remove();
  }
  return true;
}

$("#copy-only").addEventListener("click", async () => {
  if (await copyMessage()) toast("Copied! Paste it into a DM to @" + IG_HANDLE);
});
$("#copy-open").addEventListener("click", async () => {
  if (await copyMessage()) {
    toast("Copied — now paste & send ✶");
    setTimeout(() => window.open("https://ig.me/m/" + IG_HANDLE, "_blank", "noopener"), 450);
  }
});

render();
