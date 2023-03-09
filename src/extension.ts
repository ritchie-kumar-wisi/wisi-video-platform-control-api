// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fetch, { Body, Headers, Response } from "node-fetch";
import cheerio from "cheerio";
import React from "react";
import * as ReactDOMServer from "react-dom/server";

//import { Configuration, NetworkInterfacesApi } from 'vidios_iapid_api'
const config = vscode.workspace.getConfiguration();
const ip = config.get<string>("chassis.ip");
console.log(ip);

// create a function to make a GET request to the API and return the data from http://192.168.137.12/sys/svc/core/api/v1/devices/1/programs/input_1 using the fetch API
// http://192.168.137.12/sys/svc/core/api/v1/ts/snapshot/in/input_1/pids/49

interface Endpoint {
  endpoint: string;
  label: string;
  description: string;
}

interface ApiDictionary {
  get: {
    endpoints: Endpoint[];
  };
  put: {
    endpoints: Endpoint[];
  };
  post: {
    endpoints: Endpoint[];
  };
  delete: {
    endpoints: Endpoint[];
  };
}

const apis: ApiDictionary = {
  get: {
    endpoints: [
      // Add additional endpoints as needed
    ],
  },
  put: {
    endpoints: [
      // Add additional endpoints as needed
    ],
  },
  post: {
    endpoints: [
      // Add additional endpoints as needed
    ],
  },
  delete: {
    endpoints: [
      // Add additional endpoints as needed
    ],
  },
};

function addEndpoint(method: keyof ApiDictionary, endpoint: Endpoint) {
  apis[method].endpoints.push(endpoint);
}





const headers = new Headers({
  Authorization: "Basic " + Buffer.from("admin:admin").toString("base64"),
  "Content-Type": "application/json",
});

const baseURL = "http://" + ip;



const getInputNames = async (): Promise<{ inputNames: string[]; row_ids: number[]; stream_ids: string[] }> => {
  let { data, status_code } = await getInputSources();
  let inputNames = [];
  let row_ids = [];
  let stream_ids = [];
  for (let input of data) {
    inputNames.push(input.values[10][0].dn); // specific to this API call
    row_ids.push(input.row_id);
    stream_ids.push(input.name);
  }
  return { inputNames, row_ids, stream_ids };
};



const getInputSources = async (): Promise<{ data: any; status_code: number; }> => {
  let url = baseURL + "/sys/svc/core/api/v1/devices/1/services/urn:incanetworks-com:serviceId:VideoRelay/tables/source_streams/store";
  const response = await fetch(url, {
    method: "get",
    headers: headers,
  });

  const data = await response.json();
  return { data, status_code: response.status };
}


const getPrograms = async (): Promise<{ data: any; status_code: number; }> => {
  let url = baseURL + "/sys/svc/core/api/v1/ts/in/input_1/programs.json";

  const response = await fetch(url, {
    method: "get",
    headers: headers,
  });
  let status_code = response.status;

  const data = await response.json();
  return { data, status_code };
}

const getRequest = async (endpoint: string): Promise<{ data: any; status_code: number; }> => {
  let url = endpoint;

  const response = await fetch(url, {
    method: "get",
    headers: headers,
  });
  let status_code = response.status;

  const data = await response.json();
  return { data, status_code };
}

const putRequest = async (endpoint: string, body: any): Promise<{ data: any; status_code: number; }> => {
  let url = endpoint;

  const response = await fetch(url, {
    method: "put",
    headers: headers,
    body: body
  });

  let status_code = response.status;

  const data = await response.json();
  return { data, status_code };
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
  //console.log(code);
  return { title, body, code };
}

