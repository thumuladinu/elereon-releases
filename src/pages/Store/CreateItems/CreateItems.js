/* eslint-disable */
import React, { Component } from "react";
import {
    Card,
    Row,
    Col,
    Form,
    InputNumber,
    Select,
    Upload,
    Button,
    message,
    Input,
    Modal
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import axios from "axios";
import { Redirect } from "react-router-dom";

const { Option } = Select;
const IMG_BB_API_KEY = "a94bb5679f1add2d50baee0220cc7926"; // ImgBB API Key

const getApiUrl = (endpoint) => {
    const base = process.env.REACT_APP_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://api.ddengineers.com');
    return `${base}${endpoint}`;
};

export default class CreateItems extends Component {
    constructor(props) {
        super(props);
        this.state = {
            imageUrl: "", // Store uploaded image URL or entered link
            uploading: false, // Handle upload loading state
            submitting: false, // Handle form submit state
            showSuccessModal: false,
            addedItem: null
        };
    }

    formRef = React.createRef();

    handleSubmit = async (values) => {
        console.log("Received values of form:", values);
        this.setState({ submitting: true });

        try {
            // Retrieve USER_ID from rememberedUser
            const rememberedUser = Cookies.get("rememberedUser");
            const USER_ID = rememberedUser ? JSON.parse(rememberedUser).USER_ID : null;

            const updatedValues = {
                ...values,
                IMAGE_LINK: this.state.imageUrl || null, // Store the uploaded or entered image URL
                STORED_PLACE: values.STORED_PLACE ? values.STORED_PLACE.toUpperCase() : '-',
                CREATED_BY: USER_ID,
                IS_ACTIVE: 1,
            };

            // Post item data
            let response;
            try {
                response = await axios.post(getApiUrl("/api/addItem"), updatedValues);
            } catch (postErr) {
                console.warn("Primary API failed, trying fallback...", postErr);
                response = await axios.post("https://api.ddengineers.com/api/addItem", updatedValues);
            }

            if (response.data && response.data.success) {
                message.success("Item Added Successfully!");

                this.setState({
                    showSuccessModal: true,
                    addedItem: updatedValues,
                    imageUrl: "",
                    submitting: false
                });

                if (this.formRef.current) {
                    this.formRef.current.resetFields();
                }
            } else {
                message.error(response.data?.message || "Failed to add item");
                this.setState({ submitting: false });
            }
        } catch (error) {
            console.error("Error adding item:", error);
            message.error("Failed to add item");
            this.setState({ submitting: false });
        }
    };

    handleImageUpload = async ({ file }) => {
        this.setState({ uploading: true });

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await axios.post(
                `https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`,
                formData
            );

            if (response.data.success) {
                const imageUrl = response.data.data.url;
                this.setState({ imageUrl, uploading: false });
                message.success("Image uploaded successfully!");
            } else {
                message.error("Image upload failed.");
                this.setState({ uploading: false });
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            message.error("Image upload failed.");
            this.setState({ uploading: false });
        }
    };

    handleImageLinkChange = (e) => {
        this.setState({ imageUrl: e.target.value });
    };

    handleInputChange = (e) => {
        e.target.value = e.target.value.toUpperCase(); // Convert input to uppercase
    };

    closeSuccessModal = () => {
        this.setState({ showSuccessModal: false, addedItem: null });
    };

    render() {
        const inputStyle = {
            width: "100%",
        };

        let rememberedUser = Cookies.get("rememberedUser");
        let ROLE = null;

        if (rememberedUser) {
            rememberedUser = JSON.parse(rememberedUser);
            ROLE = rememberedUser.ROLE;
        }

        if (ROLE === "USER_MILL") {
            return <Redirect to="/items" />;
        }

        const { addedItem } = this.state;

        return (
            <>
                <div className="tabled">
                    <Row gutter={[16, 16]} justify="left" align="top">
                        <Col xs="24" xl={24}>
                            <Card className="criclebox tablespace mb-24" title="Add New Item">
                                <Form
                                    layout="vertical"
                                    onFinish={this.handleSubmit}
                                    style={{ margin: "20px" }}
                                    ref={this.formRef}
                                >
                                    <Row gutter={[16, 16]} justify="left" align="top">
                                        <Col xs={24} sm={12} md={12} lg={6}>
                                            <Form.Item
                                                label="Name"
                                                name="NAME"
                                                rules={[{ required: true, message: "Please enter the name" }]}
                                            >
                                                <Input style={inputStyle} placeholder="Enter the name" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={12} lg={6}>
                                            <Form.Item
                                                label="Code"
                                                name="CODE"
                                                rules={[{ required: true, message: "Please enter the item code" }]}
                                            >
                                                <Input
                                                    style={inputStyle}
                                                    placeholder="Enter the code"
                                                    onInput={this.handleInputChange}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={12} lg={6}>
                                            <Form.Item label="Part Number" name="PART_NUMBER">
                                                <Input style={inputStyle} placeholder="Enter the part number" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={12} lg={6}>
                                            <Form.Item
                                                label="Price (Rs.)"
                                                name="PRICE"
                                            >
                                                <InputNumber style={inputStyle} step={0.01} placeholder="0.00" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={12} lg={6}>
                                            <Form.Item
                                                label="Stored Place"
                                                name="STORED_PLACE"
                                            >
                                                <Input
                                                    style={inputStyle}
                                                    placeholder="Enter stored place"
                                                    onInput={this.handleInputChange}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Image Preview */}
                                    {this.state.imageUrl && (
                                        <Row justify="left">
                                            <Col xs={24} sm={12} md={6} lg={6}>
                                                <img
                                                    src={this.state.imageUrl}
                                                    alt="Uploaded"
                                                    style={{ width: "100%", maxHeight: "180px", objectFit: "contain", marginBottom: "10px", borderRadius: "8px", border: "1px solid #d9d9d9" }}
                                                />
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Upload or Enter Image Link */}
                                    <Row gutter={[16, 16]} justify="left">
                                        <Col xs={24} sm={24} md={24} lg={24}>
                                            <Upload
                                                customRequest={this.handleImageUpload}
                                                showUploadList={false}
                                                accept="image/*"
                                            >
                                                <Button icon={<UploadOutlined />} loading={this.state.uploading}>
                                                    Upload Image
                                                </Button>
                                            </Upload>
                                        </Col>
                                        <Col xs={24} sm={24} md={24} lg={24}>
                                            <Form.Item label="Image Link">
                                                <Input
                                                    style={inputStyle}
                                                    placeholder="Paste image URL"
                                                    value={this.state.imageUrl}
                                                    onChange={this.handleImageLinkChange}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={[16, 16]} justify="left">
                                        <Col xs={24} sm={24} md={24} lg={12}>
                                            <Form.Item label="Description" name="DESCRIPTION">
                                                <Input.TextArea style={inputStyle} rows={3} placeholder="Enter description" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={[16, 16]} justify="left">
                                        <Col xs={24}>
                                            <Form.Item>
                                                <Button type="primary" htmlType="submit" loading={this.state.submitting}>
                                                    Add Item
                                                </Button>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* Controlled Success Modal */}
                <Modal
                    open={this.state.showSuccessModal}
                    title="Item Added Successfully!"
                    onOk={this.closeSuccessModal}
                    onCancel={this.closeSuccessModal}
                    okText="OK"
                    cancelButtonProps={{ style: { display: "none" } }}
                    centered
                >
                    {addedItem && (
                        <div style={{ marginTop: "12px", fontSize: "14px", lineHeight: "1.8" }}>
                            <div><strong>Item Name:</strong> {addedItem.NAME}</div>
                            <div><strong>Item Code:</strong> {addedItem.CODE}</div>
                            <div><strong>Part Number:</strong> {addedItem.PART_NUMBER || "-"}</div>
                            <div><strong>Price (Rs.):</strong> {addedItem.PRICE ? `Rs. ${Number(addedItem.PRICE).toFixed(2)}` : "Rs. 0.00"}</div>
                            <div><strong>Stored Place:</strong> {addedItem.STORED_PLACE || "-"}</div>
                        </div>
                    )}
                </Modal>
            </>
        );
    }
}
