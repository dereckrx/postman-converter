import {HttpRequest} from "./convertCollection";
import {cleanFilename} from "./fileClient";

interface HttpFile {
  fileName: string;
  data: string;
}

export function toHttpFile(request: HttpRequest): HttpFile {

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