import { Denops, ensureString, ensureNumber, parse, Diff, Hunk, toString } from "./deps.ts";

const intentAdd = async (fileName: string): Promise<void> => {
  const process = Deno.run({
    cmd: ['git', 'add', '-N', fileName],
  });
  await process.status()
  process.close();
  return;
}

const getDiff = async (fileName: string): Promise<string> => {
  const process = Deno.run({
    cmd: ['git', '-c', 'diff.noprefix', 'diff', '--no-ext-diff', '--no-color', '-U0', fileName],
    stdout: 'piped',
  });
  const output = await process.output();
  const ret = new TextDecoder().decode(output);
  process.close();
  return ret;
};

const applyDiff = async (patch: string, isNewFile: boolean): Promise<void> => {
  let opt: Deno.RunOptions
  if (isNewFile) {
    opt = {
      cmd: ['git', 'apply', '--unidiff-zero', '--cached', '-p0', '-'],
    }
  } else {
    opt = {
      cmd: ['git', 'apply', '--unidiff-zero', '--cached', '-'],
    }
  }

  const process = Deno.run({ ...opt, stdin: 'piped' });
  await process.stdin.write(new TextEncoder().encode(patch));
  process.stdin.close();
  await process.status();
  process.close();
  return;
}

const limitDiff = (diff: Diff, firstLine: number, lastLine: number): Diff => {
  const newHunks = diff.hunks.filter((hunk: Hunk) => {
    const hunkFirstLine = hunk.header.afterStartLine;
    const hunkLastLine = hunk.header.afterStartLine + hunk.header.afterLines - 1;
    return hunkFirstLine >= firstLine && hunkLastLine <= lastLine
  })

  if (newHunks.length === 1) {
    newHunks[0] = limitU0Hunk(newHunks[0], firstLine, lastLine);
  }

  if (newHunks.length >= 2) {
    newHunks[0] = limitU0Hunk(newHunks[0], firstLine, lastLine);
    newHunks[newHunks.length - 1] = limitU0Hunk(newHunks[newHunks.length - 1], firstLine, lastLine);
  }

  diff.hunks = newHunks;
  return diff;
}

const limitU0Hunk = (hunk: Hunk, _firstLine: number, _lastLine: number): Hunk => {
  return hunk;
}

const applyPatch = async (fileName: string, firstLine: number, lastLine: number): Promise<void> => {
  await intentAdd(fileName);
  const gitDiff = await getDiff(fileName);
  const parsed = parse(gitDiff);
  if (parsed.length === 0) {
    return;
  }

  const limited = limitDiff(parsed[0], firstLine, lastLine);
  if (limited.hunks.length === 0) {
    return;
  }

  await applyDiff(toString(limited), limited.afterFileName === fileName);
}

export function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    async applyPatch(fileName: unknown, firstLine: unknown, lastLine: unknown): Promise<void> {
      ensureString(fileName);
      ensureNumber(firstLine);
      ensureNumber(lastLine);
      return await applyPatch(fileName, firstLine, lastLine);
    },
  };
  return Promise.resolve();
}
