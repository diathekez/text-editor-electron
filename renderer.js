const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    // Stores all DOM selectors in one place for easier use
    const el = {
        // Selector for element that contains document name
        documentName: document.getElementById("documentName"),
        createDocumentBtn: document.getElementById("createDocumentBtn"),
    };

    el.createDocumentBtn.addEventListener("click", () => {
        // Lets the main process know that a click event has happened
        ipcRenderer.send("create-document-triggered")
    });

    // Callback function: Payload is the filePath
    ipcRenderer.on("document-created", (_, filePath) => {
        el.documentName.innerHTML = filePath;
    });
});