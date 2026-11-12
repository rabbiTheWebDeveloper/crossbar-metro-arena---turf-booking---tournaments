/**
 * Verifies that every icon imported from 'lucide-react-native' in src/ actually exists.
 * (A misspelt icon name is `undefined` at runtime and crashes the screen that renders it.)
 *   node scripts/check-icons.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'node_modules', 'lucide-react-native', 'dist', 'esm');
const index = fs.readFileSync(path.join(dist, 'lucide-react-native.mjs'), 'utf8');
const exported = new Set();
for (const m of index.matchAll(/default as (\w+)/g)) exported.add(m[1]);
for (const m of index.matchAll(/export \{([^}]+)\}/g)) {
    m[1].split(',').forEach(part => {
        const name = part.trim().split(/\s+as\s+/).pop();
        if (name) exported.add(name);
    });
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : (/\.(js|jsx)$/.test(e.name) ? [p] : []);
});

let missing = 0;
for (const file of walk(path.join(root, 'src'))) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react-native['"]/g)) {
        for (const part of m[1].split(',')) {
            const name = part.trim().split(/\s+as\s+/)[0];
            if (name && !exported.has(name)) {
                missing++;
                console.log(`MISSING ICON  ${name}  in ${path.relative(root, file)}`);
            }
        }
    }
}
console.log(missing ? `${missing} missing icon(s)` : `icons ok (${exported.size} available)`);
process.exit(missing ? 1 : 0);
