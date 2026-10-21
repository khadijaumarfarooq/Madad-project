// --- Initial State & Mock Data (6 Diverse Community Requests) ---
let requests = JSON.parse(localStorage.getItem('madad_requests')) || [
    {
        id: 1,
        title: 'Urgent O+ Blood Donor Needed for Patient',
        category: 'Blood Donation',
        location: 'Liaquat University Hospital, Hyderabad',
        author: 'Ali Raza (0300-9876543)',
        description: 'Need 2 units of O+ blood urgently for a surgery scheduled this evening. Please reach out if available.',
        status: 'Open'
    },
    {
        id: 2,
        title: 'Help Carrying Heavy Groceries for Elderly Neighbor',
        category: 'Elderly Support',
        location: 'Qasimabad, Block C',
        author: 'Sana Memon (0312-5554321)',
        description: 'My grandmother needs assistance carrying monthly grocery bags from the car up to her 3rd-floor apartment.',
        status: 'Accepted'
    },
    {
        id: 3,
        title: 'Basic Mathematics Tutoring for 8th Grade Student',
        category: 'Education / Tutoring',
        location: 'Latifabad Unit 7',
        author: 'Farhan Ahmed (0333-1122334)',
        description: 'Looking for a volunteer student or teacher who can spend 2 hours on weekends helping with algebra basics.',
        status: 'Open'
    },
    {
        id: 4,
        title: 'Car Battery Jump-Start Needed',
        category: 'Other',
        location: 'Sindh University Campus Gate',
        author: 'Hamza Khan (0301-7788990)',
        description: 'Car battery went flat near the main entrance gate. Looking for anyone with jumper cables nearby.',
        status: 'Open'
    },
    {
        id: 5,
        title: 'Wheelchair Escort Assistance to Clinic',
        category: 'Elderly Support',
        location: 'Saddar, Hyderabad',
        author: 'Zainab Bibi (0345-4433221)',
        description: 'Need a volunteer to help guide and accompany an elderly relative using a wheelchair for a 30-minute doctor appointment.',
        status: 'Completed'
    },
    {
        id: 6,
        title: 'Volunteers Needed to Search for Lost Persian Cat',
        category: 'Other',
        location: 'Autobahn Road, Latifabad',
        author: 'Ayesha Shah (0321-9988776)',
        description: 'White Persian cat went missing near Autobahn Road. Looking for 2-3 volunteers to help search nearby streets.',
        status: 'Open'
    }
];

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

// --- Save to LocalStorage ---
function saveRequests() {
    localStorage.setItem('madad_requests', JSON.stringify(requests));
}

// --- Render Stats ---
function updateStats() {
    statTotal.textContent = requests.length;
    statOpen.textContent = requests.filter(r => r.status === 'Open').length;
    statAccepted.textContent = requests.filter(r => r.status === 'Accepted').length;
    statCompleted.textContent = requests.filter(r => r.status === 'Completed').length;
}

// --- Render Request Cards ---
function renderRequests() {
    const searchVal = searchInput.value.toLowerCase();
    const catVal = categoryFilter.value;
    const statusVal = statusFilter.value;

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
                        <i class="fa-solid fa-tag"></i> ${req.category}
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

// --- Action Handlers ---
function updateStatus(id, newStatus) {
    requests = requests.map(req => req.id === id ? { ...req, status: newStatus } : req);
    saveRequests();
    renderRequests();
}

function deleteRequest(id) {
    if (confirm('Are you sure you want to delete this request?')) {
        requests = requests.filter(req => req.id !== id);
        saveRequests();
        renderRequests();
    }
}

// --- Form Submission Handling ---
requestForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newReq = {
        id: Date.now(),
        title: document.getElementById('reqTitle').value,
        category: document.getElementById('reqCategory').value,
        location: document.getElementById('reqLocation').value,
        author: document.getElementById('reqAuthor').value,
        description: document.getElementById('reqDescription').value,
        status: 'Open'
    };

    requests.unshift(newReq);
    saveRequests();
    renderRequests();

    requestForm.reset();
    document.getElementById('requestModal').classList.remove('active');
});

// --- Event Listeners for Filters ---
searchInput.addEventListener('input', renderRequests);
categoryFilter.addEventListener('change', renderRequests);
statusFilter.addEventListener('change', renderRequests);

// --- Security Helper ---
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Initial Render on Page Load
renderRequests();
