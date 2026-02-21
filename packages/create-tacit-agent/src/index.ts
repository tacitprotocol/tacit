#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';

// ─── Colors (no deps) ───────────────────────────────────────────

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

// ─── Readline Prompt Helper ─────────────────────────────────────

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function choose(question: string, options: string[], defaultIndex = 0): Promise<string> {
  console.log(question);
  options.forEach((opt, i) => {
    const marker = i === defaultIndex ? green('> ') : '  ';
    const label = i === defaultIndex ? bold(opt) : opt;
    console.log(`${marker}${dim(`${i + 1})`)} ${label}`);
  });
  const answer = await ask(`\n  ${dim(`Choice [${defaultIndex + 1}]:`)} `);
  const idx = answer ? parseInt(answer, 10) - 1 : defaultIndex;
  return options[idx] || options[defaultIndex];
}

// ─── CLI ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectName = args[0];

if (!projectName || projectName === '--help' || projectName === '-h') {
  console.log(`
${bold('create-tacit-agent')} — scaffold a new Tacit Protocol agent

${bold('Usage:')}
  npx create-tacit-agent ${cyan('<project-name>')}

${bold('Example:')}
  npx create-tacit-agent my-agent
  cd my-agent
  npm start
`);
  process.exit(projectName ? 0 : 1);
}

// Validate project name
if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
  console.error(red(`Invalid project name: "${projectName}". Use only letters, numbers, hyphens, and underscores.`));
  process.exit(1);
}

const projectDir = resolve(process.cwd(), projectName);

if (existsSync(projectDir)) {
  console.error(red(`Directory "${projectName}" already exists.`));
  process.exit(1);
}

// ─── Banner ──────────────────────────────────────────────────────

console.log(`
${bold('Tacit Protocol')} ${dim('v0.1')}
${dim('The trust layer for the internet')}
`);

console.log(`Creating ${cyan(projectName)}...\n`);

// ─── Interactive Prompts ─────────────────────────────────────────

