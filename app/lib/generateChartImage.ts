import BigNumber from "bignumber.js";
import {SUBQUERY_ENDPOINT} from "@/app/const";
import ChartJsImage from "chartjs-to-image";

async function generateChartImage(rewardsByDate: Record<string, number>) {

  const vertical: boolean = Object.keys(rewardsByDate).length > 20;

  const myChart = new ChartJsImage();
  myChart.setConfig({
    type: 'bar',
    data: { labels: Object.keys(rewardsByDate), datasets: [
      { label: 'Rewards (SQT)',
        data: Object.values(rewardsByDate),
        backgroundColor: 'rgba(75, 192, 192, 1)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 1
      }] },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            fontSize: 10,
            beginAtZero: true,
          },
        }],
        xAxes: [{
          ticks: {
            fontSize: 10
          }
        }],
        y: {
          offset: true,
        }
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
          rotation: vertical? -70 : 0,
          color: 'blue',
          font: {
            size: vertical? 9 : 11,
            weight: vertical?'normal': 'bold',
          }
        }
      },
    }
  }).setWidth(500).setHeight(500);

  return await myChart.toDataUrl()
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

  const imageData = await generateChartImage(sortedResults);
  return imageData;
}

export default buildImage;