import http from 'k6/http';
import { check } from 'k6';

const supportedVersions = ['17', '21', '25'];
const selectedVersion = __ENV.JAVA_VERSION || 'all';

if (selectedVersion !== 'all' && !supportedVersions.includes(selectedVersion)) {
  throw new Error('JAVA_VERSION must be one of: all, 17, 21, 25');
}

const enabledVersions = selectedVersion === 'all' ? supportedVersions : [selectedVersion];
const scenarios = {};
const thresholds = {};

for (const version of enabledVersions) {
  scenarios[`java${version}`] = {
    executor: 'ramping-vus',
    exec: `java${version}`,
    startVUs: 0,
    stages: [
      { duration: '15s', target: 200 }, // Ramp up
      { duration: '2m', target: 200 }, // Hold
      { duration: '15s', target: 0 }, // Ramp down
    ],
    gracefulRampDown: '15s',
    gracefulStop: '15s',
  };

  // Register tagged submetrics for the summary without pass/fail limits.
  for (const metric of ['http_req_duration', 'http_reqs', 'http_req_failed']) {
    thresholds[`${metric}{name:r${version}}`] = [];
  }
}

export const options = { scenarios, thresholds };

function runBenchmark(version, port) {
  const params = 'tasks=50&delay=100';
  const response = http.get(`http://localhost:${port}/benchmark/concurrent?${params}`, {
    tags: { name: `r${version}` },
  });
  check(response, { [`java${version} ok`]: (r) => r.status === 200 });
}

export function java17() {
  runBenchmark('17', 8081);
}

export function java21() {
  runBenchmark('21', 8082);
}

export function java25() {
  runBenchmark('25', 8083);
}
