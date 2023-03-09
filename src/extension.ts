// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fetch, { Headers } from "node-fetch";
import cheerio from "cheerio";
import React from "react";
import * as ReactDOMServer from "react-dom/server";

//import { Configuration, NetworkInterfacesApi } from 'vidios_iapid_api'
const config = vscode.workspace.getConfiguration();
const ip = config.get<string>("chassis.ip");
console.log(ip);

// create a function to make a GET request to the API and return the data from http://192.168.137.12/sys/svc/core/api/v1/devices/1/programs/input_1 using the fetch API
// http://192.168.137.12/sys/svc/core/api/v1/ts/snapshot/in/input_1/pids/49

// Define your modified component
interface API_DiagnosticsProps {
  items: string[];
}

async function getPrograms() {
  let url =
    "http://192.168.137.12/sys/svc/core/api/v1/ts/in/input_1/programs.json";

  console.log(Buffer.from("admin:admin").toString("base64"));

  const headers = new Headers({
    Authorization: "Basic " + Buffer.from("admin:admin").toString("base64"),
  });

  const response = await fetch(url, {
    method: "get",
    headers: headers,
  });

  //console.log(response);

  const data = await response.json();
  console.log(data);
}

async function parseWebsite(): Promise<{
  title: string;
  body: string | null;
  code: string[];
}> {
  const response = await fetch(
    "http://nexus.incanetworks.com/artifacts/vidios-iapid_2.5.2/openapi/html/"
  );
  const html = await response.text();
  const $ = cheerio.load(html, { xmlMode: false, decodeEntities: true });
  const title = $("title").text();
  const body = $("body").html();
  const code = $("code")
    .map((i, el) => {
      return $(el)
        .find("span.pln")
        .map((j, line) => $(line).text())
        .get();
    })
    .get();
  console.log(code);
  return { title, body, code };
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Create a new webview panel
  const panel = vscode.window.createWebviewPanel(
    "extension.api",
    "WISI Video Platform Control API",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  // Define your array of items
  const items = ["Item 1", "Item 2", "Item 3"];


  parseWebsite();

  // getPrograms();
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  console.log(
    'Congratulations, your extension "wisi-video-platform-control-api" is now active!'
  );

  // create a dictionary with api endpoints and their corresponding functions
  type ApiDictionary = {
    [key: string]: {
      endpoint: string;
      description: string;
      type?: string;
      payload?: any;
    };
  };

  const apis: ApiDictionary = {
    get: {
      endpoint:
        "http://192.168.137.12/sys/svc/core/api/v1/ts/in/input_1/programs.json",
      description: "Endpoint for retrieving user data. (call getPrograms())",
      type: "GET",
    },
    put: {
      endpoint:
        "http://192.168.137.12/sys/svc/core/api/v1/dvp/streams/ip/sources/cfmu5tj7nsis0n51siu0",
      description: "Provides URI for updating user data.",
      type: "PUT",
    },
    post: {
      endpoint:
        "http://192.168.137.12/sys/svc/core/api/v1/dvp/streams/ip/sources/cfmu5tj7nsis0n51siu0",
      description:
        "Provides URI for creating new configuration data within in the chassis.",
      type: "POST",
    },
    delete: {
      endpoint:
        "http://192.168.137.12/sys/svc/core/api/v1/dvp/streams/ip/sources/cfmu5tj7nsis0n51siu0",
      description:
        "Provides URI for deleting configuration data within in the chassis",
      type: "DELETE",
    },
  };

  // map apis to return a label and detail property for each api
  const apiList = Object.keys(apis).map((api) => {
    return {
      label: api,
      detail: apis[api].description,
    };
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "wisi-video-platform-control-api.testAPI",
    // make an async function to show the quick pick menu and select an API from const apis
    async () => {
      const selection = await vscode.window.showQuickPick(apiList, {
        matchOnDetail: true,
      });

      if (!selection) {
        return;
      }
      // if the user selects the an option with type: GET, all the getPrograms() function
      else if (apis[selection.label].type === "GET") {
        getPrograms();
      } else {
        const newSelection = await vscode.window.showQuickPick(apiList, {
          matchOnDetail: true,
        });
      }
    },
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from WISI Video Platform Control API!"
      );
    }
  );

  let disposable2 = vscode.commands.registerCommand(
    "wisi-video-platform-control-api.getChassisInfo",
    () => {
      // Open the chassis web page externally URI
      vscode.env.openExternal(vscode.Uri.parse("http://admin:admin@" + ip));
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {}
