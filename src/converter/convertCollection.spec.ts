import { convertCollection } from "./convertCollection";
import { HttpsSchemaGetpostmanComJsonCollectionV210, Item, Request1 } from "./PostmanTypes";

describe("convertCollection", () => {
    it("converts graphQL request", () => {
        const postmanCollection = makePostmanCollection({
            item: [
                makePostmanItem({
                    name: "GraphQL findById",
                    request: makePostmanRequest({
                        method: "POST",
                        url: {raw: "https://example.com/graphql"},
                        body: {
                            mode: "graphql",
                            graphql: {
                                query: "query findById($id: ID!) {\nfindById(id: $id) {\nid \nitem {\nid \nname \n}\n}\n}",
                                variables: "{\n\"id\": \"12345\"\n}"
                            }
                        }
                    })
                })
            ]
        })
        const result = convertCollection(postmanCollection);

        expect(result.name).toEqual("Sample Collection");
        expect(result.requests.length).toEqual(1);
        const request = result.requests[0];
        expect(request.name).toEqual("GraphQL findById");
        expect(request.method).toEqual("GRAPHQL");
        expect(request.url).toEqual("https://example.com/graphql");
        expect(request.body).toEqual("query findById($id: ID!) {\nfindById(id: $id) {\nid \nitem {\nid \nname \n}\n}\n}\n\n{\n\"id\": \"12345\"\n}");
        expect(request.headers).toEqual([]);
        expect(request.script).toEqual([]);
    });
});

function makePostmanRequest(overrides: Partial<Request1> = {}): Request1 {
    return {
        method: "",
        header: [],
        body: {},
        url: {},
        ...overrides
    }
}

function makePostmanItem(overrides: Partial<Item> = {}): Item {
    return {
        name: "",
        request: {},
        ...overrides,
    }
}

function makePostmanCollection(overrides: Partial<HttpsSchemaGetpostmanComJsonCollectionV210> = {}): HttpsSchemaGetpostmanComJsonCollectionV210 {
    return {
        info: {
            name: "Sample Collection",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: [],
        ...overrides,
    }
}