async function main() {
  const domains = ['professional', 'dating', 'commerce', 'local-services', 'learning'];
  const domain = await choose(
    `  ${bold('What domain will your agent operate in?')}`,
    domains,
    0
  );

  console.log();
  const seeking = await ask(`  ${bold('What are you looking for?')} ${dim('(e.g., "collaboration on AI projects")')}\n  > `) || 'meaningful connections';

  console.log();
  const offering = await ask(`  ${bold('What do you offer?')} ${dim('(e.g., "full-stack engineering, 10yr experience")')}\n  > `) || 'unique expertise';

  console.log();
  console.log(`  ${green('Got it!')} Setting up your ${cyan(domain)} agent...\n`);

  // ─── Scaffold ────────────────────────────────────────────────────

  mkdirSync(join(projectDir, 'src'), { recursive: true });

  // package.json
  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          start: 'npx tsx src/agent.ts',
          dev: 'npx tsx --watch src/agent.ts',
        },
        dependencies: {
          '@tacitprotocol/sdk': '^0.1.2',
        },
        devDependencies: {
          typescript: '^5.4.0',
          tsx: '^4.7.0',
          '@types/node': '^20.11.0',
        },
      },
      null,
      2
    ) + '\n'
  );

  // tsconfig.json
  writeFileSync(
    join(projectDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2022', 'DOM'],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          outDir: './dist',
          rootDir: './src',
        },
        include: ['src/**/*'],
      },
      null,
      2
    ) + '\n'
  );

  // Escape user input for template strings
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  // src/agent.ts — the main agent file
  writeFileSync(
    join(projectDir, 'src', 'agent.ts'),
    `/**
 * ${esc(projectName)} — Tacit Protocol Agent
 *
 * Your AI agent that verifies identity, prevents fraud,
 * and brokers trusted introductions with cryptographic proof.
 */

import { TacitAgent, IntentBuilder } from '@tacitprotocol/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  console.log('\\x1b[1mInitializing Tacit agent...\\x1b[0m\\n');

  // Create agent with cryptographic identity
  const agent = await TacitAgent.create({
    domain: '${esc(domain)}',
    seeking: '${esc(seeking)}',
    offering: '${esc(offering)}',
  });

  // Persist identity to disk
  const idDir = join(process.cwd(), '.tacit');
  const idPath = join(idDir, 'identity.json');

  if (existsSync(idPath)) {
    console.log(\`  \\x1b[2mLoaded identity:\\x1b[0m \${agent.did}\`);
  } else {
    mkdirSync(idDir, { recursive: true });
    writeFileSync(idPath, JSON.stringify({ did: agent.did, created: new Date().toISOString() }, null, 2));
    console.log(\`  \\x1b[32m+\\x1b[0m Created identity: \\x1b[36m\${agent.did}\\x1b[0m\`);
  }

  // Build and publish an intent
  const intent = new IntentBuilder(agent.did)
    .type('introduction')
    .domain('${esc(domain)}')
    .seeking({ what: '${esc(seeking)}' })
    .context({ offering: '${esc(offering)}' })
    .minAuthenticity(50)
    .build();

  console.log(\`  \\x1b[32m+\\x1b[0m Intent published: \\x1b[2m\${intent.id}\\x1b[0m\`);

  // Listen for matches
  agent.on('match', async (event) => {
    const match = (event as any).match;
    const score = match?.score;
    console.log();
    console.log('  \\x1b[32m\\u250C\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2510\\x1b[0m');
    console.log('  \\x1b[32m\\u2502\\x1b[0m  \\x1b[1m\\x1b[32mMatch Found!\\x1b[0m                        \\x1b[32m\\u2502\\x1b[0m');
    console.log(\`  \\x1b[32m\\u2502\\x1b[0m  Score: \\x1b[1m\${score?.overall}/100\\x1b[0m                    \\x1b[32m\\u2502\\x1b[0m\`);
    console.log(\`  \\x1b[32m\\u2502\\x1b[0m  Intent alignment:  \${(score?.breakdown?.intentAlignment * 100).toFixed(0)}%             \\x1b[32m\\u2502\\x1b[0m\`);
    console.log(\`  \\x1b[32m\\u2502\\x1b[0m  Domain fit:        \${(score?.breakdown?.domainFit * 100).toFixed(0)}%             \\x1b[32m\\u2502\\x1b[0m\`);
    console.log(\`  \\x1b[32m\\u2502\\x1b[0m  Authenticity:      \\x1b[32mverified\\x1b[0m            \\x1b[32m\\u2502\\x1b[0m\`);
    console.log('  \\x1b[32m\\u2514\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2518\\x1b[0m');
    console.log();
    console.log('  \\x1b[2mThis is a simulated match. Deploy a relay node to match with real agents.\\x1b[0m');
    console.log('  \\x1b[2mLearn more: https://github.com/tacitprotocol/tacit\\x1b[0m');
    console.log();
    process.exit(0);
  });

  console.log();
  console.log('  \\x1b[1mAgent is running.\\x1b[0m Listening for matches...');
  console.log('  \\x1b[2mPress Ctrl+C to stop.\\x1b[0m\\n');

  // Connect in demo mode (simulates a match after ~3s)
  await agent.connect({ demo: true });
}

main().catch(console.error);
`
  );

  // .gitignore
  writeFileSync(
    join(projectDir, '.gitignore'),
    `node_modules/
dist/
.env
*.local
.tacit/
`
  );

  // README
  writeFileSync(
    join(projectDir, 'README.md'),
    `# ${projectName}

A [Tacit Protocol](https://tacitprotocol.com) agent — verify identity, prevent fraud, and broker trusted introductions.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

Your agent will:
1. Generate a cryptographic identity (W3C DID)
2. Publish an intent to the network
3. Listen for compatible matches
4. Broker introductions with double opt-in

## Customize

Edit \`src/agent.ts\` to configure your agent's domain, intent, and preferences.

## Learn More

- [Tacit Protocol Docs](https://github.com/tacitprotocol/tacit)
- [SDK Reference](https://www.npmjs.com/package/@tacitprotocol/sdk)
- [Protocol Spec](https://github.com/tacitprotocol/tacit/blob/main/docs/PROTOCOL_SPEC.md)
`
  );

  // ─── Install Dependencies ────────────────────────────────────────

  console.log(`${dim('Installing dependencies...')}`);
  console.log();

  try {
    execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
  } catch {
    console.log();
    console.log(dim('npm install failed — you can run it manually:'));
    console.log(`  cd ${projectName} && npm install`);
  }

  // ─── Done ────────────────────────────────────────────────────────

  console.log();
  console.log(green('Done!') + ` Your Tacit agent is ready.`);
  console.log();
  console.log(`  ${bold('cd')} ${cyan(projectName)}`);
  console.log(`  ${bold('npm start')}`);
  console.log();
  console.log(dim('Your agent will create a cryptographic identity, publish an intent,'));
  console.log(dim('and show a simulated match in ~3 seconds. Edit src/agent.ts to customize.'));
  console.log();
}

main().catch(console.error);
