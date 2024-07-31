import puppeteer from "puppeteer";
import BigNumber from "bignumber.js";
import {SUBQUERY_ENDPOINT} from "@/app/const";

async function generateChartImage(rewardsByDate: Record<string, number>) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const vertical: boolean = Object.keys(rewardsByDate).length > 20;

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
    </head>
    <body>
      <canvas id="myChart" width="400" height="400"></canvas>
      <script>
        const ctx = document.getElementById('myChart').getContext('2d');
        Chart.register(ChartDataLabels);
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [${Object.keys(rewardsByDate).map(i => `"${i}"`)}],
            datasets: [{
              label: 'Rewards (SQT)',
              data: [${Object.values(rewardsByDate)}],
              backgroundColor: 'rgba(75, 192, 192, 1)',
              borderColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                offset: true
              }
            },
            plugins: {
              datalabels: {
                anchor: 'end',
                align: 'end',
                ${vertical?'rotation: -70,': "font: {weight: 'bold'},"}
                color: 'blue',
                formatter: function (value, context) {
                    return value;
                }
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `

  await page.setContent(content, {waitUntil: 'networkidle0'});

  const chartCanvas = await page.$('#myChart');
  const chartImage = await chartCanvas?.screenshot({ type: 'png' });

  await browser.close();

  return chartImage;
}

function buildQuery(indexer: string|undefined|null, minDate: string, byHour: boolean) {
  return `query {
     rewards(filter: {${indexer? `indexerAddress: {equalTo: "${indexer}"},`:''} claimedTime: {greaterThan: "${minDate}"}}) {
      groupedAggregates(groupBy: ${byHour? "CLAIMED_TIME_TRUNCATED_TO_HOUR" : "CLAIMED_TIME_TRUNCATED_TO_DAY"}) {
        sum {
          amount
        }
        keys
      }
    }
  }`
}

function parseDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return {year, month, day, hours, minutes};
}

async function buildImage(days: number, indexer?: string|null) {
  const dates = [];
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - days);

  const splitByHour = days <= 2;

  if (splitByHour) {
    startDate.setMinutes(0);
    for (let d: Date = startDate; d <= currentDate; d.setHours(d.getHours() + 1)) {
      const {year, month, day, hours, minutes} = parseDate(d);
      // Format the date as "YYYY-MM-DD HH:mm"
      dates.push(`${year}-${month}-${day} ${hours}:${minutes}`);
    }
  } else {
    for (let d: Date = startDate; d <= currentDate; d.setDate(d.getDate() + 1)) {
      const {year, month, day} = parseDate(d);
      // Format the date as "YYYY-MM-DD"
      dates.push(`${year}-${month}-${day}`);
    }
  }

  const query = buildQuery(indexer, dates[0], splitByHour);

  const response = await fetch(SUBQUERY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({query})
  });

  const message = await response.json();

  const result: Record<string, string> = {};

  message.data.rewards.groupedAggregates.forEach((item: any) => {
    const date = new Date(item.keys[0]);
    const {year, month, day, hours, minutes} = parseDate(date);
    let datetime;
    if (splitByHour) {
      datetime = `${year}-${month}-${day} ${hours}:${minutes}`
    } else {
      datetime = `${year}-${month}-${day}`
    }
    result[datetime] = item.sum.amount;
  });

  dates.forEach(date => {
    // If the date is not present in results, set it to "0"
    if (!result.hasOwnProperty(date)) {
      result[date] = "0";
    }
  });

  const sortedResults: Record<string, number> = {};
  Object.keys(result)
    .sort()
    .forEach(key => {
      const bn = new BigNumber(result[key]);
      const amount = bn.div(new BigNumber('1000000000000000000')) // 10^18

      sortedResults[key] = Math.round(amount.toNumber());
    });

  const chartImage = await generateChartImage(sortedResults);
  const imageData = `data:image/png;base64,${chartImage?.toString('base64')}`
  return imageData;
}

export default buildImage;