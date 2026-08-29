/* eslint-disable */
import React, { Component } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Descriptions,
  Avatar,
  Upload,
  Form,
  Input,
  message,
  Modal,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import axios from "axios";
import Password from "antd/es/input/Password";

class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isModalVisible: false,
      fileList: [],
      previewVisible: false,
      imgBBLink: "",
    };

    this.formRef = React.createRef();
  }

  showModal = () => {
    this.setState({ isModalVisible: true });
  };

  handleCancel = () => {
    this.setState({ isModalVisible: false });
  };

  handleFileChange = async ({ fileList }) => {
    try {
      this.setState({ fileList });

      if (fileList.length > 0) {
        const imgFile = fileList[0].originFileObj;

        if (imgFile) {
          const formData = new FormData();
          formData.append("image", imgFile);

          const response = await axios.post(
            "https://api.imgbb.com/1/upload",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              params: { key: "a94bb5679f1add2d50baee0220cc7926" },
            }
          );

          if (response.data.success) {
            this.setState({ imgBBLink: response.data.data.url });
            message.success("Image uploaded successfully");
          } else {
            message.error("Failed to upload Image");
          }
        }
      }
    } catch (error) {
      console.error("Error in handleFileChange:", error);
      message.error("Image upload failed.");
    }
  };

  handleSubmit = async (values) => {
    try {
      const { PASSWORD, OLD_PASSWORD } = values;
      if (PASSWORD && PASSWORD.length < 8) {
        message.error("Password should be at least 8 characters");
        return;
      }

      let rememberedUser = Cookies.get("rememberedUser");
      let USER_ID = null;
      let NAME = "";
      let PHOTO = "https://i.ibb.co/YySdxGJ/user-1.png";

      if (rememberedUser) {
        rememberedUser = JSON.parse(rememberedUser);
        USER_ID = rememberedUser.USER_ID;
        NAME = rememberedUser.NAME;
        PHOTO = rememberedUser.PHOTO;
      }

      const response = await axios.post("https://api.ddengineers.com/api/checkPassword", {
        USER_ID,
        PASSWORD: OLD_PASSWORD,
      });

      if (response.data.match) {
        const updatedValues = {
          PHOTO: this.state.imgBBLink || PHOTO,
          USER_ID,
          NAME: values.NAME || NAME,
          PASSWORD: PASSWORD || OLD_PASSWORD,
        };

        const updateResponse = await axios.post(
          "https://api.ddengineers.com/api/updateProfile",
          updatedValues
        );

        if (updateResponse.data.success) {
          message.success("Profile updated successfully");
          Cookies.remove("rememberedUser");
          window.location.href = "/";
        } else {
          message.error("Failed to update profile");
        }
      } else {
        message.error("Old password is incorrect");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Internal server error");
    }
  };

  render() {
    const { isModalVisible, fileList, previewVisible, imgBBLink } = this.state;

    let rememberedUser = Cookies.get("rememberedUser");
    let NAME = "";
    let PHOTO = "https://i.ibb.co/YySdxGJ/user-1.png";
    let EMAIL = "";
    let ROLE = "USER";

    if (rememberedUser) {
      rememberedUser = JSON.parse(rememberedUser);
      NAME = rememberedUser.NAME;
      PHOTO = rememberedUser.PHOTO;
      EMAIL = rememberedUser.EMAIL;
      ROLE = rememberedUser.ROLE;
    }

    return (
      <>
        {/* Header Section */}
        <Row justify="center" style={{ marginTop: "20px", textAlign: "center" }}>
          <Col>
            <Avatar
              size={90}
              src={PHOTO}
              style={{ cursor: "pointer" }}
              onClick={this.showModal}
            />
            <h2 style={{ marginTop: "10px" }}>{NAME}</h2>
            <p style={{ fontSize: "16px", color: "gray" }}>{ROLE}</p>
          </Col>
        </Row>

        {/* Profile Details Card */}
        <Row justify="center" style={{ marginTop: "20px" }}>
          <Col xs={24} sm={20} md={16} lg={12}>
            <Card bordered={false} title="Profile Information">
              <Descriptions>
                <Descriptions.Item label="Name" span={3}>
                  {NAME}
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={3}>
                  {EMAIL}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Profile Edit Form */}
        <Row justify="center" style={{ marginTop: "20px" }}>
          <Col xs={24} sm={20} md={16} lg={12}>
            <Card bordered={false} title="Update Profile">
              <Form layout="vertical" onFinish={this.handleSubmit}>
                <Form.Item name="NAME" label="New Name">
                  <Input placeholder="Enter new name" />
                </Form.Item>

                {/* Image Upload Section */}
                {imgBBLink && (
                  <Row justify="center">
                    <Col>
                      <img
                        src={imgBBLink}
                        alt="Uploaded"
                        style={{ width: "100px", marginBottom: "10px", borderRadius: "5px" }}
                      />
                    </Col>
                  </Row>
                )}
                <Form.Item label="Profile Picture">
                  <Upload
                    customRequest={({ onSuccess }) => onSuccess()}
                    fileList={fileList}
                    onChange={this.handleFileChange}
                    accept="image/*"
                    listType="picture-card"
                    showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                    maxCount={1}
                    onPreview={() => this.setState({ previewVisible: true })}
                  >
                    {fileList.length >= 1 ? null : (
                      <div>
                        <UploadOutlined />
                        <div className="ant-upload-text">Upload</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                {/* Password Section */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="PASSWORD" label="New Password">
                      <Password placeholder="Enter new password" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="OLD_PASSWORD"
                      label="Old Password"
                      rules={[{ required: true, message: "Please enter old password" }]}
                    >
                      <Password placeholder="Enter old password" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Update Profile
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>

        {/* Modal for Enlarged Image */}
        <Modal visible={isModalVisible} onCancel={this.handleCancel} footer={null} centered>
          <img src={PHOTO} alt="Enlarged" style={{ width: "100%" }} />
        </Modal>
      </>
    );
  }
}

export default Profile;
