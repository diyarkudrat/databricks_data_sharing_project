-- Sample Data Creation Script for Databricks
-- This script creates a simple sales table with sample data for testing

-- Create the sales_data table
CREATE TABLE IF NOT EXISTS default.sales_data (
  id INT,
  product_name STRING,
  category STRING,
  price DECIMAL(10,2),
  quantity INT,
  sale_date DATE,
  region STRING
)
COMMENT 'Sample sales data for testing Databricks integration';

-- Insert sample data (10 rows for testing)
INSERT INTO default.sales_data VALUES
(1, 'Laptop Pro', 'Electronics', 1299.99, 2, '2024-01-15', 'North America'),
(2, 'Wireless Mouse', 'Electronics', 29.99, 5, '2024-01-16', 'Europe'),
(3, 'Office Chair', 'Furniture', 299.99, 1, '2024-01-17', 'Asia'),
(4, 'Desk Lamp', 'Furniture', 49.99, 3, '2024-01-18', 'North America'),
(5, 'USB Cable', 'Electronics', 12.99, 10, '2024-01-19', 'Europe'),
(6, 'Monitor 27"', 'Electronics', 399.99, 2, '2024-01-20', 'Asia'),
(7, 'Keyboard', 'Electronics', 79.99, 4, '2024-01-21', 'North America'),
(8, 'Standing Desk', 'Furniture', 599.99, 1, '2024-01-22', 'Europe'),
(9, 'Webcam HD', 'Electronics', 89.99, 2, '2024-01-23', 'Asia'),
(10, 'Notebook Set', 'Office Supplies', 15.99, 8, '2024-01-24', 'North America');

-- Verify the data was inserted
SELECT * FROM default.sales_data;

-- Example queries to test your setup:

-- 1. Get total revenue by category
SELECT 
  category,
  COUNT(*) as total_items,
  SUM(price * quantity) as total_revenue
FROM default.sales_data
GROUP BY category
ORDER BY total_revenue DESC;

-- 2. Get recent sales
SELECT 
  product_name,
  price,
  quantity,
  sale_date,
  region
FROM default.sales_data
ORDER BY sale_date DESC
LIMIT 5;

-- 3. Get sales by region
SELECT 
  region,
  COUNT(*) as num_sales,
  SUM(quantity) as total_units,
  SUM(price * quantity) as revenue
FROM default.sales_data
GROUP BY region
ORDER BY revenue DESC;

