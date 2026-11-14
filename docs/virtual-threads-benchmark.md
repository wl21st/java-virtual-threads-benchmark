# Java Virtual Threads Benchmark

## Latest run — 2026-11-13

Source: k6 terminal output supplied by the user. This report records that run; the benchmark was not rerun when documenting it.

Java 21 and Java 25 delivered approximately **36× the Java 17 throughput** in this combined run. All three scenarios completed with **100% successful checks and zero HTTP failures**. Java 17's average response time was **3.87s**, compared with approximately **105–106ms** for Java 21 and Java 25.

## Workload and execution

Command:

```bash
k6 run - < k6/ramp-up.js
```

Each request calls `/benchmark/concurrent?tasks=50&delay=100`: 50 concurrent tasks, each sleeping for 100ms, with the response waiting for all tasks to finish. This models blocking waits rather than a real external I/O dependency.

The script runs three independent `ramping-vus` scenarios concurrently, each calling only its own Java application's endpoint:

| Scenario | Request tag | Endpoint | Peak VUs |
| --- | --- | --- | ---: |
| Java 17 | `r17` | `http://localhost:8081/benchmark/concurrent` | 200 |
| Java 21 | `r21` | `http://localhost:8082/benchmark/concurrent` | 200 |
| Java 25 | `r25` | `http://localhost:8083/benchmark/concurrent` | 200 |

Each scenario follows the same stages:

| Stage | Duration | VU change |
| --- | --- | --- |
| Ramp up | 15s | 0 → 200 |
| Hold | 2m | 200 → 200 |
| Ramp down | 15s | 200 → 0 |

Both `gracefulRampDown` and `gracefulStop` are 15s. Scheduled duration is 2m30s, with a maximum duration of 2m45s including graceful stop. The observed elapsed time was **2m30.1s**, with **600 maximum VUs** across all scenarios and **zero interrupted iterations**.

## Per-Java results

These are whole-run results, including ramp-up and ramp-down; they are not measurements isolated to the two-minute hold stage.

| Metric | Java 17 (`r17`) | Java 21 (`r21`) | Java 25 (`r25`) |
| --- | ---: | ---: | ---: |
| Requests completed | 7,025 | 256,159 | 254,328 |
| Throughput (requests/s) | 46.806088 | 1,706.733177 | 1,694.533612 |
| Throughput relative to Java 17 | 1.00× | 36.46× | 36.20× |
| Average latency | 3.87s | 105.4ms | 106.08ms |
| Minimum latency | 103.31ms | 100.23ms | 100.22ms |
| Median latency | 5.16s | 104.27ms | 105.56ms |
| Maximum latency | 7.84s | 157ms | 135.4ms |
| p90 latency | 6.28s | 110.65ms | 110.38ms |
| p95 latency | 6.54s | 113.68ms | 112.04ms |
| HTTP failure rate | 0.00% | 0.00% | 0.00% |
| HTTP failures | 0 / 7,025 | 0 / 256,159 | 0 / 254,328 |

## Combined results

| Metric | Value |
| --- | ---: |
| Total checks | 517,512 |
| Successful checks | 517,512 / 517,512 (100.00%) |
| Failed checks | 0 / 517,512 (0.00%) |
| Total HTTP requests | 517,512 |
| Aggregate throughput | 3,448.072877 requests/s |
| HTTP failures | 0 / 517,512 (0.00%) |
| Average HTTP request duration | 156.85ms |
| Minimum HTTP request duration | 100.22ms |
| Median HTTP request duration | 104.99ms |
| Maximum HTTP request duration | 7.84s |
| p90 HTTP request duration | 110.88ms |
| p95 HTTP request duration | 113.74ms |
| Completed iterations | 517,512 |
| Interrupted iterations | 0 |
| Average iteration duration | 156.91ms |
| Minimum iteration duration | 100.24ms |
| Median iteration duration | 105.05ms |
| Maximum iteration duration | 7.84s |
| p90 iteration duration | 110.99ms |
| p95 iteration duration | 113.85ms |
| Data received | 131 MB (873 kB/s) |
| Data sent | 56 MB (376 kB/s) |

## Interpretation and limits

