import { useState, useEffect } from 'react';
import {
    Row, Col, Card, Statistic, Progress, List,
    Tag, Button, Typography, Spin, Modal, Divider, message
} from 'antd';
import {
    ProjectOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { getUserRole } from './utils/getUserRole';
import axios from 'axios';
import CreateJob from './CreateJob'; // Make sure CreateJob is a component, not a page

const { Title, Text } = Typography;

const statusColors = {
    PENDING: '#faad14',
    IN_PROGRESS: '#1890ff',
    COMPLETED: '#52c41a',
    OVERDUE: '#f5222d',
    CANCELLED: '#d9d9d9',
    ASKING_FOR_RESCHEDULE: '#ff185d'
};

const statusDisplay = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    OVERDUE: 'Overdue',
    CANCELLED: 'Cancelled',
    ASKING_FOR_RESCHEDULE: 'Asking for Reschedule'
};

const Dashboard = () => {
    const role = getUserRole();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        invoicePending: 0,
    });

    const formatJobId = (id) => `DDJob-${id.toString().padStart(5, '0')}`;


    const fetchJobs = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('https://api.ddengineers.com/api/jobs');
            setJobs(data);
            const total = data.length;
            const pending = data.filter(j => j.status === 'PENDING').length;
            const inProgress = data.filter(j => j.status === 'IN_PROGRESS').length;
            const completed = data.filter(j => j.status === 'COMPLETED').length;
            const overdue = data.filter(j => j.status === 'OVERDUE').length;
            const invoicePending = data.filter(j => j.status === 'COMPLETED' && j.invoiceStatus === 'NOT_STARTED').length;
            setStats({ total, pending, inProgress, completed, overdue, invoicePending });
        } catch (err) {
            console.error('Error loading dashboard jobs:', err);
            message.error('Failed to load jobs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    if (loading) {
        return (
            <div className="h-[50vh] flex justify-center items-center">
                <Spin size="large" />
            </div>
        );
    }

    console.log('Jobs:', jobs);

    const recent = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const urgent = jobs.filter(j => !['COMPLETED', 'CANCELLED'].includes(j.status))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
    const invoiceList = jobs.filter(j => j.status === 'COMPLETED' && j.invoiceStatus === 'NOT_STARTED').slice(0, 5);

    return (
        <div className="px-6 py-4">
            <Row justify="space-between" align="middle" className="mb-4">
                <Col>
                    <Title level={3} style={{ marginBottom: 0 }}>Dashboard</Title>
                </Col>
                {(role === 'ADMIN' || role === 'OFFICE') && (
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setModalVisible(true)}
                        >
                            New Job
                        </Button>
                    </Col>
                )}
            </Row>

            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} sm={12} md={6}>
                    <Card><Statistic title="Total Jobs" value={stats.total} prefix={<ProjectOutlined />} /></Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card><Statistic title="In Progress" value={stats.inProgress} prefix={<ClockCircleOutlined />} valueStyle={{ color: statusColors.IN_PROGRESS }} /></Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card><Statistic title="Completed" value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: statusColors.COMPLETED }} /></Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card><Statistic title="Pending Invoices" value={stats.invoicePending} prefix={<DollarOutlined />} valueStyle={{ color: statusColors.OVERDUE }} /></Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card title={<Title level={5} style={{ marginBottom: 0 }}>Job Status Overview</Title>}>
                        {console.log('Stats:', stats)}
                        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((key) => {
                            const label = statusDisplay[key];
                            const color = statusColors[key];

                            // Define proper key mapping to match the stats object
                            const statsKeyMap = {
                                PENDING: 'pending',
                                IN_PROGRESS: 'inProgress',
                                COMPLETED: 'completed',
                                OVERDUE: 'overdue',
                            };

                            const statKey = statsKeyMap[key];
                            const value = stats[statKey] || 0;
                            const percentage = Math.round((value / (stats.total || 1)) * 100);

                            return (
                                <div key={key} className="mb-4">
                                    <Text>{label}</Text>
                                    <Progress
                                        percent={percentage}
                                        strokeColor={color}
                                        showInfo
                                    />
                                </div>
                            );
                        })}
                    </Card>

                </Col>


                <Col xs={24} lg={16}>
                    {(role === 'ADMIN' || role === 'OFFICE') && (
                        <Card title="Jobs Completed - Invoice Pending" className="mb-4">
                            <List
                                dataSource={invoiceList}
                                renderItem={j => (
                                    <List.Item actions={[<Button type="link" onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>View</Button>]}>
                                        <List.Item.Meta
                                            title={<a onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>{j.name}</a>}
                                            description={
                                                <div>
                                                    <div>ID: {formatJobId(j.id)}</div>
                                                    <div>Completed: {j.completedDate ? new Date(j.completedDate).toLocaleDateString() : 'N/A'}</div>
                                                </div>
                                            }
                                        />
                                        <Tag color={statusColors.OVERDUE}>Invoice Needed</Tag>
                                    </List.Item>
                                )}
                                locale={{ emptyText: 'No jobs pending invoice' }}
                            />
                        </Card>
                    )}
                    {(role === 'ADMIN' || role === 'OFFICE') && (
                        <Card title="Jobs Asking for Reschedule" className="mb-4">
                            <List
                                dataSource={jobs.filter(j => j.status === 'ASKING_FOR_RESCHEDULE')}
                                renderItem={j => (
                                    <List.Item actions={[<Button type="link" onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>View</Button>]}>
                                        <List.Item.Meta
                                            title={<a onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>{j.name}</a>}
                                            description={
                                                <div>
                                                    <div>ID: {formatJobId(j.id)}</div>
                                                    <div>Asking for Reschedule</div>
                                                </div>
                                            }
                                        />
                                        <Tag color={statusColors.ASKING_FOR_RESCHEDULE}>Reschedule Needed</Tag>
                                    </List.Item>
                                )}
                                locale={{ emptyText: 'No jobs asking for reschedule' }}
                            />
                        </Card>
                    )}
                    <Card title="Urgent Jobs" className="mb-4">
                        <List
                            dataSource={urgent}
                            renderItem={j => (
                                <List.Item
                                    actions={[
                                        <Button type="link" onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>View</Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<a onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>{j.name}</a>}
                                        description={
                                            <>
                                                <div>
                                                    <div>ID: {formatJobId(j.id)}</div>
                                                    <div>Due: {new Date(j.dueDate).toLocaleDateString()}</div>
                                                </div>
                                                <div>
                                                    <Progress
                                                        percent={Math.round((j.percentage / 100) * 100)}
                                                        size="small"
                                                        strokeColor={statusColors[j.status]}
                                                    />
                                                </div>
                                            </>
                                        }
                                    />
                                    <Tag color={statusColors[j.status]}>{statusDisplay[j.status]}</Tag>
                                </List.Item>

                            )}
                            locale={{ emptyText: 'No urgent jobs' }}
                        />
                    </Card>
                    <Card title="Recently Created Jobs" className="mb-4">
                        <List
                            dataSource={recent}
                            renderItem={j => (
                                <List.Item actions={[<Button type="link" onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>View</Button>]}>
                                    <List.Item.Meta
                                        title={<a onClick={() => window.location.href = `/pm/job/${btoa(j.id)}`}>{j.name}</a>}
                                        description={
                                            <>
                                                <div>
                                                    <div>ID: {formatJobId(j.id)}</div>
                                                    <div>Created: {new Date(j.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <div>
                                                    <Progress
                                                        percent={Math.round((j.percentage / 100) * 100)}
                                                        size="small"
                                                        strokeColor={statusColors[j.status]}
                                                    />
                                                </div>
                                            </>

                                        }
                                    />
                                    <Tag color={statusColors[j.status]}>{statusDisplay[j.status]}</Tag>
                                </List.Item>
                            )}
                            locale={{ emptyText: 'No recent jobs' }}
                        />
                    </Card>




                </Col>
            </Row>

            {/* 🔥 Modal for Create Job */}
            <Modal
                // title="Create New Job"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={900}
                destroyOnClose
            >
                <CreateJob onSuccess={() => {
                    setModalVisible(false);
                    fetchJobs(); // reload dashboard stats and lists
                }} />
            </Modal>
        </div>
    );
};

export default Dashboard;
