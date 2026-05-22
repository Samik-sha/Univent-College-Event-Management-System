
let adminState = {
  isLoggedIn: false,
  username: null
};

// Hardcoded admin (for now)
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "1234"
};

const EVENT_TYPES = ["All", "Workshop", "Competition", "Performance", "Meetup", "Talk", "Conference", "Showcase", "Volunteer"];
const CATEGORIES = ["All", "Technology", "Arts", "Academic", "Business", "Social"];

const typeColor = {
  Workshop: { bg: "#e0f2fe", text: "#0369a1" },
  Competition: { bg: "#fef3c7", text: "#b45309" },
  Performance: { bg: "#fce7f3", text: "#db2777" },
  Meetup: { bg: "#e0f5ee", text: "#0f7a55" },
  Talk: { bg: "#ede9fe", text: "#7c3aed" },
  Conference: { bg: "#fdeee9", text: "#c94a1e" },
  Showcase: { bg: "#e8f0fe", text: "#1a6ef5" },
  Volunteer: { bg: "#dcfce7", text: "#16a34a" },
};

let state = {
  clubs: [],               // ← empty here; load from API
  view: "home",
  activeClub: null,
  userName: "Student",      // will later come from login
  filterCategory: "All",
  filterType: "All",
  search: "",
  showAddEvent: false,
  showRsvpToast: null,
  loading: true,
  newEvent: { title: "", date: "", time: "", location: "", type: "Workshop", description: "", capacity: 50 },
  rsvpedEvents: {},         // keep for UI, but sync with backend
  activeTab: "events",
};

// 1. LOAD: fetch clubs from backend
async function loadClubs() {
  const res = await fetch("http://localhost:8080/Univent/clubs"); // your Java backend
  const { clubs } = await res.json();
  state.clubs = clubs;
  updateRsvpedEvents(); // sync local rsvpedEvents once data is loaded
  render();
}

// Optional: sync UI‑only rsvpedEvents object from DB
function updateRsvpedEvents() {
  state.rsvpedEvents = {};

  state.clubs.forEach(c => {
    (c.events || []).forEach(e => {   // ✅ safe fallback
      const key = `${c.id}-${e.id}`;
      if ((e.rsvps || []).includes(state.userName)) {
        state.rsvpedEvents[key] = true;
      }
    });
  });
}

const app = document.getElementById("app");

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

async function handleAdminLogin() {
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;

  if (!user || !pass) {
    alert("Please enter username and password");
    return;
  }

  try {
    const res = await fetch("http://localhost:8080/Univent/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert("Error: " + (data.error || "Login failed"));
      return;
    }

    // ✅ Store sessionId in localStorage (or state)
    localStorage.setItem("adminSessionId", data.sessionId);
    adminState.isLoggedIn = true;
    adminState.username = user;
    alert("Admin login successful!");
  } catch (err) {
    console.error(err);
    alert("Network error");
  }

  state.showAdminLogin = false;
  render();
}

function closeAdminLogin() {
  state.showAdminLogin = false;
  render();
}

function getAllEvents() {
  return state.clubs.flatMap(c =>
    c.events.map(e => ({ ...e, clubName: c.name, clubColor: c.color, clubId: c.id }))
  );
}

function getFilteredClubs() {
	  return (state.clubs || []).filter(c =>
    (state.filterCategory === "All" || c.category === state.filterCategory) &&
    (state.search === "" || c.name.toLowerCase().includes(state.search.toLowerCase()))
  );
}

function getUpcomingEvents() {
  return getAllEvents()
    .filter(e => state.filterType === "All" || e.type === state.filterType)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);
}

