import { Denops, ensureString, ensureNumber, parse, Diff, Hunk, toString, removeHunksBefore, removeHunksAfter, removeHunk } from "./deps.ts";

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

const applyDiffToWorkingTree = async (patch: string, isNewFile: boolean): Promise<void> => {
  let opt: Deno.RunOptions
  if (isNewFile) {
    opt = {
      cmd: ['git', 'apply', '--unidiff-zero', '-p0', '-'],
    }
  } else {
    opt = {
      cmd: ['git', 'apply', '--unidiff-zero', '-'],
    }
  }

  const process = Deno.run({ ...opt, stdin: 'piped' });
  await process.stdin.write(new TextEncoder().encode(patch));
  process.stdin.close();
  await process.status();
  process.close();
  return;
}

const applyReverseDiffToWorkingTree = async (patch: string, isNewFile: boolean): Promise<void> => {
  let opt: Deno.RunOptions
  if (isNewFile) {
    opt = {
      cmd: ['git', 'apply', '--unidiff-zero', '-p0', '-R', '-'],
    }
  } else {
    opt = {
      cmd: ['git', 'apply', '--unidiff-zero', '-R', '-'],
    }
  }

  const process = Deno.run({ ...opt, stdin: 'piped' });
  await process.stdin.write(new TextEncoder().encode(patch));
  process.stdin.close();
  await process.status();
  process.close();
  return;
}

const pushStash = async (fileName: string): Promise<void> => {
  const process = Deno.run({
    cmd: ['git', 'stash', '--', fileName],
  });
  await process.status()
  process.close();
  return;
}

const limitDiff = (diff: Diff, firstLine: number, lastLine: number): Diff => {
  const removeBeforeIndex = diff.hunks.findIndex((hunk: Hunk) => hunk.header.afterStartLine >= firstLine) - 1;
  const removeAfterIndex = diff.hunks.findIndex((hunk: Hunk) => hunk.header.afterStartLine + hunk.header.afterLines - 1 > lastLine);
  return removeHunksBefore(removeHunksAfter(diff, removeAfterIndex), removeBeforeIndex);
}

const hollowDiff = (diff: Diff, firstLine: number, lastLine: number): Diff => {
  const start = diff.hunks.findIndex((hunk: Hunk) => hunk.header.afterStartLine >= firstLine);
  if (start < 0) {
    return diff;
  }
  let end = diff.hunks.findIndex((hunk: Hunk) => hunk.header.afterStartLine + hunk.header.afterLines - 1 > lastLine) - 1;
  if (end < 0) {
    end = diff.hunks.length - 1
  }

  for (let i = start; i <= end; i++) {
    diff = removeHunk(diff, i);
  }

  return diff;
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

const restorePatch = async (fileName: string, firstLine: number, lastLine: number): Promise<void> => {
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

  await applyReverseDiffToWorkingTree(toString(limited), limited.afterFileName === fileName);
}

const stashPatch = async (fileName: string, firstLine: number, lastLine: number): Promise<void> => {
  await intentAdd(fileName);
  const gitDiff = await getDiff(fileName);
  const parsed = parse(gitDiff);
  if (parsed.length === 0) {
    return;
  }

  const limited = hollowDiff(parsed[0], firstLine, lastLine);

  if (limited.hunks.length !== 0) {
    await applyReverseDiffToWorkingTree(toString(limited), limited.afterFileName === fileName);
  }

  await pushStash(fileName);

  if (limited.hunks.length !== 0) {
    await applyDiffToWorkingTree(toString(limited), limited.afterFileName === fileName);
  }
}

export function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    async applyPatch(fileName: unknown, firstLine: unknown, lastLine: unknown): Promise<void> {
      ensureString(fileName);
      ensureNumber(firstLine);
      ensureNumber(lastLine);
      return await applyPatch(fileName, firstLine, lastLine);
    },
    async restorePatch(fileName: unknown, firstLine: unknown, lastLine: unknown): Promise<void> {
      ensureString(fileName);
      ensureNumber(firstLine);
      ensureNumber(lastLine);
      return await restorePatch(fileName, firstLine, lastLine);
    },
    async stashPatch(fileName: unknown, firstLine: unknown, lastLine: unknown): Promise<void> {
      ensureString(fileName);
      ensureNumber(firstLine);
      ensureNumber(lastLine);
      return await stashPatch(fileName, firstLine, lastLine);
    },
  };
  return Promise.resolve();
}
