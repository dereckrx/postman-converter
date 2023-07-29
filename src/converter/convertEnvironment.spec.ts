import { convertEnvironments } from "./convertEnvironment";

describe(`${convertEnvironments.name}`, () => {
    it('returns empty if no envs', () => {
        expect(convertEnvironments([])).toEqual({})
    })
});