import { Entry } from '@/types/types';
import React, { PureComponent } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: Entry[];
}

class TradingLineChart extends PureComponent<Props> {
  static demoUrl = 'https://codesandbox.io/p/sandbox/area-chart-filled-by-sign-td4jqk';

  gradientOffset = () => {
    const { data } = this.props;
    const dataMax = Math.max(...data.map((item) => Number(item.value)));
    const dataMin = Math.min(...data.map((item) => Number(item.value)));

    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }

    return dataMax / (dataMax - dataMin);
  };

  render() {
    const off = this.gradientOffset();
    const { data } = this.props;

    return (
      <ResponsiveContainer>
        <AreaChart
          data={data}
          height={130}
          width={270}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="green" stopOpacity={1} />
              <stop offset={off} stopColor="red" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#000" fill="url(#splitColor)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
}

export default TradingLineChart;
