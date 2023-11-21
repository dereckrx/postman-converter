import { toHttpFile } from "./toHttpFile";
import { HttpRequest } from "./convertCollection";

describe("toHttpFile", () => {
    it("returns http file from GraphQL request", () => {
        const request: HttpRequest = {
            name: "Foo Request",
            method: "GRAPHQL",
            url: "https://example.com",
            body: "{ body: \"foo\"}\n\n{ id: 1 }",
            headers: [{ key: "header1", value: "header1Value"}],
            script: [],
        }

        const result = toHttpFile(request);

        expect(result.fileName).toEqual("Foo_Request.http")
        expect(result.data).toEqual(
`###
# @name Foo Request
GRAPHQL https://example.com
header1: header1Value

{ body: \"foo\"}

{ id: 1 }
`
        );
    });
});