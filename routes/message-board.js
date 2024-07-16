import express from 'express'
import moment from 'moment-timezone'
import db from '../configs/mysql.js'
import multer from 'multer'

const dateFormat = 'YYYY-MM-DD'
const router = express.Router()
const upload = multer() // 初始化 multer

const getListData = async (req) => {
  const perPage = 20 // 每頁最多有幾筆
  let page = +req.query.page || 1
  if (page < 1) {
    return {
      success: false,
      redirect: `?page=1`,
      info: 'page 值太小', // 轉向
    }
  }

  const sql = `SELECT COUNT(*) totalRows FROM comments`
  const [[{ totalRows }]] = await db.query(sql) // 取得總筆數，再解構

  let totalPages = 0 // 總頁數，預設值為 0
  let comments = [] // 分頁資料
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage)
    if (page > totalPages) {
      return {
        success: false,
        redirect: `?page=${totalPages}`,
        info: 'page 值太大', // 轉向
      }
    }

    const sql2 = `SELECT * FROM comments ORDER BY c_id DESC LIMIT ?, ?`
    const [rows] = await db.query(sql2, [(page - 1) * perPage, perPage])

    comments = rows.map((comment) => ({
      ...comment,
      created_at: comment.created_at
        ? moment(comment.created_at).format(dateFormat)
        : 'Invalid Date',
    }))
  }

  return {
    success: true,
    totalRows,
    totalPages,
    page,
    perPage,
    comments,
    qs: req.query,
  }
}

router.get('/', async (req, res) => {
  res.locals.pageName = 'am-list'
  const result = await getListData(req)

  if (result.redirect) {
    return res.redirect(result.redirect)
  }
  if (req.session && req.session.admin) {
    res.render('address-book/list', result)
  } else {
    res.render('message-board/list', result)
  }
})

router.get('/api', async (req, res) => {
  const result = await getListData(req)
  res.json(result)
})

router.get('/add', (req, res) => {
  res.locals.pageName = 'am-add'
  // 呈現新增資料的表單
  res.render('message-board/add')
})

router.post('/add', upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    result: {},
  }
  console.log('Received data:', req.body) // 打印接收到的數據

  const sql2 = `INSERT INTO comments SET ?`
  const data = { ...req.body, created_at: new Date() }
  console.log('Data to insert:', data) // 打印即將插入的數據

  try {
    const [result] = await db.query(sql2, data)
    output.result = result
    output.success = !!result.affectedRows
  } catch (ex) {
    console.error('SQL Error:', ex) // 紀錄錯誤
    output.error = ex.message // 打印詳細錯誤信息
  }
  res.json(output)
})

export default router