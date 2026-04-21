function fail(message) {
  throw new Error(message);
}

function ok(value, message) {
  if (!value) fail(message);
}

function equal(actual, expected, message) {
  if (actual !== expected) {
    fail(`${message}\nExpected: ${expected}\nReceived: ${actual}`);
  }
}

function match(value, pattern, message) {
  if (!pattern.test(value)) {
    fail(`${message}\nPattern: ${pattern}`);
  }
}

module.exports = {
  equal,
  fail,
  match,
  ok,
};
