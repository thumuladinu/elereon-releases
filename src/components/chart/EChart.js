/*!
  =========================================================
  * Muse Ant Design Dashboard - v1.0.0
  =========================================================
  * Product Page: https://www.creative-tim.com/product/muse-ant-design-dashboard
  * Copyright 2021 Creative Tim (https://www.creative-tim.com)
  * Licensed under MIT (https://github.com/creativetimofficial/muse-ant-design-dashboard/blob/main/LICENSE.md)
  * Coded by Creative Tim
  =========================================================
  * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import ReactApexChart from "react-apexcharts";
import { Row, Col, Typography } from "antd";
import eChart from "./configs/eChart";
import axios from "axios";
import { useEffect, useState } from "react";
import { CheckOutlined } from "@ant-design/icons";

function EChart() {
  const { Title, Paragraph } = Typography;
  const [loading, setLoading] = useState(false);
  const [soldCountData, setSoldCountData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('https://api.ddengineers.com/api/getSoldItemCountData');

      if (response.data.success) {
        //console.log('ResponseDashboard:', response.data.result);
        setSoldCountData(response.data.result);
      } else {
        //console.log('Error:', response.data.message);
      }
    } catch (error) {
      //console.log('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };


  const eChartData = {
    series: [
      {
        name: "Items",
        data: soldCountData,
        color: "#fff",
      },
    ],
  };

  const items = [
    {
      Title: soldCountData[0],
      user: "Rough",
    },
    {
      Title: soldCountData[1],
      user: "Lots",
    },
    {
      Title: soldCountData[2],
      user: "Sorted Lots",
    },
    {
      Title: soldCountData[3],
      user: "Cut & Polished",
    },
  ];


  return (
    <>
      <div id="chart">
        <ReactApexChart
          className="bar-chart"
          options={eChart.options}
          series={eChartData.series}
          type="bar"
        // height={220}
        />
      </div>
      <div className="chart-vistior">
        <Title level={5}>Sold Items</Title>
        <Paragraph className="lastweek">
          <span className="bnb2"><CheckOutlined /></span> All sold items summary
        </Paragraph>
        {/*<Paragraph className="lastweek">*/}
        {/*  We have created multiple options for you to put together and customise*/}
        {/*  into pixel perfect pages.*/}
        {/*</Paragraph>*/}
        <Row gutter>
          {items.map((v, index) => (
            <Col xs={6} xl={6} sm={6} md={6} key={index}>
              <div className="chart-visitor-count">
                <Title level={4}>{v.Title}</Title>
                <span>{v.user}</span>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
}

export default EChart;
