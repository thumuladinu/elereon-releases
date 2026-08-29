import { useState, useEffect } from 'react';
import {
    Table, Tag, Button, Input, Space, Card, Typography,
    Dropdown, Menu, DatePicker, Select, Modal, message, Row, Col, Progress
} from 'antd';
import {
    SearchOutlined, PlusOutlined, FilterOutlined, EllipsisOutlined,
    CheckCircleOutlined, FileOutlined, CalendarOutlined
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import { getUserRole } from './utils/getUserRole';
import CreateJob from './CreateJob'; // Make sure CreateJob is a component, not a page


const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const statusColors = {
    PENDING: '#faad14',
    IN_PROGRESS: '#1890ff',
    COMPLETED: '#52c41a',
    OVERDUE: '#f5222d',
    CANCELLED: '#767676',
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
const invoiceStatusColors = {
    NOT_STARTED: '#d9d9d9',
    GENERATED: '#faad14',
    SENT: '#1890ff',
    PAID: '#52c41a',
};
const invoiceStatusDisplay = {
    NOT_STARTED: 'Not Started',
    GENERATED: 'Generated',
    SENT: 'Sent',
    PAID: 'Paid',
};

const Jobs = () => {
    const nav = useHistory();
    const role = getUserRole();

    const [jobs, setJobs] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState([]);
    const [invF, setInvF] = useState([]);
    const [range, setRange] = useState(null);
    const [users, setUsers] = useState([]);
    const [userF, setUserF] = useState([]);
    const [filterVisible, setFilterVisible] = useState(false);

    const [rescheduleVisible, setRescheduleVisible] = useState(false);
    const [selJob, setSelJob] = useState(null);
    const [newDue, setNewDue] = useState(null);
    const [jobCreateModal, setJobCreateModal] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [j, u] = await Promise.all([
                    axios.get('https://api.ddengineers.com/api/jobs'),
                    axios.get('https://api.ddengineers.com/api/users1'),
                ]);
                setJobs(j.data);
                setFiltered(j.data);
                setUsers(u.data);

            } catch (e) {
                console.error(e);
                message.error('Failed to load jobs or users');
            } finally {
                setLoading(false);
            }
        })();
    }, []);


    useEffect(() => {
        apply();
    }, [search, statusF, invF, range, userF, jobs]);


    const fetchJobsandUsers = async () => {
        try {
            const [j, u] = await Promise.all([
                axios.get('https://api.ddengineers.com/api/jobs'),
                axios.get('https://api.ddengineers.com/api/users1'),
            ]);
            setJobs(j.data);
            setUsers(u.data);
        } catch (e) {
            console.error(e);
            message.error('Failed to load jobs or users');
        }
    }

    const apply = () => {
        let res = [...jobs];
        const s = search.toLowerCase();
        if (search) {
            res = res.filter(j =>
                j.name.toLowerCase().includes(s) || (j.description || '').toLowerCase().includes(s) ||
                `DDJob-${j.id.toString().padStart(5, '0')}`.toLowerCase().includes(s)
            );
        }
        if (statusF.length) res = res.filter(j => statusF.includes(j.status));
        if (invF.length) res = res.filter(j => invF.includes(j.invoiceStatus));
        if (range && range[0] && range[1]) {
            const start = range[0].startOf('day');
            const end = range[1].endOf('day');
            res = res.filter(j =>
                dayjs(j.dueDate).isAfter(start) && dayjs(j.dueDate).isBefore(end)
            );
        }
        console.log('userF', userF);
        console.log('res', res);
        if (userF.length) res = res.filter(j => j.assignedTo && userF.includes(j.assignedTo));
        setFiltered(res);
    };

    const markInvoice = async (job, status) => {
        try {
            setLoading(true);
            await axios.put(`https://api.ddengineers.com/api/jobs/${job.id}`, { invoiceStatus: status });
            message.success(`Invoice ${status.toLowerCase()} for "${job.name}"`);
            const { data } = await axios.get('https://api.ddengineers.com/api/jobs');
            setJobs(data);
        } catch (e) {
            console.error(e);
            message.error('Update failed');
        } finally {
            setLoading(false);
        }
    };

    const reschedule = async () => {
        if (!selJob || !newDue) return;
        try {
            setLoading(true);
            await axios.put(`https://api.ddengineers.com/api/jobs/${selJob.id}`, {
                dueDate: newDue.toISOString(),
                status: selJob.status === 'OVERDUE' ? 'IN_PROGRESS' : selJob.status,
            });
            message.success('Rescheduled');
            const { data } = await axios.get('https://api.ddengineers.com/api/jobs');
            setJobs(data);
        } catch (e) {
            console.error(e);
            message.error('Failed');
        } finally {
            setLoading(false);
            setRescheduleVisible(false);
            setSelJob(null);
            setNewDue(null);
        }
    };

    const columns = [
        {
            title: 'Job',
            dataIndex: 'name',
            render: (text, record) => (
                <a onClick={() => nav.push(`/pm/job/${btoa(record.id)}`)}>{text}</a>
            ),
        },
        {
            title: 'Job ID',
            dataIndex: 'id',
            render: id => `DDJob-${id.toString().padStart(5, '0')}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: s => <Tag color={statusColors[s]}>{statusDisplay[s]}</Tag>,
        },
        {
            title: 'Invoice',
            dataIndex: 'invoiceStatus',
            render: s => <Tag color={invoiceStatusColors[s]}>{invoiceStatusDisplay[s]}</Tag>,
        },
        {
            title: 'Due',
            dataIndex: 'dueDate',
            render: d => new Date(d).toLocaleDateString(),
        },
        {
            title: 'Assigned',
            dataIndex: 'assignedTo',
            render: (a => {
                const user = users.find(u => u.id === a);
                return user ? user.name : 'Unassigned';
            }
            ),
        },
        {
            title: 'Completed Percentage',
            dataIndex: 'percentage',
            render: (p, record) => {
                let color = '#767676';

                if (record.status === 'COMPLETED') color = '#52c41a';
                else if (record.status === 'OVERDUE') color = '#f5222d';
                else if (p <= 20) color = '#767676';
                else if (p <= 50) color = '#fa8c16';
                else if (p <= 80) color = '#1890ff';
                else if (p <= 100) color = '#52c41a';

                if (record.status === 'OVERDUE') {
                    return <Tag color={color}>Overdue</Tag>;
                }

                return (
                    <div style={{ width: 100 }}>
                        <Progress
                            percent={p || 0}
                            strokeColor={color}
                            size="small"
                            showInfo={true}
                        />
                    </div>
                );
            },
        },
        {
            title: 'Actions',
            render: (_, record) => {
                const menu = (
                    <Menu
                        items={[
                            {
                                key: 'view',
                                label: 'View',
                                icon: <SearchOutlined />,
                                onClick: () => nav.push(`/pm/job/${btoa(record.id)}`),
                            },
                            ...(role === 'ADMIN' || role === 'OFFICE'
                                ? [
                                    {
                                        key: 'reschedule',
                                        label: 'Reschedule',
                                        icon: <CalendarOutlined />,
                                        onClick: () => {
                                            setSelJob(record);
                                            setNewDue(dayjs(record.dueDate));
                                            setRescheduleVisible(true);
                                        },
                                    },
                                    ...(record.status === 'COMPLETED' && record.invoiceStatus === 'NOT_STARTED'
                                        ? [{
                                            key: 'mark-inv',
                                            label: 'Mark Invoiced',
                                            icon: <FileOutlined />,
                                            onClick: () => markInvoice(record, 'GENERATED'),
                                        }]
                                        : []),
                                    ...(record.invoiceStatus === 'GENERATED'
                                        ? [{
                                            key: 'mark-sent',
                                            label: 'Mark Sent',
                                            icon: <FileOutlined />,
                                            onClick: () => markInvoice(record, 'SENT'),
                                        }]
                                        : []),
                                    ...(record.invoiceStatus === 'SENT'
                                        ? [{
                                            key: 'mark-paid',
                                            label: 'Mark Paid',
                                            icon: <CheckCircleOutlined />,
                                            onClick: () => markInvoice(record, 'PAID'),
                                        }]
                                        : []),
                                ]
                                : []),
                        ]}
                    />
                );
                return <Dropdown overlay={menu} trigger={['click']}><Button icon={<EllipsisOutlined />} /></Dropdown>;
            },
        },
    ];

    return (
        <div className="px-2 sm:px-4 md:px-6 py-4">
            <Card>
                <Row justify="space-between" align="middle" className="mb-4 flex-wrap gap-2">
                    <Col xs={24} sm={12}>
                        <Title level={3} style={{ marginBottom: 0 }}>Jobs Management</Title>
                    </Col>
                    {(role === 'ADMIN' || role === 'OFFICE') && (
                        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setJobCreateModal(true)}>
                                Create New Job
                            </Button>
                        </Col>
                    )}
                </Row>

                <Row justify="space-between" align="middle" className="mb-4 flex-wrap gap-2">
                    <Col xs={24} sm={16}>
                        <Space wrap>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Search jobs"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', maxWidth: 250 }}
                            />
                            <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(!filterVisible)}>
                                Filters
                            </Button>
                        </Space>
                    </Col>
                    <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                        <Text type="secondary">
                            {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
                        </Text>
                    </Col>
                </Row>

                {filterVisible && (
                    <Card className="mb-4" bodyStyle={{ paddingBottom: 12 }}>
                        <Row gutter={[16, 16]} align="middle" className="mb-2">
                            <Col xs={24} sm={12} md={6}>
                                <p className="mb-1 font-medium">Status</p>
                                <Select
                                    mode="multiple"
                                    style={{ width: '100%' }}
                                    value={statusF}
                                    onChange={setStatusF}
                                    placeholder="Select Status"
                                >
                                    {Object.keys(statusDisplay).map(k => (
                                        <Option key={k} value={k}>{statusDisplay[k]}</Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <p className="mb-1 font-medium">Invoice</p>
                                <Select
                                    mode="multiple"
                                    style={{ width: '100%' }}
                                    value={invF}
                                    onChange={setInvF}
                                    placeholder="Select Invoice Status"
                                >
                                    {Object.keys(invoiceStatusDisplay).map(k => (
                                        <Option key={k} value={k}>{invoiceStatusDisplay[k]}</Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <p className="mb-1 font-medium">Due Range</p>
                                <RangePicker
                                    style={{ width: '100%' }}
                                    value={range}
                                    onChange={setRange}
                                />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <p className="mb-1 font-medium">Assigned To</p>
                                <Select
                                    mode="multiple"
                                    style={{ width: '100%' }}
                                    value={userF}
                                    onChange={setUserF}
                                    placeholder="Select Users"
                                    showSearch
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }>
                                    {users.map(u => (
                                        <Option key={u.id} value={u.id}>{u.name}</Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>

                        <Row justify="end">
                            <Col>
                                <Button onClick={() => {
                                    setStatusF([]);
                                    setInvF([]);
                                    setRange(null);
                                    setUserF([]);
                                }}>
                                    Clear Filters
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                )}

                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </Card>

            <Modal
                title="Reschedule Job"
                open={rescheduleVisible}
                onOk={reschedule}
                onCancel={() => {
                    setRescheduleVisible(false);
                    setSelJob(null);
                    setNewDue(null);
                }}
                confirmLoading={loading}
            >
                <p>Job: {selJob?.name}</p>
                <p>Current Due: {selJob ? new Date(selJob.dueDate).toLocaleDateString() : ''}</p>
                <DatePicker
                    style={{ width: '100%' }}
                    value={newDue}
                    onChange={setNewDue}
                    disabledDate={d => d.isBefore(dayjs(), 'day')}
                />
            </Modal>

            <Modal
                open={jobCreateModal}
                onCancel={() => setJobCreateModal(false)}
                footer={null}
                width={window.innerWidth < 768 ? '100%' : 900}
                destroyOnClose
            >
                <CreateJob onSuccess={() => {
                    setJobCreateModal(false);
                    fetchJobsandUsers();
                }} />
            </Modal>
        </div>
    );
}

export default Jobs;
