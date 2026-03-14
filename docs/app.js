/* ============================================
   Dinner Out — App Logic (Portugal-inspired)
   ============================================ */

(function () {
    "use strict";

    let map;
    let markerLayer;
    let allRestaurants = [];
    let db;
    let currentUser = null;

    const ALLOWED_EMAILS = [
        "payne.brad@gmail.com",
        "anahitamakouie@gmail.com"
    ];

    // Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyAhl6Lj3mZCkwyFmRJrRTBuNNsn-fhVhHA",
        authDomain: "restaurants-90def.firebaseapp.com",
        projectId: "restaurants-90def",
        storageBucket: "restaurants-90def.firebasestorage.app",
        messagingSenderId: "502651951719",
        appId: "1:502651951719:web:8dec9888900cff196f52c2"
    };

    // ── Doc ID formula ──
    function makeDocId(name) {
        return name.toLowerCase().replace(/ /g, "-").replace(/'/g, "").replace(/&/g, "and");
    }

    // ── Marker icons ──
    function createMarkerIcon(status, size) {
        const s = size || 12;
        const color = status === "Tried" ? "#2e7d32" : "#d4a96a";
        return L.divIcon({
            className: "custom-marker",
            html: `<div style="
                width: ${s}px; height: ${s}px;
                background: ${color};
                border: 2.5px solid #fff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [s, s],
            iconAnchor: [s / 2, s / 2],
            popupAnchor: [0, -(s / 2 + 2)],
        });
    }

    // ── Init map ──
    function initMap() {
        map = L.map("map", {
            center: [43.651, -79.4],
            zoom: 13,
            zoomControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19,
        }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
    }

    // ── Popup HTML ──
    // Name scrolls to card; "Visit →" opens website
    function popupHTML(r) {
        const docId = r._docId || makeDocId(r.name);
        let html = `<div class="popup-name">`;
        html += `<a href="#" onclick="(function(e){e.preventDefault();var el=document.querySelector('[data-id=\\'${docId}\\']');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});};})(event)">${r.name}</a>`;
        html += `</div>`;
        html += `<div class="popup-meta">${r.cuisine} &middot; ${r.price} &middot; ${r.vibe}</div>`;

        if (r.her_rating != null || r.his_rating != null) {
            const parts = [];
            if (r.her_rating != null) parts.push(`Her: ${r.her_rating}`);
            if (r.his_rating != null) parts.push(`His: ${r.his_rating}`);
            html += `<div class="popup-ratings">${parts.join(" &middot; ")}</div>`;
        }

        if (r.notes) {
            html += `<div class="popup-notes">"${r.notes}"</div>`;
        }

        if (r.url) {
            html += `<a class="popup-link" href="${r.url}" target="_blank" rel="noopener">Visit &rarr;</a>`;
        }

        return html;
    }

    // ── Render markers ──
    function renderMarkers(restaurants) {
        markerLayer.clearLayers();

        restaurants.forEach(function (r) {
            if (r.lat == null || r.lng == null) return;
            var marker = L.marker([r.lat, r.lng], {
                icon: createMarkerIcon(r.status),
            }).bindPopup(popupHTML(r), { maxWidth: 280 });
            markerLayer.addLayer(marker);
        });
    }

    // ── Card HTML ──
    function buildCard(r) {
        const statusClass = r.status === "Tried" ? "tried" : "want";
        const statusLabel = r.status === "Tried" ? "Tried" : "Want to Try";
        const docId = r._docId || makeDocId(r.name);

        let nameHtml;
        if (r.url) {
            nameHtml = `<a href="${r.url}" target="_blank" rel="noopener">${r.name}</a>`;
        } else {
            nameHtml = r.name;
        }

        const imageUrl = r.image || "";
        const imageType = r.image_type || "stock";

        let ratingsHtml = "";
        if (r.her_rating != null || r.his_rating != null) {
            let parts = [];
            if (r.her_rating != null) {
                parts.push(
                    `<span><span class="rating-label">Her </span><span class="rating-value">${r.her_rating}</span></span>`
                );
            }
            if (r.his_rating != null) {
                parts.push(
                    `<span><span class="rating-label">His </span><span class="rating-value">${r.his_rating}</span></span>`
                );
            }
            if (r.average_rating != null) {
                parts.push(
                    `<span><span class="rating-label">Avg </span><span class="rating-value">${r.average_rating}</span></span>`
                );
            }
            ratingsHtml = `<div class="card-ratings">${parts.join("")}</div>`;
        }

        let notesHtml = r.notes
            ? `<div class="card-notes">"${r.notes}"</div>`
            : `<div class="card-notes"></div>`;

        let linkHtml = "";
        if (r.url) {
            // Clean domain for display
            let domain;
            try {
                domain = new URL(r.url).hostname.replace("www.", "");
            } catch (e) {
                domain = "Visit";
            }
            linkHtml = `<a class="card-link" href="${r.url}" target="_blank" rel="noopener">${domain} &rarr;</a>`;
        }

        const card = document.createElement("div");
        card.className = "rest-card";
        card.dataset.id = docId;
        card.innerHTML = `
            <span class="card-edit-icon" title="Edit">✏</span>
            ${imageUrl && imageType === "instagram" ? `
            <div class="card-image card-image-ig">
                <div class="ig-backdrop" style="background-image:url('${imageUrl}')"></div>
                <img src="${imageUrl}" alt="${r.name}" loading="lazy">
                <span class="card-image-badge ${statusClass}">${statusLabel}</span>
            </div>` : imageUrl ? `
            <div class="card-image">
                <img src="${imageUrl}" alt="${r.name}" loading="lazy">
                <span class="card-image-badge ${statusClass}">${statusLabel}</span>
            </div>` : ""}
            <div class="card-body">
                <div class="card-header">
                    <span class="card-name">${nameHtml}</span>
                </div>
                <div class="card-cuisine">${r.cuisine}</div>
                <div class="card-tags">
                    <span class="card-tag">${r.price}</span>
                    <span class="card-tag">${r.vibe}</span>
                    <span class="card-tag">${r.type}</span>
                </div>
                ${ratingsHtml}
                ${notesHtml}
                <div class="card-footer">
                    <span class="card-location">${r.location}</span>
                    ${linkHtml}
                </div>
            </div>
        `;

        // Edit icon click — open modal
        card.querySelector(".card-edit-icon").addEventListener("click", function (e) {
            e.stopPropagation();
            openEditModal(r, docId, card);
        });

        // Click card body to fly on map (not the edit icon or links)
        card.addEventListener("click", function (e) {
            if (e.target.closest("a")) return;
            if (e.target.closest(".card-edit-icon")) return;
            if (r.lat != null && r.lng != null) {
                document.getElementById("map-section").scrollIntoView({ behavior: "smooth" });
                setTimeout(function () {
                    map.flyTo([r.lat, r.lng], 16, { duration: 0.8 });
                    markerLayer.eachLayer(function (layer) {
                        if (
                            layer.getLatLng().lat === r.lat &&
                            layer.getLatLng().lng === r.lng
                        ) {
                            layer.openPopup();
                        }
                    });
                }, 400);
            }
        });
        card.style.cursor = "pointer";

        return card;
    }

    // ── Edit Modal ──
    function openEditModal(r, docId, cardEl) {
        document.getElementById("edit-doc-id").value = docId;
        document.getElementById("edit-name").value = r.name || "";
        document.getElementById("edit-cuisine").value = r.cuisine || "";
        document.getElementById("edit-type").value = r.type || "";
        document.getElementById("edit-price").value = r.price || "";
        document.getElementById("edit-vibe").value = r.vibe || "";
        document.getElementById("edit-location").value = r.location || "";
        document.getElementById("edit-url").value = r.url || "";
        document.getElementById("edit-her-rating").value = r.her_rating != null ? r.her_rating : "";
        document.getElementById("edit-his-rating").value = r.his_rating != null ? r.his_rating : "";
        document.getElementById("edit-status").value = r.status || "Want to try";
        document.getElementById("edit-notes").value = r.notes || "";

        // Store reference to the restaurant object and card element for post-save update
        document.getElementById("edit-modal").dataset.restaurantIndex = allRestaurants.indexOf(r);
        document.querySelector(".modal-title").textContent = "Edit Restaurant";
        document.querySelector(".modal-btn-save").textContent = "Save Changes";

        showModal();
    }

    function showModal() {
        const overlay = document.getElementById("edit-modal");
        overlay.classList.add("active");
        overlay.removeAttribute("aria-hidden");
        document.body.style.overflow = "hidden";
    }

    function hideModal() {
        const overlay = document.getElementById("edit-modal");
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    // ── Open modal in "Add New" mode ──
    function openAddModal() {
        document.getElementById("edit-doc-id").value = "";
        document.getElementById("edit-name").value = "";
        document.getElementById("edit-cuisine").value = "";
        document.getElementById("edit-type").value = "";
        document.getElementById("edit-price").value = "";
        document.getElementById("edit-vibe").value = "";
        document.getElementById("edit-location").value = "";
        document.getElementById("edit-url").value = "";
        document.getElementById("edit-her-rating").value = "";
        document.getElementById("edit-his-rating").value = "";
        document.getElementById("edit-status").value = "Want to try";
        document.getElementById("edit-notes").value = "";

        document.getElementById("edit-modal").dataset.restaurantIndex = "-1";
        document.querySelector(".modal-title").textContent = "Add Restaurant";
        document.querySelector(".modal-btn-save").textContent = "Add Restaurant";
        showModal();
    }

    function initModal() {
        document.getElementById("modal-close").addEventListener("click", hideModal);
        document.getElementById("modal-cancel").addEventListener("click", hideModal);
        document.getElementById("edit-modal").addEventListener("click", function (e) {
            if (e.target === this) hideModal();
        });

        // Nav "New" button
        document.getElementById("nav-add-btn").addEventListener("click", function (e) {
            e.preventDefault();
            openAddModal();
        });

        document.getElementById("edit-form").addEventListener("submit", async function (e) {
            e.preventDefault();
            const saveBtn = this.querySelector(".modal-btn-save");
            saveBtn.textContent = "Saving…";
            saveBtn.disabled = true;

            const docId = document.getElementById("edit-doc-id").value;

            const herRatingRaw = document.getElementById("edit-her-rating").value;
            const hisRatingRaw = document.getElementById("edit-his-rating").value;

            const changes = {
                name:       document.getElementById("edit-name").value.trim(),
                cuisine:    document.getElementById("edit-cuisine").value.trim(),
                type:       document.getElementById("edit-type").value.trim(),
                price:      document.getElementById("edit-price").value.trim(),
                vibe:       document.getElementById("edit-vibe").value.trim(),
                location:   document.getElementById("edit-location").value.trim(),
                url:        document.getElementById("edit-url").value.trim(),
                status:     document.getElementById("edit-status").value,
                notes:      document.getElementById("edit-notes").value.trim(),
                her_rating: herRatingRaw !== "" ? parseFloat(herRatingRaw) : null,
                his_rating: hisRatingRaw !== "" ? parseFloat(hisRatingRaw) : null,
            };

            // Compute average if both ratings present
            if (changes.her_rating != null && changes.his_rating != null) {
                changes.average_rating = Math.round(((changes.her_rating + changes.his_rating) / 2) * 10) / 10;
            } else {
                changes.average_rating = changes.her_rating ?? changes.his_rating ?? null;
            }

            const isNew = !docId;
            const finalDocId = isNew ? makeDocId(changes.name) : docId;

            try {
                if (db) {
                    if (isNew) {
                        await db.collection("restaurants").doc(finalDocId).set(changes);
                    } else {
                        await db.collection("restaurants").doc(finalDocId).update(changes);
                    }
                }

                if (isNew) {
                    // Add to in-memory array and re-render
                    changes._docId = finalDocId;
                    allRestaurants.push(changes);
                    populateFilterOptions(allRestaurants);
                } else {
                    // Update in-memory record
                    const idx = parseInt(document.getElementById("edit-modal").dataset.restaurantIndex, 10);
                    if (!isNaN(idx) && allRestaurants[idx]) {
                        Object.assign(allRestaurants[idx], changes);
                    }
                }

                const filtered = applyFilters();
                renderCards(filtered);
                renderMarkers(filtered);
                updateStats(allRestaurants);

                hideModal();
            } catch (err) {
                console.error("Failed to save:", err);
                alert("Save failed — check the console for details.");
            } finally {
                saveBtn.textContent = isNew ? "Add Restaurant" : "Save Changes";
                saveBtn.disabled = false;
            }
        });
    }

    // ── Render card grids ──
    function renderCards(restaurants) {
        const triedGrid = document.getElementById("tried-grid");
        const wishlistGrid = document.getElementById("wishlist-grid");
        triedGrid.innerHTML = "";
        wishlistGrid.innerHTML = "";

        const tried = restaurants.filter(function (r) { return r.status === "Tried"; });
        const want = restaurants.filter(function (r) { return r.status !== "Tried"; });

        // Sort by average rating descending
        tried.sort(function (a, b) { return (b.average_rating || 0) - (a.average_rating || 0); });
        want.sort(function (a, b) {
            if (a.cuisine < b.cuisine) return -1;
            if (a.cuisine > b.cuisine) return 1;
            return 0;
        });

        tried.forEach(function (r) { triedGrid.appendChild(buildCard(r)); });
        want.forEach(function (r) { wishlistGrid.appendChild(buildCard(r)); });
    }

    // ── Filters ──
    function applyFilters() {
        const cuisine = document.getElementById("filter-cuisine").value;
        const vibe = document.getElementById("filter-vibe").value;
        const price = document.getElementById("filter-price").value;

        return allRestaurants.filter(function (r) {
            if (cuisine !== "all" && r.cuisine.toLowerCase() !== cuisine.toLowerCase())
                return false;
            if (vibe !== "all" && r.vibe.toLowerCase() !== vibe.toLowerCase()) return false;
            if (price !== "all" && r.price !== price) return false;
            return true;
        });
    }

    function populateFilterOptions(restaurants) {
        var cuisines = [];
        var vibes = [];
        var prices = [];
        var seen = { c: {}, v: {}, p: {} };

        restaurants.forEach(function (r) {
            if (r.cuisine && !seen.c[r.cuisine]) { cuisines.push(r.cuisine); seen.c[r.cuisine] = true; }
            if (r.vibe && !seen.v[r.vibe]) { vibes.push(r.vibe); seen.v[r.vibe] = true; }
            if (r.price && !seen.p[r.price]) { prices.push(r.price); seen.p[r.price] = true; }
        });

        cuisines.sort();
        vibes.sort();
        prices.sort(function (a, b) { return a.length - b.length; });

        fillSelect("filter-cuisine", cuisines);
        fillSelect("filter-vibe", vibes);
        fillSelect("filter-price", prices);
    }

    function fillSelect(id, options) {
        var select = document.getElementById(id);
        options.forEach(function (opt) {
            var el = document.createElement("option");
            el.value = opt;
            el.textContent = opt;
            select.appendChild(el);
        });
    }

    function onFilterChange() {
        var filtered = applyFilters();
        renderMarkers(filtered);
        renderCards(filtered);
        fitBounds(filtered);
    }

    function fitBounds(restaurants) {
        var withCoords = restaurants.filter(function (r) {
            return r.lat != null && r.lng != null;
        });
        if (withCoords.length === 0) return;
        var bounds = L.latLngBounds(
            withCoords.map(function (r) {
                return [r.lat, r.lng];
            })
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    // ── Hero stats ──
    function updateStats(restaurants) {
        var tried = restaurants.filter(function (r) { return r.status === "Tried"; });
        var want = restaurants.filter(function (r) { return r.status !== "Tried"; });
        var cuisines = {};
        restaurants.forEach(function (r) { if (r.cuisine) cuisines[r.cuisine] = true; });

        document.getElementById("stat-total").textContent = restaurants.length;
        document.getElementById("stat-tried").textContent = tried.length;
        document.getElementById("stat-want").textContent = want.length;
        document.getElementById("stat-cuisines").textContent = Object.keys(cuisines).length;
    }

    // ── Auth ──
    function initAuth() {
        var auth = firebase.auth();
        var provider = new firebase.auth.GoogleAuthProvider();

        var signInBtn = document.getElementById("nav-sign-in");
        var signOutBtn = document.getElementById("nav-sign-out");
        var addItem = document.getElementById("nav-auth-item");

        signInBtn.addEventListener("click", function (e) {
            e.preventDefault();
            auth.signInWithRedirect(provider);
        });

        signOutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            auth.signOut();
        });

        auth.onAuthStateChanged(function (user) {
            if (user && ALLOWED_EMAILS.indexOf(user.email) !== -1) {
                currentUser = user;
                signInBtn.style.display = "none";
                signOutBtn.style.display = "";
                addItem.style.display = "";
                // Show edit icons
                document.body.classList.add("auth-ready");
            } else {
                if (user) auth.signOut(); // signed in but not allowed
                currentUser = null;
                signInBtn.style.display = "";
                signOutBtn.style.display = "none";
                addItem.style.display = "none";
                document.body.classList.remove("auth-ready");
            }
        });
    }

    // ── Nav scroll effect + hamburger toggle ──
    function initNav() {
        var nav = document.getElementById("nav");
        window.addEventListener("scroll", function () {
            if (window.scrollY > 50) {
                nav.classList.add("scrolled");
            } else {
                nav.classList.remove("scrolled");
            }
        });

        var hamburger = document.getElementById("nav-hamburger");
        var navLinks = document.getElementById("nav-links");
        hamburger.addEventListener("click", function () {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("open");
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                hamburger.classList.remove("active");
                navLinks.classList.remove("open");
            });
        });
    }

    // ── Load data from Firestore, fall back to static JSON ──
    async function loadData() {
        // Try Firestore first
        if (typeof firebase !== "undefined" && firebase.apps.length) {
            try {
                db = firebase.firestore();
                const snapshot = await db.collection("restaurants").get();
                if (!snapshot.empty) {
                    const data = [];
                    snapshot.forEach(function (doc) {
                        const r = doc.data();
                        r._docId = doc.id;
                        data.push(r);
                    });
                    return data;
                }
            } catch (err) {
                console.warn("Firestore unavailable, falling back to static JSON:", err);
            }
        }

        // Fallback: static JSON
        const resp = await fetch("data/restaurants.json");
        const data = await resp.json();
        data.forEach(function (r) {
            r._docId = makeDocId(r.name);
        });
        return data;
    }

    // ── Init ──
    async function init() {
        // Initialize Firebase first — auth and data both depend on it
        if (typeof firebase !== "undefined" && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        initMap();
        initNav();
        initModal();
        initAuth();

        allRestaurants = await loadData();

        updateStats(allRestaurants);
        populateFilterOptions(allRestaurants);

        // Filter listeners
        ["filter-cuisine", "filter-vibe", "filter-price"].forEach(function (id) {
            document.getElementById(id).addEventListener("change", onFilterChange);
        });

        renderMarkers(allRestaurants);
        renderCards(allRestaurants);
        fitBounds(allRestaurants);
    }

    init();
})();
