import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    // { duration: '30s', target: 10 },
    { duration: '2m', target: 200 },
    // { duration: '3m', target: 200 },
    { duration: '1m', target: 10 },
  ],
};

export default function () {
  const params = 'tasks=50&delay=100';

  const r17 = http.get(`http://localhost:8081/benchmark/concurrent?${params}`);
  check(r17, { 'java17 ok': (r) => r.status === 200 });

  const r21 = http.get(`http://localhost:8082/benchmark/concurrent?${params}`);
  check(r21, { 'java21 ok': (r) => r.status === 200 });

  const r26 = http.get(`http://localhost:8083/benchmark/concurrent?${params}`);
  check(r26, { 'java26 ok': (r) => r.status === 200 });
}
