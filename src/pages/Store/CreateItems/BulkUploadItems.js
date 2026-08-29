/* eslint-disable */
import React, { Component } from "react";
import {
    Card,
    Row,
    Col,
    Table,
    Button,
    Upload,
    message,
    Input,
    Popconfirm, Modal,
} from "antd";
import { UploadOutlined, DeleteOutlined, UndoOutlined } from "@ant-design/icons";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import axios from "axios";
import Cookies from 'js-cookie';
import "./BulkUploadItems.css"; // Import external CSS for styling

export default class BulkUploadItems extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableData: [], // Store uploaded data
            deletedRows: [], // Store up to 3 deleted rows for undo
        };
    }

    // Handle CSV/Excel file upload


    handleFileUpload = async ({ file }) => {
        const reader = new FileReader();


        // Detect file type based on file extension
        const fileExtension = file.name.split('.').pop().toLowerCase();
        console.log("fileExtension", fileExtension);

        reader.onload = async ({ target }) => {
            let parsedData = [];

            if (fileExtension === 'csv') {
                // Parse CSV data using PapaParse
                const csv = Papa.parse(target.result, { header: true, skipEmptyLines: true });

                // Trim column names
                const formattedData = csv.data.map(row => {
                    const trimmedRow = {};
                    Object.keys(row).forEach(key => {
                        trimmedRow[key.trim()] = row[key]; // Remove extra spaces from column names
                    });
                    return trimmedRow;
                });

                // Format and assign data
                parsedData = formattedData.map((row, index) => ({
                    key: index,
                    NAME: row.NAME || "",
                    CODE: row.CODE || "",
                    STORED_PLACE: row.STORED_PLACE ? row.STORED_PLACE.toUpperCase() : "",
                    PART_NUMBER: row.PART_NUMBER || "",
                    PRICE: isNaN(parseFloat(row["PRICE"])) ? 0 : parseFloat(row["PRICE"]).toFixed(2),
                    DESCRIPTION: row.DESCRIPTION || "",
                }));

            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {

                console.log("XLSX", XLSX);
                // Parse XLSX data using XLSX library
                const workbook = XLSX.read(target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0]; // Use the first sheet
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                // Convert data to an array of objects with trimmed column names
                const formattedData = data.slice(1).map(row => {
                    const trimmedRow = {};
                    data[0].forEach((header, index) => {
                        trimmedRow[header.trim()] = row[index] || ""; // Remove extra spaces from column names
                    });
                    return trimmedRow;
                });

                // Format and assign data
                parsedData = formattedData.map((row, index) => ({
                    key: index,
                    NAME: row.NAME || "",
                    CODE: row.CODE || "",
                    STORED_PLACE: row.STORED_PLACE ? row.STORED_PLACE.toUpperCase() : "",
                    PART_NUMBER: row.PART_NUMBER || "",
                    PRICE: isNaN(parseFloat(row["PRICE"])) ? 0 : parseFloat(row["PRICE"]).toFixed(2),
                    DESCRIPTION: row.DESCRIPTION || "",
                }));
            }

            // Set state with parsed data
            this.setState({ tableData: parsedData });
        };

        // Read the file as a binary string (for XLSX) or text (for CSV)
        if (fileExtension === 'csv') {
            reader.readAsText(file);  // For CSV files
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            reader.readAsBinaryString(file);  // For XLSX files
        }
    };


    // Handle cell editing
    handleCellChange = (key, dataIndex, value) => {
        const newData = [...this.state.tableData];
        const targetRow = newData.find((item) => item.key === key);
        if (targetRow) {
            targetRow[dataIndex] = value;
            this.setState({ tableData: newData });
        }
    };

    // Delete row from table & store it for undo
    handleDeleteRow = (key) => {
        const { tableData, deletedRows } = this.state;
        const rowToDelete = tableData.find((item) => item.key === key);
        const updatedData = tableData.filter((item) => item.key !== key);

        if (rowToDelete) {
            this.setState({
                tableData: updatedData,
                deletedRows: [rowToDelete, ...deletedRows].slice(0, 3), // Store max 3 rows for undo
            });
        }
    };

    // Undo last deleted row
    handleUndoDelete = () => {
        const { deletedRows, tableData } = this.state;
        if (deletedRows.length > 0) {
            const lastDeleted = deletedRows[0]; // Get the last deleted row
            this.setState({
                tableData: [lastDeleted, ...tableData], // Restore deleted row
                deletedRows: deletedRows.slice(1), // Remove restored row from undo list
            });
        }
    };

    // Submit the cleaned & edited data
    handleSubmit = async () => {
        const { tableData } = this.state;

        // Retrieve USER_ID from cookies
        let rememberedUser = Cookies.get("rememberedUser");
        let USER_ID = null;
        if (rememberedUser) {
            rememberedUser = JSON.parse(rememberedUser);
            USER_ID = rememberedUser.USER_ID;
        }
        if (!USER_ID) {
            message.error("User ID is missing. Please log in again.");
            return;
        }

        // Validate required fields (CODE and NAME)
        const hasInvalidRows = tableData.some(row => !row.CODE || !row.NAME);
        if (hasInvalidRows) {
            message.error("Please fill all required fields before submitting.");
            return;
        }

        // Append USER_ID to each item
        const updatedTableData = tableData.map(item => ({
            ...item,
            CREATED_BY: USER_ID,
        }));
        console.log("updatedTableData", updatedTableData);

        // Default mode is 'skip' (only insert new rows)
        let mode = 'skip';

        try {
            // Get existing data from backend
            const getResponse = await axios.post('https://api.ddengineers.com/api/getAllItems');
            if (getResponse.data.success) {
                const existingData = getResponse.data.result;
                console.log("existingData", existingData);
                // Identify duplicate items based on CODE
                const duplicateItems = updatedTableData.filter(newItem =>
                    existingData.find(item => item.CODE === newItem.CODE)
                );
                if (duplicateItems.length > 0) {
                    // Ask the user which action they want to perform when duplicates are detected.
                    // Option 1: "Insert Only" will skip duplicate rows.
                    // Option 2: "Update Duplicates" will update duplicate rows using new values.
                    mode = await new Promise((resolve) => {
                        Modal.confirm({
                            title: 'Duplicate Items Detected',
                            content: (
                                <div>
                                    <p>
                                        Duplicates were detected based on CODE.
                                        <br />
                                        <strong>Insert Only:</strong> Only new data will be added. Existing rows remain unchanged.
                                        <br />
                                        <strong>Update Duplicates:</strong> Only columns with provided values in the CSV will update existing rows (empty CSV fields keep the old data).
                                    </p>
                                </div>
                            ),
                            okText: 'Insert Only',
                            cancelText: 'Update Duplicates',
                            onOk() {
                                resolve('skip');
                            },
                            onCancel() {
                                resolve('update');
                            },
                        });
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching items:", error);
            message.error("Failed to fetch current items from the database.");
            return;
        }

        try {
            // Send the data along with the chosen mode to the backend
            const uploadResponse = await axios.post("https://api.ddengineers.com/api/bulkUploadItems", {
                data: updatedTableData,
                mode
            });
            if (uploadResponse.data.success) {
                message.success("Items processed successfully!");
                this.setState({ tableData: [] }); // Clear table after successful upload
            } else {
                message.error("Failed to process items.");
            }
        } catch (error) {
            console.error("Error uploading bulk items:", error);
            message.error("Failed to upload items.");
        }
    };



    render() {
        const { tableData, deletedRows } = this.state;

        const columns = [
            {
                title: "Item Name",
                dataIndex: "NAME",
                render: (text, record) => (
                    <Input
                        value={text}
                        onChange={(e) => this.handleCellChange(record.key, "NAME", e.target.value)}
                    />
                ),
            },
            {
                title: "Code",
                dataIndex: "CODE",
                render: (text, record) => (
                    <Input
                        value={text}
                        onChange={(e) => this.handleCellChange(record.key, "CODE", e.target.value)}
                    />
                ),
            },
            {
                title: "Stored Place",
                dataIndex: "STORED_PLACE",
                render: (text, record) => (
                    <Input
                        value={text}
                        onChange={(e) => this.handleCellChange(record.key, "STORED_PLACE", e.target.value.toUpperCase())}
                    />
                ),
            },
            {
                title: "Part Number",
                dataIndex: "PART_NUMBER",
                render: (text, record) => (
                    <Input
                        value={text}
                        onChange={(e) => this.handleCellChange(record.key, "PART_NUMBER", e.target.value)}
                    />
                ),
            },
            {
                title: "Price",
                dataIndex: "PRICE",
                render: (text, record) => (
                    <Input
                        type="number"
                        value={text}
                        onChange={(e) => this.handleCellChange(record.key, "PRICE", e.target.value)}
                    />
                ),
            },
            {
                title: "Description",
                dataIndex: "DESCRIPTION",
                render: (text, record) => (
                    <Input
                        value={text}
                        onChange={(e) => this.handleCellChange(record.key, "DESCRIPTION", e.target.value)}
                    />
                ),
            },
            {
                title: "Action",
                dataIndex: "action",
                render: (_, record) => (
                    <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDeleteRow(record.key)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                ),
            },
        ];

        return (
            <>
                <div className="tabled">
                    <Row gutter={[16, 16]} justify="left">
                        <Col xs={24}>
                            <Card title="Bulk Upload Items">
                                {/* Upload Button */}
                                <Upload
                                    customRequest={this.handleFileUpload}
                                    showUploadList={false}
                                    accept=".csv,.xlsx"
                                >
                                    <Button icon={<UploadOutlined />}>Upload CSV/Excel</Button>
                                </Upload>

                                {/* Undo Delete Button (Max 3 Undos) */}
                                {deletedRows.length > 0 && (
                                    <Button
                                        icon={<UndoOutlined />}
                                        onClick={this.handleUndoDelete}
                                        style={{ marginLeft: "10px" }}
                                        disabled={deletedRows.length === 0}
                                    >
                                        Undo ({deletedRows.length} Left)
                                    </Button>
                                )}


                                {/* Table Displaying Uploaded Data */}
                                {tableData.length > 0 && (
                                    <>
                                        <Table
                                            dataSource={tableData}
                                            columns={columns}
                                            pagination={{ pageSize: 10 }}
                                            rowClassName={(record) =>
                                                !record.CODE || !record.NAME ? "missing-data" : ""
                                            }
                                            style={{ marginTop: "20px" }}
                                        />
                                        <Button type="primary" onClick={this.handleSubmit} style={{ marginTop: "10px" }}>
                                            Submit All Items
                                        </Button>
                                    </>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </div>
            </>
        );
    }
}
