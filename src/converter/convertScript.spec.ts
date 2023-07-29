import { convertScript } from "./convertScript";

describe(`${convertScript.name}`, () => {
    it('preserves empty lines', () => {
        const lines = convertScript([""]);
        expect(lines).toEqual([""])
    });

    it('preserves ending bracket', () => {
        const lines = convertScript(["}"]);
        expect(lines).toEqual(["}"])
    });

    it('preserves ending bracket and closing paren', () => {
        const lines = convertScript(["})"]);
        expect(lines).toEqual(["})"])
    });

    it("converts postman.setEnvironmentVariable", () => {
        const lines = convertScript([
            'postman.setEnvironmentVariable("access_token", jsonData.access_token)',
            '    postman.setEnvironmentVariable("access_token", jsonData.access_token)',
        ]);
        expect(lines).toEqual([
            'client.global.set("access_token", response.body.access_token)',
            '    client.global.set("access_token", response.body.access_token)'
        ])
    });

    it("converts pm.response.json() to response.body", () => {
        const lines = convertScript([
            "pm.response.json()",
            "    pm.response.json()    ",
            "const responseJson = pm.response.json();"
        ]);
        expect(lines).toEqual([
            "response.body",
            "    response.body    ",
            "const responseJson = response.body;"
        ])
    })

    it("converts pm.response.code", () => {
        const lines = convertScript([
            "pm.response.code",
            "    pm.response.code    ",
            "if (pm.response.code == 200)"
        ]);
        expect(lines).toEqual([
            "response.status",
            "    response.status    ",
            "if (response.status == 200)"
        ])
    });

    it("converts pm.environment.get()", () => {
        const lines = convertScript([
            'pm.environment.get("foo")',
            '    pm.environment.get("foo")    ',
            'let foo = pm.environment.get("foo")',
        ]);
        expect(lines).toEqual([
            'client.global.get("foo")',
            '    client.global.get("foo")    ',
            'let foo = client.global.get("foo")',
        ])
    });

    it("converts pm.test() with pm.expect() example", () => {
        const lines = convertScript([
            'pm.test("Person is Jane", () => {',
            '    const responseJson = pm.response.json();',
            '    pm.expect(responseJson.name).to.eql("Jane");',
            '    pm.expect(responseJson.age).to.eql(23);',
            '});',
        ]);
        expect(lines).toEqual([
            'client.test("Person is Jane", () => {',
            '    const responseJson = response.body;',
            '    client.assert(responseJson.name === "Jane", `Expected responseJson.name ${responseJson.name} to equal "Jane"`);',
            '    client.assert(responseJson.age === 23, `Expected responseJson.age ${responseJson.age} to equal 23`);',
            '});'
        ])
    })

    it("converts pm.test() with status examples", () => {
        const lines = convertScript([
            'pm.test("Status code is 201", () => {',
            '   pm.response.to.have.status(201);',
            '});',
        ]);
        expect(lines).toEqual([
            'client.test("Status code is 201", () => {',
            '   client.assert(response.status === 201, `Expected response.status ${response.status} to equal 201`);',
            '});',
        ])
    });

    it("converts pm.test() with pm.expect(...).to.be.oneOf(...)", () => {
        const lines = convertScript([
            'pm.test("Successful POST request", () => {',
            '   pm.expect(pm.response.code).to.be.oneOf([201, 202]);',
            '});',
        ]);
        expect(lines).toEqual([
            'client.test("Successful POST request", () => {',
            '   client.assert([201, 202].includes(response.status), `Expected response.status ${response.status} to be one of [201, 202]`);',
            '});',
        ])
    });

    it("converts pm.expect(...).to.eql(...)", () => {
        const lines = convertScript([
            'pm.expect(customJsonVar.foo).to.eql("bar")',
            'pm.expect(pm.response.json().foo).to.eql("bar")',
            'pm.expect(pm.response.code).to.eql(200)',
        ]);
        expect(lines).toEqual([
            'client.assert(customJsonVar.foo === "bar", `Expected customJsonVar.foo ${customJsonVar.foo} to equal \"bar\"`)',
            'client.assert(response.body.foo === "bar", `Expected response.body.foo ${response.body.foo} to equal \"bar\"`)',
            'client.assert(response.status === 200, `Expected response.status ${response.status} to equal 200`)',
        ])
    });
})