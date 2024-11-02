const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3003; // 使用 Railway 提供的端口或默认端口

// 使用中间件
app.use(cors());
app.use(bodyParser.json());

// 创建 MySQL 连接
const db = mysql.createConnection({
    host: process.env.DB_HOST, // 从环境变量读取
    user: process.env.DB_USER, // 从环境变量读取
    password: process.env.DB_PASSWORD, // 从环境变量读取
    database: process.env.DB_NAME // 从环境变量读取
});

// 连接到数据库
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// 测试插入数据的路由
app.post('/receive', (req, res) => {
    const { buyerId, product1Quantity, product2Quantity, totalPrice } = req.body;

    // 插入数据到 orders 表
    const query = 'INSERT INTO orders (buyer_id, product1_quantity, product2_quantity, total_price) VALUES (?, ?, ?, ?)';
    
    db.query(query, [buyerId, product1Quantity, product2Quantity, totalPrice], (error, results) => {
        if (error) {
            console.error('Error inserting order:', error);
            return res.status(500).json({ message: 'Error inserting order', error });
        }
        res.status(200).json({ message: 'Order received successfully!', results });
    });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => { // 监听 0.0.0.0 地址
    console.log(`Server running at http://localhost:${port}`);
});