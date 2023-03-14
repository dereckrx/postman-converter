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
        method: request.method,
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
        .filter(line => !line.match(/var jsonData = pm\.response\.json\(\)/))
        .filter(line => !line.match(/let jsonResponse = pm\.response\.json\(\);/))
        .map(line => {
            if(line === "" || line === "}" || line.match(/\}\)/)) {
                return line;
            }

            const match = line.match(/postman\.setEnvironmentVariable\("(.*)", .*\.(.*)\);/);
            if (match && match[1] && match[2]) {
                const varName = match[1];
                const jsonName = match[2];
                return line.replace(
                    /postman.setEnvironmentVariable.*/,
                    `client.global.set("${varName}", response.body.${jsonName})`);
            }

            const ifCodeMatch = line.match(/if \(pm\.response\.code == (.*)\)/);
            if (ifCodeMatch && ifCodeMatch[1]) {
                const code = ifCodeMatch[1];
                return line.replace(
                    /pm\.response\.code/,
                    `response.status`);
            }

            const varMatch = line.match(/pm\.environment\.get\("(.*)"\)/);
            if (varMatch && varMatch[1]) {
                const varName = varMatch[1];
                return line.replace(
                    /pm\.environment\.get.*/,
                    `client.global.get("${varName}")`);
            }

            const testNameMatch = line.match(/pm\.test\("(.*)".*/);
            if (testNameMatch && testNameMatch[1]) {
                const testName = testNameMatch[1];
                return line.replace(
                    /pm\.test.*/,
                    `client.test("${testName}", () => {`);
            }

            const assertStatusMatch = line.match(/pm\.response\.to\.have\.status\((.*)\)/);
            if (assertStatusMatch && assertStatusMatch[1]) {
                const expectedValue = assertStatusMatch[1];
                return `client.assert(response.status === ${expectedValue}, \`Expected response.status \${response.status\} to equal ${expectedValue}\`);`;
            }

            const assertionMatch = line.match(/pm\.expect\(([^)]*)\)\.to(?:\.be)?\.(.*)\(([^)]*)\)/);
            if (assertionMatch && assertionMatch[1] && assertionMatch[2] && assertionMatch[3]) {
                const actualValue = assertionMatch[1]
                    .replace(/(jsonData|jsonResponse)./, `response.body.`)
                    .replace(/pm\.response\.code/, "response.status")
                const assertType = assertionMatch[2];
                const expectedValue = assertionMatch[3];
                if(assertType === "eql" || assertType === "equal") {
                    return `client.assert(${actualValue} === ${expectedValue}, \`Expected ${actualValue} \${${actualValue}} to equal ${expectedValue}\`);`;
                }
                if(assertType === "oneOf") {
                    return `client.assert(${expectedValue}.includes(${actualValue}), \`Expected ${actualValue} \${${actualValue}} to be one of ${expectedValue}\`);`;
                }
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