import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp-up ke 5 user
    { duration: '20s', target: 10 },  // Beban stabil 10 user
    { duration: '5s', target: 0 },    // Selesai / Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% request harus di bawah 1 detik (1000ms)
    http_req_failed: ['rate<0.01'],    // Kegagalan request < 1%
  },
};

export default function loadTest() {
  // Menguji endpoint API produk Kasir Safira
  const res = http.get('http://localhost:3000/api/products');
  check(res, {
    'status 200 OK': (r) => r.status === 200,
    'waktu respon < 1000ms': (r) => r.timings.duration < 1000,
  });
  sleep(1);
}
