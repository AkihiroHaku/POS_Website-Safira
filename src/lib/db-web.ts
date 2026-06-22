/**
 * db-web.ts — SQL.js adapter untuk browser (web)
 *
 * Menggunakan sql.js (WebAssembly SQLite) langsung tanpa Capacitor.
 * Data disimpan ke IndexedDB agar persistent antar sesi.
 */

// ─────────────────────────────────────────────
// Unified DB interface
// ─────────────────────────────────────────────

export interface WebDBConnection {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ values: T[] }>
  run(sql: string, params?: unknown[]): Promise<void>
  execute(sql: string): Promise<void>
  executeSet(statements: Array<{ statement: string; values?: unknown[] }>): Promise<void>
}

// ─────────────────────────────────────────────
// IndexedDB persistence
// ─────────────────────────────────────────────

const DB_IDB_NAME = 'kasir_umkm_store'
const IDB_OBJECT_STORE = 'db'
const IDB_KEY = 'kasir_umkm'

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_IDB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_OBJECT_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIDB()
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_OBJECT_STORE, 'readonly')
      const req = tx.objectStore(IDB_OBJECT_STORE).get(IDB_KEY)
      req.onsuccess = () => resolve(req.result instanceof Uint8Array ? req.result : null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function saveToIDB(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIDB()
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_OBJECT_STORE, 'readwrite')
      const req = tx.objectStore(IDB_OBJECT_STORE).put(data, IDB_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[db-web] Failed to save to IndexedDB:', err)
  }
}

// ─────────────────────────────────────────────
// WebDB implementation
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlJsDatabase = any

class WebDB implements WebDBConnection {
  private db: SqlJsDatabase
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => void this._flush(), 500)
  }

  private async _flush() {
    try {
      const data: Uint8Array = this.db.export()
      await saveToIDB(data)
    } catch (err) {
      console.error('[db-web] Save error:', err)
    }
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ values: T[] }> {
    const results = this.db.exec(sql, params)
    if (!results || results.length === 0) return { values: [] }

    const { columns, values } = results[0]
    const rows = values.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {}
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i]
      })
      return obj as T
    })
    return { values: rows }
  }

  async run(sql: string, params: unknown[] = []): Promise<void> {
    this.db.run(sql, params)
    this.scheduleSave()
  }

  async execute(sql: string): Promise<void> {
    this.db.run(sql)
    this.scheduleSave()
  }

  async executeSet(statements: Array<{ statement: string; values?: unknown[] }>): Promise<void> {
    for (const s of statements) {
      this.db.run(s.statement, s.values ?? [])
    }
    this.scheduleSave()
  }
}

// ─────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────

let _webDb: WebDBConnection | null = null
let _initWebPromise: Promise<WebDBConnection> | null = null

export async function getWebDb(): Promise<WebDBConnection> {
  if (_webDb) return _webDb
  if (_initWebPromise) return _initWebPromise

  _initWebPromise = (async () => {
    // Load sql.js via CDN script tag (paling reliable di browser)
    // Atau gunakan file yang sudah kita copy ke /public
    const SQL = await loadSqlJs()

    const savedData = await loadFromIDB()
    const db = savedData ? new SQL.Database(savedData) : new SQL.Database()

    _webDb = new WebDB(db)
    return _webDb
  })()

  return _initWebPromise
}

// ─────────────────────────────────────────────
// Load sql.js via script injection
// ─────────────────────────────────────────────

function loadSqlJs(): Promise<{ Database: new (data?: Uint8Array) => SqlJsDatabase }> {
  return new Promise((resolve, reject) => {
    // Cek jika sudah diload
    type WindowWithSqlJs = Window & {
      initSqlJs?: (config: { locateFile: (f: string) => string }) => Promise<{ Database: new (data?: Uint8Array) => SqlJsDatabase }>
    }
    const w = window as WindowWithSqlJs

    function runInit() {
      if (typeof w.initSqlJs !== 'function') {
        reject(new Error('sql.js did not expose initSqlJs'))
        return
      }
      w.initSqlJs({
        // Arahkan semua file WASM ke /public root
        locateFile: (file: string) => `/${file}`,
      }).then(resolve).catch(reject)
    }

    if (typeof w.initSqlJs === 'function') {
      runInit()
      return
    }

    // Load sql-wasm.js dari public (sudah di-copy dari node_modules/sql.js/dist)
    const script = document.createElement('script')
    script.src = '/sql-wasm.js'
    script.onload = runInit
    script.onerror = () => reject(new Error('Failed to load /sql-wasm.js'))
    document.head.appendChild(script)
  })
}

