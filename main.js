// Creates the main browser window
const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
// Creates file from filePath
const fs = require("fs");

// Loads electron-reloader package, which automatically refreshes changes from index.html
require("electron-reloader")(module);

let mainWindow;
let openedFilePath;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    // Hides default title bar style
    titleBarStyle: "hiddenInset",
    // Loads renderer.js and all paths into one
    webPreferences: {
      preload: path.join(app.getAppPath(), "renderer.js"),
    },
  });

  // Loads browser window with the dev tools already open. This is optional.
  mainWindow.webContents.openDevTools();
  mainWindow.loadFile("index.html");

  //   Adds custom menu to txt editor app
  const menuTemplate = [
    {
      label: "File",
      submenu: [],
    },
  ];
};

// Controls the lifecycle of the app and returns promise that is fulfilled when Electron is started
app.whenReady().then(createWindow);

// Shows users any errors
const handleError = () => {
  new Notification({
    title: "Error",
    body: "Something went wrong!",
  }).show();
};

// Opens dialog box that only lets app open .txt files
ipcMain.on("open-document-triggered", () => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];

      // Loads content of file
      fs.readFile(filePath, "utf8", (error, content) => {
        if (error) {
          handleError();
        } else {
          openedFilePath = filePath;
          mainWindow.webContents.send("document-opened", { filePath, content });
        }
      });
    });
});

// Listens to event from the renderer and calls back a function to be triggered
ipcMain.on("create-document-triggered", () => {
  // Shows user a dialog box to save their text file
  dialog
    .showSaveDialog(mainWindow, {
      // Restricts dialog only to txt files
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePath }) => {
      // Saves text file
      fs.writeFile(filePath, "", (error) => {
        if (error) {
          handleError();
        } else {
          openedFilePath = filePath;
          // Sends the event back to renderer
          mainWindow.webContents.send("document-created", filePath);
        }
      });
    });
});

// Listens for file content updated event
ipcMain.on("file-content-updated", (_, textareaContent) => {
  fs.writeFile(openedFilePath, textareaContent, (error) => {
    if (error) {
      handleError();
    }
  });
});
