// Creates the main browser window
const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
// Creates file from filePath
const fs = require("fs");

// Loads electron-reloader package, which automatically refreshes changes from index.html
require("electron-reloader")(module);

let mainWindow;

const createWindow = () => {
    const mainWindow = new BrowserWindow({
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
};

// Controls the lifecycle of the app and returns promise that is fulfilled when Electron is started
app.whenReady().then(createWindow);
// Listens to event from the renderer and calls back a function to be triggered
ipcMain.on("create-document-triggered", () =>{
    // Shows user a dialog box to save their text file
    dialog.showSaveDialog(mainWindow, {
        // Restricts dialog only to txt files
        filters: [{ name: "text files", extensions: ["txt"]}],
    })
    .then(({ filePath }) => {
        console.log("file path", filePath);
        // Saves text file
        fs.writeFile(filePath, "", (error) => {
            if (error) {
                console.log("error")
            } else {
                // Sends the event back to renderer
                mainWindow.webContents.send("document-created", filePath);
            }
        });
    });
});