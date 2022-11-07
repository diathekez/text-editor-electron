// Creates the main browser window
const { BrowserWindow, app, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
// Creates file from filePath
const fs = require("fs");

// Makes it so devtools only open when in dev mode
const isDevEnv = process.env.NODE_ENV === "development;";

if (isDevEnv) {
  try {
    require("electron-reloader")(module);
  } catch {}
}

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

  // Loads browser window with the dev tools already open. This is optional. Will only run in dev mode.
  if (isDevEnv) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.loadFile("index.html");

  // Adds custom menu on the interface using an array
  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Add New File",
          click: () => ipcMain.emit("open-document-trigger"),
        },
        {
          label: "Create Add New File",
          click: () => ipcMain.emit("create-document-trigger"),
        },
        {
          type: "seperator",
        },
        {
          label: "Open Recent",
          role: "recentdocuments",
          submenu: [
            {
              label: "Clear Recent",
              role: "clearrecentdocuments",
            },
          ],
        },
        {
          role: "quit",
        },
      ],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
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

const openFile = (filePath) => {
  // Loads content of file
  fs.readFile(filePath, "utf8", (error, content) => {
    if (error) {
      handleError();
    } else {
      app.addRecentDocument(filePath);
      openedFilePath = filePath;
      mainWindow.webContents.send("document-opened", { filePath, content });
    }
  });
};

// Event that lets you open a recent file
app.on("open-file", (_, filePath) => {
  openFile(filePath);
});

// Opens dialog box that only lets app open .txt files
ipcMain.on("open-document-triggered", () => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];
      openFile(filePath);
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
          app.addRecentDocument(filePath);
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
