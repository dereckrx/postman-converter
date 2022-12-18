import {
    EventList,
    Header,
    HttpsSchemaGetpostmanComJsonCollectionV210,
    Item,
    Items,
    Request,
    Request1
} from "./PostmanTypes";

export interface HttpCollection {
    name: string;
    requests: HttpRequest[];
}

export interface HttpRequest {
    name: string;
    method: string;
    url: string;
    headers: Header[];
    body: string;
    script: string[];
}


export function convertCollection(collection: HttpsSchemaGetpostmanComJsonCollectionV210): HttpCollection {
    return {
        name: collection.info.name,
        requests: collection.item
            .filter(isItem)
            .map(toHttpRequest),
    }
}

function toHttpRequest(item: Item): HttpRequest {
    const name = item.name || "unnamed_request";
    if (!isRequest(item.request)) {
        console.warn("Unsupported request: ", item.name, item.request)
        return {
            name: name,
            method: "",
            url: "",
            headers: [],
            body: "",
            script: [],
        };
    }

    const request = item.request;

    return {
        name: name,
        method: request.method,
        url: parseUrl(request),
        headers: parseHeaders(request),
        body: parseBody(request.body),
        script: parseScript(item.event),
    }
}


function parseBody(body: Request1["body"]): string {
    if (!body || !body.mode) {
        return "";
    }
    switch (body.mode) {
        case "raw":
            return body.raw || "";

        case "urlencoded":
            return (body.urlencoded || [])
                .map(({key, value}) => `${key}=${value}`)
                .join("\n");

        case "formdata":
            if (body.formdata?.length === 0) {
                return "";
            }
            console.warn(`body.mode.formdata is not currently implemented`);
            return "";
        default:
            console.warn(`Unknown body type: ${body.mode}`);
            return "";
    }
}

function parseScript(eventList?: EventList): string[] {
    if (!eventList) {
        return [];
    }

    const scriptLines: string[] = eventList
        .map(event => event.script?.exec)
        .filter((exec): exec is string[] | string => !!exec)
        .flatMap(exec => typeof exec === "string" ? [exec] : exec);

    return convertPostmanScriptToIntellj(scriptLines);
}

function convertPostmanScriptToIntellj(scriptLines: string[]): string[] {
    return scriptLines
        .filter(line => !line.match(/var jsonData = JSON.parse\(responseBody\);/))
        .map(line => {
            const match = line.match(/postman\.setEnvironmentVariable\("(.*)", .*\.(.*)\);/);
            if (match === null) {
                return line;
            }
            if (match && match[1] && match[2]) {
                const varName = match[1];
                const jsonName = match[2];
                return line.replace(
                    /postman.setEnvironmentVariable.*/,
                    `client.global.set("${varName}", response.body.json.${jsonName})`);
            }
            console.log("Not sure how to convert script line: ", line)
            return line;
        })
}

function parseHeaders(request: Request1): Header[] {
    if (!request.header) {
        return [];
    }
    if (typeof request.header === "string") {
        console.warn("Unsupported header: ", request.header)
        return [];
    }
    return request.header
}

function parseUrl(request: Request1): string {
    if (typeof request.url === "string") {
        return request.url;
    }
    const rawUrl = request.url?.raw || "";
    return rawUrl.match(/http(s)?:\/\//) ?
        rawUrl :
        rawUrl.match("localhost") ?
            `http://${rawUrl}` :
            `https://${rawUrl}`;
}

function isItem(item: Items): item is Item {
    if (!item.request) {
        throw new Error("Folder items are not implemented")
    }
    return "request" in item;
}

function isRequest(request: Request): request is Request1 & Required<Pick<Request1, "method">> {
    return typeof request !== "string" && request.method !== undefined
}