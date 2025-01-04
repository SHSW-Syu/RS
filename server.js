const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3003; // 使用 Railway 提供的端口或默认端口

// 使用中间件
app.use(cors({
  origin: '*', // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的请求方法
}));
app.use(bodyParser.json());

// 创建 MySQL 连接
const db = mysql.createConnection({
    host: process.env.DB_HOST, // 从环境变量读取
    user: process.env.DB_USER, // 从环境变量读取
    password: process.env.DB_PASSWORD, // 从环境变量读取
    database: process.env.DB_NAME // 从环境变量读取
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
    const query = 'SELECT * FROM orders'; // 确保表名与数据库中的一致

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err);
            return res.status(500).send('Server error');
        }
        res.json(results); // 将结果以 JSON 格式返回
    });
});

// 更新订单状态的 API 端点
app.put('/api/orders/:id', (req, res) => {
    const orderId = req.params.id; // 获取订单 ID
    const { status } = req.body; // 从请求体获取新的状态

    // 允许状态值为 1、2 或 3
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

// 数据分析 - 总订单数、总销量、总收入
app.get('/api/analysis', (req, res) => {
  const product = req.query.product || 'all'; // 获取查询参数，默认为 'all'

  let query = '';
  
  // 根据 product 参数选择不同的查询
  if (product === 'product1') {
    query = `
      SELECT 
        COUNT(*) AS totalOrders,
        SUM(product1_quantity) AS totalSales,
        SUM(total_price) AS totalRevenue,
        SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashierOrders,
        SUM(CASE WHEN cashier IS NULL OR cashier != 1 THEN 1 ELSE 0 END) AS mobileOrders
      FROM orders
      WHERE product1_quantity != 0
    `;
  } else if (product === 'product2') {
    query = `
      SELECT 
        COUNT(*) AS totalOrders,
        SUM(product2_quantity) AS totalSales,
        SUM(total_price) AS totalRevenue,
        SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashierOrders,
        SUM(CASE WHEN cashier IS NULL OR cashier != 1 THEN 1 ELSE 0 END) AS mobileOrders
      FROM orders
      WHERE product2_quantity != 0
    `;
  } else {
    query = `
      SELECT 
        COUNT(*) AS totalOrders,
        SUM(product1_quantity + product2_quantity) AS totalSales,
        SUM(total_price) AS totalRevenue,
        SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashierOrders,
        SUM(CASE WHEN cashier IS NULL OR cashier != 1 THEN 1 ELSE 0 END) AS mobileOrders
      FROM orders
    `;
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Server error');
    }

    const totalOrders = results[0].totalOrders;
    const cashierOrders = results[0].cashierOrders;
    const mobileOrders = results[0].mobileOrders;

    // 计算占比
    const cashierPercentage = totalOrders === 0 ? 0 : (cashierOrders / totalOrders) * 100;
    const mobilePercentage = totalOrders === 0 ? 0 : (mobileOrders / totalOrders) * 100;

    res.json({
      totalOrders,
      totalSales: results[0].totalSales,
      totalRevenue: results[0].totalRevenue,
      cashierOrders,
      mobileOrders,
      cashierPercentage,
      mobilePercentage,
    });
  });
});



// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
