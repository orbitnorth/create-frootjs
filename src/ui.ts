/**
 * Terminal UI and interactive prompt utilities for create-frootjs.
 * Zero-dependency implementation with full ANSI color and raw-mode TTY support.
 */

import * as readline from 'node:readline';

// ---------------------------------------------------------------------------
// ANSI Color & Styling Codes
// ---------------------------------------------------------------------------

export const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright / 24-bit RGB colors
  emerald: '\x1b[38;2;16;185;129m',
  violet: '\x1b[38;2;168;85;247m',
  amber: '\x1b[38;2;245;158;11m',
  sky: '\x1b[38;2;14;165;233m',
  rose: '\x1b[38;2;244;63;94m',
};

// ---------------------------------------------------------------------------
// Visual Components
// ---------------------------------------------------------------------------

/**
 * Print the stylized Froot header banner.
 */
export function printBanner(version = '1.0.1'): void {
  const line = '─'.repeat(54);
  console.log();
  console.log(`  ${c.emerald}╭${line}╮${c.reset}`);
  console.log(`  ${c.emerald}│${c.reset}  ${c.bold}${c.emerald}F R O O T J S${c.reset}  ${c.gray}v${version}${c.reset}${' '.repeat(34 - version.length)}${c.emerald}│${c.reset}`);
  console.log(`  ${c.emerald}│${c.reset}  ${c.dim}Ultra-fast, TypeScript-native web framework       ${c.reset}${c.emerald}│${c.reset}`);
  console.log(`  ${c.emerald}╰${line}╯${c.reset}`);
  console.log();
}

/**
 * Print a section step indicator.
 */
export function printStep(current: number, total: number, title: string): void {
  console.log(`  ${c.emerald}${current}/${total}${c.reset} ${c.bold}${title}${c.reset}`);
}

/**
 * Print a success message.
 */
export function printSuccess(message: string): void {
  console.log(`  ${c.green}✔${c.reset} ${message}`);
}

/**
 * Print an info message.
 */
export function printInfo(message: string): void {
  console.log(`  ${c.cyan}ℹ${c.reset} ${c.dim}${message}${c.reset}`);
}

/**
 * Print a warning message.
 */
export function printWarning(message: string): void {
  console.log(`  ${c.yellow}▲${c.reset} ${c.yellow}${message}${c.reset}`);
}

/**
 * Print an error message.
 */
export function printError(message: string): void {
  console.log(`  ${c.red}✖${c.reset} ${c.red}${message}${c.reset}`);
}

// ---------------------------------------------------------------------------
// Interactive Prompts
// ---------------------------------------------------------------------------

/**
 * Text input prompt with a default fallback value.
 */
export async function promptText(
  question: string,
  defaultValue: string,
  validate?: (input: string) => string | true
): Promise<string> {
  const isTTY = process.stdin.isTTY;
  if (!isTTY) {
    return defaultValue;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    const ask = () => {
      rl.question(
        `  ${c.cyan}?${c.reset} ${c.bold}${question}${c.reset} ${c.dim}(${defaultValue})${c.reset} `,
        (answer) => {
          const value = answer.trim() || defaultValue;
          if (validate) {
            const result = validate(value);
            if (result !== true) {
              console.log(`    ${c.red}▲ ${result}${c.reset}`);
              ask();
              return;
            }
          }
          rl.close();
          resolve(value);
        }
      );
    };
    ask();
  });
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Interactive single-select prompt with keyboard arrow navigation.
 */
