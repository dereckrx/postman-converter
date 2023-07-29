export function convertScript(scriptLines: string[]): string[] {
    return scriptLines
        .map(line => line.replace(
                    /pm\.response\.json\(\)/,
                    `response.body`)
        ).map(line => line.replace(
            /pm\.response\.code/,
            `response.status`)
        ).map(line => {
            const varMatch = line.match(/pm\.environment\.get\("(.*)"\)/);
            if (varMatch && varMatch[1]) {
                const varName = varMatch[1];
                return line.replace(
                    /pm\.environment\.get.*\)/,
                    `client.global.get("${varName}")`);
            }
            return line;
        }).map(line => {
            const match = line.match(/postman\.setEnvironmentVariable\("(.*)", .*\.(.*)\)/);
            if (match && match[1] && match[2]) {
                const varName = match[1];
                const jsonName = match[2];
                return line.replace(
                    /postman.setEnvironmentVariable.*/,
                    `client.global.set("${varName}", response.body.${jsonName})`);
            }
            return line;
        }).map(line => {
            if(line === "" || line === "}" || line.match(/\}\)/)) {
                return line;
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
                return line.replace(
                    /pm\.response\.to\.have\.status\((.*)\)/,
                    `client.assert(response.status === ${expectedValue}, \`Expected response.status \${response.status\} to equal ${expectedValue}\`)`);
            }

            const assertionMatch = line.match(/pm\.expect\(([^)]*)\)\.to(?:\.be)?\.(.*)\(([^)]*)\)/);
            if (assertionMatch && assertionMatch[1] && assertionMatch[2] && assertionMatch[3]) {
                const actualValue = assertionMatch[1]
                    .replace(/(jsonData|jsonResponse)./, `response.body.`)
                const assertType = assertionMatch[2];
                const expectedValue = assertionMatch[3];
                if(assertType === "eql" || assertType === "equal") {
                    return line.replace(
                        /pm\.expect\(([^)]*)\)\.to(?:\.be)?\.(.*)\(([^)]*)\)/,
                        `client.assert(${actualValue} === ${expectedValue}, \`Expected ${actualValue} \${${actualValue}} to equal ${expectedValue}\`)`);
                }
                if(assertType === "oneOf") {
                    return line.replace(
                        /pm\.expect\(([^)]*)\)\.to(?:\.be)?\.(.*)\(([^)]*)\)/,
                        `client.assert(${expectedValue}.includes(${actualValue}), \`Expected ${actualValue} \${${actualValue}} to be one of ${expectedValue}\`)`);
                }
            }
            if(
                line.match('client.global.set') ||
                line.match('client.global.get') ||
                line.match('response.status') ||
                line.match('response.body')
            ) return line;

            console.log("Not sure how to convert script line: ", line)
            return line;
        })
}

// TODO: delete previous version
// function convertPostmanScriptToIntellj(scriptLines: string[]): string[] {
//     return scriptLines
//         .filter(line => !line.match(/var jsonData = JSON.parse\(responseBody\);/))
//         .filter(line => !line.match(/var jsonData = pm\.response\.json\(\)/))
//         .filter(line => !line.match(/let jsonResponse = pm\.response\.json\(\);/))
//         .map(line => {
//             if(line === "" || line === "}" || line.match(/\}\)/)) {
//                 return line;
//             }
//
//             const match = line.match(/postman\.setEnvironmentVariable\("(.*)", .*\.(.*)\);/);
//             if (match && match[1] && match[2]) {
//                 const varName = match[1];
//                 const jsonName = match[2];
//                 return line.replace(
//                     /postman.setEnvironmentVariable.*/,
//                     `client.global.set("${varName}", response.body.${jsonName})`);
//             }
//
//             const ifCodeMatch = line.match(/if \(pm\.response\.code == (.*)\)/);
//             if (ifCodeMatch && ifCodeMatch[1]) {
//                 const code = ifCodeMatch[1];
//                 return line.replace(
//                     /pm\.response\.code/,
//                     `response.status`);
//             }
//
//             const varMatch = line.match(/pm\.environment\.get\("(.*)"\)/);
//             if (varMatch && varMatch[1]) {
//                 const varName = varMatch[1];
//                 return line.replace(
//                     /pm\.environment\.get.*/,
//                     `client.global.get("${varName}")`);
//             }
//
//             const testNameMatch = line.match(/pm\.test\("(.*)".*/);
//             if (testNameMatch && testNameMatch[1]) {
//                 const testName = testNameMatch[1];
//                 return line.replace(
//                     /pm\.test.*/,
//                     `client.test("${testName}", () => {`);
//             }
//
//             const assertStatusMatch = line.match(/pm\.response\.to\.have\.status\((.*)\)/);
//             if (assertStatusMatch && assertStatusMatch[1]) {
//                 const expectedValue = assertStatusMatch[1];
//                 return `client.assert(response.status === ${expectedValue}, \`Expected response.status \${response.status\} to equal ${expectedValue}\`);`;
//             }
//
//             const assertionMatch = line.match(/pm\.expect\(([^)]*)\)\.to(?:\.be)?\.(.*)\(([^)]*)\)/);
//             if (assertionMatch && assertionMatch[1] && assertionMatch[2] && assertionMatch[3]) {
//                 const actualValue = assertionMatch[1]
//                     .replace(/(jsonData|jsonResponse)./, `response.body.`)
//                     .replace(/pm\.response\.code/, "response.status")
//                 const assertType = assertionMatch[2];
//                 const expectedValue = assertionMatch[3];
//                 if(assertType === "eql" || assertType === "equal") {
//                     return `client.assert(${actualValue} === ${expectedValue}, \`Expected ${actualValue} \${${actualValue}} to equal ${expectedValue}\`);`;
//                 }
//                 if(assertType === "oneOf") {
//                     return `client.assert(${expectedValue}.includes(${actualValue}), \`Expected ${actualValue} \${${actualValue}} to be one of ${expectedValue}\`);`;
//                 }
//             }
//
//             console.log("Not sure how to convert script line: ", line)
//             return line;
//         })
// }
