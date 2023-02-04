// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fetch, { Headers } from "node-fetch";
import { Configuration, NetworkInterfacesApi } from 'vidios_iapid_api'

async function getQuotes() {
  const response = await fetch("https://zenquotes.io/api/quotes");
  const data = await response.json();
  console.log(data);
  console.log("Above is the data");
}

// create a function to make a GET request to the API and return the data from http://192.168.137.12/sys/svc/core/api/v1/devices/1/programs/input_1 using the fetch API
// http://192.168.137.12/sys/svc/core/api/v1/ts/snapshot/in/input_1/pids/49

async function getPrograms() {
  let url = 'http://192.168.137.12/sys/svc/core/api/v1/ts/in/input_1/programs.json';

  console.log(Buffer.from('admin:admin').toString('base64'));

  const headers = new Headers({
    'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64'),
  });


  const response = await fetch(url, {
    method: 'get',
    headers: headers
  });

  //console.log(response);

  const data = await response.json();
  console.log(data);
  console.log("Above is the second data");

}



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  //getQuotes();
  getPrograms();
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  console.log(
    'Congratulations, your extension "wisi-video-platform-control-api" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "wisi-video-platform-control-api.testAPI",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from WISI Video Platform Control API!"
      );
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
