'use client'

import { useEffect } from 'react'
import Script from 'next/script'

/**
 * SqliteWebInitializer
 *
 * Load jeep-sqlite via <script> tag (bukan dynamic import yang gagal di Turbopack).
 * Mendefinisikan <jeep-sqlite> custom element yang dibutuhkan oleh
 * @capacitor-community/sqlite sebelum initWebStore() dipanggil.
 */
export function SqliteWebInitializer() {
  return (
    <Script
      src="/jeep-sqlite/jeep-sqlite.esm.js"
      type="module"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('[SqliteWebInitializer] jeep-sqlite script loaded')

        // Tambahkan element ke DOM setelah script load
        if (document.querySelector('jeep-sqlite')) return

        customElements.whenDefined('jeep-sqlite').then(() => {
          if (document.querySelector('jeep-sqlite')) return
          const el = document.createElement('jeep-sqlite')
          document.body.appendChild(el)
          console.log('[SqliteWebInitializer] jeep-sqlite element added to DOM ✓')
        }).catch(err => {
          console.error('[SqliteWebInitializer] Error:', err)
        })
      }}
    />
  )
}
