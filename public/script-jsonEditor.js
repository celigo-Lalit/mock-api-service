//Editor Logic
let editor = null;
const initialJson = {
    "message": "Hello, World!",
    "status": true,
    "items": [1, 2, 3]
};

// Initialize editor function
function initializeJSONEditor() {
    if (editor) return; // Already initialized
    
    const container = document.getElementById("jsoneditor");
    if (!container) return;
    
    // Define options for the editor
    const options = {
        mode: 'code',
        modes: ['code', 'form', 'text', 'tree', 'view'],
        onError: function (err) {
            alert(err.toString());
        }
    };
    
    // Create the editor
    editor = new JSONEditor(container, options);
    
    // Set initial JSON data
    editor.set(initialJson);
    
    // Force refresh to fix any layout issues
    setTimeout(() => {
        if (editor && editor.refresh) {
            editor.refresh();
        }
    }, 100);
}

// Get Editor data
function getEditedJSON() {
    try {
        if (!editor) {
            console.warn('JSON Editor not initialized yet');
            return initialJson;
        }
        const updatedJson = editor.get();
        console.log("Edited JSON:", updatedJson);
        return updatedJson;
    } catch (err) {
        alert("Invalid JSON data: " + err);
        return initialJson;
    }
}

// Set Editor data
function setEditorJSON(jsonData) {
    try {
        if (!editor) {
            console.warn('JSON Editor not initialized yet');
            return;
        }
        editor.set(jsonData);
    } catch (err) {
        alert("Error setting JSON data: " + err);
    }
}