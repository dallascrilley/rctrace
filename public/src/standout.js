// These labels describe the option's documented role. They do not evaluate the
// final value after command-line flags, config expansion, or later overrides.
const OPTION_GUIDE = {
  remote_cache: {
    group: 'Action cache',
    label: 'Remote cache endpoint',
    explanation: 'Names the remote cache endpoint Bazel can use for action results and artifacts.',
    url: 'https://bazel.build/remote/caching',
  },
  disk_cache: {
    group: 'Action cache',
    label: 'Disk cache directory',
    explanation: 'Sets a local directory for Bazel action cache entries.',
    url: 'https://bazel.build/remote/caching',
  },
  remote_instance_name: {
    group: 'Action cache',
    label: 'Remote instance name',
    explanation: 'Selects a named instance on remote execution or cache services. It can separate namespaces on the same endpoint.',
    url: 'https://bazel.build/remote/caching',
  },
  remote_accept_cached: {
    group: 'Action cache behavior',
    label: 'Accept remote cache hits',
    explanation: 'Controls whether Bazel accepts cached results from the remote cache.',
    url: 'https://bazel.build/remote/caching',
  },
  remote_upload_local_results: {
    group: 'Action cache behavior',
    label: 'Upload local results',
    explanation: 'Controls whether locally executed action results are uploaded to the remote cache.',
    url: 'https://bazel.build/remote/caching',
  },
  remote_download_outputs: {
    group: 'Action cache behavior',
    label: 'Remote output downloads',
    explanation: 'Sets which remote execution outputs Bazel downloads. This changes output handling, not whether two actions have the same key.',
    url: 'https://bazel.build/remote/caching',
  },
  experimental_remote_cache_compression: {
    group: 'Action cache behavior',
    label: 'Remote cache compression',
    explanation: 'Enables compression for remote cache blobs above Bazel’s configured threshold. It affects transfer behavior, not action identity.',
    url: 'https://bazel.build/remote/caching',
  },
  repository_cache: {
    group: 'Repository downloads',
    label: 'Repository download cache',
    explanation: 'Sets the local cache for downloaded repository artifacts. This is separate from the action result cache.',
    url: 'https://bazel.build/external/overview',
  },
  compilation_mode: {
    group: 'Action configuration',
    label: 'Compilation mode',
    explanation: 'Selects a build configuration that can change action commands and action keys. The effect depends on the configured targets.',
    url: 'https://bazel.build/reference/command-line-reference',
  },
  platforms: {
    group: 'Action configuration',
    label: 'Target platforms',
    explanation: 'Selects target platforms and can change configured actions and their keys.',
    url: 'https://bazel.build/reference/command-line-reference',
  },
  define: {
    group: 'Action configuration',
    label: 'Build definitions',
    explanation: 'Adds a build definition. It can change configured actions when the build uses that definition.',
    url: 'https://bazel.build/reference/command-line-reference',
  },
  features: {
    group: 'Action configuration',
    label: 'Enabled features',
    explanation: 'Enables build features that may change configured actions and their keys.',
    url: 'https://bazel.build/reference/command-line-reference',
  },
  action_env: {
    group: 'Action configuration',
    label: 'Action environment',
    explanation: 'Sets environment values for actions. Environment differences can change action keys.',
    url: 'https://bazel.build/reference/command-line-reference',
  },
  host_action_env: {
    group: 'Action configuration',
    label: 'Host action environment',
    explanation: 'Sets environment values for host actions. Environment differences can change action keys.',
    url: 'https://bazel.build/reference/command-line-reference',
  },
};

function tokenizeFlags(text) {
  const found = [];
  const re = /(?:^|\s)(--[A-Za-z0-9][A-Za-z0-9_-]*(?:=(?:"[^"\n]*"|'[^'\n]*'|[^\s]+))?)/g;
  for (const match of text.matchAll(re)) found.push(match[1]);
  return found;
}

function splitFlag(raw) {
  const equalAt = raw.indexOf('=');
  const argument = equalAt < 0 ? raw : raw.slice(0, equalAt);
  const possibleNo = argument.startsWith('--no') ? argument.slice(4) : '';
  const name = possibleNo && OPTION_GUIDE[possibleNo] ? possibleNo : argument.slice(2);
  const negated = name !== argument.slice(2);
  return { name, negated, value: equalAt < 0 ? null : raw.slice(equalAt + 1) };
}

function readAnnouncement(line) {
  const match = line.match(/^INFO:\s*(?:Reading ['"]([^'"]+)['"] options from|Reading options for ['"]([^'"]+)['"] from|Reading rc options for ['"]([^'"]+)['"] from)\s+(.+)$/);
  if (!match) return null;
  const command = match[1] || match[2] || match[3];
  const rest = match[4];
  const delimiter = rest.search(/:\s*(?=--|$)/);
  if (delimiter < 0) return null;
  return {
    command,
    source: rest.slice(0, delimiter).trim(),
    optionsText: rest.slice(delimiter + 1).trim(),
  };
}

/** Parse option/source pairs that Bazel explicitly reports in --announce_rc output. */
export function analyze(text) {
  if (typeof text !== 'string') throw new TypeError('Input must be text from Bazel --announce_rc.');
  const announcements = [];
  let sourceBlock = null;
  const lines = text.split(/\r?\n/);
  const addFlags = (optionsText, command, source, line) => {
    for (const raw of tokenizeFlags(optionsText)) {
      const { name, negated, value } = splitFlag(raw);
      const guide = OPTION_GUIDE[name];
      if (!guide) continue;
      announcements.push({ raw, name, negated, value, command, source, line, ...guide });
    }
  };

  for (const [index, line] of lines.entries()) {
    const record = readAnnouncement(line);
    if (record) {
      if (record.optionsText) {
        addFlags(record.optionsText, record.command, record.source, index + 1);
        sourceBlock = null;
      } else {
        sourceBlock = { command: record.command, source: record.source };
      }
      continue;
    }

    const optionGroup = line.match(/^\s*(?:Inherited\s+)?['"]([^'"]+)['"] options:\s*(.*)$/);
    if (sourceBlock && optionGroup) {
      addFlags(optionGroup[2], optionGroup[1], sourceBlock.source, index + 1);
      continue;
    }
    if (sourceBlock && line.trim()) sourceBlock = null;
  }
  return { announcements, totalLines: lines.length };
}

export const supportedOptions = Object.freeze(Object.keys(OPTION_GUIDE));
