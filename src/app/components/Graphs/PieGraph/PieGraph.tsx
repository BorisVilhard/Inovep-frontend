import React, { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';

const data = [
  { name: 'Made conversion', value: 400 },
  { name: 'Only added to cart', value: 300 },
  { name: 'Only visited', value: 300 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type BarProps = {
  firstNameBar: string;
  secondNameBar: string;
  firstBarColor: string;
  secondBarColor: string;
};

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`User count: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const PieGraph = () => {
  const [activeIndex, setActiveIndex] = useState(data.map((_, index) => index));

  const onPieEnter = (_: any, index: any) => {
    setActiveIndex([index]);
  };

  return (
    <div style={{ width: '33vw', height: '40vh' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeShape={renderActiveShape}
            activeIndex={activeIndex}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieGraph;
