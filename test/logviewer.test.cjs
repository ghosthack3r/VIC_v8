const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'logviewer.html'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('log viewer is a standalone HTML tool with no external dependencies', () => {
  assert.match(html, /<title>VIC Log Viewer<\/title>/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(html, /<script\s+src=/);
  assert.doesNotMatch(html, /<link\s+[^>]*href=/);
});

test('log viewer has load, filter, copy, and export controls', () => {
  for (const id of [
    'fileInput',
    'dropZone',
    'searchInput',
    'levelFilter',
    'sourceFilter',
    'copyVisibleButton',
    'exportJsonlButton',
    'exportCsvButton',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('log viewer includes JSONL parsing and filtered export helpers', () => {
  for (const fn of ['parseJsonl', 'filterEntries', 'toJsonl', 'toCsv', 'copyText', 'download']) {
    assert.match(html, new RegExp(`function ${fn}\\(`));
  }
});
