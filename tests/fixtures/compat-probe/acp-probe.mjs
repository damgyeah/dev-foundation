// Drives `copilot --acp` over stdio: new session in a cwd, print available slash commands,
// send each prompt, print agent text and tool calls. Hard timeout; never waits for a person.
// usage: node acp-probe.mjs <cwd> <timeoutSec> <prompt> [prompt...]
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { execSync } from "node:child_process";

const [cwd, timeoutSec, ...prompts] = process.argv.slice(2);
const loader = `${execSync("npm root -g").toString().trim()}/@github/copilot/npm-loader.js`;
const child = spawn(process.execPath, [loader, "--acp", "--allow-all-tools", "--model", "claude-opus-5.5"], {
  cwd, stdio: ["pipe", "pipe", "pipe"], env: process.env,
});
const kill = setTimeout(() => { console.log(`TIMEOUT after ${timeoutSec}s`); child.kill(); process.exit(2); }, Number(timeoutSec) * 1000);
child.stderr.on("data", (d) => process.stderr.write(d));

let nextId = 1; const pending = new Map();
const send = (msg) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
const call = (method, params) => new Promise((resolve, reject) => {
  const id = nextId++; pending.set(id, { resolve, reject }); send({ id, method, params });
});
let text = "";
createInterface({ input: child.stdout }).on("line", (line) => {
  let m; try { m = JSON.parse(line); } catch { console.log("RAW", line.slice(0, 300)); return; }
  if (m.id !== undefined && pending.has(m.id) && (m.result !== undefined || m.error)) {
    const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); return;
  }
  if (m.method === "session/request_permission") {
    const opt = m.params.options.find((o) => o.kind?.startsWith("allow")) ?? m.params.options[0];
    send({ id: m.id, result: { outcome: { outcome: "selected", optionId: opt.optionId } } }); return;
  }
  if (m.method === "session/update") {
    const u = m.params.update;
    if (u.sessionUpdate === "agent_message_chunk") text += u.content?.text ?? "";
    else if (u.sessionUpdate === "available_commands_update")
      console.log("COMMANDS:", u.availableCommands.map((c) => c.name).join(", "));
    else if (u.sessionUpdate === "tool_call") console.log("TOOL_CALL:", u.title, JSON.stringify(u.rawInput ?? {}).slice(0, 200));
    else if (u.sessionUpdate === "tool_call_update" && u.status === "failed") console.log("TOOL_FAILED:", JSON.stringify(u.content ?? u.rawOutput ?? {}).slice(0, 300));
    return;
  }
  if (m.method) { console.log("REQ/NOTE", m.method, JSON.stringify(m.params ?? {}).slice(0, 300)); if (m.id !== undefined) send({ id: m.id, result: {} }); }
});

try {
  const init = await call("initialize", { protocolVersion: 1, clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false } });
  console.log("AGENT:", JSON.stringify(init.agentInfo ?? {}));
  const { sessionId } = await call("session/new", { cwd, mcpServers: [] });
  await new Promise((r) => setTimeout(r, 4000));
  for (const prompt of prompts) {
    text = "";
    console.log(`\n>>> ${prompt}`);
    const res = await call("session/prompt", { sessionId, prompt: [{ type: "text", text: prompt }] });
    console.log(`<<< (${res.stopReason})\n${text}`);
  }
} catch (e) { console.log("ERROR", JSON.stringify(e)); }
clearTimeout(kill); child.kill(); process.exit(0);
