import {
    EventList,
    Header,
    HttpsSchemaGetpostmanComJsonCollectionV210,
    Item,
    Items,
    Request,
    Request1
} from "./PostmanTypes";
import { convertScript } from "./convertScript";

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
    console.log(`Converting collection: ${collection.info.name}`)
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

    const result = {
        name,
        method: parseMethod(request),
        url: parseUrl(request),
        headers: parseHeaders(request),
        body: parseBody(request.body),
        script: parseScript(item.event),
    }
    console.log(`Converted request: ${name}`);
    return result;
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
                .join("&");

        case "formdata":
            if (body.formdata?.length === 0) {
                return "";
            }
            console.warn(`body.mode.formdata is not currently implemented`);
            return "";
        case "graphql":
            if(!body.graphql) {
                console.warn(`Missing graphQL body: ${body}`);
                return "";
            }
            return `${body.graphql.query}\n\n${body.graphql.variables}`;
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

    return convertScript(scriptLines);
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

function parseMethod(request: Request1): string {
    if(request.body?.mode === "graphql") {
        return "GRAPHQL";
    }
    if(request.method === undefined) {
        console.warn("Missing request method: ", request)
        return "";
    }
    return request.method;
}
