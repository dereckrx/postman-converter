import * as Path from "path";
import {HttpsSchemaGetpostmanComJsonCollectionV210,} from "./PostmanTypes";
import {HttpCollection, HttpRequest} from "./convertCollection";
import {HttpEnvironment, PostmanEnvironment} from "./convertEnvironment";
import {PostmanBackup} from "./converter";
import {PathLike} from "node:fs";

const fs = require('fs');

const POSTMAN_ENVS_PATH = Path.join("toConvert");
const POSTMAN_COLLECTIONS_PATH = Path.join("toConvert");
const HTTP_OUTPUT_PATH = Path.join("converted");
const HTTP_ENV_FILE_NAME = "http-client.env.json";

interface FileClientConfig {
    postmanCollectionFilesPath: string;
    postmanEnvFilesPath: string;
    httpOutputPath: string;
    httpEnvFileName: string;
    postmanBackupPath: string;
}

interface HttpFile {
    fileName: string;
    data: string;
}

const config: FileClientConfig = {
    postmanCollectionFilesPath: POSTMAN_COLLECTIONS_PATH,
    postmanEnvFilesPath: POSTMAN_ENVS_PATH,
    httpOutputPath: HTTP_OUTPUT_PATH,
    httpEnvFileName: HTTP_ENV_FILE_NAME,
    postmanBackupPath: Path.join("."),
}

export async function findAllPostmanEnvironments(): Promise<PostmanEnvironment[]> {
    return readFiles(config.postmanEnvFilesPath,".postman_environment.json");
}

export async function findAllPostmanCollections(): Promise<HttpsSchemaGetpostmanComJsonCollectionV210[]> {
    return readFiles(config.postmanCollectionFilesPath,".postman_collection.json");
}

export async function findPostmanBackup(): Promise<PostmanBackup[]> {
    return readFiles(config.postmanBackupPath,"backup.json");
}

export async function saveHttpEnvironment(httpEnvironments: HttpEnvironment) {
    return writeFile(Path.join(config.httpOutputPath, config.httpEnvFileName), JSON.stringify(httpEnvironments));
}

export async function saveHttpCollection({name, requests}: HttpCollection) {
    console.log(`Saving collection: ${name}`)
    const dirPath = await createCollectionDir(name);

    return requests
        .map(toHttpFile)
        .map(({fileName, data}) => writeFile(Path.join(dirPath, fileName), data));
}

async function readFiles<T>(path: string, fileMatch: string): Promise<T[]> {
    console.log(`Searching for files: ${path}/*${fileMatch}`)
    const filesNames = (await fs.promises.readdir(path))
        .filter((fileName: string) => fileName.match(fileMatch));
    return (await Promise.all(
        filesNames.map((fileName: string) => {
            console.log(`Reading file: ${fileName}`);
            return fs.promises.readFile(Path.join(path, fileName))
        })
    )).map(data => JSON.parse(data));
}

async function createCollectionDir(dirName: string): Promise<string> {
    const dirPath = Path.join(config.httpOutputPath, cleanFilename(dirName));
    return createDir(dirPath).then(() => dirPath);
}

export const cleanFilename = (s: string) =>
    s.replace(/\s*-\s*/g, "-")
        .replace(/ /g, "_")
        .replace('/', '|');

function toHttpFile(request: HttpRequest): HttpFile {

    const scriptSection = request.script.length > 0 ?
        ["> {%", ...request.script, "%}"] :
        [];

    const httpRequest = [
        "###",
        `# @name ${request.name}`,
        `${request.method} ${request.url}`,
        ...request.headers.map(({key, value}) => `${key}: ${value}`),
        "",
        request.body,
        "",
        ...scriptSection
    ].join("\n");

    return {
        fileName: `${cleanFilename(request.name)}.http`,
        data: httpRequest
    }
}

function createDir(dirPath: PathLike): Promise<void> {
    if (fs.existsSync(dirPath)) {
        console.log(`Directory exists: ${dirPath}`)
        return Promise.resolve();
    }
    console.log(`Creating directory: ${dirPath}`);
    return fs.promises.mkdir(dirPath, { recursive: true });
}

function writeFile(path: PathLike, data: string): Promise<void> {
    console.log(`Writing file: ${path}`);
    return fs.promises.writeFile(path, data);
}