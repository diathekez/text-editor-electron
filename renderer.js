const { ipcRenderer } = require("electron");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  // Stores all DOM selectors in one place for easier use
  const el = {
    // Selector for element that contains document name
    documentName: document.getElementById("documentName"),
    createDocumentBtn: document.getElementById("createDocumentBtn"),
    openDocumentBtn: document.getElementById("openDocumentBtn"),
    fileTextarea: document.getElementById("fileTextarea"),
  };

  // Wraps all code below
  const handleDocumentChange = (filePath, content = "") => {
    el.documentName.innerHTML = path.parse(filePath).base;
    el.fileTextarea.removeAttribute("disabled");
    el.fileTextarea.value = content;
    el.fileTextarea.focus();
  };

  el.createDocumentBtn.addEventListener("click", () => {
    // Lets the main process know that a click event has happened
    ipcRenderer.send("create-document-triggered");
  });

  el.openDocumentBtn.addEventListener("click", () => {
    ipcRenderer.send("open-document-triggered");
  });

  // Updates content of file when user is writing in textarea
  el.fileTextarea.addEventListener("input", (e) => {
    ipcRenderer.send("file-content-updated", e.target.value);
  });

  // Listens to load the contents of txt file (document open)
  ipcRenderer.on("document-opened", (_, { filePath, content }) => {
    handleDocumentChange(filePath, content);
  });

  // Callback function: Payload is the filePath.
  // Disables textarea until a file is opened or created
  // Focuses textarea when doc is created
  ipcRenderer.on("document-created", (_, filePath) => {
    handleDocumentChange(filePath);
  });
});