export async function promptSelect<T = string>(
  question: string,
  options: SelectOption<T>[]
): Promise<T> {
  const isTTY = process.stdin.isTTY;
  if (!isTTY || options.length === 0) {
    return options[0]!.value;
  }

  let selectedIndex = 0;
  const stdin = process.stdin;
  const stdout = process.stdout;

  // Hide cursor during selection
  stdout.write('\x1b[?25l');

  const maxLabelLen = Math.max(...options.map((o) => o.label.length), 10);

  const render = (isInitial = false) => {
    if (!isInitial) {
      // Clear previous options lines
      stdout.write(`\x1b[${options.length}A\x1b[0J`);
    }

    for (let i = 0; i < options.length; i++) {
      const opt = options[i]!;
      const isSelected = i === selectedIndex;
      const pointer = isSelected ? `${c.emerald}❯${c.reset}` : ' ';
      const paddedLabel = opt.label.padEnd(maxLabelLen + 2, ' ');
      const labelText = isSelected
        ? `${c.bold}${c.emerald}${paddedLabel}${c.reset}`
        : `${c.dim}${paddedLabel}${c.reset}`;
      const hintText = opt.hint
        ? isSelected
          ? `${c.cyan}${opt.hint}${c.reset}`
          : `${c.gray}${opt.hint}${c.reset}`
        : '';

      stdout.write(`    ${pointer} ${labelText}${hintText}\n`);
    }
  };

  console.log(`  ${c.cyan}?${c.reset} ${c.bold}${question}${c.reset} ${c.dim}(Use arrows, Enter to select)${c.reset}`);
  render(true);

  return new Promise<T>((resolve) => {
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    const onData = (data: Buffer) => {
      const key = data.toString();

      // Ctrl+C
      if (key === '\u0003') {
        stdout.write('\x1b[?25h'); // restore cursor
        process.exit(130);
      }

      // Enter / Return
      if (key === '\r' || key === '\n') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        stdout.write('\x1b[?25h'); // restore cursor
        resolve(options[selectedIndex]!.value);
        return;
      }

      // Up arrow or 'k'
      if (key === '\u001b[A' || key === 'k') {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
      }

      // Down arrow or 'j'
      if (key === '\u001b[B' || key === 'j') {
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
      }
    };

    stdin.on('data', onData);
  });
}

/**
 * Confirm (yes/no) prompt.
 */
export async function promptConfirm(
  question: string,
  defaultValue = true
): Promise<boolean> {
  const isTTY = process.stdin.isTTY;
  if (!isTTY) {
    return defaultValue;
  }

  const defaultHint = defaultValue ? 'Y/n' : 'y/N';
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<boolean>((resolve) => {
    rl.question(
      `  ${c.cyan}?${c.reset} ${c.bold}${question}${c.reset} ${c.dim}(${defaultHint})${c.reset} `,
      (answer) => {
        rl.close();
        const trimmed = answer.trim().toLowerCase();
        if (!trimmed) {
          resolve(defaultValue);
        } else {
          resolve(trimmed === 'y' || trimmed === 'yes');
        }
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Post-Generation Next Steps Card
// ---------------------------------------------------------------------------

export function printNextSteps(options: {
  projectDir: string;
  pkgManager: string;
  hasInstalled: boolean;
  port?: number;
}): void {
  const { projectDir, pkgManager, hasInstalled, port = 3000 } = options;
  const isCurrentDir = projectDir === '.' || projectDir === './';

  const commands: string[] = [];
  if (!isCurrentDir) {
    commands.push(`cd ${projectDir}`);
  }
  if (!hasInstalled) {
    commands.push(`${pkgManager} install`);
  }
  commands.push(`${pkgManager} run dev`);

  const innerWidth = 54;
  const top = '─'.repeat(innerWidth);
  console.log();
  console.log(`  ${c.emerald}╭${top}╮${c.reset}`);
  console.log(`  ${c.emerald}│${c.reset}  ${c.bold}Project created successfully!${c.reset}${' '.repeat(innerWidth - 30)}${c.emerald}│${c.reset}`);
  console.log(`  ${c.emerald}│${c.reset}${' '.repeat(innerWidth)}${c.emerald}│${c.reset}`);
  console.log(`  ${c.emerald}│${c.reset}  ${c.dim}Next steps:${c.reset}${' '.repeat(innerWidth - 13)}${c.emerald}│${c.reset}`);

  for (const cmd of commands) {
    const formatted = `  ${c.cyan}$ ${cmd}${c.reset}`;
    const visibleLength = cmd.length + 4;
    const padding = Math.max(0, innerWidth - visibleLength);
    console.log(`  ${c.emerald}│${c.reset}${formatted}${' '.repeat(padding)}${c.emerald}│${c.reset}`);
  }

  console.log(`  ${c.emerald}│${c.reset}${' '.repeat(innerWidth)}${c.emerald}│${c.reset}`);
  const urlMsg = `  ${c.gray}Server starts on http://localhost:${port}${c.reset}`;
  const urlLen = `Server starts on http://localhost:${port}`.length + 2;
  console.log(`  ${c.emerald}│${c.reset}${urlMsg}${' '.repeat(Math.max(0, innerWidth - urlLen))}${c.emerald}│${c.reset}`);
  console.log(`  ${c.emerald}╰${top}╯${c.reset}`);
  console.log();
}
