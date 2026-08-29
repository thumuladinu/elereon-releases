// 📁 src/pages/pm/JobDetails.js
import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
    Card, Typography, Descriptions, Tag, Tabs, Timeline, Button, Space, Modal, Form,
    Input, Select, DatePicker, Upload, message, List, Avatar, Empty, Popconfirm,
    Spin, Image, Divider, Col, Row
} from 'antd';
import {
    EditOutlined, FileAddOutlined, PictureOutlined, MessageOutlined,
    CheckCircleOutlined, UploadOutlined, ClockCircleOutlined, UserOutlined,
    DeleteOutlined, CloseCircleOutlined, WarningOutlined, FileOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { getUserRole } from './utils/getUserRole';
import Cookies from "js-cookie";


export const IMG_BB_API_KEY = 'a94bb5679f1add2d50baee0220cc7926';
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
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
    PAID: '#52c41a'
};

const uploadPhoto = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await axios.post(`https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`, fd);
    return data.data.url;
};

const JobDetails = () => {

    // const {jobId} = useParams();
    //get btoa decoded jobId
    const { jobId } = useParams();
    const decodedJobId = atob(jobId);
    const nav = useHistory();
    const role = getUserRole();
    const [job, setJob] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const [editVisible, setEditVisible] = useState(false);
    const [photoVisible, setPhotoVisible] = useState(false);
    const [uploaded, setUploaded] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [remarkVisible, setRemarkVisible] = useState(false);
    const [subVisible, setSubVisible] = useState(false);
    const [editSubVisible, setEditSubVisible] = useState(false);
    const [selSub, setSelSub] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [{ data: jobData }, { data: usersData }] = await Promise.all([
                    axios.get(`https://api.ddengineers.com/api/jobs/${decodedJobId}`),
                    axios.get(`https://api.ddengineers.com/api/users1`)
                ]);
                setJob(jobData);
                setUsers(usersData);
            } catch (e) {
                console.error(e);
                message.error('Failed to load job details');
            } finally {
                setLoading(false);
            }
        })();
    }, [decodedJobId]);

    const refresh = async () => {
        const { data } = await axios.get(`https://api.ddengineers.com/api/jobs/${job.id}`);
        setJob(data);
    };

    const handleSaveJob = async (v) => {
        try {
            setLoading(true);
            await axios.put(`https://api.ddengineers.com/api/jobs/${job.id}`, {
                ...v,
                startDate: v.startDate ? v.startDate.toISOString() : null,
                dueDate: v.dueDate ? v.dueDate.toISOString() : null,
                assignedTo: v.assignedTo ? v.assignedTo : null
            });
            message.success('Updated');
            await refresh();
            setEditVisible(false);
        } catch (e) {
            console.error(e);
            message.error('Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (files) => {
        setUploading(true);
        try {
            const urls = [];
            for (const f of files) {
                const url = await uploadPhoto(f); // your existing upload logic
                urls.push({ url, caption: '' }); // convert to object
            }
            setUploaded(prev => [...prev, ...urls]);
            message.success('Uploaded');
        } catch (e) {
            console.error(e);
            message.error('Upload error');
        } finally {
            setUploading(false);
        }
    };

    const rememberedUser = Cookies.get("rememberedUser");
    const USER_ID = rememberedUser ? JSON.parse(rememberedUser).USER_ID : null;


    const savePhotos = async () => {
        if (!uploaded.length) return;
        try {
            setLoading(true);
            for (const photo of uploaded) {
                await axios.post(`https://api.ddengineers.com/api/jobs/${job.id}/photos`, {
                    url: photo.url,
                    caption: photo.caption || ''
                });
            }
            message.success('Saved');
            await refresh(); // refresh job data
            setUploaded([]);
            setPhotoVisible(false);
        } catch (e) {
            console.error(e);
            message.error('Save photo failed');
        } finally {
            setLoading(false);
        }
    };


    const addRemark = async (v) => {
        try {
            setLoading(true);
            await axios.post(`https://api.ddengineers.com/api/jobs/${job.id}/remarks`, {
                content: v.content,
                type: role,
                createdBy: USER_ID,
            });
            message.success('Remark added');
            await refresh();
            setRemarkVisible(false);
        } catch (e) {
            console.error(e);
            message.error('Add remark failed');
        } finally {
            setLoading(false);
        }
    };

    const addSub = async (v) => {
        try {
            setLoading(true);
            await axios.post(`https://api.ddengineers.com/api/jobs/${job.id}/subjobs`, {
                ...v,
                startDate: v.subJobStartDate ? v.subJobStartDate.toISOString() : null,
                dueDate: v.subJobDueDate ? v.subJobDueDate.toISOString() : null,
            });
            message.success('Sub job added');
            await refresh();
            setSubVisible(false);
        } catch (e) {
            console.error(e);
            message.error('Add sub failed');
        } finally {
            setLoading(false);
        }
    };



    const saveSub = async (v) => {
        try {
            console.log("sub job", selSub);
            setLoading(true);
            await axios.put(`https://api.ddengineers.com/api/jobs/${job.id}/subjobs/${selSub.SUB_JOB_ID}`, {
                name: v.subJobName,
                description: v.subJobDescription ? v.subJobDescription : null,
                status: v.subJobStatus,
                startDate: v.subJobStartDate ? v.subJobStartDate.toISOString() : null,
                dueDate: v.subJobDueDate ? v.subJobDueDate.toISOString() : null,
                assignedTo: v.subJobAssignedTo ? v.subJobAssignedTo : null
            });

            message.success('Sub updated');
            await refresh();
            setEditSubVisible(false);
        } catch (e) {
            console.error(e);
            message.error('Update sub failed');
        } finally {
            setLoading(false);
        }
    };

    const markJob = async (fields) => {
        try {
            setLoading(true);
            await axios.put(`https://api.ddengineers.com/api/jobs/${job.id}`, fields);
            message.success('Updated');
            await refresh();
        } catch (e) {
            console.error(e);
            message.error('Update failed');
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div className="h-[50vh] flex justify-center items-center"><Spin size="large" /></div>;
    if (!job) return <Empty description="Job not found" />;

    const canEdit = role === 'ADMIN' || role === 'OFFICE';
    // const canComplete = ['ADMIN', 'MAIN_SUPERVISOR', 'SUPERVISOR'].includes(role) && !['COMPLETED', 'CANCELLED'].includes(job.status);
    const canCancel = (role === 'ADMIN' || role === 'OFFICE') && !['COMPLETED', 'CANCELLED'].includes(job.status);
    const canInvoice = (role === 'ADMIN' || role === 'OFFICE') && job.status === 'COMPLETED' && job.invoiceStatus === 'NOT_STARTED';
    const canSent = (role === 'ADMIN' || role === 'OFFICE') && job.status === 'COMPLETED' && job.invoiceStatus === 'GENERATED';
    const canPaid = (role === 'ADMIN' || role === 'OFFICE') && job.status === 'COMPLETED' && job.invoiceStatus === 'SENT';

    // const canComplete role = ADMIN or USER_ID= job.assignedTo
    const canComplete = (role === 'ADMIN' || (job.assignedTo === USER_ID)) && !['COMPLETED', 'CANCELLED', 'ASKING_FOR_RESCHEDULE'].includes(job.status);

    return (<div>
        <Card className="mb-4">
            <Row justify="space-between" align="middle" gutter={[16, 16]} wrap>
                <Col span={24} md={16}>
                    <Space direction="vertical" size={0}>
                        <Space wrap align="center">
                            <Title level={4} style={{ margin: 0 }}>{job.name}</Title>
                            <Tag color={statusColors[job.status]}>{statusDisplay[job.status]}</Tag>
                            <Tag color={invoiceStatusColors[job.invoiceStatus]}>Invoice: {job.invoiceStatus}</Tag>
                        </Space>
                        <Text type="secondary">DDJob-{job.id.toString().padStart(5, '0')}</Text>
                    </Space>
                </Col>

                <Col span={24} md={8} style={{ textAlign: 'right' }}>
                    <Space wrap>
                        <Button onClick={() => nav.push('/pm/jobs')}>Back</Button>
                        {canEdit && (
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => {
                                    // console.log("job", job);
                                    form.setFieldsValue({
                                        name: job.name,
                                        description: job.description,
                                        status: job.status,
                                        invoiceStatus: job.invoiceStatus,
                                        startDate: dayjs(job.startDate),
                                        dueDate: dayjs(job.dueDate),
                                        assignedTo: job.assignedTo
                                    });
                                    setEditVisible(true);
                                }}
                            >
                                Edit Job
                            </Button>
                        )}
                    </Space>
                </Col>
            </Row>

            <Divider />
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item
                    label="Created By">{job.createdByName}</Descriptions.Item><Descriptions.Item
                        label="Created At">{new Date(job.createdAt).toLocaleString()}</Descriptions.Item><Descriptions.Item
                            label="Last Updated">{new Date(job.updatedAt).toLocaleString()}</Descriptions.Item><Descriptions.Item
                                label="Start">{new Date(job.startDate).toLocaleDateString()}</Descriptions.Item><Descriptions.Item
                                    label="Due">{new Date(job.dueDate).toLocaleDateString()}</Descriptions.Item><Descriptions.Item
                                        label="Completed">{job.completedDate ? new Date(job.completedDate).toLocaleDateString() : '-'}</Descriptions.Item><Descriptions.Item
                                            //fullRow for Assigned To
                                            span={3} label="Assigned To">{job.assignedTo ? job.assignedToName : '-'}</Descriptions.Item>
                {job.description &&
                    <Descriptions.Item label="Description" span={3}>{job.description}</Descriptions.Item>}</Descriptions>
            <Row gutter={[8, 8]} style={{ marginTop: 10 }} wrap>
                <>
                    <Col>
                        <Button icon={<PictureOutlined />} onClick={() => setPhotoVisible(true)}>
                            Add Photos
                        </Button>
                    </Col>
                    <Col>
                        <Button icon={<MessageOutlined />} onClick={() => setRemarkVisible(true)}>
                            Add Remark
                        </Button>
                    </Col>
                </>

                {canEdit && (
                    <Col>
                        <Button icon={<FileAddOutlined />} onClick={() => setSubVisible(true)}>
                            Add Sub Job
                        </Button>
                    </Col>
                )}

                {canComplete && (
                    <Col>
                        <Popconfirm
                            title="Mark completed?"
                            onConfirm={() => markJob({
                                status: 'COMPLETED',
                                completedDate: new Date().toISOString()
                            })}
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ backgroundColor: statusColors.COMPLETED }}
                            >
                                Mark as Completed
                            </Button>
                        </Popconfirm>
                    </Col>
                )}

                {canComplete && (
                    <Col>
                        <Popconfirm
                            title="Asking for reschedule?"
                            onConfirm={() => markJob({ status: 'ASKING_FOR_RESCHEDULE' })}
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ backgroundColor: statusColors.ASKING_FOR_RESCHEDULE }}
                            >
                                Ask for Reschedule
                            </Button>
                        </Popconfirm>
                    </Col>
                )}

                {canCancel && (
                    <Col>
                        <Popconfirm
                            title="Cancel job?"
                            onConfirm={() => markJob({ status: 'CANCELLED' })}
                        >
                            <Button danger icon={<CloseCircleOutlined />}>
                                Cancel Job
                            </Button>
                        </Popconfirm>
                    </Col>
                )}

                {canInvoice && (
                    <Col>
                        <Popconfirm
                            title="Mark invoiced?"
                            onConfirm={() => markJob({ invoiceStatus: 'GENERATED' })}
                        >
                            <Button
                                type="primary"
                                icon={<FileOutlined />}
                                style={{ backgroundColor: invoiceStatusColors.GENERATED }}
                            >
                                Mark as Invoiced
                            </Button>
                        </Popconfirm>
                    </Col>
                )}
                {canSent && (
                    <Col>
                        <Popconfirm
                            title="Send invoice?"
                            onConfirm={() => markJob({ invoiceStatus: 'SENT' })}
                        >
                            <Button
                                type="primary"
                                icon={<FileOutlined />}
                                style={{ backgroundColor: invoiceStatusColors.SENT }}
                            >
                                Send Invoice
                            </Button>
                        </Popconfirm>
                    </Col>
                )}

                {canPaid && (
                    <Col>
                        <Popconfirm
                            title="Mark paid?"
                            onConfirm={() => markJob({ invoiceStatus: 'PAID' })}
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ backgroundColor: invoiceStatusColors.PAID }}
                            >
                                Mark as Paid
                            </Button>
                        </Popconfirm>
                    </Col>
                )}

            </Row>


        </Card>
        <Tabs defaultActiveKey="sub">
            <TabPane tab="Sub Jobs" key="sub">
                <Card>{job.subJobs.length ? <List itemLayout="vertical" dataSource={job.subJobs} renderItem={sj => (
                    console.log("sub job", sj),
                    <List.Item actions={[<Button icon={<EditOutlined />} disabled={!canEdit} onClick={() => {
                        setSelSub(sj);
                        { console.log("sub job", sj) }
                        form.setFieldsValue({
                            subJobName: sj.NAME,
                            subJobDescription: sj.DESCRIPTION,
                            subJobStatus: sj.STATUS,
                            subJobStartDate: sj.START_DATE ? dayjs(sj.START_DATE) : null,
                            subJobDueDate: sj.DUE_DATE ? dayjs(sj.DUE_DATE) : null,
                            subJobAssignedTo: sj.ASSIGNED_TO ? sj.ASSIGNED_TO : null
                        });
                        setEditSubVisible(true);
                    }}>Edit</Button>]}>

                        <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Text strong>{sj.NAME + ` (DDSub-${job.id}-${sj.SUB_JOB_ID.toString().padStart(5, '0')}) `}</Text>
                                    <Tag color={statusColors[sj.STATUS]}>
                                        {statusDisplay[sj.STATUS]}
                                    </Tag>
                                </div>

                                {sj.DESCRIPTION && (
                                    <Paragraph className="mt-2">{sj.DESCRIPTION}</Paragraph>
                                )}

                                <div className="mt-2 text-sm text-gray-500">
                                    {sj.ASSIGNED_TO_NAME && (
                                        <div className="flex items-center gap-1">
                                            <UserOutlined />
                                            <span> Assigned to: {sj.ASSIGNED_TO_NAME}</span>
                                        </div>
                                    )}

                                    {sj.START_DATE && (
                                        <div className="mt-1">
                                            Start: {new Date(sj.START_DATE).toLocaleDateString()}
                                        </div>
                                    )}

                                    {sj.DUE_DATE && (
                                        <div className="mt-1">
                                            Due: {new Date(sj.DUE_DATE).toLocaleDateString()}
                                        </div>
                                    )}

                                    {sj.COMPLETED_DATE && (
                                        <div className="mt-1">
                                            Completed: {new Date(sj.COMPLETED_DATE).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </List.Item>)} /> : <Empty />}
                </Card>
            </TabPane>
            <TabPane tab={`Photos (${job.photos.length})`} key="photos"><Card>{job.photos.length ?
                <div className="grid grid-cols-3 gap-4">
                    {job.photos?.map(p => (
                        <div
                            key={p.PHOTO_ID}
                            className="relative w-full pb-[100%] bg-gray-100 rounded-lg overflow-hidden shadow"
                        >
                            <Title level={5} className="absolute top-2 left-2 text-white bg-gray-800 px-2 py-1 rounded">
                                {p.CAPTION || 'Photo'}
                            </Title>
                            <Image
                                src={p.URL}
                                className="absolute top-0 left-0 w-full h-full object-cover"
                                alt={p.CAPTION || 'Photo'}
                            />

                        </div>
                    ))}
                </div>

                : <Empty />}
            </Card>
            </TabPane>
            <TabPane tab={`Remarks (${job.remarks.length})`}
                key="remarks"><Card>{job.remarks.length ?
                    <Timeline>
                        {[...job.remarks]
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map(r => (
                                <Timeline.Item key={r.id} color={r.type === 'OFFICE' || r.type === 'ADMIN' ? 'blue' : 'green'}>
                                    <div className="flex gap-2">
                                        <Avatar
                                            src={r.createdBy?.profilePicture || ''}
                                            icon={!r.createdBy?.profilePicture && <UserOutlined />}
                                        />
                                        <div>
                                            <Text strong>{r.createdBy?.name + ' '}</Text>
                                            <Tag color={r.type === 'OFFICE' ? 'blue' : 'green'}>{r.type}</Tag>
                                            <Text type="secondary" className="text-xs">
                                                {new Date(r.createdAt).toLocaleString()}
                                            </Text>
                                            <Paragraph>{r.content}</Paragraph>
                                        </div>
                                    </div>
                                </Timeline.Item>
                            ))}
                    </Timeline>
                    : <Empty />}</Card></TabPane></Tabs>

        {/* Modals */}
        <Modal title="Edit Job" open={editVisible} onOk={form.submit} onCancel={() => setEditVisible(false)}
            confirmLoading={loading}><Form form={form} layout="vertical" onFinish={handleSaveJob}><Form.Item
                name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="description"
                    label="Description"><TextArea
                        rows={3} /></Form.Item>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Form.Item name="status" label="Status"
                    rules={[{ required: true }]}><Select><Option
                        value="PENDING">Pending</Option><Option value="IN_PROGRESS">In Progress</Option><Option
                            value="COMPLETED">Completed</Option><Option value="OVERDUE">Overdue</Option>
                        <Option
                            value="CANCELLED">Cancelled</Option>
                        <Option
                            value="ASKING_FOR_RESCHEDULE">Asking for Reschedule</Option>
                    </Select></Form.Item><Form.Item name="invoiceStatus"
                        label="Invoice Status"
                    ><Select><Option
                        value="NOT_STARTED">Not Started</Option><Option value="GENERATED">Generated</Option><Option
                            value="SENT">Sent</Option><Option value="PAID">Paid</Option></Select></Form.Item></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Form.Item name="startDate" label="Start"
                    rules={[{ required: true }]}><DatePicker
                        style={{ width: '100%' }} /></Form.Item><Form.Item name="dueDate" label="Due"
                        ><DatePicker
                            style={{ width: '100%' }} /></Form.Item></div>
                <Form.Item name="assignedTo" label="Assigned To"><Select
                    allowClearshowSearch={true}
                    filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                    }>{users.map(u => <Option key={u.id}
                        value={u.id}>{u.name}</Option>)}</Select></Form.Item></Form></Modal>
        <Modal
            title="Add Photos"
            open={photoVisible}
            onOk={savePhotos}
            onCancel={() => {
                setPhotoVisible(false);
                setUploaded([]);
            }}
            confirmLoading={loading}
        >
            <Upload
                beforeUpload={(f) => {
                    handleUpload([f]);
                    return false;
                }}
                multiple
                showUploadList={false}
            >
                <Button icon={<UploadOutlined />} loading={uploading}>Select Photos</Button>
            </Upload>

            {uploaded.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {uploaded.map((u, i) => (
                        <div key={i} className="relative">
                            <img src={u.url} alt="up" className="w-full h-32 object-cover rounded" />
                            <Input
                                placeholder="Add caption"
                                value={u.caption}
                                onChange={(e) => {
                                    const arr = [...uploaded];
                                    arr[i].caption = e.target.value;
                                    setUploaded(arr);
                                }}
                                className="mt-1"
                            />
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                className="absolute top-0 right-0"
                                onClick={() => {
                                    const arr = [...uploaded];
                                    arr.splice(i, 1);
                                    setUploaded(arr);
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : !uploading && <Empty />}
        </Modal>


        <Modal
            title="Add Remark"
            open={remarkVisible}
            onOk={form.submit}
            onCancel={() => setRemarkVisible(false)}
            confirmLoading={loading}>
            <Form form={form} layout="vertical" onFinish={addRemark}>
                <Form.Item
                    name="content"
                    rules={[{ required: true }]}>
                    <TextArea rows={4} />
                </Form.Item>
            </Form>
        </Modal>

        <Modal title="Add Sub Job" open={subVisible} onOk={form.submit} onCancel={() => setSubVisible(false)}
            confirmLoading={loading}><Form form={form} layout="vertical" onFinish={addSub}><Form.Item name="name"
                label="Name"
                rules={[{ required: true }]}><Input /></Form.Item><Form.Item
                    name="description" label="Description"><TextArea rows={3} /></Form.Item><Form.Item name="status"
                        label="Status"
                        initialValue="PENDING"
                        rules={[{ required: true }]}><Select><Option
                            value="PENDING">Pending</Option><Option value="IN_PROGRESS">In Progress</Option><Option
                                value="COMPLETED">Completed</Option><Option value="OVERDUE">Overdue</Option></Select></Form.Item>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Form.Item name="startDate" label="Start"
                    rules={[{ required: true }]}><DatePicker
                        style={{ width: '100%' }} /></Form.Item><Form.Item name="dueDate" label="Due"
                        ><DatePicker
                            style={{ width: '100%' }} /></Form.Item></div>
                <Form.Item name="assignedTo" label="Assigned To"><Select
                    allowClear showSearch={true}
                    filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                    }>{users.map(u => <Option key={u.id}
                        value={u.id}>{u.name}</Option>)}</Select></Form.Item></Form></Modal>
        <Modal title="Edit Sub Job" open={editSubVisible} onOk={form.submit} onCancel={() => {
            setEditSubVisible(false);
            setSelSub(null);
        }} confirmLoading={loading}><Form form={form} layout="vertical" onFinish={saveSub}><Form.Item name="subJobName"
            label="Name"
            rules={[{ required: true }]}><Input /></Form.Item><Form.Item
                name="subJobDescription" label="Description"><TextArea rows={3} /></Form.Item><Form.Item name="subJobStatus"
                    label="Status"
                    rules={[{ required: true }]}><Select><Option
                        value="PENDING">Pending</Option><Option value="IN_PROGRESS">In Progress</Option><Option
                            value="COMPLETED">Completed</Option><Option value="OVERDUE">Overdue</Option></Select></Form.Item>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Form.Item name="subJobStartDate"
                    label="Start"
                    rules={[{ required: true }]}><DatePicker
                        style={{ width: '100%' }} /></Form.Item><Form.Item name="subJobDueDate" label="Due"><DatePicker
                            style={{ width: '100%' }} /></Form.Item></div>
                <Form.Item name="subJobAssignedTo" label="Assigned To"><Select
                    allowClear showSearch={true}
                    filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                    }>{users.map(u => <Option key={u.id}
                        value={u.id}>{u.name}</Option>)}</Select></Form.Item></Form></Modal>
    </div>);
};

export default JobDetails;
