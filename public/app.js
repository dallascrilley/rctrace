import { analyze } from './src/standout.js';

const input = document.querySelector('#announce-output');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const sampleButton = document.querySelector('#load-sample');
const clearButton = document.querySelector('#clear');
function render() {
  const { announcements, totalLines } = analyze(input.value);
  results.replaceChildren();
  if (!announcements.length) {
    const message = document.createElement('p');
    message.className = 'empty-state';
    message.textContent = input.value.trim()
      ? 'No supported cache-related options found in Bazel announcement lines.'
      : 'Paste Bazel --announce_rc output or load the sample.';
    results.append(message);
    status.textContent = input.value.trim()
      ? 'No recognized options found. The input was processed in this browser.'
      : 'Ready. Your text stays in this browser.';
    return;
  }

  const groups = new Map();
  for (const item of announcements) {
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group).push(item);
  }
  const groupOrder = ['Action cache', 'Action cache behavior', 'Repository downloads', 'Action configuration'];
  const orderedGroups = [...groups].sort(([a], [b]) => groupOrder.indexOf(a) - groupOrder.indexOf(b));
  for (const [groupName, entries] of orderedGroups) {
    const section = document.createElement('section');
    section.className = 'result-group';
    const heading = document.createElement('h3');
    heading.textContent = groupName;
    section.append(heading);
    const list = document.createElement('ul');
    for (const item of entries) {
      const row = document.createElement('li');
      row.className = 'option-row';
      const option = document.createElement('code');
      option.textContent = item.raw;
      const explanation = document.createElement('p');
      explanation.textContent = item.explanation;
      const source = document.createElement('p');
      source.className = 'source';
      source.textContent = `${item.command} · ${item.source}`;
      source.title = item.source;
      row.append(option, explanation, source);
      list.append(row);
    }
    section.append(list);
    results.append(section);
  }
  status.textContent = `${announcements.length} recognized option ${announcements.length === 1 ? 'occurrence' : 'occurrences'} across ${totalLines} input lines. Source locations are exactly those announced by Bazel.`;
}

input.addEventListener('input', render);
sampleButton.addEventListener('click', async () => {
  sampleButton.disabled = true;
  sampleButton.textContent = 'Loading…';
  try {
    const response = await fetch('/sample.txt');
    if (!response.ok) throw new Error('Sample could not be loaded.');
    input.value = await response.text();
    input.scrollTop = 0;
    input.setSelectionRange(0, 0);
    render();
    input.focus();
  } catch {
    status.textContent = 'The sample could not be loaded. Paste your own output instead.';
  } finally {
    sampleButton.disabled = false;
    sampleButton.textContent = 'Load sample';
  }
});
clearButton.addEventListener('click', () => {
  input.value = '';
  render();
  input.focus();
});
render();