- Independent scenarios allow the faster applications to complete more requests without waiting for Java 17. Their throughput is no longer tied to one shared iteration containing all three requests.
- Java 21 and Java 25 stay close to the workload's intended 100ms wait. Java 17 has much higher latency under this load despite returning successful responses.
- The aggregate p95 of 113.74ms hides Java 17's 6.54s p95 because Java 17 accounts for only about 1.36% of completed requests. Use the per-Java statistics for comparisons.
- This compares application threading designs as well as Java versions: Java 17 creates a fresh platform-thread pool per request; Java 21/25 use virtual-thread executors and enable Spring virtual threads. This run alone does not isolate JDK-version effects or identify the exact source of the performance gap.
- The three workloads ran concurrently. The supplied output does not include CPU, memory, thread counts, hardware details, resource limits, or verified JVM runtime versions. Scenario labels identify the configured targets.
- The small differences between Java 21 and Java 25 in this single run do not establish a consistent winner. Separate repeated runs and hold-stage measurements would support a stronger comparison.

## Supplied k6 output

```text
❯ k6 run - < k6/ramp-up.js

         /\      Grafana   /‾‾/
    /\  /  \     |\  __   /  /
   /  \/    \    | |/ /  /   ‾‾\
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/


     execution: local
        script: -
        output: -

     scenarios: (100.00%) 3 scenarios, 600 max VUs, 2m45s max duration (incl. graceful stop):
              * java17: Up to 200 looping VUs for 2m30s over 3 stages (gracefulRampDown: 15s, exec: java17, gracefulStop: 15s)
              * java21: Up to 200 looping VUs for 2m30s over 3 stages (gracefulRampDown: 15s, exec: java21, gracefulStop: 15s)
              * java25: Up to 200 looping VUs for 2m30s over 3 stages (gracefulRampDown: 15s, exec: java25, gracefulStop: 15s)



  █ TOTAL RESULTS

    checks_total.......: 517512  3448.072877/s
    checks_succeeded...: 100.00% 517512 out of 517512
    checks_failed......: 0.00%   0 out of 517512

    ✓ java21 ok
    ✓ java25 ok
    ✓ java17 ok

    HTTP
    http_req_duration..............: avg=156.85ms min=100.22ms med=104.99ms max=7.84s   p(90)=110.88ms p(95)=113.74ms
      { expected_response:true }...: avg=156.85ms min=100.22ms med=104.99ms max=7.84s   p(90)=110.88ms p(95)=113.74ms
      { name:r17 }.................: avg=3.87s    min=103.31ms med=5.16s    max=7.84s   p(90)=6.28s    p(95)=6.54s
      { name:r21 }.................: avg=105.4ms  min=100.23ms med=104.27ms max=157ms   p(90)=110.65ms p(95)=113.68ms
      { name:r25 }.................: avg=106.08ms min=100.22ms med=105.56ms max=135.4ms p(90)=110.38ms p(95)=112.04ms
    http_req_failed................: 0.00%  0 out of 517512
      { name:r17 }.................: 0.00%  0 out of 7025
      { name:r21 }.................: 0.00%  0 out of 256159
      { name:r25 }.................: 0.00%  0 out of 254328
    http_reqs......................: 517512 3448.072877/s
      { name:r17 }.................: 7025   46.806088/s
      { name:r21 }.................: 256159 1706.733177/s
      { name:r25 }.................: 254328 1694.533612/s

    EXECUTION
    iteration_duration.............: avg=156.91ms min=100.24ms med=105.05ms max=7.84s   p(90)=110.99ms p(95)=113.85ms
    iterations.....................: 517512 3448.072877/s
    vus............................: 4      min=4           max=600
    vus_max........................: 600    min=600         max=600

    NETWORK
    data_received..................: 131 MB 873 kB/s
    data_sent......................: 56 MB  376 kB/s




running (2m30.1s), 000/600 VUs, 517512 complete and 0 interrupted iterations
java17 ✓ [======================================] 000/200 VUs  2m30s
java21 ✓ [======================================] 000/200 VUs  2m30s
java25 ✓ [======================================] 000/200 VUs  2m30s
```
