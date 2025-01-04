const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3003;

// 使用中间件
app.use(cors({
  origin: '*', // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(bodyParser.json());

// 创建 MySQL 连接
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 连接到数据库
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// 获取订单信息的 API 端点
app.get('/api/orders', (req, res) => {
  const query = 'SELECT * FROM orders';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data: ' + err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// 更新订单状态的 API 端点
app.put('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (![1, 2, 3].includes(status)) {
    return res.status(400).json({ message: '无效的状态' });
  }

  db.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId],
    (err, result) => {
      if (err) {
        console.error('Error updating status: ' + err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '订单未找到' });
      }

      res.status(200).json({ message: '状态更新成功' });
    }
  );
});

// 全商品数据分析的 API 端点
app.get('/api/analysis/all', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) AS totalOrders,
      SUM(product1_quantity) AS totalProduct1,
      SUM(product2_quantity) AS totalProduct2,
      SUM(total_price) AS totalRevenue,
      SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashierOrders,
      SUM(CASE WHEN mobile = 1 THEN 1 ELSE 0 END) AS mobileOrders
    FROM orders
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Server error');
    }

    res.json({
      totalOrders: results[0].totalOrders,
      totalProduct1: results[0].totalProduct1,
      totalProduct2: results[0].totalProduct2,
      totalRevenue: results[0].totalRevenue,
      cashierOrders: results[0].cashierOrders,
      mobileOrders: results[0].mobileOrders,
      cashierPercentage: (results[0].cashierOrders / results[0].totalOrders) * 100,
      mobilePercentage: (results[0].mobileOrders / results[0].totalOrders) * 100,
    });
  });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});
