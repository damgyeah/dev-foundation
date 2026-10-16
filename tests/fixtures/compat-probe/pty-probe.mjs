// Drives the interactive Copilot TUI through a pseudo-terminal with scripted keystrokes, then kills it.
// usage: node pty-probe.mjs <cwd> <outFile> <totalSec> <step> [step...]   where step = "<waitSec>|<text>"
// "\r" in text is Enter. Output is ANSI-stripped into outFile. Never waits for a person.
import pty from "@homebridge/node-pty-prebuilt-multiarch";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [cwd, outFile, totalSec, ...steps] = process.argv.slice(2);
const loader = `${execSync("npm root -g").toString().trim()}/@github/copilot/npm-loader.js`;
const p = pty.spawn(process.execPath, [loader, "--allow-all-tools", "--model", "claude-opus-5.5"], {
  name: "xterm-256color", cols: 160, rows: 50, cwd, env: process.env,
});
let out = "";
p.onData((d) => { out += d; });
const strip = (s) => s.replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, "").replace(/\x1b\][^\x07]*\x07/g, "").replace(/\x1b[()][0-9A-Za-z]/g, "");
const save = () => writeFileSync(outFile, strip(out));
const end = () => { save(); try { p.kill(); } catch {} process.exit(0); };
setTimeout(end, Number(totalSec) * 1000);
let t = 0;
for (const step of steps) {
  const i = step.indexOf("|");
  t += Number(step.slice(0, i)) * 1000;
  const text = step.slice(i + 1).replace(/\\r/g, "\r");
  setTimeout(() => { out += `\n[[SEND ${JSON.stringify(text)}]]\n`; p.write(text); save(); }, t);
}
