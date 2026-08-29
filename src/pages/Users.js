import React, { Component } from 'react';
import { Table, Switch, message, Card, Input } from 'antd';
import axios from 'axios';
import { UserOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { Redirect } from 'react-router-dom';

export default class SignUp extends Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            filteredUsers: [],
            loading: true,
            searchQuery: '',
        };
    }

    componentDidMount() {
        this.getUsers();
    }

    getUsers = async () => {
        console.log('Get users');
        try {
            const response = await axios.get('https://api.ddengineers.com/api/users');
            console.log('Users:', response.data.users);
            this.setState({ users: response.data.users, filteredUsers: response.data.users, loading: false });
        } catch (error) {
            console.error('Get users error:', error);
            message.error('Failed to get users');
        }
    };

    handleUserStatus = async (userId, status) => {
        let rememberedUser = Cookies.get('rememberedUser');
        let ROLE = null;

        if (rememberedUser) {
            rememberedUser = JSON.parse(rememberedUser);
            ROLE = rememberedUser.ROLE;
        }
        if (ROLE !== 'ADMIN') {
            message.error('You do not have permission to update user status');
            return;
        }

        try {
            const response = await axios.put(`https://api.ddengineers.com/api/users/${userId}`, { status });
            console.log('User status:', response.data);

            if (response.status === 200) {
                message.success('User status updated successfully');
                this.getUsers();
            } else {
                message.error('Failed to update user status');
            }
        } catch (error) {
            console.error('Update user status error:', error);
            message.error('Failed to update user status');
        }
    };

    // Search handler without debounce
    handleSearchChange = (e) => {
        const searchQuery = e.target.value.toLowerCase();
        this.setState({ searchQuery });

        // Filter users based on the search query (for name and email)
        const filteredUsers = this.state.users.filter(
            (user) =>
                (user.NAME && user.NAME.toLowerCase().includes(searchQuery)) || // Ensure NAME exists
                (user.EMAIL && user.EMAIL.toLowerCase().includes(searchQuery))   // Ensure EMAIL exists
        );
        this.setState({ filteredUsers });
    };

    render() {
        let rememberedUser = Cookies.get('rememberedUser');
        let ROLE = null;

        if (rememberedUser) {
            rememberedUser = JSON.parse(rememberedUser);
            ROLE = rememberedUser.ROLE;
        }

        if (ROLE !== 'ADMIN') {
            return <Redirect to="/" />;
        }

        const { filteredUsers, loading, searchQuery } = this.state;

        const columns = [
            {
                title: 'Name',
                dataIndex: 'NAME',
                key: 'name',
                render: (text, record) => (
                    <div>
                        <div className="user-info">
                            <UserOutlined />
                            <span>{text}</span>
                        </div>
                        <div className="user-info">
                            <span>{record.EMAIL}</span>
                        </div>
                    </div>
                ),
            },
            {
                title: 'Role',
                dataIndex: 'ROLE',
                key: 'role',
            },
            {
                title: 'Status',
                dataIndex: 'IS_ACTIVE',
                key: 'status',
                render: (text, record) => (
                    <Switch
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        checked={text === 1}
                        onChange={(checked) => this.handleUserStatus(record.USER_ID, checked ? 1 : 0)}
                    />
                ),
            },
        ];

        return (
            <Card title="Users" className="users-card">
                {/* Search Bar for Name and Email */}
                <Input
                    placeholder="Search by Name or Email"
                    value={searchQuery}
                    onChange={this.handleSearchChange}
                    style={{ marginBottom: 20 }}
                />
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    loading={loading}
                    pagination={false}
                    scroll={{ x: true }}
                />
            </Card>
        );
    }
}