function renderClubCard(club) {
  return `
    <div class="card" data-club-id="${club.id}">
      <div class="cardHeader" style="background:${club.color}"></div>
      <div class="cardBody">
        <div class="clubIcon" style="background:${club.bg}; color:${club.color}">${club.icon}</div>
        <h3 class="clubName">${club.name}</h3>
        <p class="clubDesc">${club.description}</p>
        <div class="clubMeta">
          <span class="badge" style="background:${club.bg}; color:${club.color}">${club.category}</span>
          <span class="tag">${club.events.length} events · ${club.members} members</span>
        </div>
      </div>
    </div>
  `;
}

function renderEventCard(event, compact = false) {
  const key = `${event.clubId}-${event.id}`;
  const isRsvped = !!state.rsvpedEvents[key];
  const tc = typeColor[event.type] || { bg: "#f0f0f0", text: "#666" };
  const pct = Math.round((event.rsvps.length / event.capacity) * 100);
  if (compact) {
    return `
      <div class="eventCard">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:10px;">
          <span class="badge" style="background:${tc.bg}; color:${tc.text}">${event.type}</span>
          <span style="font-size:11px; color:#aaa; font-weight:500">${event.clubName}</span>
        </div>
        <h3 class="eventTitle">${event.title}</h3>
        <div class="eventMeta"> 📅  ${formatDate(event.date)} · ${event.time}</div>
        <div class="eventMeta"> 📍  ${event.location}</div>
        <p class="eventDesc">${event.description}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <span style="font-size:12px; color:#aaa">${event.rsvps.length}/${event.capacity} spots</span>
          <button class="rsvpBtn ${isRsvped ? "rsvped" : ""}" data-rsvp="${event.clubId}-${event.id}">
            ${isRsvped ? "✓ RSVPed" : "RSVP"}
          </button>
        </div>
      </div>
    `;
  }
  return `
    <div class="eventItem">
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap;">
          <span class="eventTitle">${event.title}</span>
          <span class="badge" style="background:${tc.bg}; color:${tc.text}">${event.type}</span>
          <span class="badge" style="background:#f0f0f0; color:#555">${event.clubName}</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:4px 20px; margin-bottom:8px;">
          <span class="eventMeta"> 📅  ${formatDate(event.date)}</span>
          <span class="eventMeta"> 🕐  ${event.time}</span>
          <span class="eventMeta"> 📍  ${event.location}</span>
        </div>
        <p class="eventDesc">${event.description}</p>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="progressBar">
            <div class="progressFill" style="width:${pct}%; background:${pct > 80 ? "#ef4444" : "#1a6ef5"}"></div>
          </div>
          <span style="font-size:12px; color:#888">${event.rsvps.length}/${event.capacity} seats</span>
        </div>
      </div>
      <button class="rsvpBtn ${isRsvped ? "rsvped" : ""}" data-rsvp="${event.clubId}-${event.id}">
        ${isRsvped ? "✓ RSVPed" : "RSVP"}
      </button>
    </div>
  `;
}

