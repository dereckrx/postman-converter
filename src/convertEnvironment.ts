export type HttpEnvironment = {[envName: string]: {[key: string]: string}}

export interface PostmanEnvFile {
    "id": string;
    "name": string;
    "values": EnvValue[];
}

interface EnvValue {
    "key": string,
    "value": string,
    "enabled": boolean
}

export function convertEnvironments(envs: PostmanEnvFile[]): HttpEnvironment {
    return envs.reduce((acc, env) => {
        const envVars = env.values.reduce((acc, {key, value}) => {
            if(key.match("token")) {
                value = "[TOKEN HERE]"
            }
            if(key.match("secret")) {
                value = "[SECRET HERE]"
            }
            return {...acc, [key]: value};
        }, {});
        return {...acc, [env.name]: envVars}
    }, {});
}
