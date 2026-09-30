import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi target pengujian beban Grafana k6
export const options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS, 10) : 1,
  duration: __ENV.DURATION || '60s',
  thresholds: {
    // 95% permintaan (p95) harus selesai di bawah 1 detik (1000ms)
    http_req_duration: ['p(95)<1000'],
    // Tingkat kegagalan request harus di bawah 1%
    http_req_failed: ['rate<0.01'],
  },
};

export default function loadTest() {
  // Menguji endpoint API katalog produk dan inventaris Kasir Safira
  const res = http.get('http://localhost:3000/api/products');

  // Validasi status respon dan durasi
  check(res, {
    'status 200 OK': (r) => r.status === 200,
    'waktu respon < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Jeda 1 detik antar-permintaan (mensimulasikan perilaku pengguna nyata)
  sleep(1);
}