function renderHomePage() {
  if (state.loading) {
    return '<div style="padding:40px;text-align:center;">Loading clubs...</div>';
  }
  const filteredClubs = getFilteredClubs();
  const upcomingEvents = getUpcomingEvents();
  return `
    <nav class="nav">
      <span class="logo" data-action="home">Uni<span class="logoSpan">vent</span></span>
      <div class="navLinks">
        <button class="navBtn active" data-action="home">Home</button>
        <button class="navBtn" data-action="events">All Events</button>
        <button class="navBtn" data-action="admin-login">Admin</button>
      </div>
    </nav>
    <div class="hero">
      <h1 class="heroTitle">Your Campus,<br>All in One Place.</h1>
      <p class="heroSub">Discover clubs, RSVP to events, never miss a thing.</p>
      <div class="searchBar">
        <input class="searchInput" placeholder="Search clubs..." value="${state.search}" data-search />
      </div>
    </div>
    <div class="section">
      <h2 class="sectionTitle">Upcoming Events</h2>
      <p class="sectionSub">Don't miss what's happening this week</p>
      <div class="filters">
        ${EVENT_TYPES.map(t => `<button class="filterBtn ${state.filterType === t ? "active" : ""}" data-filter-type="${t}">${t}</button>`).join("")}
      </div>
      <div class="eventsGrid">
        ${upcomingEvents.map(e => renderEventCard(e, true)).join("")}
      </div>
      <div style="text-align:center; margin-top:24px;">
        <button class="addBtn" style="background:transparent; color:#1a6ef5; border:1.5px solid #1a6ef5;" data-action="events">
          View All Events →
        </button>
      </div>
    </div>
    <div style="background:#fff; border-top:1px solid #ebebeb">
      <div class="section">
        <h2 class="sectionTitle">University Clubs</h2>
        <p class="sectionSub">Click any club to explore its events</p>
        <div class="filters">
          ${CATEGORIES.map(c => `<button class="filterBtn ${state.filterCategory === c ? "active" : ""}" data-filter-category="${c}">${c}</button>`).join("")}
        </div>
        <div class="grid">
          ${filteredClubs.map(renderClubCard).join("")}
        </div>
        ${filteredClubs.length === 0 ? `<div class="noResults">No clubs match your search.</div>` : ""}
      </div>
    </div>
    <div class="footer">
      <div style="font-weight:800; font-size:20px; margin-bottom:6px;">Uni<span style="color:#1a6ef5">vent</span></div>
      <div style="color:#666; font-size:13px;">${state.clubs.length} clubs · ${getAllEvents().length} events</div>
    </div>
    ${state.showRsvpToast ? `<div class="toast ${state.showRsvpToast.ok ? "show" : "error show"}">${state.showRsvpToast.msg}</div>` : ""}
    ${state.showAdminLogin ? renderAdminLogin() : ""}
  `;
}

