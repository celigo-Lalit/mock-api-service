// <!-- JavaScript to handle dynamic content -->
const form = document.getElementById('routeForm');
const pathInput = document.getElementById('path');
const routesTableBody = document.getElementById('routesTableBody');
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
        var data = buildHierarchy(routes);
        routesTableBody.innerHTML = ''; // Clear existing rows
        renderHierarchy(data, routesTableBody);
    } catch (error) {
        console.error('Error fetching routes:', error);
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

function renderHierarchy(hierarchy, parentElement, parentPath = '') {
    for (const key in hierarchy) {
        const node = hierarchy[key];
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        const fullPath = node.__meta__.path;
        const hasChildren = Object.keys(node.__children__).length > 0;

        cell.style.paddingLeft = `${(fullPath.split('/').length - 2) * 20}px`;

        if (hasChildren) {
            const toggleBtn = document.createElement('span');
            toggleBtn.textContent = '+';
            toggleBtn.classList.add('toggle-btn');
            toggleBtn.addEventListener('click', () => {
                const isExpanded = toggleBtn.textContent === '-';
                toggleBtn.textContent = isExpanded ? '+' : '-';

                document.querySelectorAll(`.parent-${fullPath.replace(/\//g, '-')}`).forEach(childRow => {
                    childRow.classList.toggle('hidden', isExpanded);
                });
            });
            cell.appendChild(toggleBtn);
        } else {
            cell.style.paddingLeft = `${(fullPath.split('/').length - 1) * 20}px`;
        }

        const textNode = document.createTextNode(fullPath);
        cell.appendChild(textNode);
        row.appendChild(cell);
        row.classList.add(`parent-${parentPath.replace(/\//g, '-')}`);
        if (parentPath) {
            row.classList.add('hidden');
        }
        parentElement.appendChild(row);

        if (hasChildren) {
            renderHierarchy(node.__children__, parentElement, fullPath);
        }

        if (!hasChildren) {
            // Edit Icon
            const tdEdit = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-primary';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => editRoute(node.__meta__));
            tdEdit.appendChild(editBtn);
            row.appendChild(tdEdit);

            // Delete Icon
            const tdDelete = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => deleteRoute(node.__meta__._id));
            tdDelete.appendChild(deleteBtn);
            row.appendChild(tdDelete);

            // Open Icon
            const tdOpen = document.createElement('td');
            const openLink = document.createElement('a');
            openLink.className = 'btn btn-sm btn-success';
            openLink.innerHTML = '<i class="fas fa-external-link-alt"></i>';
            openLink.href = node.__meta__.path;
            openLink.target = '_blank';
            tdOpen.appendChild(openLink);
            row.appendChild(tdOpen);

            // Clone Icon column
            const tdClone = document.createElement('td');
            const cloneBtn = document.createElement('button');
            cloneBtn.className = 'btn btn-sm btn-secondary';
            cloneBtn.innerHTML = '<i class="fas fa-clone"></i>'; // Font Awesome clone icon :contentReference[oaicite:2]{index=2}
            cloneBtn.addEventListener('click', () => cloneRoute(node.__meta__));
            tdClone.appendChild(cloneBtn);
            row.appendChild(tdClone);
        }


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