import {convertCollection, HttpRequest} from "./convertCollection";
import {convertEnvironments} from "./convertEnvironment";
import {findAllPostmanCollections, findAllPostmanEnvironments, saveHttpEnvironment, saveHttpCollection} from "./fileClient";

export async function convertPostmanFiles() {
    return Promise.all([
        convertAllCollections(),
        convertAllEnvFiles(),
    ]);
}

async function convertAllEnvFiles() {
    const envs = await findAllPostmanEnvironments();
    return saveHttpEnvironment(convertEnvironments(envs));
}

async function convertAllCollections() {
    return (await findAllPostmanCollections())
        .map((collection) =>
            saveHttpCollection(convertCollection(collection)));
}

convertPostmanFiles().then(() => console.log("DONE"));