function displayResponse(response: Object, channel: vscode.OutputChannel) {
  const responseString = JSON.stringify(response, null, 2);
  const responseLines = responseString.split('\n');
  responseLines.forEach(line => channel.appendLine(line));
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel('WISI Output Channel');
  channel.show();
  channel.appendLine('WISI Video Platform Control API Extension Activated');
  vscode.window.showInformationMessage('WISI Video Platform Control API Extension Activated');

  let inputs = await getInputSources();
  //let { inputNames, row_ids } = await getInputNames();
  let { data, status_code } = await getPrograms();
  //console.log(data);
  //console.log(inputNames, row_ids);
  displayResponse(inputs, channel);
  // display the inputs in a list view to the channel
  // display every part of the object in the list view



  // Create the webview panel
  const panel = vscode.window.createWebviewPanel(
    'listView',
    'List View',
    vscode.ViewColumn.One,
    {}
  );

  // Define an array of items to display in the webview
  let items = ['WISI Video Platform Control API Extension Activated'];

  // Generate the HTML content for the webview
  function generateHtml() {
    return `
      <ul>
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }

  // Set the initial HTML content for the webview panel
  panel.webview.html = generateHtml();

  // Define a command to update the webview content
  const add_item_to_list = vscode.commands.registerCommand('extension.updateListView', (item: string) => {
    // Update the items array
    items.push(item);

    // Update the HTML content of the webview panel
    panel.webview.html = generateHtml();
  });


  context.subscriptions.push(add_item_to_list);


  parseWebsite();




  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable1 = vscode.commands.registerCommand(
    "wisi-video-platform-control-api.testAPI",
    async () => {
      /// clear the const apis variable
      /// input sources
      let { inputNames, row_ids, stream_ids } = await getInputNames();
      let n = inputNames.length;
      for (let i = 0; i < n; i++) {
        let endpoint = {
          label: inputNames[i],
          description: "Request the input source: " + inputNames[i],
          endpoint: baseURL + "/sys/svc/core/api/v1/devices/1/services/urn:incanetworks-com:serviceId:VideoRelay/tables/source_streams/store/" + row_ids[i],
        }

        let exists = false;
        // Search through each endpoint in the dictionary and skip if it exists
        for (const method of Object.keys(apis)) {
          const endpoints = apis[method as keyof ApiDictionary]["endpoints"];
          for (const endpointObj of endpoints) {
            if (endpointObj.endpoint === endpoint.endpoint) {
              exists = true;
              break;
            }
          }
        }

        if (exists) continue;

        // The endpoint was not found in the dictionary
        addEndpoint("get", endpoint);
        addEndpoint("delete", endpoint);

        // Add the put endpoint, make a deep copy of the endpoint object
        const putEndpoint = JSON.parse(JSON.stringify(endpoint));
        putEndpoint.endpoint = baseURL + "/sys/svc/core/api/v1/dvp/streams/ip/sources/" + stream_ids[i];
        addEndpoint("put", putEndpoint);
      }


      interface HttpMethodDictionary {
        [key: string]: { detail: string };
      }

      // Define the HTTP methods dictionary
      const http_methods: HttpMethodDictionary = {
        'get': {
          detail: 'Retrieves data from the WISI Video Platform Control API',
        },
        'put': {
          detail: 'Updates data in the WISI Video Platform Control API',
        },
        'post': {
          detail: 'Creates a new resource in the WISI Video Platform Control API',
        },
        'delete': {
          detail: 'Deletes a resource from the WISI Video Platform Control API',
        },
      };

      // Create an array of QuickPickItems that match on detail
      const httpMethodList = Object.keys(http_methods).map((method) => ({
        label: method.toUpperCase(),
        detail: http_methods[method].detail,
      }));

      // make a quick pick for the user to select get, put, post, delete
      const selection = await vscode.window.showQuickPick(httpMethodList, {
        placeHolder: "Select an HTTP method",
        matchOnDetail: true,
      });

      if (!selection) {
        return;
      }

      // get the selected method
      const method = selection.label.toLowerCase();
      if (method === "put") {
        // get a quick pick of the 'put' endpoints from the apis dictionary
        const putMethodList = apis.put.endpoints.map((endpoint, index) => ({
          endpoint: endpoint.endpoint,
          label: endpoint.label,
          description: endpoint.description,
        }));



        // make a quick pick for the user to select get, put, post, delete
        const selection = await vscode.window.showQuickPick(putMethodList, {
          placeHolder: "Select an endpoint to PUT to",
          matchOnDetail: true,
        });

        if (!selection) {
          return;
        }

        console.log(apis);
        let selectedEndpoint = selection.endpoint;

        // make an input box for the user to enter the body of the request
        // load up the current json from the endpoint and display it in the input box
        let { data, status_code } = await getRequest(selectedEndpoint);
        let placeHolder_payload = await JSON.stringify(data);
        let body = await vscode.window.showInputBox({
          prompt: "Enter the body for the PUT request",
          placeHolder: "Enter the body for the PUT request",
          value: placeHolder_payload,
        });

        // convert the body to a json object
        if (!body) { return; }
        let payload = JSON.parse(body);
        console.log(payload, status_code);
        console.log(selectedEndpoint);

        // make the put request
        let test = await fetch(selectedEndpoint, {
          "headers": {
            "accept": "application/javascript, application/json",
            "accept-language": "en-US,en;q=0.9",
            "authorization": "Basic YWRtaW46YWRtaW4=",
            "content-type": "application/json",
            "x-requested-with": "XMLHttpRequest",
            "Referer": "http://192.168.137.12/controlpanel?deviceid=1",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          "body": "{\"lid\":1,\"id\":\"cg37baj7nsislqeqefjg\",\"group\":\"0\",\"networkID\":[2],\"enabled\":true,\"sourceType\":\"UDP\",\"dn\":\"Guido test\",\"udp\":{\"ipAddress\":\"239.222.111.43\",\"ipPort\":1234},\"streams\":[],\"ip_iface\":[null]}",
          "method": "PUT"
        });
        let resp = await test.json();
        console.log(resp);
        //let { data: put_data, status_code: put_status_code } = await putRequest(selectedEndpoint, payload);
        //console.log(put_data, put_status_code);


        /*
        let body = await vscode.window.showInputBox({
          prompt: "Enter the body for the PUT request",
          placeHolder: "Enter the body for the PUT request",
          value: "api"
        });
        */
      }




    }

  );

  let disposable2 = vscode.commands.registerCommand(
    "wisi-video-platform-control-api.getChassisInfo",
    () => {
      // Open the chassis web page externally URI
      vscode.env.openExternal(vscode.Uri.parse("http://admin:admin@" + ip));
    }
  );

  context.subscriptions.push(disposable1);
  context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() { }
