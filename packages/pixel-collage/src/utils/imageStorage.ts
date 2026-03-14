const DB_NAME = "pixel-collage";
const DB_VERSION = 1;
const STORE_NAME = "keyval";

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function loadValue<T>(key: string, fallback: T): Promise<T> {
    return openDatabase().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const store = tx.objectStore(STORE_NAME);
                const request = store.get(key);
                request.onsuccess = () => {
                    db.close();
                    resolve(request.result === undefined ? fallback : (request.result as T));
                };
                request.onerror = () => {
                    db.close();
                    reject(request.error);
                };
            }),
    );
}

export function saveValue<T>(key: string, value: T): Promise<void> {
    return openDatabase().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                const request = store.put(value, key);
                request.onsuccess = () => {
                    db.close();
                    resolve();
                };
                request.onerror = () => {
                    db.close();
                    reject(request.error);
                };
            }),
    );
}

export function deleteValue(key: string): Promise<void> {
    return openDatabase().then(
        (db) =>
            new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                const request = store.delete(key);
                request.onsuccess = () => {
                    db.close();
                    resolve();
                };
                request.onerror = () => {
                    db.close();
                    reject(request.error);
                };
            }),
    );
}
