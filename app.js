
// --- Backend API Configuration ---
const API_URL = 'https://KhadijaNizamani.pythonanywhere.com/api';

// --- Global State ---
let requests = [];

// --- DOM Elements ---
const requestsContainer = document.getElementById('requestsContainer');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');

const statTotal = document.getElementById('statTotal');
const statOpen = document.getElementById('statOpen');
const statAccepted = document.getElementById('statAccepted');
const statCompleted = document.getElementById('statCompleted');

const requestForm = document.getElementById('requestForm');

// --- Fetch Requests from Live PythonAnywhere Backend ---
async function fetchRequests() {
    try {
        const response = await fetch(`${API_URL}/requests`);
        if (!response.ok) throw new Error('API server down');
        requests = await response.json();
        renderRequests();
    } catch (error) {
        console.warn('Backend API connection failed, falling back to LocalStorage:', error);
        requests = JSON.parse(localStorage.getItem('madad_requests')) || [];
        renderRequests();
    }
}

// --- Render Stats ---
function updateStats() {
    if (!statTotal) return;
    statTotal.textContent = requests.length;
    statOpen.textContent = requests.filter(r => r.status === 'Open').length;
    statAccepted.textContent = requests.filter(r => r.status === 'Accepted').length;
    statCompleted.textContent = requests.filter(r => r.status === 'Completed').length;
}

// --- Render Request Cards ---
function renderRequests() {
    const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
    const catVal = categoryFilter ? categoryFilter.value : 'all';
    const statusVal = statusFilter ? statusFilter.value : 'all';

    const filtered = requests.filter(req => {
        const matchesSearch = req.title.toLowerCase().includes(searchVal) || 
                              req.location.toLowerCase().includes(searchVal) ||
                              req.description.toLowerCase().includes(searchVal);
        const matchesCat = catVal === 'all' || req.category === catVal;
        const matchesStatus = statusVal === 'all' || req.status === statusVal;

        return matchesSearch && matchesCat && matchesStatus;
    });

    updateStats();

    if (filtered.length === 0) {
        requestsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>No matching requests found. Try adjusting your filters or search.</p>
            </div>
        `;
        return;
    }

    requestsContainer.innerHTML = filtered.map(req => {
        let badgeClass = 'badge-open';
        if (req.status === 'Accepted') badgeClass = 'badge-accepted';
        if (req.status === 'Completed') badgeClass = 'badge-completed';

        return `
            <div class="request-card">
                <div>
                    <div class="card-header">
                        <h3 class="card-title">${escapeHTML(req.title)}</h3>
                        <span class="badge ${badgeClass}">${req.status}</span>
                    </div>
                    
                    <div class="card-category">
                        <i class="fa-solid fa-tag"></i> ${escapeHTML(req.category)}
                    </div>

                    <p class="card-desc">${escapeHTML(req.description)}</p>
                </div>

                <div>
                    <div class="card-meta">
                        <span><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${escapeHTML(req.location)}</span>
                        <span><i class="fa-solid fa-user" style="color: var(--primary);"></i> ${escapeHTML(req.author)}</span>
                    </div>

                    <div class="card-actions">
                        ${req.status === 'Open' ? `
                            <button onclick="updateStatus(\${req.id}, 'Accepted')" class="btn-sm btn-help">
                                <i class="fa-solid fa-hand-holding-heart"></i> I Can Help
                            </button>
                        ` : ''}
                        
                        ${req.status === 'Accepted' ? `
                            <button onclick="updateStatus(\${req.id}, 'Completed')" class="btn-sm btn-complete">
                                <i class="fa-solid fa-check"></i> Mark Completed
                            </button>
                        ` : ''}

                        <button onclick="deleteRequest(${req.id})" class="btn-sm btn-delete" title="Delete Request">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Action Handlers (Live Backend + Local Fallback) ---
async function updateStatus(id, newStatus) {
    try {
        await fetch(`${API_URL}/requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    } catch (e) {
        console.error('API update status failed:', e);
    }
    
    requests = requests.map(req => req.id === id ? { ...req, status: newStatus } : req);
    localStorage.setItem('madad_requests', JSON.stringify(requests));
    renderRequests();
}

async function deleteRequest(id) {
    if (confirm('Are you sure you want to delete this request?')) {
        try {
            await fetch(`${API_URL}/requests/${id}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error('API delete request failed:', e);
        }
        
        requests = requests.filter(req => req.id !== id);
        localStorage.setItem('madad_requests', JSON.stringify(requests));
        renderRequests();
    }
}

// --- Form Submission Handling ---
if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newReq = {
            title: document.getElementById('reqTitle').value,
            category: document.getElementById('reqCategory').value,
            location: document.getElementById('reqLocation').value,
            author: document.getElementById('reqAuthor').value,
            description: document.getElementById('reqDescription').value,
            status: 'Open'
        };

        try {
            const response = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReq)
            });
            
            if (response.ok) {
                const createdReq = await response.json();
                requests.unshift(createdReq);
            } else {
                newReq.id = Date.now();
                requests.unshift(newReq);
            }
        } catch (err) {
            newReq.id = Date.now();
            requests.unshift(newReq);
        }

        localStorage.setItem('madad_requests', JSON.stringify(requests));
        renderRequests();

        requestForm.reset();
        const modal = document.getElementById('requestModal');
        if (modal) modal.classList.remove('active');
    });
}

// --- Event Listeners for Filters ---
if (searchInput) searchInput.addEventListener('input', renderRequests);
if (categoryFilter) categoryFilter.addEventListener('change', renderRequests);
if (statusFilter) statusFilter.addEventListener('change', renderRequests);

// --- Security Helper ---
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Initial Fetch and Render on Page Load
fetchRequests();
