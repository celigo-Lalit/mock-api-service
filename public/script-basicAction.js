async function addEditRoutes(path, response) {
    try {
        let apiResponse;
        if (pathId != "") {
            apiResponse = await authenticatedFetch('/routes/' + pathId, {
                method: 'PUT',
                body: JSON.stringify({ path, response }),
            });
        } else {
            apiResponse = await authenticatedFetch('/routes', {
                method: 'POST',
                body: JSON.stringify({ path, response }),
            });
        }
        
        if (!apiResponse) return; // User was logged out
        
        if (apiResponse.ok) {
            pathInput.value = '';
            editor.set(initialJson);
            pathId = "";
        } else {
            const errorData = await apiResponse.json();
            alert('Error: ' + (errorData.message || 'Operation failed'));
        }
    } catch (error) {
        console.error('Error saving route:', error);
        alert('Network error. Please try again.');
    }
}

async function editRoute(route) {
    try {
        pathInput.value = route.path;
        const res = await authenticatedFetch('/routes/' + route._id);
        if (!res) return; // User was logged out
        
        const resp = await res.json();
        editor.set(resp.response);
        pathId = route._id;
    } catch (error) {
        console.error('Error fetching route:', error);
        alert('Failed to load route for editing');
    }
}

async function deleteRoute(id) {
    if (confirm('Are you sure you want to delete this route?')) {
        try {
            const response = await authenticatedFetch(`/routes/${id}`, {
                method: 'DELETE',
            });
            if (!response) return; // User was logged out
            
            if (response.ok) {
                fetchRoutes();
            } else {
                const errorData = await response.json();
                alert('Error: ' + (errorData.message || 'Delete failed'));
            }
        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Network error. Please try again.');
        }
    }
}

async function cloneRoute(route) {
    try {
        pathInput.value = route.path;
        const res = await authenticatedFetch('/routes/' + route._id);
        if (!res) return; // User was logged out
        
        const full = await res.json();
        editor.set(full.response);
        pathId = ''; // reset—so saving creates a new route, not edits existing
    } catch (error) {
        console.error('Error cloning route:', error);
        alert('Failed to clone route');
    }
}
