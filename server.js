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

// 获取全商品分析数据
app.get('/api/analysis/all', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) AS totalOrders,
      SUM(product1_quantity + product2_quantity) AS totalSales,
      SUM(total_price) AS totalRevenue,
      SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashierOrders,
      SUM(CASE WHEN cashier IS NULL OR cashier != 1 THEN 1 ELSE 0 END) AS mobileOrders
    FROM orders
  `;
  
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

// 获取商品1分析数据
app.get('/api/analysis/product1', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) AS totalOrders,
      SUM(product1_quantity) AS totalSales,
      SUM(total_price) AS totalRevenue,
      SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashierOrders,
      SUM(CASE WHEN cashier IS NULL OR cashier != 1 THEN 1 ELSE 0 END) AS mobileOrders
    FROM orders
    WHERE product1_quantity > 0
  `;
  
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

// 获取商品2分析数据
app.get('/api/analysis/product2', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) AS totalOrders,
      SUM(product2_quantity) AS totalSales,
      SUM(total_price) AS totalRevenue,
      SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashierOrders,
      SUM(CASE WHEN cashier IS NULL OR cashier != 1 THEN 1 ELSE 0 END) AS mobileOrders
    FROM orders
    WHERE product2_quantity > 0
  `;
  
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
