/**
 * Terminal UI and interactive prompt utilities for create-frootjs.
 * Zero-dependency implementation with 24-bit RGB gradients, raw-mode TTY, and animated spinners.
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

  // 24-bit RGB colors
  emerald: '\x1b[38;2;16;185;129m',
  sky: '\x1b[38;2;14;165;233m',
  violet: '\x1b[38;2;168;85;247m',
  amber: '\x1b[38;2;245;158;11m',
  rose: '\x1b[38;2;244;63;94m',
};

/**
 * Interpolate RGB colors along a multi-stop gradient.
 */
function interpolateRgb(
  colorA: [number, number, number],
  colorB: [number, number, number],
  factor: number
): [number, number, number] {
  return [
    Math.round(colorA[0] + (colorB[0] - colorA[0]) * factor),
    Math.round(colorA[1] + (colorB[1] - colorA[1]) * factor),
    Math.round(colorA[2] + (colorB[2] - colorA[2]) * factor),
  ];
}

/**
 * Apply a multi-color gradient across a line of text.
 */
export function gradientLine(
  text: string,
  stops: [number, number, number][] = [
    [16, 185, 129],  // Emerald
    [14, 165, 233],  // Sky
    [168, 85, 247],  // Violet
  ]
): string {
  const len = text.length;
  if (len === 0) return '';
  if (stops.length < 2) return text;

  let out = '';
  for (let i = 0; i < len; i++) {
    const progress = i / Math.max(1, len - 1);
    const scaled = progress * (stops.length - 1);
    const segmentIndex = Math.min(Math.floor(scaled), stops.length - 2);
    const segmentFactor = scaled - segmentIndex;

    const [r, g, b] = interpolateRgb(
      stops[segmentIndex]!,
      stops[segmentIndex + 1]!,
      segmentFactor
    );
    out += `\x1b[38;2;${r};${g};${b}m${text[i]}`;
  }
  return out + c.reset;
}

// ---------------------------------------------------------------------------
// Header Banner
// ---------------------------------------------------------------------------

export function printBanner(version = '1.0.5'): void {
  const logo = [
    '  ███████╗██████╗  ██████╗  ██████╗ ████████╗   ██╗███████╗',
    '  ██╔════╝██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝   ██║██╔════╝',
    '  █████╗  ██████╔╝██║   ██║██║   ██║   ██║      ██║███████╗',
    '  ██╔══╝  ██╔══██╗██║   ██║██║   ██║   ██║ ██   ██║╚════██║',
    '  ██║     ██║  ██║╚██████╔╝╚██████╔╝   ██║ ╚█████╔╝███████║',
    '  ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝  ╚════╝ ╚══════╝',
  ];

  console.log();
  for (const line of logo) {
    console.log(gradientLine(line));
  }
  console.log();
  console.log(`  ${c.dim}Ultra-fast, TypeScript-native web framework${c.reset}  ${c.gray}v${version}${c.reset}`);
  console.log(`  ${c.gray}${'─'.repeat(57)}${c.reset}`);
  console.log();
}

// ---------------------------------------------------------------------------
// Messages & Indicators
// ---------------------------------------------------------------------------

export function printStep(current: number, total: number, title: string): void {
  console.log(`  ${c.emerald}${current}/${total}${c.reset} ${c.bold}${title}${c.reset}`);
}

export function printSuccess(message: string): void {
  console.log(`  ${c.green}✔${c.reset} ${message}`);
}

export function printInfo(message: string): void {
  console.log(`  ${c.cyan}ℹ${c.reset} ${c.dim}${message}${c.reset}`);
}

export function printWarning(message: string): void {
  console.log(`  ${c.yellow}▲${c.reset} ${c.yellow}${message}${c.reset}`);
}

export function printError(message: string): void {
  console.log(`  ${c.red}✖${c.reset} ${c.red}${message}${c.reset}`);
}

