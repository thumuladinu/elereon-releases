import React, { useRef, useState, useEffect } from "react";
import { Form, Input, DatePicker, Table, Checkbox, Select, Button, Tag, message, Row, Col } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";
import moment from "moment";
import Cookies from "js-cookie";

const { Option } = Select;

const initialCategories = [
    {
        name: "Main Category 1",
        subCategories: [
            { name: "Sub Category 1", check: false, spareParts: false, selector: "D&D" },
            { name: "Sub Category 2", check: false, spareParts: false, selector: "Agents" },
        ],
    },
    {
        name: "Main Category 2",
        subCategories: [
            { name: "Sub Category 1", check: false, spareParts: false, selector: "D&D" },
        ],
    },
];

const colorMap = {
    "D&D": "green",
    "Agents": "blue",
};

const tagRender = (props) => {
    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    return (
        <Tag
            color={colorMap[value] || "default"}
            onMouseDown={onPreventMouseDown}
            closable={closable}
            onClose={onClose}
            style={{ marginInlineEnd: 4 }}
        >
            {label}
        </Tag>
    );
};

const InspectionForm = () => {
    const printRef = useRef(null);
    const [form] = Form.useForm();
    const [categories, setCategories] = useState(initialCategories);
    const [creatorName, setCreatorName] = useState("NO User");

    useEffect(() => {
        let rememberedUser = Cookies.get("rememberedUser");

        if (!rememberedUser) {
            Cookies.remove("rememberedUser");
            window.location.href = "/";
        } else {
            rememberedUser = JSON.parse(rememberedUser);
            // if (rememberedUser.ROLE !== "ADMIN") {
            //     window.location.href = "/items";
            // }
            setCreatorName(rememberedUser.NAME);
            form.setFieldsValue({ createdName: rememberedUser.NAME });
        }
    }, [form]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current || null,
        documentTitle: "Inspection Report",
        onAfterPrint: () => message.success("Printed Successfully"),
    });

    const handleSelectorChange = (categoryIndex, subIndex, value) => {
        const newCategories = [...categories];
        newCategories[categoryIndex].subCategories[subIndex].selector = value;
        setCategories(newCategories);
    };

    const columns = (categoryIndex) => [
        {
            title: "Sub Category",
            dataIndex: "name",
            key: "name",
            render: (text) => <b style={{ color: "#333" }}>{text}</b>,
        },
        {
            title: "Check",
            dataIndex: "check",
            key: "check",
            render: (_, record) => <Checkbox />,
        },
        {
            title: "Spare Parts",
            dataIndex: "spareParts",
            key: "spareParts",
            render: (_, record) => <Checkbox />,
        },
        {
            title: "D&D/Agents",
            dataIndex: "selector",
            key: "selector",
            render: (_, record, subIndex) => (
                <Select
                    value={record.selector}
                    onChange={(value) => handleSelectorChange(categoryIndex, subIndex, value)}
                    style={{ width: 120 }}
                    dropdownStyle={{ padding: 5 }}
                >
                    {Object.keys(colorMap).map((option) => (
                        <Option key={option} value={option}>
                            <Tag color={colorMap[option]} style={{ marginRight: 5 }}>{option}</Tag>
                        </Option>
                    ))}
                </Select>
            ),
        },
    ];

    return (
        <div style={{ padding: 20, minHeight: "100vh", backgroundColor: "#f0f2f5" ,textAlign: "center"}}>
            <div
                ref={printRef}
                style={{
                    background: "white",
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    maxWidth: 1000,
                    margin: "auto",
                }}
            >
                <Form form={form} layout="vertical">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Customer Name" name="customerName">
                                <Input placeholder="Enter Customer Name" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Machine Model" name="machineModel">
                                <Input placeholder="Enter Machine Model" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Serial Number" name="serialNumber">
                                <Input placeholder="Enter Serial Number" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Inspection Date" name="inspectionDate">
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Created Date" name="createdDate">
                                <DatePicker defaultValue={moment()} style={{ width: "100%" }} disabled />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Created Name" name="createdName">
                                <Input value={creatorName} disabled />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                {categories.map((category, index) => (
                    <div key={index} style={{ marginTop: 20 }}>
                        <h3 style={{ background: "#722ed1", color: "white", padding: 10, borderRadius: 5, textAlign: "left" }}>
                            {category.name}
                        </h3>
                        <Table
                            columns={columns(index)}
                            dataSource={category.subCategories.map((sub, i) => ({ key: i, ...sub }))}
                            pagination={false}
                            bordered
                            scroll={{ x: true }}
                        />
                    </div>
                ))}
            </div>
            <Button
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                style={{ marginTop: 20, width: "100%", maxWidth: 1000, marginInline: "auto",textAlign: "center"}}
            >
                Generate PDF
            </Button>
        </div>
    );
};

export default InspectionForm;
