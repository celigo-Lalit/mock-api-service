// <!-- JavaScript to handle dynamic content -->
const form = document.getElementById('routeForm');
const pathInput = document.getElementById('path');
const treeContainer = document.getElementById('treeContainer');
pathId = "";


// Remove the auto-load since authentication handles this now

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const path = pathInput.value;
    await addEditRoutes(path, getEditedJSON());
    fetchRoutes();
});

async function fetchRoutes() {
    try {
        const response = await authenticatedFetch('/routes/summary');
        if (!response) return; // User was logged out
        
        const routes = await response.json();
        
        if (routes.length === 0) {
            treeContainer.innerHTML = `
                <div class="p-4 text-muted" style="text-align: left;">
                    <i class="fas fa-route fa-2x mb-2"></i>
                    <p>No routes created yet</p>
                    <small>Create your first API route using the form</small>
                </div>
            `;
            return;
        }
        
        var data = buildHierarchy(routes);
        treeContainer.innerHTML = ''; // Clear existing content
        renderTreeHierarchy(data, treeContainer);
    } catch (error) {
        console.error('Error fetching routes:', error);
        treeContainer.innerHTML = `
            <div class="p-4 text-danger" style="text-align: left;">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p>Failed to load routes</p>
            </div>
        `;
    }
}

function buildHierarchy(routes) {
    const hierarchy = {};

    routes.forEach(({ _id, path }) => {
        const segments = path.split('/').filter(Boolean);
        let currentLevel = hierarchy;

        segments.forEach((segment, index) => {
            if (!currentLevel[segment]) {
                currentLevel[segment] = {
                    __meta__: {
                        _id: index === segments.length - 1 ? _id : null,
                        path: '/' + segments.slice(0, index + 1).join('/')
                    },
                    __children__: {}
                };
            }
            currentLevel = currentLevel[segment].__children__;
        });
    });

    return hierarchy;
}

function renderTreeHierarchy(hierarchy, parentElement, level = 0) {
    // Sort: folders first, then files
    const items = Object.keys(hierarchy).sort((a, b) => {
        const aHasChildren = Object.keys(hierarchy[a].__children__).length > 0;
        const bHasChildren = Object.keys(hierarchy[b].__children__).length > 0;
        if (aHasChildren && !bHasChildren) return -1;
        if (!aHasChildren && bHasChildren) return 1;
        return a.localeCompare(b);
    });

    items.forEach(key => {
        const node = hierarchy[key];
        const hasChildren = Object.keys(node.__children__).length > 0;
        const isEndpoint = node.__meta__._id !== null;

        if (hasChildren) {
            // Render folder
            renderFolder(key, node, parentElement, level);
        } else if (isEndpoint) {
            // Render endpoint file
            renderEndpoint(node, parentElement, level);
        }
    });
}

function renderFolder(folderName, node, parentElement, level) {
    const folderItem = document.createElement('div');
    folderItem.className = 'tree-item folder-item';
    folderItem.style.paddingLeft = `${level * 16 + 12}px`;

    // Expand/collapse button
    const expandBtn = document.createElement('div');
    expandBtn.className = 'tree-expand expanded';
    expandBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    
    // Folder icon
    const folderIcon = document.createElement('div');
    folderIcon.className = 'tree-icon folder-icon';
    folderIcon.innerHTML = '<i class="fas fa-folder"></i>';
    
    // Folder label
    const folderLabel = document.createElement('div');
    folderLabel.className = 'tree-label';
    folderLabel.textContent = folderName;

    folderItem.appendChild(expandBtn);
    folderItem.appendChild(folderIcon);
    folderItem.appendChild(folderLabel);
    
    parentElement.appendChild(folderItem);

    // Children container
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'tree-children';
    parentElement.appendChild(childrenDiv);

    // Render children
    renderTreeHierarchy(node.__children__, childrenDiv, level + 1);

    // Toggle functionality
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFolder(expandBtn, childrenDiv);
    });
    
    folderItem.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFolder(expandBtn, childrenDiv);
    });
}

function renderEndpoint(node, parentElement, level) {
    const endpointItem = document.createElement('div');
    endpointItem.className = 'tree-item endpoint-item';
    endpointItem.style.paddingLeft = `${level * 16 + 32}px`; // Extra indent for files

    // File icon
    const fileIcon = document.createElement('div');
    fileIcon.className = 'tree-icon file-icon';
    fileIcon.innerHTML = '<i class="fas fa-file-code"></i>';
    
    // File label
    const fileLabel = document.createElement('div');
    fileLabel.className = 'tree-label';
    fileLabel.textContent = node.__meta__.path;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'tree-actions';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        editRoute(node.__meta__);
    };

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteRoute(node.__meta__._id);
    };

    // Open button
    const openBtn = document.createElement('button');
    openBtn.className = 'action-btn open';
    openBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
    openBtn.title = 'Open';
    openBtn.onclick = (e) => {
        e.stopPropagation();
        window.open(node.__meta__.path, '_blank');
    };

    // Clone button
    const cloneBtn = document.createElement('button');
    cloneBtn.className = 'action-btn clone';
    cloneBtn.innerHTML = '<i class="fas fa-copy"></i>';
    cloneBtn.title = 'Clone';
    cloneBtn.onclick = (e) => {
        e.stopPropagation();
        cloneRoute(node.__meta__);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(openBtn);
    actions.appendChild(cloneBtn);

    endpointItem.appendChild(fileIcon);
    endpointItem.appendChild(fileLabel);
    endpointItem.appendChild(actions);
    
    parentElement.appendChild(endpointItem);
}

function toggleFolder(expandBtn, childrenDiv) {
    const isExpanded = expandBtn.classList.contains('expanded');
    
    if (isExpanded) {
        expandBtn.classList.remove('expanded');
        childrenDiv.classList.add('collapsed');
    } else {
        expandBtn.classList.add('expanded');
        childrenDiv.classList.remove('collapsed');
    }
}

// Ping the server every 2 minutes to keep the connection alive
setInterval(async () => {
    try {
        const response = await fetch('/ping');
        if (!response.ok) {
            console.error('Ping failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error during ping:', error);
    }
}, 120000);