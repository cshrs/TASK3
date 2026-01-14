// Fetch and visualize data from the CSV file
document.addEventListener('DOMContentLoaded', function () {
  // Load CSV data
  fetch('MExport.csv')
    .then(response => response.text())
    .then(csvText => {
      // Parse CSV text into objects
      const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true });
      const data = parsed.data;
      // Filter out any empty rows if present
      const products = data.filter(item => item['Product ID']);
      
      // Prepare data structures for aggregations
      const categoryStats = {};
      const bestSellerCount = {};
      
      for (let item of products) {
        const brand = item['Brand'] ? String(item['Brand']).trim() : 'Unknown';
        const category = item['Parent Category'] || 'Misc';
        // Initialize category accumulator if not present
        if (!categoryStats[category]) {
          categoryStats[category] = {
            unitsThisYear: 0,
            unitsLastYear: 0,
            revenueThisYear: 0,
            revenueLastYear: 0,
            stockUnits: 0,
            stockValue: 0,
            profitSum: 0,
            revenueForProfit: 0
          };
        }
        // Extract numeric values (using 0 if any value is missing)
        const unitsThis = item['Total Sales this Year'] || 0;
        const unitsLast = item['Total Sales Last Year'] || 0;
        const sellingEx = item['Selling Price ex VAT'] || 0;
        const cost = item['Cost Price ex VAT'] || 0;
        const availStock = item['Availabile Stock'] || 0;  // note: "Availabile" is misspelled in the CSV header
        // Compute revenue and profit for last year
        const revenueLast = sellingEx * unitsLast;
        const revenueThis = sellingEx * unitsThis;
        const profitLast = (sellingEx - cost) * unitsLast;
        
        // Accumulate into category totals
        categoryStats[category].unitsThisYear += unitsThis;
        categoryStats[category].unitsLastYear += unitsLast;
        categoryStats[category].revenueThisYear += revenueThis;
        categoryStats[category].revenueLastYear += revenueLast;
        categoryStats[category].stockUnits += availStock;
        categoryStats[category].stockValue += cost * availStock;  // inventory value at cost
        categoryStats[category].profitSum += profitLast;
        categoryStats[category].revenueForProfit += revenueLast;
        
        // Count best seller status
        const status = item['Best Seller Status'];
        if (status) {
          bestSellerCount[status] = (bestSellerCount[status] || 0) + 1;
        }
      }
      
      // Prepare arrays for chart data
      const categories = Object.keys(categoryStats).sort();
      const salesUnitsLast = [];
      const salesUnitsThis = [];
      const salesRevenueLast = [];
      const salesRevenueThis = [];
      const stockUnitsArr = [];
      const stockValueArr = [];
      const profitMarginCats = [];
      const profitMargins = [];
      
      categories.forEach(cat => {
        const stats = categoryStats[cat];
        salesUnitsLast.push(stats.unitsLastYear);
        salesUnitsThis.push(stats.unitsThisYear);
        salesRevenueLast.push(Math.round(stats.revenueLastYear));
        salesRevenueThis.push(Math.round(stats.revenueThisYear));
        stockUnitsArr.push(stats.stockUnits);
        stockValueArr.push(Math.round(stats.stockValue));
        // Calculate weighted average profit margin (%) for category (if there were sales)
        if (stats.revenueForProfit > 0) {
          const marginPct = (stats.profitSum / stats.revenueForProfit) * 100;
          profitMarginCats.push(cat);
          profitMargins.push(Math.round(marginPct * 10) / 10);  // one decimal place
        }
      });
      
      // Best seller status distribution
      const statusCategories = ["A+", "A", "B", "C", "D", "E"];
      const statusCounts = statusCategories.map(st => bestSellerCount[st] || 0);
      
      // Set global chart font color for better readability on dark background
      Chart.defaults.color = "#d9dbdf";
      Chart.defaults.font.family = 'Arial';
      
      // Sales by Category: Last Year vs This Year (default showing units)
      const salesCtx = document.getElementById('salesChart').getContext('2d');
      const salesChart = new Chart(salesCtx, {
        type: 'bar',
        data: {
          labels: categories,
          datasets: [
            {
              label: 'Last Year',
              data: salesUnitsLast,
              backgroundColor: '#d9dbdf'
            },
            {
              label: 'This Year',
              data: salesUnitsThis,
              backgroundColor: '#ff8b00'
            }
          ]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            title: {
              display: true,
              text: 'Sales by Category: Last Year vs This Year',
              font: { size: 14, weight: 'bold' },
              color: '#ece6d5'
            },
            legend: {
              position: 'top'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Units Sold'
              },
              ticks: {
                callback: value => value.toLocaleString()
              }
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Stock by Category: Available Stock (default showing units)
      const stockCtx = document.getElementById('stockChart').getContext('2d');
      const stockChart = new Chart(stockCtx, {
        type: 'bar',
        data: {
          labels: categories,
          datasets: [
            {
              label: 'Available Stock',
              data: stockUnitsArr,
              backgroundColor: '#00909e'  // Makita brand teal for stock bars
            }
          ]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            title: {
              display: true,
              text: 'Stock by Category (Available Stock Units)',
              font: { size: 14, weight: 'bold' },
              color: '#ece6d5'
            },
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Units in Stock'
              },
              ticks: {
                callback: value => value.toLocaleString()
              }
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Profit Margin by Category (%)
      const profitCtx = document.getElementById('profitChart').getContext('2d');
      const profitChart = new Chart(profitCtx, {
        type: 'bar',
        data: {
          labels: profitMarginCats,
          datasets: [
            {
              label: 'Profit Margin',
              data: profitMargins,
              backgroundColor: '#ff8b00'
            }
          ]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            title: {
              display: true,
              text: 'Average Profit Margin by Category',
              font: { size: 14, weight: 'bold' },
              color: '#ece6d5'
            },
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Profit Margin (%)'
              },
              ticks: {
                callback: value => value + '%'
              }
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Products by Best Seller Rating
      const bestCtx = document.getElementById('bestChart').getContext('2d');
      const bestChart = new Chart(bestCtx, {
        type: 'bar',
        data: {
          labels: statusCategories,
          datasets: [
            {
              label: 'Number of Products',
              data: statusCounts,
              backgroundColor: [
                '#4caf50',  // A+ (green)
                '#8bc34a',  // A  (light green)
                '#cddc39',  // B  (lime)
                '#ffeb3b',  // C  (yellow)
                '#ff9800',  // D  (orange)
                '#f44336'   // E  (red)
              ]
            }
          ]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Products by Best Seller Rating',
              font: { size: 14, weight: 'bold' },
              color: '#ece6d5'
            },
            legend: { display: false }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Best Seller Status'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Products'
              }
            }
          }
        }
      });
      
      // Toggle between Quantity and Revenue views
      document.querySelectorAll('input[name="metric"]').forEach(radio => {
        radio.addEventListener('change', () => {
          const useRevenue = document.getElementById('metricRev').checked;
          if (useRevenue) {
            // Switch to revenue data
            salesChart.data.datasets[0].data = salesRevenueLast;
            salesChart.data.datasets[1].data = salesRevenueThis;
            salesChart.options.scales.x.title.text = 'Revenue (£)';
            salesChart.update();
            stockChart.data.datasets[0].data = stockValueArr;
            stockChart.options.scales.x.title.text = 'Stock Value (£)';
            stockChart.options.plugins.title.text = 'Stock by Category (Inventory Value)';
            stockChart.update();
          } else {
            // Switch back to quantity data
            salesChart.data.datasets[0].data = salesUnitsLast;
            salesChart.data.datasets[1].data = salesUnitsThis;
            salesChart.options.scales.x.title.text = 'Units Sold';
            salesChart.update();
            stockChart.data.datasets[0].data = stockUnitsArr;
            stockChart.options.scales.x.title.text = 'Units in Stock';
            stockChart.options.plugins.title.text = 'Stock by Category (Available Stock Units)';
            stockChart.update();
          }
        });
      });
      
    })
    .catch(error => console.error('Error loading or parsing data:', error));
});
