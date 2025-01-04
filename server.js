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

// 数据分析的 API 端点
app.post('/api/analyze', (req, res) => {
    const { dateRange, product } = req.body;

    let query = 'SELECT ';
    const params = [];

    // 统计字段
    query += `
        SUM(total_price) AS total_revenue,
        SUM(product1_quantity + product2_quantity) AS total_sales,
        COUNT(*) AS total_orders,
        SUM(CASE WHEN cashier = 1 THEN 1 ELSE 0 END) AS cashier_orders,
        SUM(CASE WHEN cashier = 0 THEN 1 ELSE 0 END) AS mobile_orders
    `;

    // 条件筛选
    query += ' FROM orders WHERE 1=1 ';

    if (dateRange !== 'all') {
        query += ' AND DATE(timestamp) = ? ';
        params.push(dateRange);
    }

    if (product !== 'all') {
        query += ` AND ${product}_quantity > 0 `;
    }

    db.query(query, params, (error, results) => {
        if (error) {
            console.error('Error analyzing data:', error);
            return res.status(500).json({ message: 'Error analyzing data', error });
        }

        const analysis = results[0];
        const cashierPercentage = (analysis.cashier_orders / analysis.total_orders) * 100;
        const mobilePercentage = (analysis.mobile_orders / analysis.total_orders) * 100;

        res.status(200).json({
            totalRevenue: analysis.total_revenue,
            totalSales: analysis.total_sales,
            totalOrders: analysis.total_orders,
            cashierOrders: analysis.cashier_orders,
            cashierPercentage: cashierPercentage.toFixed(2),
            mobileOrders: analysis.mobile_orders,
            mobilePercentage: mobilePercentage.toFixed(2),
        });
    });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => { // 监听 0.0.0.0 地址
    console.log(`Server running at http://localhost:${port}`);
});
