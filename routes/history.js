import express from 'express'
import db from '#configs/mysql.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM messages ORDER BY timestamp ASC LIMIT 30'
    const result = await db.query(query)
    console.log('Query result:', result)
    const results = Array.isArray(result) ? result[0] : result
    res.json(results)
  } catch (error) {
    console.error('查不到歷史資料:', error)
    res.status(500).json({ error: '查詢歷史資料失敗' })
  }
})

router.get('/lastMessage', async (req, res) => {
  try {
    const query = 'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 1'
    const [results, _] = await db.query(query)

    if (results.length > 0) {
      const lastMessage = results[0]
      lastMessage.status = lastMessage.isRead ? 'read' : 'sent'
      res.json({ lastMessage })
    } else {
      res.json({ lastMessage: null })
    }
  } catch (error) {
    console.error('查詢最新訊息時出錯:', error)
    res.status(500).json({ error: '查詢最新訊息失敗' })
  }
})
export default router
