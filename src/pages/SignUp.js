//eslint-disable
import React, { Component } from "react";
import { Card, Row, Col, Form, Input, Button, message, Upload, Modal, Select } from "antd";
import Password from "antd/es/input/Password";
import Cookies from "js-cookie";
import axios from "axios";
import { UploadOutlined } from "@ant-design/icons";

export default class SignUp extends Component {

  constructor(props) {
    super(props);

    this.state = {
      fileList2: [],  // For the second photo uploader
      previewVisible2: false,
      previewImage2: '',
      imgBBLink2: 'https://i.ibb.co/YySdxGJ/user-1.png',
    };

    this.formRef = React.createRef();
  }

  // componentDidMount() {
  //   let rememberedUser = Cookies.get('rememberedUser');
  //
  //   if (rememberedUser) {
  //     rememberedUser = JSON.parse(rememberedUser);
  //     const { ROLE } = rememberedUser;
  //       if (ROLE !== 'ADMIN') {
  //           window.location.href = '/items';
  //       }
  //
  //   }
  //   else{
  //     Cookies.remove('rememberedUser');
  //     window.location.href = '/';
  //   }
  // }


  handleFileChange = async ({ fileList }, uploaderNumber) => {
    try {
      this.setState({ [`fileList${uploaderNumber}`]: fileList, fileList: [] }); // Clear the general fileList

      if (fileList.length > 0) {
        const imgFile = fileList[0].originFileObj;

        if (imgFile) {
          const formData = new FormData();
          formData.append('image', imgFile);

          const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            params: {
              key: 'a94bb5679f1add2d50baee0220cc7926', // Replace with your ImgBB API key
            },
          });

          const imgBBLinkKey = `imgBBLink${uploaderNumber}`;
          this.setState({ [imgBBLinkKey]: response.data.data.url });
          //console.log('Image uploaded to ImgBB:', response.data.data.url);
          //show success message if response is success
          if (response.data.success) {
            message.success('Image uploaded successfully');
          }
          //show not success message if response is not success
          else {
            message.error('Failed to upload Image');
          }

          //console.log('this.state', this.state);
        }
      }
    } catch (error) {
      // Log the error to the console for debugging
      console.error('Error in handleFileChange:', error);

      // Handle specific errors if needed
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('ImgBB API Error:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from ImgBB API');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error in request setup:', error.message);
      }
    }
  };
  handleSubmit = async (values) => {
    try {
      const { EMAIL, USERNAME } = values;



      // Check if the email and username are already in use
      const checkResponse = await axios.post('https://api.ddengineers.com/api/checkEmailUsername', { EMAIL, USERNAME });

      if (checkResponse.data.used) {
        // Either email or username is already in use
        message.error('Email or username is already in use');
        return;
      }


      // Add IS_ACTIVE and CREATED_BY to the values object
      const updatedValues = {
        ...values,
        IS_ACTIVE: 0,
        PHOTO: this.state.imgBBLink2,
      };

      const response = await axios.post('https://api.ddengineers.com/api/addUser', updatedValues);

      if (response.data.success) {
        message.success('User added successfully');
        // Clear the form
        this.formRef.current.resetFields();
      } else {
        message.error('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      message.error('Internal server error');
    }
  };
  render() {
    const { fileList2 } = this.state;
    const fileLimit = {
      accept: 'image/*', // Accept only image files
    };
    return (
      <>
        <div className="tabled">
          <Row justify="center" style={{ marginTop: "20px" }}>
            <Col xs="24" xl={24}>
              <Card
                bordered={false}
                className="criclebox tablespace mb-24"
                title="Register New User For D&D Engineers"
              >
                <Form
                  layout="vertical"
                  onFinish={this.handleSubmit}
                  style={{ margin: '20px' }}
                  ref={this.formRef}
                >
                  <Row gutter={[16, 16]} justify="left" align="top">
                    <Col xs={24} sm={12} md={12} lg={12}>
                      <Form.Item
                        name="NAME"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter a name' }]}
                      >
                        <Input placeholder="Enter a name"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={24} md={24} lg={9}>
                      <Form.Item
                        name="ROLE"
                        label="Role"
                        initialValue="USER"
                        rules={[{ required: true, message: 'Please enter a role' }]}
                      >
                        <Select
                          placeholder="Select a role"

                        >
                          <Select.Option value="ADMIN">Admin</Select.Option>
                          <Select.Option value="USER">User</Select.Option>
                          <Select.Option value="USER2">User2</Select.Option>
                          <Select.Option value="MAIN_SUPERVISOR">Main Supervisor</Select.Option>
                          <Select.Option value="SUPERVISOR">Supervisor</Select.Option>
                          <Select.Option value="OFFICE">Office</Select.Option>
                          <Select.Option value="STOCK_UPDATER">Stock Updater</Select.Option>

                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={24} md={24} lg={3}>
                      {/* File Upload */}
                      <Form.Item
                        name="PHOTO"
                        label="Upload Photo"
                      >
                        <Upload
                          customRequest={({ onSuccess, onError, file }) => {
                            onSuccess();
                          }}
                          fileList={fileList2}
                          onChange={(info) => this.handleFileChange(info, 2)}
                          {...fileLimit}
                          listType="picture-card"
                          showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                          maxCount={1} // Allow only one file
                          onPreview={() => this.setState({ previewVisible2: true })}
                        >
                          {fileList2.length >= 1 ? null : (
                            <div>
                              <UploadOutlined />
                              <div className="ant-upload-text">Upload</div>
                            </div>
                          )}
                        </Upload>
                        {/* Display uploaded image */}
                        <div className="clearfix">
                          <Modal
                            visible={this.state.previewVisible2}
                            footer={null}
                            onCancel={() => this.setState({ previewVisible2: false })}
                          >
                            {this.state.imgBBLink2 === '' ? (
                              <div className="loading-indicator">Uploading...</div>
                            ) : (
                              <img
                                alt="Preview"
                                style={{ width: '100%' }}
                                src={this.state.imgBBLink2}
                                onError={(e) => {
                                  console.error('Image loading error:', e);
                                }}
                              />
                            )}
                          </Modal>
                        </div>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]} justify="left" align="top">
                    <Col xs={24} sm={12} md={12} lg={12}>
                      <Form.Item
                        name="USERNAME"
                        label="User Name"
                        rules={[{ required: true, message: 'Please enter a username' }]}
                      >
                        <Input placeholder="Enter a username" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={12}>
                      <Form.Item
                        name="PASSWORD"
                        label="Password"
                        rules={[{ required: true, message: 'Please enter a password' }, { min: 8, message: 'Password must be at least 8 characters' }]}
                      >
                        <Password
                          placeholder="Enter a Password"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]} justify="left" align="top">
                    <Col xs={24} sm={24} md={24} lg={24}>
                      <Form.Item
                        name="EMAIL"
                        label="Email Address"
                      // rules={[{ required: true, message: 'Please enter an email' }]}
                      >
                        <Input placeholder="Enter an email address" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]} justify="left" align="top">
                    <Col xs={24} sm={24} md={24} lg={24}>
                      <Form.Item>
                        <Button type="primary" htmlType="submit">
                          Register User
                        </Button>
                        {/*//home button to go back to home page*/}
                        <Button type="default" style={{ marginLeft: '10px' }} onClick={() => window.location.href = '/'}>
                          Home
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      </>
    );
  }
}