// ---------------------------------------------------------------------------
// Animated Terminal Spinner
// ---------------------------------------------------------------------------

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private current = 0;
  private timer?: NodeJS.Timeout;
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  start(): this {
    if (!process.stdout.isTTY) {
      console.log(`  ${c.dim}${this.text}...${c.reset}`);
      return this;
    }
    process.stdout.write('\x1b[?25l');
    this.timer = setInterval(() => {
      const frame = this.frames[this.current % this.frames.length];
      this.current++;
      process.stdout.write(`\r  ${c.emerald}${frame}${c.reset} ${this.text}`);
    }, 80);
    return this;
  }

  stop(successMessage?: string): void {
    if (this.timer) clearInterval(this.timer);
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1b[2K');
      process.stdout.write('\x1b[?25h');
    }
    if (successMessage) {
      console.log(`  ${c.green}✔${c.reset} ${successMessage}`);
    }
  }

  fail(errorMessage: string): void {
    if (this.timer) clearInterval(this.timer);
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1b[2K');
      process.stdout.write('\x1b[?25h');
    }
    console.log(`  ${c.red}✖${c.reset} ${c.red}${errorMessage}${c.reset}`);
  }
}

// ---------------------------------------------------------------------------
// Interactive Prompts
// ---------------------------------------------------------------------------

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

  stdout.write('\x1b[?25l'); // Hide cursor

  const maxLabelLen = Math.max(...options.map((o) => o.label.length), 10);

  const render = (isInitial = false) => {
    if (!isInitial) {
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

  console.log(`  ${c.cyan}?${c.reset} ${c.bold}${question}${c.reset} ${c.dim}(Use arrows or numbers 1-${options.length})${c.reset}`);
  render(true);

  return new Promise<T>((resolve) => {
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    const onData = (data: Buffer) => {
      const key = data.toString();

      // Ctrl+C
      if (key === '\u0003') {
        stdout.write('\x1b[?25h');
        process.exit(130);
      }

      // Enter / Return
      if (key === '\r' || key === '\n') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        stdout.write('\x1b[?25h');

        // Collapse menu into compact confirmed answer
        stdout.write(`\x1b[${options.length + 1}A\x1b[0J`);
        console.log(`  ${c.green}✔${c.reset} ${c.bold}${question.replace(/:$/, '')}:${c.reset} ${c.emerald}${options[selectedIndex]!.label}${c.reset}`);
        resolve(options[selectedIndex]!.value);
        return;
      }

      // Numbers 1-9 direct jump
      const num = parseInt(key, 10);
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        selectedIndex = num - 1;
        render();
        return;
      }

      // Up arrow or 'k'
      if (key === '\u001b[A' || key === 'k') {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
      }

      // Down arrow, 'j', or Tab
      if (key === '\u001b[B' || key === 'j' || key === '\t') {
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
      }
    };

    stdin.on('data', onData);
  });
}

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
        const result = !trimmed ? defaultValue : trimmed === 'y' || trimmed === 'yes';
        resolve(result);
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
  durationMs?: number;
}): void {
  const { projectDir, pkgManager, hasInstalled, port = 3000, durationMs } = options;
  const isCurrentDir = projectDir === '.' || projectDir === './';

  const commands: string[] = [];
  if (!isCurrentDir) {
    commands.push(`cd ${projectDir}`);
  }
  if (!hasInstalled) {
    commands.push(`${pkgManager} install`);
  }
  commands.push(`${pkgManager} run dev`);

  const innerWidth = 56;
  const top = '─'.repeat(innerWidth);
  const timeMsg = durationMs !== undefined ? ` in ${(durationMs / 1000).toFixed(2)}s` : '';

  console.log();
  console.log(`  ${c.emerald}╭${top}╮${c.reset}`);
  console.log(`  ${c.emerald}│${c.reset}  ${c.bold}Project created successfully!${c.reset}${c.dim}${timeMsg}${c.reset}${' '.repeat(Math.max(0, innerWidth - 30 - timeMsg.length))}${c.emerald}│${c.reset}`);
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
