import { useState, useEffect } from 'react';
import {
    Card, Typography, Form, Input, Select, DatePicker, Button,
    Divider, Space, message, Row, Col
} from 'antd';
import {
    PlusOutlined, MinusCircleOutlined, SaveOutlined, RollbackOutlined
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import Cookies from 'js-cookie';


const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateJob = () => {
    const navigate = useHistory();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const response = await axios.get('https://api.ddengineers.com/api/supervisors');
                console.log("supervisors", response.data.supervisors);
                setUsers(response.data.supervisors);
            } catch (e) {
                console.error(e);
                message.error('Failed to load users');
            }
        })();
    }, []);

    useEffect(() => {
        console.log("users (updated):", users);
    }, [users]);


    const handleCreateJob = async (values) => {
        try {
            setLoading(true);
            //get created by user
            let rememberedUser = Cookies.get('rememberedUser');
            let USER_ID = null;
            if (rememberedUser) {
                rememberedUser = JSON.parse(rememberedUser);
                USER_ID = rememberedUser.USER_ID;
            }

            const { data: job } = await axios.post('https://api.ddengineers.com/api/jobs', {
                name: values.name,
                description: values.description,
                status: values.status || 'PENDING',
                invoiceStatus: 'NOT_STARTED',
                startDate: values.startDate ? values.startDate.toISOString() : null,
                dueDate: values.dueDate ? values.dueDate.toISOString() : null,
                assignedTo: values.assignedTo,
                createdBy: USER_ID,
            });

            if (values.subJobs?.length) {
                for (const sj of values.subJobs) {
                    await axios.post(`https://api.ddengineers.com/api/jobs/${job.id}/subjobs`, {
                        name: sj.name,
                        description: sj.description,
                        status: 'PENDING',
                        startDate: sj.startDate?.toISOString(),
                        dueDate: sj.dueDate?.toISOString(),
                        assignedTo: sj.assignedTo,
                    });
                }
            }

            message.success('Job created');
            // navigate.push(`/pm/job/${job.id}`) with encrypted id
            navigate.push(`/pm/job/${btoa(job.id)}`);
        } catch (e) {
            console.error(e);
            message.error('Failed to create job');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <Row justify="space-between" align="middle" className="mb-4">
                    <Col>
                        <Title level={4}>Create New Job</Title>
                    </Col>
                    {/*    <Col>*/}
                    {/*<Button onClick={() => navigate.push('/pm/jobs')}>Back to Jobs</Button>*/}
                    {/*    </Col>*/}
                </Row>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleCreateJob}
                initialValues={{ status: 'PENDING', startDate: dayjs(), dueDate: dayjs().add(7, 'day') }}
            >
                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <Form.Item name="name" label="Job Name" rules={[{ required: true }]}>
                            <Input placeholder="Enter job name" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                        <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                        <Form.Item name="dueDate" label="Due Date">
                            <DatePicker
                                style={{ width: '100%' }}
                                disabledDate={(d) => d.isBefore(form.getFieldValue('startDate'))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <Form.Item name="description" label="Description">
                            <TextArea rows={4} placeholder="Enter job description" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="assignedTo" label="Assigned To">
                            <Select placeholder="Select user to assign" allowClear showSearch={true}
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().includes(input.toLowerCase())
                                }>
                                {users.map((u) => (
                                    <Option key={u.USER_ID} value={u.USER_ID}>
                                        {u.NAME}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="status" label="Initial Status" rules={[{ required: true }]}>
                            <Select>
                                <Option value="PENDING">Pending</Option>
                                <Option value="IN_PROGRESS">In Progress</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Sub Jobs (Optional)</Divider>

                <Form.List name="subJobs">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...rest }) => (
                                <div key={key} className="mb-6 p-4 border rounded">
                                    <div className="flex justify-between mb-4">
                                        <Row justify="space-between" align="middle" className="mb-4">
                                            <Col>
                                                <Title level={5}>Sub Job #{name + 1}</Title>
                                            </Col>
                                            <Col>
                                                <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                                            </Col>
                                        </Row>
                                    </div>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item {...rest} name={[name, 'name']} label="Sub Job Name" rules={[{ required: true }]}>
                                                <Input placeholder="Enter sub job name" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item {...rest} name={[name, 'assignedTo']} label="Assigned To">
                                                <Select placeholder="Select user to assign" allowClear
                                                    showSearch={true}
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                >
                                                    {users.map((u) => (
                                                        <Option key={u.USER_ID} value={u.USER_ID}>
                                                            {u.NAME}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                    </Row>
                                    <Row gutter={16}>
                                        <Col xs={24}>
                                            <Form.Item {...rest} name={[name, 'description']} label="Description">
                                                <TextArea rows={3} placeholder="Enter sub job description" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item {...rest} name={[name, 'startDate']} label="Start Date">
                                                <DatePicker style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item {...rest} name={[name, 'dueDate']} label="Due Date">
                                                <DatePicker style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                            <Form.Item>
                                <Button type="dashed" block icon={<PlusOutlined />} onClick={add}>
                                    Add Sub Job
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Divider />
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                            Create Job
                        </Button>
                        <Button icon={<RollbackOutlined />} onClick={() => navigate.push('/pm/jobs')}>
                            Cancel
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default CreateJob;