function renderClubPage(club) {
  const clubEvents = club.events.filter(e => state.filterType === "All" || e.type === state.filterType);
  const totalRsvps = club.events.reduce((s, e) => s + e.rsvps.length, 0);
  return `
    <nav class="nav">
      <span class="logo" data-action="home">Uni<span class="logoSpan">vent</span></span>
      <div class="navLinks">
        <button class="navBtn" data-action="home">Home</button>
        <button class="navBtn" data-action="events">All Events</button>
      </div>
    </nav>
    <div class="clubPage">
      <button class="backBtn" data-action="home">← Back to Clubs</button>
      <div class="clubHero" style="background:linear-gradient(135deg, ${club.color}22, ${club.color}44);">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; gap:16px; align-items:center;">
            <div style="font-size:48px; background:#fff; border-radius:16px; width:72px; height:72px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${club.icon}</div>
            <div>
              <div style="font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${club.color}; margin-bottom:4px;">${club.category}</div>
              <h1 class="clubHeroName">${club.name}</h1>
              <p style="color:#555; margin:0; font-size:15px;">${club.description}</p>
            </div>
          </div>
         ${adminState.isLoggedIn ? `<button class="addBtn" data-action="add-event">+ Add Event</button>` : ""}
        </div>
      </div>
      <div class="statBox">
        <div class="stat"><p class="statNum">${club.members}</p><p class="statLabel">Members</p></div>
        <div class="stat"><p class="statNum">${club.events.length}</p><p class="statLabel">Events</p></div>
        <div class="stat"><p class="statNum">${totalRsvps}</p><p class="statLabel">RSVPs</p></div>
      </div>
      <div class="tabs">
        <button class="tab ${state.activeTab === "events" ? "active" : ""}" data-tab="events">Events</button>
        <button class="tab ${state.activeTab === "about" ? "active" : ""}" data-tab="about">About</button>
      </div>
      ${state.activeTab === "events" ? `
        <div class="filters">
          ${EVENT_TYPES.map(t => `<button class="filterBtn ${state.filterType === t ? "active" : ""}" data-filter-type="${t}">${t}</button>`).join("")}
        </div>
        ${clubEvents.length === 0 ? `<div class="noResults">No events found for this filter.</div>` : `
          <div class="eventList">
            ${clubEvents.map(e => renderEventCard({ ...e, clubId: club.id, clubName: club.name }, false)).join("")}
          </div>
        `}
      ` : `
        <div style="background:#fff; border-radius:14px; padding:24px; border:1px solid #ebebeb;">
          <h3 style="margin:0 0 12px; font-weight:700;">About ${club.name}</h3>
          <p style="color:#555; line-height:1.7; margin-top:0;">
            ${club.description} This club welcomes students from all backgrounds and skill levels. Join us to grow, collaborate, and create something amazing together.
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
            ${[
              ["Category", club.category],
              ["Members", club.members],
              ["Events", club.events.length],
              ["Total RSVPs", totalRsvps]
            ].map(([k, v]) => `
              <div style="background:#f8f8f6; border-radius:10px; padding:12px 16px;">
                <div style="font-size:11px; color:#999; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">${k}</div>
                <div style="font-size:18px; font-weight:700; margin-top:2px;">${v}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `}
      ${state.showAddEvent ? renderAddEventModal() : ""}
    </div>
    ${state.showRsvpToast ? `<div class="toast ${state.showRsvpToast.ok ? "show" : "error show"}">${state.showRsvpToast.msg}</div>` : ""}
    ${state.showAdminLogin ? renderAdminLogin() : ""}
  `;
}

function renderAddEventModal() {
  return `
    <div class="modal" data-close-modal="true">
      <div class="modalBox">
		        <h2 style="margin:0 0 20px; font-weight:800; font-size:22px;">Add New Event</h2>
		        <label class="label">Event Title *</label>
		        <input class="input" placeholder="e.g. Annual Hackathon" value="${state.newEvent.title}" data-new-event="title" />
		        <label class="label">Date *</label>
		        <input class="input" type="date" value="${state.newEvent.date}" data-new-event="date" />
		        <label class="label">Time</label>
		        <input class="input" type="time" value="${state.newEvent.time}" data-new-event="time" />
		        <label class="label">Location *</label>
		        <input class="input" placeholder="e.g. CS Lab 101" value="${state.newEvent.location}" data-new-event="location" />
		        <label class="label">Event Type</label>
		        <select class="select" data-new-event="type">
		          ${EVENT_TYPES.filter(t => t !== "All").map(t => `<option value="${t}" ${state.newEvent.type === t ? "selected" : ""}>${t}</option>`).join("")}
		        </select>
		        <label class="label">Capacity</label>
		        <input class="input" type="number" placeholder="50" value="${state.newEvent.capacity}" data-new-event="capacity" />
		        <label class="label">Description</label>
		        <textarea class="textarea" placeholder="What's this event about?" data-new-event="description">${state.newEvent.description}</textarea>
		        <div style="display:flex; gap:10px; justify-content:flex-end;">
		          <button class="rsvpBtn rsvped" style="padding:10px 20px;" data-close-modal="true">Cancel</button>
		          <button class="addBtn" data-create-event="true">Create Event</button>
		        </div>
		      </div>
		    </div>
		  `;
		}
		function renderEventsPage() {
		  const allFiltered = getAllEvents()
		    .filter(e => state.filterType === "All" || e.type === state.filterType)
		    .sort((a, b) => new Date(a.date) - new Date(b.date));
		  return `
		    <nav class="nav">
		      <span class="logo" data-action="home">Uni<span class="logoSpan">vent</span></span>
		      <div class="navLinks">
		        <button class="navBtn" data-action="home">Home</button>
		        <button class="navBtn active" data-action="events">All Events</button>
		        <button class="navBtn" data-action="admin-login">Admin</button>
		      </div>
		    </nav>
		    <div style="background:#1a6ef5; color:#fff; padding:2.5rem 2rem 2rem; text-align:center;">
		      <h1 style="font-size:36px; font-weight:800; margin:0 0 8px; letter-spacing:-1px;">All Campus Events</h1>
		      <p style="opacity:0.8; margin:0;">Every event happening across all university clubs</p>
		    </div>
		    <div class="section">
		      <div class="filters">
		        ${EVENT_TYPES.map(t => `<button class="filterBtn ${state.filterType === t ? "active" : ""}" data-filter-type="${t}">${t}</button>`).join("")}
		      </div>
		      <p style="color:#888; font-size:14px; margin-bottom:20px;">${allFiltered.length} events found</p>
		      <div class="eventList">
		        ${allFiltered.map(e => renderEventCard(e, false)).join("")}
		      </div>
		    </div>
		    ${state.showRsvpToast ? `<div class="toast ${state.showRsvpToast.ok ? "show" : "error show"}">${state.showRsvpToast.msg}</div>` : ""}
		  ${state.showAdminLogin ? renderAdminLogin() : ""}
		  `;
		}
		function renderAdminLogin() {
		  return `
		    <div class="modal">
		      <div class="modalBox">
		        <h2>Admin Login</h2>
		        <input class="input" placeholder="Username" id="adminUser" />
		        <input class="input" type="password" placeholder="Password" id="adminPass" />
		        <div style="margin-top:10px; display:flex; gap:10px;">
		          <button class="addBtn" onclick="handleAdminLogin()">Login</button>
		          <button class="rsvpBtn rsvped" onclick="closeAdminLogin()">Cancel</button>
		        </div>
		      </div>
		    </div>
		  `;
		}
		function render() {
		  if (state.view === "club" && state.activeClub) {
		    app.innerHTML = renderClubPage(state.activeClub);
		  } else if (state.view === "events") {
		    app.innerHTML = renderEventsPage();
		  } else {
		    app.innerHTML = renderHomePage();
		  }
		  attachListeners();
		  if (state.showRsvpToast) {
		    clearTimeout(window.toastTimer);
		    window.toastTimer = setTimeout(() => {
		      state.showRsvpToast = null;
		      render();
		    }, 3000);
		  }
		}

		async function handleRsvp(clubId, eventId) {
		  const userName = state.userName;
		  const key = `${clubId}-${eventId}`;
		  const eventTitle =
		    state.clubs.find(c => c.id === clubId)?.events.find(e => e.id === eventId)?.title || "Event";

		  try {
		    const res = await fetch(`http://localhost:8080/Univent/events/${eventId}/rsvp`, {
		      method: "POST",
		      headers: { "Content-Type": "application/json" },
		      body: JSON.stringify({ userName }),
		    });
		    const data = await res.json();

		    if (!res.ok) {
		      state.showRsvpToast = { msg: data.error, ok: false };
		      render();
		      return;
		    }

		    // reload clubs (or optimistically update)
		    await loadClubs();

		    state.showRsvpToast = {
		      msg: data.msg,
		      ok: data.ok,
		    };
		  } catch (err) {
		    console.error(err);
		    state.showRsvpToast = { msg: "Network error", ok: false };
		  }
		  render();
		}

		async function handleAddEvent() {
		  if (!adminState.isLoggedIn) {
		    alert("Only admin can add events");
		    return;
		  }

		  if (!state.newEvent.title || !state.newEvent.date || !state.newEvent.location) {
		    alert("Please fill title, date, and location");
		    return;
		  }

		  const clubId = state.activeClub?.id;
		  if (!clubId) return;

		  const body = {
		    title: state.newEvent.title,
		    date: state.newEvent.date,
		    time: state.newEvent.time,
		    location: state.newEvent.location,
		    type: state.newEvent.type,
		    description: state.newEvent.description,
		    capacity: parseInt(state.newEvent.capacity) || 50,
		  };

		  // ✅ Get sessionId from login
		  const sessionId = localStorage.getItem("adminSessionId");
		  if (!sessionId) {
		    alert("Please log in as admin first");
		    return;
		  }

		  try {
		    const res = await fetch(`http://localhost:8080/Univent/clubs/${clubId}/events`, {
		      method: "POST",
		      headers: {
		        "Content-Type": "application/json",
		        "X-Admin-Session": sessionId,   // ← this is required
		      },
		      body: JSON.stringify(body),
		    });

		    if (!res.ok) {
		      const err = await res.json();
		      alert("Error: " + (err.error || "Could not create event"));
		      return;
		    }

		    const event = await res.json();
		    await loadClubs();

		    alert(`Success! A new event, "${event.title}", has been scheduled.`);
		    state.showAddEvent = false;
		    state.newEvent = { title: "", date: "", time: "", location: "", type: "Workshop", description: "", capacity: 50 };
		  } catch (err) {
		    console.error(err);
		    alert("Network error");
		  }
		  render();
		}

		function attachListeners() {
		  document.querySelectorAll("[data-action='home']").forEach(el => {
		    el.onclick = () => {
		      state.view = "home";
		      state.activeClub = null;
		      state.filterType = "All";
		      state.showAddEvent = false;
		      render();
		    };
		  });
		   document.querySelectorAll("[data-action='admin-login']").forEach(el => {
		    el.onclick = () => {
		      state.showAdminLogin = true;
		      render();
		    };
		  });
		  document.querySelectorAll("[data-action='events']").forEach(el => {
		    el.onclick = () => {
		      state.view = "events";
		      state.filterType = "All";
		      state.showAddEvent = false;
		      render();
		    };
		  });
		  document.querySelectorAll("[data-club-id]").forEach(el => {
		    el.onclick = () => {
		      const clubId = parseInt(el.dataset.clubId);
		      state.activeClub = state.clubs.find(c => c.id === clubId);
		      state.view = "club";
		      state.activeTab = "events";
		      state.filterType = "All";
		      render();
		    };
		  });
		  document.querySelectorAll("[data-rsvp]").forEach(el => {
		    el.onclick = (e) => {
		      e.stopPropagation();
		      const [clubId, eventId] = el.dataset.rsvp.split("-").map(Number);
		      handleRsvp(clubId, eventId);
		    };
		  });
		  const searchInput = document.querySelector("[data-search]");
		  if (searchInput) {
		    searchInput.oninput = (e) => {
		      state.search = e.target.value;
		      render();
		    };
		  }
		  document.querySelectorAll("[data-filter-category]").forEach(el => {
		    el.onclick = () => {
		      state.filterCategory = el.dataset.filterCategory;
		      render();
		    };
		  });
		  document.querySelectorAll("[data-filter-type]").forEach(el => {
		    el.onclick = () => {
		      state.filterType = el.dataset.filterType;
		      render();
		    };
		  });
		  document.querySelectorAll("[data-tab]").forEach(el => {
		    el.onclick = () => {
		      state.activeTab = el.dataset.tab;
		      render();
		    };
		  });
		  document.querySelectorAll("[data-action='add-event']").forEach(el => {
		    el.onclick = () => {
		      state.showAddEvent = true;
		      render();
		    };
		  });
		  document.querySelectorAll("[data-close-modal='true']").forEach(el => {
		    el.onclick = () => {
		      state.showAddEvent = false;
		      render();
		    };
		  });
		  document.querySelector("[data-create-event='true']")?.addEventListener("click", handleAddEvent);
		  document.querySelectorAll("[data-new-event]").forEach(el => {
		    el.oninput = (e) => {
		      state.newEvent[el.dataset.newEvent] = e.target.value;
		    };
		  });
		  const modal = document.querySelector(".modal");
		  if (modal) {
		    modal.onclick = (e) => {
		      if (e.target === modal) {
		        state.showAddEvent = false;
		        render();
		      }
		    };
		  }
		}
		render();
		loadClubs().then(() => {
		  state.loading = false;
		  render();
		}).catch(err => {
		  console.error(err);
		  state.loading = false;
		  render();
		});


