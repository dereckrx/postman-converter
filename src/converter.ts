import {convertCollection} from "./convertCollection";
import {convertEnvironments, PostmanEnvironment} from "./convertEnvironment";
import {
    findAllPostmanCollections,
    findAllPostmanEnvironments,
    saveHttpEnvironment,
    saveHttpCollection,
    findPostmanBackup
} from "./fileClient";
import {HttpsSchemaGetpostmanComJsonCollectionV210, Event, Item} from "./PostmanTypes";

export interface PostmanBackup {
    collections: Array<{
        name: string;
        requests: Array<{
            name: string;
            url: string;
            data: Array<{
                key: string;
                value: string;
            }>;
            dataMode: string; // urlencoded
            rawModeData: string;
            queryParams: Array<{
                key: string;
                value: string;
            }>;
            headerData: Array<{
                key: string;
                value: string;
            }>;
            method: string;
            events: Event[];
        }>
    }>;
    environments: PostmanEnvironment[];
}

export async function convertPostmanFiles() {
    await convertAllCollections();
    await convertAllEnvFiles();
}

async function convertAllEnvFiles() {
    const envs = await findAllPostmanEnvironments();
    return saveHttpEnvironment(convertEnvironments(envs));
}

async function convertAllCollections() {
    return (await findAllPostmanCollections())
        .map(convertCollection)
        .map(saveHttpCollection);
}

convertPostmanFiles()
    .then(() => console.log("DONE"));


type PostmanCollection = HttpsSchemaGetpostmanComJsonCollectionV210;

export async function convertPostmanBackup() {
    const backup = (await findPostmanBackup())[0];
    if (!backup) {
        throw Error("No backup found")
    }
    const collections: PostmanCollection[] = backup.collections.map(col => {
        return {
            info: {
                schema: "",
                name: col.name,
            },
            item: col.requests.map(r => {
                // const data = r.dataMode === "urlencoded" ?
                return {
                    name: r.name,
                    event: r.events,
                    request: {
                        url: r.url,
                        method: r.method,
                        header: r.headerData,
                        body: {
                            mode: r.dataMode,
                            raw: r.rawModeData,
                        },
                    }
                } as Item
            }),
        }
    })
    return Promise.all([
        saveHttpEnvironment(convertEnvironments(backup.environments)),
        ...collections
            .map(convertCollection)
            .map(saveHttpCollection)
    ])
}

// convertPostmanBackup().then(() => console.log("DONE"))