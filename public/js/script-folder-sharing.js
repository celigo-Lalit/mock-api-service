// Folder Sharing Functionality

let currentFolderPath = null;
let userSearchTimeout = null;

// Open folder sharing modal
async function shareFolderModal(folderPath, folderName) {
    console.log('Opening folder share modal for:', folderPath, folderName);
    currentFolderPath = folderPath;
    
    // Update modal title and folder path
    document.getElementById('shareFolderPath').textContent = folderPath;
    
    // Clear previous data
    document.getElementById('shareUserEmail').value = '';
    document.getElementById('userSearchResults').innerHTML = '';
    hideMessages();
    
    // Load current shares
    await loadCurrentFolderShares();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('folderShareModal'));
    modal.show();
}

// Load current folder shares
async function loadCurrentFolderShares() {
    try {
        const response = await authenticatedFetch(`/folders/shares?folderPath=${encodeURIComponent(currentFolderPath)}`);
        if (!response) return;
        
        const data = await response.json();
        
        const sharesDiv = document.getElementById('currentFolderShares');
        
        if (data.sharedWith.length === 0) {
            sharesDiv.innerHTML = '<p class="text-muted">This folder is not shared with anyone yet.</p>';
        } else {
            const sharesHtml = data.sharedWith.map(share => `
                <div class="folder-share-item">
                    <div>
                        <strong>${share.name}</strong>
                        <div class="text-muted small">${share.email}</div>
                        <div class="text-muted small">${share.routeCount} route(s) shared</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFolderShare('${share.id}')">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `).join('');
            sharesDiv.innerHTML = sharesHtml;
        }
    } catch (error) {
        console.error('Error loading folder shares:', error);
        document.getElementById('currentFolderShares').innerHTML = '<p class="text-danger">Failed to load current shares</p>';
    }
}

// Search users
async function searchUsers(query) {
    if (query.length < 2) {
        document.getElementById('userSearchResults').innerHTML = '';
        return;
    }
    
    try {
        const response = await authenticatedFetch(`/users/search?q=${encodeURIComponent(query)}`);
        if (!response) return;
        
        const users = await response.json();
        displayUserSearchResults(users);
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

// Display user search results
function displayUserSearchResults(users) {
    const resultsDiv = document.getElementById('userSearchResults');
    
    if (users.length === 0) {
        resultsDiv.innerHTML = '<div class="text-muted small">No users found</div>';
        return;
    }
    
    const resultsHtml = users.map(user => `
        <div class="user-search-result" onclick="selectUser('${user.email}', '${user.name}')">
            <div><strong>${user.name}</strong></div>
            <div class="text-muted small">${user.email}</div>
        </div>
    `).join('');
    
    resultsDiv.innerHTML = resultsHtml;
}

// Select user from search results
function selectUser(email, name) {
    document.getElementById('shareUserEmail').value = email;
    document.getElementById('userSearchResults').innerHTML = '';
}

// Share folder
async function shareFolderWithUser(userEmail) {
    try {
        const response = await authenticatedFetch('/folders/share', {
            method: 'POST',
            body: JSON.stringify({
                folderPath: currentFolderPath,
                userEmail: userEmail
            })
        });
        
        if (!response) return;
        
        if (response.ok) {
            const result = await response.json();
            if (result.routesShared === 0) {
                showError('No routes found in this folder to share.');
            } else {
                showSuccess(`${result.message} (${result.routesShared} routes)`);
            }
            
            // Clear form and reload shares
            document.getElementById('shareUserEmail').value = '';
            document.getElementById('userSearchResults').innerHTML = '';
            await loadCurrentFolderShares();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to share folder');
        }
    } catch (error) {
        console.error('Error sharing folder:', error);
        showError('Network error. Please try again.');
    }
}

// Remove folder share
async function removeFolderShare(userId) {
    try {
        const response = await authenticatedFetch('/folders/share', {
            method: 'DELETE',
            body: JSON.stringify({
                folderPath: currentFolderPath,
                userId: userId
            })
        });
        
        if (!response) return;
        
        if (response.ok) {
            const result = await response.json();
            showSuccess(`${result.message} (${result.routesUpdated} routes)`);
            await loadCurrentFolderShares();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to remove folder sharing');
        }
    } catch (error) {
        console.error('Error removing folder share:', error);
        showError('Network error. Please try again.');
    }
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('folderShareSuccess');
    successDiv.textContent = message;
    successDiv.classList.remove('d-none');
    
    const errorDiv = document.getElementById('folderShareError');
    errorDiv.classList.add('d-none');
    
    setTimeout(() => {
        successDiv.classList.add('d-none');
    }, 5000);
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('folderShareError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    
    const successDiv = document.getElementById('folderShareSuccess');
    successDiv.classList.add('d-none');
    
    setTimeout(() => {
        errorDiv.classList.add('d-none');
    }, 5000);
}

// Hide all messages
function hideMessages() {
    document.getElementById('folderShareError').classList.add('d-none');
    document.getElementById('folderShareSuccess').classList.add('d-none');
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Folder share form submission
    document.getElementById('folderShareForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const userEmail = document.getElementById('shareUserEmail').value.trim();
        if (userEmail) {
            shareFolderWithUser(userEmail);
        }
    });
    
    // User search on input
    document.getElementById('shareUserEmail').addEventListener('input', function(e) {
        clearTimeout(userSearchTimeout);
        userSearchTimeout = setTimeout(() => {
            searchUsers(e.target.value.trim());
        }, 300);
    });
}); 