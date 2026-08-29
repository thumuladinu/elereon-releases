/* eslint-disable */

import React, { Component } from 'react';
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
import Cookies from "js-cookie";
import axios from "axios";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const IMG_BB_API_KEY = "a94bb5679f1add2d50baee0220cc7926";

class UpdateEditStock extends Component {
    constructor(props) {
        super(props);
        this.state = {
            imageUrl: this.props.initialValues.IMAGE_LINK || "",
            uploading: false,
        };
        this.formRef = React.createRef();
    }

    handleSubmit = async (values) => {
        try {
            let rememberedUser = Cookies.get('rememberedUser');
            let USER_ID = rememberedUser ? JSON.parse(rememberedUser).USER_ID : null;

            const checkName = {
                CODE: values.CODE,
                ITEM_ID: this.props.initialValues.ITEM_ID,
            };

            const checkDuplicateName = await axios.post('https://api.ddengineers.com/api/checkForDuplicateNameUpdate', checkName);

            if (checkDuplicateName.data.duplicate) {
                message.error('Item code already exists');
                return;
            }

            const mainData = {
                ...values,
                ITEM_ID: this.props.initialValues.ITEM_ID,
                IMAGE_LINK: this.state.imageUrl,
                STORED_PLACE: values.STORED_PLACE ? values.STORED_PLACE.toUpperCase() : '-',
            };

            const updateItem = await axios.post('https://api.ddengineers.com/api/updateItem', mainData);

            if (updateItem.data.success) {
                message.success('Item updated successfully');
                await this.props.onUpdate();
                this.props.onCancel();
            } else {
                message.error('Internal server error');
            }
        } catch (error) {
            console.error('Error updating item:', error);
            message.error('Internal server error');
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
                this.setState({ imageUrl: response.data.data.url, uploading: false });
                this.formRef.current.setFieldsValue({ IMAGE_LINK: this.state.imageUrl }); // Update image link in the form
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

    handleInputChange = (e) => {
        e.target.value = e.target.value.toUpperCase();
    };

    render() {
        const inputStyle = { width: '100%' };
        return (
            <div className="tabled">
                <Row gutter={[16, 16]} justify="left" align="top">
                    <Col xs="24" xl={24}>
                        <Card className="criclebox tablespace mb-24">
                            <Form
                                layout="vertical"
                                onFinish={this.handleSubmit}
                                style={{ margin: '20px' }}
                                ref={this.formRef}
                                initialValues={this.props.initialValues}
                            >
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12} md={12} lg={6}>
                                        <Form.Item label="Name" name="NAME" rules={[{ required: true, message: 'Please enter the name' }]}>
                                            <Input style={inputStyle} placeholder="Enter the name" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={12} lg={6}>
                                        <Form.Item label="Code" name="CODE" rules={[{ required: true, message: 'Please enter the item code' }]}>
                                            <Input style={inputStyle} placeholder="Enter the code" onInput={this.handleInputChange} />
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
                                        <Form.Item label="Part Number" name="PART_NUMBER">
                                            <Input style={inputStyle} placeholder="Enter the part number" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={12} lg={6}>
                                        <Form.Item label="Stored Place" name="STORED_PLACE">
                                            <Input style={inputStyle} placeholder="Enter stored place" onInput={this.handleInputChange} />
                                        </Form.Item>
                                    </Col>
                                    {/* <Col xs={24} sm={12} md={12} lg={6}>
                                    <Form.Item name="BARCODE" label="Barcode">
  <Input placeholder="e.g. 8901234567890" />
</Form.Item>
                                    </Col> */}
                                </Row>
                                <Row gutter={[16, 16]}>
                                    {this.state.imageUrl && (
                                        <Col xs={24} sm={12} md={6} lg={6}>
                                            <img src={this.state.imageUrl} alt="Uploaded" style={{ width: "100%", marginBottom: "10px" }} />
                                        </Col>
                                    )}
                                    <Col xs={24} sm={12} md={12} lg={6}>
                                        <Upload customRequest={this.handleImageUpload} showUploadList={false} accept="image/*">
                                            <Button icon={<UploadOutlined />} loading={this.state.uploading}> Upload Image </Button>
                                        </Upload>
                                    </Col>
                                    <Col xs={24} sm={12} md={12} lg={6}>
                                        <Form.Item label="Image Link" name="IMAGE_LINK">
                                            <Input style={inputStyle} placeholder="Enter image URL" value={this.state.imageUrl} onChange={(e) => this.setState({ imageUrl: e.target.value })} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={12} lg={6}>
                                        <Form.Item label="Description" name="DESCRIPTION">
                                            <Input.TextArea style={inputStyle} rows={4} placeholder="Enter description" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24}>
                                        <Form.Item>
                                            <Button type="primary" htmlType="submit"> Update Item </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default UpdateEditStock;
