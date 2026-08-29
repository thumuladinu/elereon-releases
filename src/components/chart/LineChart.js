import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Form, Typography } from "antd";
import { CheckOutlined, MinusOutlined } from "@ant-design/icons";
import moment from "moment";
import axios from "axios";
import lineChart from "./configs/lineChart";

function LineChart() {
    const { Title, Paragraph } = Typography;
    const [loading, setLoading] = useState(false);
    const [transactionData, setTransactionData] = useState([]);

    const fetchData = async (date) => {
        setLoading(true);
        try {
            const response = await axios.post('https://api.ddengineers.com/api/getSellingDataHourlyForChart', { date: date ? date.format('YYYY-MM-DD') : null });
            if (response.data.success) {
                const allHours = Array.from({ length: 24 }, (_, i) => ({
                    x: `${i % 12 === 0 ? 12 : i % 12}${i < 12 ? 'am' : 'pm'}`,
                    y: 0,
                }));

                const transactionMap = response.data.result.reduce((map, item) => {
                    map[item.hour] = item.totalSellAmount;
                    return map;
                }, {});

                const formattedData = allHours.map((hour, index) => ({
                    x: hour.x,
                    y: transactionMap[index] || 0,
                }));

                setTransactionData(formattedData);
            } else {
                console.error('Error:', response.data.message);
            }
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(moment());
    }, []);

    const lineChartData = {
        series: [
            {
                name: "Total Sell Amount",
                data: transactionData,
            }
        ],
        options: {
            ...lineChart.options,
            xaxis: {
                ...lineChart.options.xaxis,
                type: 'category',
                labels: {
                    format: 'HH:mm',
                },
            },
        },
    };

    return (
        <>
            <style>
                {`
                .custom-date-picker {
                    width: 100%;
                    padding: 4px 11px;
                    border-radius: 2px;
                    border: 1px solid #d9d9d9;
                    font-size: 14px;
                    transition: all 0.3s;
                    outline: none;
                }

                .custom-date-picker:hover {
                    border-color: #40a9ff;
                }

                .custom-date-picker:focus {
                    border-color: #40a9ff;
                    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                }

                .custom-date-picker::-webkit-calendar-picker-indicator {
                    opacity: 1;
                    cursor: pointer;
                }

                .custom-date-picker::-ms-expand {
                    display: none;
                }

                .custom-date-picker::-webkit-inner-spin-button {
                    display: none;
                }

                .custom-date-picker::-webkit-clear-button {
                    display: none;
                }
                `}
            </style>

            <div className="linechart">
                <div>
                    <Title level={5}>Transactions</Title>
                    <Paragraph className="lastweek">
                        <span className="bnb2"><CheckOutlined /></span> Selling Summary of the day
                    </Paragraph>
                </div>
                <div>
                    <Form.Item
                        name="Date"
                        initialValue={moment().format('YYYY-MM-DD')} // Set the initial value to the current date
                        label="Date"
                    >
                        <input
                            type="date"
                            className="custom-date-picker"
                            defaultValue={moment().format('YYYY-MM-DD')} // Default to the current date
                            onChange={(e) => fetchData(moment(e.target.value))}
                        />
                    </Form.Item>
                </div>
                {/*<div className="sales">*/}
                {/*    <ul>*/}
                {/*        <li>{<MinusOutlined style={{ color: "#008ffb" }} />} Selling</li>*/}
                {/*    </ul>*/}
                {/*</div>*/}
            </div>

            <ReactApexChart
                className="full-width"
                options={lineChartData.options}
                series={lineChartData.series}
                type="area"
                height={350}
                width={"100%"}
            />
        </>
    );
}

export default LineChart;
