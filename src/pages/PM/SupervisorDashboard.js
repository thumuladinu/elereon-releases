// 📁 src/pages/pm/SupervisorDashboard.js
import { useState, useEffect } from 'react';
import {
    Card, List, Tag, Button, Typography, Tabs, Empty, Spin, Badge, Row, Col, Progress
} from 'antd';
import { useHistory } from 'react-router-dom';
import { getUserRole } from './utils/getUserRole';
import axios from 'axios';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import Cookies from "js-cookie";

const { Title, Text } = Typography;

const statusColors = {
    PENDING: '#faad14',
    IN_PROGRESS: '#1890ff',
    COMPLETED: '#52c41a',
    OVERDUE: '#f5222d',
    CANCELLED: '#767676'
};

const SupervisorDashboard = () => {
    const nav = useHistory();
    const role = getUserRole();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('active');

    useEffect(() => {
        (async () => {
            const rememberedUser = Cookies.get("rememberedUser");
            const USER_ID = rememberedUser ? JSON.parse(rememberedUser).USER_ID : null;
            try {
                const { data } = await axios.get('https://api.ddengineers.com/api/jobs/assigned', {
                    params: { userId: USER_ID }
                });
                setJobs(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [role]);

    const active = jobs.filter(j => !['COMPLETED', 'CANCELLED'].includes(j.status));
    const overdue = jobs.filter(j =>
        j.status === 'OVERDUE' || (
            !['COMPLETED', 'CANCELLED'].includes(j.status) &&
            new Date(j.dueDate) < new Date()
        )
    );
    const completed = jobs.filter(j => j.status === 'COMPLETED');

    if (loading)
        return <div className="h-[50vh] flex justify-center items-center"><Spin size="large" /></div>;

    const renderTabContent = (list) => (
        <List
            dataSource={list}
            renderItem={(j) => (
                <Card className="mb-4 shadow-sm rounded-lg" bodyStyle={{ padding: 20 }}>
                    <Row gutter={[16, 16]} align="middle">
                        {/* Task Info + Subtasks */}
                        <Col xs={24} sm={18}>
                            <div className="flex items-center gap-2 mb-1">
                                <Title level={5} style={{ margin: 0 }}>{j.name + ' '}
                                    {j.subJobs.length > 0 && (
                                        <Badge count={j.subJobs.length} style={{ backgroundColor: '#1890ff' }} />
                                    )}
                                </Title>
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                                <Text type="secondary">DDJob-{j.id.toString().padStart(5, '0')}</Text>
                            </div>
                            <Text type="secondary">Due: {new Date(j.dueDate).toLocaleDateString()}</Text>
                            <div className="mt-1">{j.description}</div>
                            {console.log(j)}
                            {j.subJobs && j.subJobs.length > 0 && (
                                <div className="mt-2">
                                    <Text strong>Sub Tasks:</Text>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {j.subJobs.map((sj) => (
                                            <Tag
                                                key={sj.SUB_JOB_ID}
                                                color={sj.STATUS === 'COMPLETED' ? statusColors.COMPLETED :
                                                    (sj.STATUS === 'OVERDUE' ? statusColors.OVERDUE :
                                                        statusColors[sj.STATUS])}
                                            >
                                                {sj.NAME}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {j.subJobs && j.subJobs.length > 0 && (
                                <div className="mt-2">
                                    <Text strong>Progress:</Text>
                                    <div className="mt-1">
                                        <Progress
                                            percent={Math.round((j.subJobs.filter(sj => sj.STATUS === 'COMPLETED').length / j.subJobs.length) * 100)}
                                            size="small"
                                            strokeColor={statusColors[j.status]}
                                        />
                                    </div>
                                </div>
                            )}
                        </Col>

                        {/* Status */}
                        <Col xs={12} sm={3} className="text-center">
                            <Tag color={statusColors[j.status]}>{j.status.replace('_', ' ')}</Tag>
                        </Col>

                        {/* Action */}
                        <Col xs={12} sm={3} className="text-center">
                            <Button type="primary" onClick={() => nav.push(`/pm/job/${btoa(j.id)}`)}>View Details</Button>
                        </Col>
                    </Row>
                </Card>
            )}
            locale={{ emptyText: <Empty /> }}
        />
    );

    const tabs = [
        {
            key: 'active',
            label: (
                <span>
                    <ClockCircleOutlined /> Active <Badge count={active.length} style={{ marginLeft: 8 }} />
                </span>
            ),
            children: renderTabContent(active)
        },
        {
            key: 'overdue',
            label: (
                <span>
                    <WarningOutlined /> Overdue <Badge count={overdue.length} style={{ marginLeft: 8, backgroundColor: '#f5222d' }} />
                </span>
            ),
            children: renderTabContent(overdue)
        },
        {
            key: 'completed',
            label: (
                <span>
                    <CheckCircleOutlined /> Completed <Badge count={completed.length} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
                </span>
            ),
            children: renderTabContent(completed)
        }
    ];

    return (
        <div>
            <Title level={4}>My Tasks</Title>
            <Tabs activeKey={tab} onChange={setTab} items={tabs} />
        </div>
    );
};

export default SupervisorDashboard;
