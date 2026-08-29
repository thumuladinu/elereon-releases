import React, { Component } from 'react';
import { Layout, Row, Col, Card, Input, Tag, Collapse, Modal, Button, Divider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import './ManageProject.css';
import Cookies from "js-cookie";

const { Content } = Layout;
const { Panel } = Collapse;

const dummyData = [
    {
        taskName: 'Task 1',
        company: 'Company A',
        plannedDate: '2025-02-20',
        assignedBy: 'John Doe',
        assignedTo: 'Jane Smith',
        status: 'completed',
    },
    {
        taskName: 'Task 2',
        company: 'Company B',
        plannedDate: '2025-02-21',
        assignedBy: 'Mike Ross',
        assignedTo: 'Rachel Zane',
        status: 'processing',
    },
    {
        taskName: 'Task 22',
        company: 'Company B',
        plannedDate: '2025-02-10',
        assignedBy: 'Mike Ross',
        assignedTo: 'Rachel Zane',
        status: 'processing',
    },
    {
        taskName: 'Task 25',
        company: 'Company B',
        plannedDate: '2025-02-10',
        assignedBy: 'Mike Ross',
        assignedTo: 'Rachel Zane',
        status: 'not-started',
    },
    {
        taskName: 'Task 3',
        company: 'Company C',
        plannedDate: '2025-02-22',
        assignedBy: 'Harvey Specter',
        assignedTo: 'Donna Paulsen',
        status: 'not-started',
    },
    {
        taskName: 'Task 4',
        company: 'Company D',
        plannedDate: '2025-02-18',
        assignedBy: 'Louis Litt',
        assignedTo: 'Gina Torres',
        status: 'hold',
    },
];

class ManageProject extends Component {
    state = {
        searchQuery: '',
        filteredTasks: dummyData,
        showModal: false,
        selectedTask: null,
    };

    handleSearch = (e) => {
        const searchQuery = e.target.value.toLowerCase();
        this.setState({
            searchQuery,
            filteredTasks: dummyData.filter(
                (task) =>
                    task.taskName.toLowerCase().includes(searchQuery) ||
                    task.company.toLowerCase().includes(searchQuery)
            ),
        });
    };

    openModal = (task) => {
        this.setState({
            showModal: true,
            selectedTask: task,
        });
    };

    closeModal = () => {
        this.setState({
            showModal: false,
            selectedTask: null,
        });
    };

    render() {
        let rememberedUser = Cookies.get('rememberedUser');
        let ROLE = null;

        if (rememberedUser) {
            rememberedUser = JSON.parse(rememberedUser);
            ROLE = rememberedUser.ROLE;
        }

        if (ROLE !== "ADMIN") {
            window.location.href = "/items";
        }
        const { filteredTasks, showModal, selectedTask } = this.state;
        const taskCategories = ['today', 'due', 'processing', 'not-started', 'completed'];

        // Initialize the categorizedTasks object
        const categorizedTasks = {
            today: [],
            due: [],
            processing: [],
            notStarted: [],
            completed: []
        };

        // Group tasks by status and date
        filteredTasks.forEach((task) => {
            const isToday = moment(task.plannedDate).isSame(moment(), 'day');
            const isDue = moment(task.plannedDate).isBefore(moment(), 'day') && task.status !== 'completed';

            if (isToday) {
                categorizedTasks.today.push(task);
            } else if (isDue) {
                categorizedTasks.due.push(task);
            } else {
                // Ensure the status category is initialized before pushing
                if (categorizedTasks[task.status]) {
                    categorizedTasks[task.status].push(task);
                }
            }
        });

        return (

            <Layout className="manage-project">
                <Content style={{ padding: '0px' }}>
                    {/* Search Bar */}
                    <Row justify="center">
                        <Col span={24} md={24} lg={24}>
                            <div className="search-bar">
                                <Input
                                    placeholder="Search tasks..."
                                    prefix={<SearchOutlined />}
                                    onChange={this.handleSearch}
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Task Sections with Collapsible View */}
                    <div className="task-sections">
                        {['today', 'due', 'processing', 'notStarted', 'completed'].map((status) => {
                            const tasksByStatus = categorizedTasks[status];
                            return (
                                <Collapse defaultActiveKey={taskCategories.map(status => status)} key={status}>
                                    <Panel header={this.capitalize(status) + ' Tasks'} key={status}>
                                        {tasksByStatus.length > 0 ? (
                                            tasksByStatus.map((task) => (
                                                <Card
                                                    key={task.taskName}
                                                    hoverable
                                                    style={{
                                                        marginBottom: '10px',
                                                        backgroundColor:
                                                            status === 'due' ? '#ffcccc' : '#fff',
                                                    }}
                                                    onClick={() => this.openModal(task)}
                                                    className="task-card"
                                                >
                                                    <Row justify="space-between" align="middle">
                                                        <Col span={12}>
                                                            <h4>{task.taskName}</h4>
                                                            <p>{task.company}</p>
                                                        </Col>
                                                        <Col span={12} style={{ textAlign: 'right' }}>
                                                            <Tag color={this.getStatusColor(task.status)}>
                                                                {this.capitalize(task.status)}
                                                            </Tag>
                                                            <p>{moment(task.plannedDate).format('MMM DD, YYYY')}</p>
                                                        </Col>
                                                    </Row>
                                                </Card>
                                            ))
                                        ) : (
                                            <p>No tasks available</p>
                                        )}
                                    </Panel>
                                </Collapse>
                            );
                        })}
                    </div>

                    {/* Task Detail Modal */}
                    <Modal
                        title="Task Details"
                        visible={showModal}
                        onCancel={this.closeModal}
                        footer={[
                            <Button key="close" onClick={this.closeModal}>
                                Close
                            </Button>,
                        ]}
                    >
                        {selectedTask && (
                            <div>
                                <p><strong>Task Name:</strong> {selectedTask.taskName}</p>
                                <p><strong>Company:</strong> {selectedTask.company}</p>
                                <p><strong>Planned Date:</strong> {moment(selectedTask.plannedDate).format('MMM DD, YYYY')}</p>
                                <p><strong>Assigned By:</strong> {selectedTask.assignedBy}</p>
                                <p><strong>Assigned To:</strong> {selectedTask.assignedTo}</p>
                                <Divider />
                                <p><strong>Status:</strong> {this.capitalize(selectedTask.status)}</p>
                            </div>
                        )}
                    </Modal>
                </Content>
            </Layout>
        );
    }


    // Helper functions
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
    }

    getStatusColor(status) {
        switch (status) {
            case 'completed':
                return 'green';
            case 'processing':
                return 'orange';
            case 'not-started':
                return 'red';
            case 'hold':
                return 'gray';
            default:
                return 'gray';
        }
    }
}

export default ManageProject;
