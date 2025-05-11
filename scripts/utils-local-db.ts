
import fs from "node:fs";
import path from "node:path";

export function getLocalD1DB() {
    try {
        const basePath = path.resolve(".wrangler", "state", "v3", "d1");
        const files = fs
            .readdirSync(basePath, { encoding: "utf-8", recursive: true })
            .filter((f) => f.endsWith(".sqlite"));

        // In case there are multiple .sqlite files, we want the most recent one.
        files.sort((a, b) => {
            const statA = fs.statSync(path.join(basePath, a));
            const statB = fs.statSync(path.join(basePath, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
        });
        const dbFile = files[0];

        if (!dbFile) {
            throw new Error(`.sqlite file not found in ${basePath}`);
        }

        const url = path.resolve(basePath, dbFile);

        return url;
    } catch (err) {
        if (err instanceof Error) {
            console.log(`Error resolving local D1 DB: ${err.message}`);
        } else {
            console.log(`Error resolving local D1 DB: ${err}`);
        }
    }
}