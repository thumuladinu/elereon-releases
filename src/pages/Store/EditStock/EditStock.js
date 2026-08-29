import React, { Component } from 'react';
import {
    Button,
    Card,
    Col,
    Input,
    message,
    Modal,
    Popconfirm,
    Row,
    Tooltip,
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    QrcodeOutlined,
    CameraOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import UpdateEditStock from './UpdateEditStock';
import Cookies from 'js-cookie';
import { Redirect, withRouter } from 'react-router-dom';
import watermark from './watermark.png'; // Import your local watermark image
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library'; // <-- added

const { Meta } = Card;

class EditStock extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            tableData: [],
            searchText: '',
            isUpdateCustomerModalVisible: false,
            selectedCustomer: null,
            isImageModalVisible: false,
            isDetailedModalVisible: false,
            isCombinedModalVisible: false,
            isScannerVisible: false,
            scannerError: null,
            zoomLevel: 1,
            visibleItems: 12, // Start with 12 items
        };
        this.getAllItems = this.getAllItems.bind(this);
        this.detailsCardRef = React.createRef();
        this.scannerVideoRef = React.createRef();
        this.codeReader = null;

        this.formats = [BarcodeFormat.CODE_39];

        this.hints = new Map();
        this.hints.set(DecodeHintType.POSSIBLE_FORMATS, this.formats);
        this.hints.set(DecodeHintType.TRY_HARDER, true);
    }

    async componentDidMount() {
        this.getAllItems();
    }

    componentWillUnmount() {
        this.stopScanner();
    }

    // ===== SPEECH (NEW) =====
    speak = (text) => {
        try {
            if (!window.speechSynthesis || !text) return;
            // cancel any in-progress speech so messages don't overlap
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.rate = 1;     // 0.1 - 10
            utter.pitch = 1;    // 0 - 2
            utter.volume = 1;   // 0 - 1
            utter.lang = 'en-GB'; // change if needed: 'en-US', 'si-LK', 'ta-LK'
            window.speechSynthesis.speak(utter);
        } catch (e) {
            // silently ignore if speech fails
            console.warn('Speech synthesis failed:', e);
        }
    };

    speakStoredPlace = (item) => {
        const name = item?.NAME?.toString().trim() || 'Item';
        const place = item?.STORED_PLACE?.toString().trim() || 'Location not specified';
        const text = `${name}. Stored place: ${place}.`;
        this.speak(text);
    };
    // =========================

    handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        this.setState({ searchText: value, visibleItems: 12 }); // Reset visible items on search
    };

    handleUpdateShow(row) {
        this.setState({
            selectedCustomer: row,
            isUpdateCustomerModalVisible: true,
        });
    }

    handleDelete = async (Id) => {
        try {
            const response = await axios.post('https://api.ddengineers.com/api/deactivateItem', {
                ITEM_ID: Id,
            });

            if (response.data.success) {
                message.success('Item deleted successfully');
                await this.getAllItems();
            } else {
                message.error('Failed to delete Item');
            }
        } catch (error) {
            console.error('Error deleting Item:', error);
            message.error('Internal server error');
        }
    };

    async getAllItems() {
        this.setState({ loading: true });

        try {
            const response = await axios.post('https://api.ddengineers.com/api/getAllItems');

            if (response.data.success) {
                this.setState({
                    tableData: response.data.result,
                });
            } else {
                message.error('Failed to fetch items.');
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            message.error('Internal server error');
        } finally {
            this.setState({ loading: false });
        }
    }

    toggleUpdateCustomerModal = () => {
        this.setState({
            isUpdateCustomerModalVisible: !this.state.isUpdateCustomerModalVisible,
        });
    };

    handleCardClick = (item) => {
        this.setState({
            selectedCustomer: item,
            isImageModalVisible: true,
            zoomLevel: 1, // Reset zoom when opening a new image
        });
    };

    handleShowDetails = (item) => {
        this.setState({
            selectedCustomer: item,
            isDetailedModalVisible: true,
        });
    }

    openCombinedModal = (item) => {
        this.setState({
            selectedCustomer: item,
            isCombinedModalVisible: true,
        });
    }

    closeModal = () => {
        this.setState({
            isImageModalVisible: false,
            isDetailedModalVisible: false,
            isCombinedModalVisible: false,
            selectedCustomer: null,
        });
    };

    zoomIn = () => {
        this.setState((prevState) => ({
            zoomLevel: Math.min(prevState.zoomLevel + 0.2, 2), // Max zoom 2x
        }));
    };

    zoomOut = () => {
        this.setState((prevState) => ({
            zoomLevel: Math.max(prevState.zoomLevel - 0.2, 1), // Min zoom 1x
        }));
    };

    loadMore = () => {
        this.setState((prevState) => ({
            visibleItems: prevState.visibleItems + 12, // Show 12 more items on each click
        }));
    };

    // ===== BARCODE SCANNING =====
    startScanner = async () => {
        try {
            this.setState({ scannerError: null });

            // Create reader with hints
            if (!this.codeReader) {
                this.codeReader = new BrowserMultiFormatReader(this.hints);
            }

            // Prefer back camera if possible
            const devices = await BrowserMultiFormatReader.listVideoInputDevices();
            if (!devices || devices.length === 0) {
                this.setState({ scannerError: 'No camera found.' });
                return;
            }
            const rear = devices.find(d => /back|rear|environment/i.test(d.label));
            const deviceId = (rear && rear.deviceId) || devices[0].deviceId;

            // Higher resolution constraints
            const constraints = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: { ideal: 'environment' },
                },
                audio: false,
            };

            await this.codeReader.decodeFromConstraints(
                constraints,
                this.scannerVideoRef.current,
                (result, err, controls) => {
                    if (result) {
                        const text = result.getText();
                        console.log('📦 Scanned barcode value:', text);
                        this.onScanSuccess(text);
                        controls.stop();
                        this.stopScanner();
                        this.setState({ isScannerVisible: false });
                    } else if (err) {
                        // Uncomment for debug logs:
                        // console.debug('No decode yet:', err?.name || err);
                    }
                }
            );
        } catch (e) {
            console.error(e);
            this.setState({
                scannerError: 'Unable to start camera. Check permissions/HTTPS.',
            });
        }
    };

    stopScanner = () => {
        try {
            if (this.codeReader) {
                this.codeReader.reset();
                this.codeReader = null;
            }
        } catch (_) { }
    };

    onScanSuccess = (barcodeValue) => {
        const { tableData } = this.state;

        // normalize helper: remove spaces & non-alphanumerics, lowercase
        const norm = (t) =>
            (t || '')
                .toString()
                .replace(/\s+/g, '')
                .replace(/[^a-zA-Z0-9]/g, '')
                .toLowerCase();

        const val = norm(barcodeValue);

        // match scanned barcode strictly to CODE (optionally also PART_NUMBER — keep if you want)
        const found = tableData.find((i) => {
            const code = norm(i.CODE);
            // const part = norm(i.PART_NUMBER); // <- uncomment to allow matching to part number too
            return val && (val === code /* || val === part */);
        });

        if (found) {
            this.speakStoredPlace(found);
            this.openCombinedModal(found);
        } else {
            message.warning(`No item found for: ${barcodeValue}`);
        }
    };


    render() {
        let rememberedUser = Cookies.get('rememberedUser');
        let ROLE = null;

        if (rememberedUser) {
            rememberedUser = JSON.parse(rememberedUser);
            ROLE = rememberedUser.ROLE;
        }

        const { tableData, searchText, loading, isImageModalVisible, selectedCustomer, zoomLevel, visibleItems } = this.state;

        // Prevents null errors by ensuring all values are strings
        const displayData = tableData.filter((item) => {
            // Normalize both the search text and the item values by removing spaces and unnecessary characters
            const normalizeText = (text) => {
                return text
                    ? text.toString()
                        .replace(/\s+/g, '')         // Remove all spaces
                        .replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric characters
                        .toLowerCase()
                    : '';
            };

            const normalizedSearchText = normalizeText(searchText);

            // Perform the search (now includes BARCODE)
            return (
                normalizeText(item.CODE).includes(normalizedSearchText) ||
                normalizeText(item.NAME).includes(normalizedSearchText) ||
                normalizeText(item.PART_NUMBER).includes(normalizedSearchText)
            );
        });

        return (
            <>
                <div className="tabled">
                    <div style={{ position: 'sticky', top: 15, zIndex: 99, background: '#fff', padding: '10px 0' }}>
                        <Row gutter={[16, 16]} justify="space-between" align="middle">
                            <Col xs={24} sm={18}>
                                <Input
                                    placeholder="Search by Name, Code or Part Number"
                                    onChange={this.handleSearch}
                                    allowClear
                                    style={{ width: '100%' }}
                                />
                            </Col>
                            <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
                                <Button
                                    icon={<QrcodeOutlined />}
                                    onClick={() => this.setState({ isScannerVisible: true }, this.startScanner)}
                                >
                                    Scan Barcode
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        {loading ? (
                            <p>Loading items...</p>
                        ) : displayData.length === 0 ? (
                            <p>No items available.</p>
                        ) : (
                            displayData.slice(0, visibleItems).map((item) => (
                                <div
                                    key={item.ITEM_ID}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '10px',
                                        paddingRight: '12px',
                                        background: '#fff',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        height: '200px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Fixed Image Section */}
                                    <div
                                        style={{
                                            width: '100px',
                                            height: '100%',
                                            flexShrink: 0,
                                            marginRight: '20px',
                                            overflow: 'hidden',
                                            borderRadius: '8px 0 0 8px',
                                            position: 'relative',
                                        }}
                                    >
                                        <img
                                            alt={item.NAME}
                                            src={item.IMAGE_LINK || 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg'}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                            onClick={() => this.handleCardClick(item)}
                                        />
                                    </div>

                                    {/* Content Section */}
                                    <div
                                        style={{
                                            position: 'relative',
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            minWidth: 0,
                                        }}
                                        onClick={() => this.openCombinedModal(item)}
                                    >
                                        {/* Watermark */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundImage: `url(${watermark})`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'center',
                                                backgroundSize: 'contain',
                                                opacity: 0.04,
                                                zIndex: 1,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                        {/* Content */}
                                        <div style={{ position: 'relative', zIndex: 2 }}>
                                            <div style={{ marginTop: '8px' }}>
                                                {/* Title - Max 2 lines */}
                                                <h3
                                                    style={{
                                                        fontSize: '15px',
                                                        fontWeight: 'bold',
                                                        margin: 0,
                                                        color: '#333',
                                                        display: '-webkit-box',
                                                        WebkitBoxOrient: 'vertical',
                                                        WebkitLineClamp: 2,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {item.NAME}
                                                </h3>

                                                {/* Stored Place - Max 1 line */}
                                                <p
                                                    style={{
                                                        fontSize: '15px',
                                                        color: '#FF6347',
                                                        fontWeight: 'bold',
                                                        margin: '4px 0',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {item.STORED_PLACE || 'Location not specified'}
                                                </p>
                                            </div>

                                            {(ROLE === 'ADMIN' || ROLE === 'USER' || ROLE === 'OFFICE') ? (
                                                <div style={{ marginBottom: '3px' }}>
                                                    <span
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            color: '#333',
                                                        }}
                                                    >
                                                        Rs. {Number(item.PRICE || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    </span>
                                                </div>
                                            ) : null}

                                            {/* Item Code - Max 1 line */}
                                            <div style={{ marginTop: '0px' }}>
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#888',
                                                        margin: '0',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    <strong>Code:</strong> {item.CODE}
                                                </p>
                                            </div>

                                            {/* Part Number - Max 1 line */}
                                            <div style={{ marginTop: '0px' }}>
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#888',
                                                        margin: '0',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    <strong>Part No:</strong> {item.PART_NUMBER}
                                                </p>
                                            </div>


                                        </div>
                                    </div>

                                    {/* Admin Actions (Edit/Delete) */}
                                    <div
                                        style={{
                                            marginLeft: '15px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {ROLE === 'ADMIN' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                {/* Edit Button */}
                                                <Tooltip title="Edit">
                                                    <Button
                                                        type="default"
                                                        icon={<EditOutlined />}
                                                        size={'large'}
                                                        style={{
                                                            marginBottom: '10px',
                                                            borderRadius: '8px',
                                                            paddingLeft: '3px',
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            this.handleUpdateShow(item);
                                                        }}
                                                    />
                                                </Tooltip>

                                                {/* Delete Button */}
                                                <Tooltip title="Delete">
                                                    <Popconfirm
                                                        title="Are you sure you want to delete this item?"
                                                        onConfirm={(e) => {
                                                            e.stopPropagation();
                                                            this.handleDelete(item.ITEM_ID);
                                                        }}
                                                        onCancel={(e) => e.stopPropagation()}
                                                        okText="Yes"
                                                        cancelText="No"
                                                        placement="topRight"
                                                    >
                                                        <Button
                                                            type="default"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            size={'large'}
                                                            style={{
                                                                borderRadius: '8px',
                                                                paddingLeft: '3px',
                                                            }}
                                                        />
                                                    </Popconfirm>
                                                </Tooltip>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {visibleItems < displayData.length && (
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <Button type="primary" onClick={this.loadMore}>Load More</Button>
                        </div>
                    )}
                </div>

                {/* Hidden Share Card for Image Only */}
                {this.state.selectedCustomer && (
                    <div
                        ref={(ref) => { this.imageShareRef = ref; }}
                        style={{
                            position: 'absolute',
                            top: '-9999px',
                            left: '-9999px',
                            width: '500px',
                            height: '500px',
                            background: 'white',
                            padding: '10px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Watermark */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `url(${watermark})`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundSize: 'contain',
                                opacity: 0.2,
                                zIndex: 1,
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Image */}
                        <img
                            crossOrigin="anonymous"
                            src={this.state.selectedCustomer.IMAGE_LINK || 'https://via.placeholder.com/400'}
                            alt={this.state.selectedCustomer.NAME}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                position: 'relative',
                                zIndex: 2,
                            }}
                        />
                    </div>
                )}

                {/* Hidden Share Card for Screenshot (with image + watermark) */}
                {this.state.selectedCustomer && (
                    <div
                        ref={this.detailsCardRef}
                        style={{
                            position: 'absolute',
                            top: '-9999px',
                            left: '-9999px',
                            width: '600px',
                            background: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                        }}
                    >
                        {/* Watermark */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `url(${watermark})`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundSize: 'contain',
                                opacity: 0.1,
                                zIndex: 1,
                                pointerEvents: 'none',
                            }}
                        />

                        <div style={{ position: 'relative', zIndex: 2 }}>
                            {/* Image */}
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <img
                                    crossOrigin="anonymous"
                                    src={this.state.selectedCustomer.IMAGE_LINK || 'https://via.placeholder.com/400'}
                                    alt={this.state.selectedCustomer.NAME}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        border: '1px solid #eee',
                                    }}
                                />
                            </div>

                            {/* Text Info */}
                            <p style={{ fontSize: '1.8em', wordBreak: 'break-word' }}>
                                <strong>Name:</strong> {this.state.selectedCustomer.NAME}
                            </p>
                            <p style={{ fontSize: '1.4em', wordBreak: 'break-word' }}>
                                <strong>Stored Place:</strong> {this.state.selectedCustomer.STORED_PLACE}
                            </p>
                            <p style={{ fontSize: '1.4em', wordBreak: 'break-word' }}>
                                <strong>Code:</strong> {this.state.selectedCustomer.CODE}
                            </p>
                            <p style={{ fontSize: '1.4em', wordBreak: 'break-word' }}>
                                <strong>Part Number:</strong> {this.state.selectedCustomer.PART_NUMBER}
                            </p>
                            {/* <p style={{ fontSize: '1.4em', wordBreak: 'break-word' }}>
                                <strong>Barcode:</strong> {this.state.selectedCustomer.BARCODE || '—'}
                            </p> */}
                            {(ROLE === 'ADMIN' || ROLE === 'USER' || ROLE === 'OFFICE') && (
                                <p style={{ fontSize: '1.4em' }}>
                                    <strong>Price:</strong> Rs. {Number(this.state.selectedCustomer.PRICE || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                </p>
                            )}
                            <p style={{ fontSize: '1.4em', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                <strong>Description:</strong> {this.state.selectedCustomer.DESCRIPTION}
                            </p>
                        </div>
                    </div>
                )}

                {/* Image Modal (kept) */}
                <Modal
                    title={selectedCustomer?.NAME}
                    visible={isImageModalVisible}
                    onCancel={this.closeModal}
                    footer={null}
                    width={600}
                >
                    {selectedCustomer && (
                        <div style={{ textAlign: 'center' }}>
                            <img
                                alt={selectedCustomer.NAME}
                                src={selectedCustomer.IMAGE_LINK || 'https://via.placeholder.com/400'}
                                style={{
                                    width: `${zoomLevel * 100}%`,
                                    transition: 'transform 0.2s ease-in-out',
                                    cursor: 'zoom-in',
                                }}
                            />
                            <div style={{ marginTop: '15px' }}>
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        const html2canvas = (await import('html2canvas')).default;

                                        const element = this.imageShareRef;
                                        if (!element) {
                                            message.error('Image card not ready for sharing.');
                                            return;
                                        }

                                        const canvas = await html2canvas(element, {
                                            backgroundColor: '#ffffff',
                                            useCORS: true,
                                        });

                                        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
                                        const file = new File([blob], 'item-image.png', { type: 'image/png' });

                                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                            try {
                                                await navigator.share({
                                                    title: 'Item Image',
                                                    text: `Check out this item image: ${selectedCustomer.NAME}`,
                                                    files: [file],
                                                });
                                            } catch (err) {
                                                console.error('Sharing failed:', err);
                                            }
                                        } else {
                                            // Fallback: download the image
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = 'item-image.png';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }
                                    }}
                                >
                                    Share
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Combined Item Modal (Image + Details) */}
                <Modal
                    visible={this.state.isCombinedModalVisible}
                    onCancel={this.closeModal}
                    footer={null}
                    width={650}
                    bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
                >
                    {this.state.selectedCustomer && (
                        <div style={{ position: 'relative' }}>
                            {/* Watermark for visible modal */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundImage: `url(${watermark})`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    backgroundSize: 'contain',
                                    opacity: 0.04,
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                }}
                            />

                            <Card style={{ background: 'transparent', position: 'relative', zIndex: 2 }}>
                                {/* Image */}
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    <img
                                        crossOrigin="anonymous"
                                        src={this.state.selectedCustomer.IMAGE_LINK || 'https://via.placeholder.com/400'}
                                        alt={this.state.selectedCustomer.NAME}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '300px',
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            border: '1px solid #eee',
                                        }}
                                    />
                                </div>

                                {/* Details */}
                                <p style={{ fontSize: '2em', wordBreak: 'break-word' }}>
                                    <strong>Name:</strong> {this.state.selectedCustomer.NAME}
                                </p>
                                <p style={{ fontSize: '1.5em', wordBreak: 'break-word' }}>
                                    <strong>Stored Place:</strong> {this.state.selectedCustomer.STORED_PLACE}
                                </p>
                                <p style={{ fontSize: '1.5em', wordBreak: 'break-word' }}>
                                    <strong>Code:</strong> {this.state.selectedCustomer.CODE}
                                </p>
                                <p style={{ fontSize: '1.5em', wordBreak: 'break-word' }}>
                                    <strong>Part Number:</strong> {this.state.selectedCustomer.PART_NUMBER}
                                </p>
                                {/* <p style={{ fontSize: '1.5em', wordBreak: 'break-word' }}>
                                    <strong>Barcode:</strong> {this.state.selectedCustomer.BARCODE || '—'}
                                </p> */}
                                {(ROLE === 'ADMIN' || ROLE === 'USER' || ROLE === 'OFFICE') && (
                                    <p style={{ fontSize: '1.5em' }}>
                                        <strong>Price:</strong> Rs. {Number(this.state.selectedCustomer.PRICE || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </p>
                                )}
                                <p style={{ fontSize: '1.5em', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                    <strong>Description:</strong> {this.state.selectedCustomer.DESCRIPTION}
                                </p>
                            </Card>

                            {/* Share Button */}
                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        const html2canvas = (await import('html2canvas')).default;

                                        const element = this.detailsCardRef.current;
                                        if (!element) {
                                            message.error('Share card is not ready.');
                                            return;
                                        }

                                        const canvas = await html2canvas(element, {
                                            backgroundColor: '#ffffff',
                                            useCORS: true,
                                        });

                                        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
                                        const file = new File([blob], 'item-details.png', { type: 'image/png' });

                                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                            try {
                                                await navigator.share({
                                                    title: 'Item Details',
                                                    text: `Check out this item: ${this.state.selectedCustomer.NAME}`,
                                                    files: [file],
                                                });
                                            } catch (err) {
                                                console.error('Sharing failed:', err);
                                            }
                                        } else {
                                            // Desktop fallback
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = 'item-details.png';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }
                                    }}
                                >
                                    Share Item Card
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* SCANNER MODAL */}
                <Modal
                    title="Scan a barcode"
                    visible={this.state.isScannerVisible}
                    onCancel={() => { this.stopScanner(); this.setState({ isScannerVisible: false }); }}
                    footer={null}
                    width={500}
                >
                    <div style={{ textAlign: 'center' }}>
                        <video
                            ref={this.scannerVideoRef}
                            style={{ width: '100%', maxHeight: 360, background: '#000', borderRadius: 8 }}
                            muted
                            playsInline
                            autoPlay
                        />
                        {this.state.scannerError && (
                            <p style={{ color: 'tomato', marginTop: 8 }}>{this.state.scannerError}</p>
                        )}
                        <div style={{ marginTop: 12 }}>
                            <Button onClick={this.startScanner} icon={<CameraOutlined />}>Restart Camera</Button>
                        </div>
                    </div>
                </Modal>

                {/* Update Item Modal */}
                <Modal
                    title="Update Item"
                    visible={this.state.isUpdateCustomerModalVisible}
                    onCancel={this.toggleUpdateCustomerModal}
                    footer={null}
                    width={1100}
                >
                    {this.state.selectedCustomer && (
                        <UpdateEditStock
                            key={this.state.selectedCustomer.ITEM_ID}
                            initialValues={this.state.selectedCustomer}
                            onUpdate={this.getAllItems}
                            onCancel={this.toggleUpdateCustomerModal}
                        />
                    )}
                </Modal>
            </>
        );
    }
}

export default withRouter(EditStock);
