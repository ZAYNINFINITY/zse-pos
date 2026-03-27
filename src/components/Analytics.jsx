import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Package, Download } from 'lucide-react';

function Analytics() {
  const [sales, setSales] = useState([]);
  const [profitLoss, setProfitLoss] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const salesData = await window.electronAPI.getSales();
      setSales(salesData);
      calculateDailySales(salesData);
      
      const profitData = await window.electronAPI.getProfitLossReport();
      setProfitLoss(profitData);
      
      const bestSellersData = await window.electronAPI.getBestSellers(10);
      setBestSellers(bestSellersData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadFilteredData = async () => {
    try {
      const salesData = await window.electronAPI.getSalesReport(dateRange.start, dateRange.end);
      setSales(salesData);
      calculateDailySales(salesData);
      
      const profitData = await window.electronAPI.getProfitLossReport(dateRange.start, dateRange.end);
      setProfitLoss(profitData);
    } catch (error) {
      console.error('Error loading filtered data:', error);
    }
  };

  const calculateDailySales = (salesData) => {
    const salesByDate = {};
    salesData.forEach(sale => {
      const date = new Date(sale.date).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, total: 0, count: 0 };
      }
      salesByDate[date].total += sale.total;
      salesByDate[date].count += 1;
    });
    const dailySalesArray = Object.values(salesByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    setDailySales(dailySalesArray);
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = profitLoss.reduce((sum, item) => sum + (item.profit || 0), 0);
  const totalCost = profitLoss.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  const totalItemsSold = profitLoss.reduce((sum, item) => sum + (item.total_sold || 0), 0);

  const COLORS = ['#008080', '#00b3b3', '#005757', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];

  const exportReport = () => {
    const reportData = {
      summary: {
        totalRevenue,
        totalProfit,
        totalCost,
        totalItemsSold,
        dateRange: dateRange.start && dateRange.end 
          ? `${dateRange.start} to ${dateRange.end}`
          : 'All Time'
      },
      profitLoss,
      bestSellers,
      dailySales
    };
    
    const csv = [
      'Analytics Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Summary',
      `Total Revenue,${totalRevenue.toFixed(2)}`,
      `Total Profit,${totalProfit.toFixed(2)}`,
      `Total Cost,${totalCost.toFixed(2)}`,
      `Total Items Sold,${totalItemsSold}`,
      '',
      'Profit/Loss by Product',
      'Product,SKU,Total Sold,Revenue,Cost,Profit',
      ...profitLoss.map(item => 
        `"${item.name}",${item.sku || ''},${item.total_sold || 0},${item.total_revenue || 0},${item.total_cost || 0},${item.profit || 0}`
      ),
      '',
      'Best Sellers',
      'Product,SKU,Total Sold,Revenue',
      ...bestSellers.map(item => 
        `"${item.name}",${item.sku || ''},${item.total_sold || 0},${item.total_revenue || 0}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="text-primary mr-3" size={32} />
          <h1 className="text-3xl font-bold text-primary">Sales Analytics</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="p-2 border rounded"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="p-2 border rounded"
            />
            <button
              onClick={loadFilteredData}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary"
            >
              Filter
            </button>
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  loadData();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={exportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Download className="mr-2" size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="text-green-500 mr-3" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₨{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="text-blue-500 mr-3" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-blue-600">₨{totalProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="text-red-500 mr-3" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-red-600">₨{totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="text-primary mr-3" size={24} />
            <div>
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-2xl font-bold text-primary">{totalItemsSold}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Daily Sales Trend</h2>
        {dailySales.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#008080" name="Sales (₨)" />
              <Line type="monotone" dataKey="count" stroke="#00b3b3" name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No sales data available.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Top 10 Best Sellers</h2>
          {bestSellers.length > 0 ? (
            <div className="space-y-2">
              {bestSellers.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="font-bold text-primary mr-2">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{item.total_sold} sold</p>
                    <p className="text-xs text-gray-600">
                      ₨{(item.total_revenue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sales data available.</p>
          )}
        </div>

        {/* Profit/Loss by Product */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profit/Loss by Product</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Sold</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Revenue</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profitLoss.slice(0, 10).map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <p className="font-medium text-xs">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-500">{item.sku}</p>}
                    </td>
                    <td className="px-2 py-2">{item.total_sold || 0}</td>
                    <td className="px-2 py-2">₨{(item.total_revenue || 0).toFixed(2)}</td>
                    <td className={`px-2 py-2 font-semibold ${
                      (item.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₨{(item.profit || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {profitLoss.length === 0 && (
              <p className="text-gray-500 text-center py-4">No profit/loss data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
