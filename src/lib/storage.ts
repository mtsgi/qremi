import { isDraft, type QrDraft } from './qr'

const databaseName = 'qremi'
const storeName = 'drafts'

/** 作業保存用のIndexedDBを開き、初回のみ保存先を作成する。 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)

    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('保存先を開けませんでした。'))
    request.onblocked = () => reject(new Error('別のタブを閉じてから再度お試しください。'))
  })
}

/**
 * 保存済みの編集データを検証して取得する。
 * @returns 保存されている編集データ。初回利用などで未保存の場合はnull。
 * @throws 保存先にアクセスできない場合や、保存データを復元できない場合。
 */
export async function loadDraft(): Promise<QrDraft | null> {
  const database = await openDatabase()

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly')
      const request = transaction.objectStore(storeName).get('last')

      request.onsuccess = () => {
        if (request.result === undefined) {
          resolve(null)
        } else if (isDraft(request.result)) {
          resolve(request.result)
        } else {
          reject(new Error('保存した作業を復元できませんでした。'))
        }
      }

      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

/** ロゴのBlobを含む編集データを、前回の作業1件として上書き保存する。 */
export async function saveDraft(draft: QrDraft): Promise<void> {
  const database = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).put(draft, 'last')

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? new Error('保存が中断されました。'))
    })
  } finally {
    database.close()
  }
}
