//Editor Logic
const container = document.getElementById("jsoneditor");
// Define options for the editor
const options = {
    mode: 'code', // Start in tree mode
    modes: ['code', 'form', 'text', 'tree', 'view'], // Allowed modes
    onError: function (err) {
        alert(err.toString());
    }
};
// Create the editor
const editor = new JSONEditor(container, options);
// Set initial JSON data
const initialJson = {
    "message": "Hello, World!",
    "status": true,
    "items": [1, 2, 3]
};

editor.set(initialJson);

// Get Editor data
function getEditedJSON() {
    try {
        const updatedJson = editor.get();
        console.log("Edited JSON:", updatedJson);
        // You can now use updatedJson as needed
        return updatedJson;
    } catch (err) {
        alert("Invalid JSON data: " + err);
    }
}