// app.js

// Mock data (replace with API)
const doctors = [
  {
    id: "d1",
    name: "Dr. Claire Martin",
    speciality: "Généraliste",
    location: "Lyon 7e",
    rating: 4.8,
    distanceKm: 1.2,
    price: 25,
    telemed: true,
    tags: ["Carte Vitale", "Téléconsultation"],
    slots: ["2025-11-17T09:00", "2025-11-17T10:30", "2025-11-18T14:00"]
  },
  {
    id: "d2",
    name: "Dr. Yassine El Amrani",
    speciality: "Dermatologue",
    location: "Lyon Presqu’île",
    rating: 4.6,
    distanceKm: 2.3,
    price: 50,
    telemed: false,
    tags: ["Conventionné", "Anglais"],
    slots: ["2025-11-17T11:00", "2025-11-19T16:30"]
  },
  {
    id: "d3",
    name: "Dr. Marie Zouzou",
    speciality: "Pédiatre",
    location: "Villeurbanne",
    rating: 4.9,
    distanceKm: 3.1,
    price: 30,
    telemed: true,
    tags: ["Carte Vitale", "Week-end"],
    slots: ["2025-11-20T09:30", "2025-11-20T10:00"]
  }
];

const state = {
  query: { speciality: "", location: "" },
  filter: {},
  sort: "soonest",
  page: 1,
  perPage: 10,
  selected: null,
  selectedSlot: null
};

const el = {
  resultsCount: document.getElementById("resultsCount"),
  doctorList: document.getElementById("doctorList"),
  sortSelect: document.getElementById("sortSelect"),
  searchForm: document.getElementById("searchForm"),
  specialityInput: document.getElementById("specialityInput"),
  locationInput: document.getElementById("locationInput"),
  bookingModal: document.getElementById("bookingModal"),
  modalDoctor: document.getElementById("modalDoctor"),
  bookingForm: document.getElementById("bookingForm"),
  bookingSuccess: document.getElementById("bookingSuccess"),
  closeModal: document.getElementById("closeModal"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  pageInfo: document.getElementById("pageInfo")
};

function formatSlot(iso) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function applySort(list, sort) {
  const copy = [...list];
  if (sort === "rating") copy.sort((a,b)=>b.rating - a.rating);
  if (sort === "distance") copy.sort((a,b)=>a.distanceKm - b.distanceKm);
  if (sort === "price") copy.sort((a,b)=>a.price - b.price);
  if (sort === "soonest") copy.sort((a,b)=>{
    const aMin = Math.min(...a.slots.map(s=>+new Date(s)));
    const bMin = Math.min(...b.slots.map(s=>+new Date(s)));
    return aMin - bMin;
  });
  return copy;
}

function matchesQuery(d, q) {
  const s = q.speciality.trim().toLowerCase();
  const l = q.location.trim().toLowerCase();
  const byS = !s || [d.speciality, d.name].join(" ").toLowerCase().includes(s);
  const byL = !l || d.location.toLowerCase().includes(l);
  return byS && byL;
}

function render() {
  const filtered = doctors.filter(d => matchesQuery(d, state.query));
  const sorted = applySort(filtered, state.sort);
  const pageStart = (state.page-1) * state.perPage;
  const paged = sorted.slice(pageStart, pageStart + state.perPage);

  el.resultsCount.textContent = `${filtered.length} résultat${filtered.length>1 ? "s": ""}`;
  el.pageInfo.textContent = `Page ${state.page}`;
  el.prevPage.disabled = state.page === 1;
  el.nextPage.disabled = pageStart + state.perPage >= filtered.length;

  el.doctorList.innerHTML = paged.map(d => `
    <li class="card" data-id="${d.id}">
      <div class="avatar" aria-hidden="true">${d.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div>
      <div>
        <h3>${d.name}</h3>
        <div class="meta">${d.speciality} • ${d.location} • ⭐ ${d.rating} • ${d.distanceKm} km</div>
        <div class="tags">${d.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        <div class="slot-grid" role="list" aria-label="Créneaux disponibles">
          ${d.slots.map(s=>`<button class="slot" data-slot="${s}" aria-label="Choisir ${formatSlot(s)}">${formatSlot(s)}</button>`).join("")}
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-outline btn-view" aria-label="Voir le profil de ${d.name}">Voir profil</button>
        <button class="btn btn-primary btn-book" aria-label="Réserver avec ${d.name}">Réserver</button>
      </div>
    </li>
  `).join("");

  // attach handlers
  el.doctorList.querySelectorAll(".slot").forEach(btn => {
    btn.addEventListener("click", () => {
      const li = btn.closest(".card");
      const id = li.dataset.id;
      state.selected = doctors.find(x => x.id === id);
      state.selectedSlot = btn.dataset.slot;
      openModal();
    });
  });

  el.doctorList.querySelectorAll(".btn-book").forEach(btn => {
    btn.addEventListener("click", () => {
      const li = btn.closest(".card");
      const id = li.dataset.id;
      state.selected = doctors.find(x => x.id === id);
      state.selectedSlot = state.selected?.slots[0] ?? null;
      openModal();
    });
  });
}

function openModal() {
  el.modalDoctor.textContent = state.selected
    ? `${state.selected.name} • ${state.selected.speciality} • ${state.selected.location} • Créneau: ${state.selectedSlot ? formatSlot(state.selectedSlot) : "à choisir"}`
    : "";
  el.bookingSuccess.classList.add("hidden");
  el.bookingModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  el.bookingModal.setAttribute("aria-hidden", "true");
}

el.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.query.speciality = el.specialityInput.value;
  state.query.location = el.locationInput.value;
  state.page = 1;
  render();
});

el.sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});

el.prevPage.addEventListener("click", () => { state.page = Math.max(1, state.page-1); render(); });
el.nextPage.addEventListener("click", () => { state.page = state.page+1; render(); });

el.closeModal.addEventListener("click", closeModal);

el.bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // Here you’d POST to your backend (doctor, slot, patient info)
  // fetch("/api/book", { method: "POST", body: JSON.stringify({...}) })
  el.bookingSuccess.classList.remove("hidden");
  setTimeout(closeModal, 1200);
});

// initial render
render();
