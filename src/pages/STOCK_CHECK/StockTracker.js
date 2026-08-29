import React, { useEffect, useState } from 'react';
import {
    Button, InputNumber, Form, message, Upload, Table, Typography,
    Tag, Select, Row, Col, Input, Space, DatePicker
} from 'antd';
import { UploadOutlined, SaveOutlined, PlusCircleOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import axios from 'axios';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';


const { Title } = Typography;
const { Option } = Select;

const ITEMS_PER_PAGE = 5;
const INITIAL_BATCH = 15;
const BATCH_STEP = 5;
const todayStr = dayjs().format('YYYY-MM-DD');

/* helper */
const filled = rows => rows.every(r => r.real_stock !== null && r.real_stock !== undefined);
// const disableOld = c => c < dayjs().subtract(3, 'day') || c > dayjs();
const disableOld = c => c < dayjs().subtract(4, 'day') || c > dayjs();

export default function StockTracker() {
    /* role from cookie */
    let roleCookie = 'USER';
    try { const raw = Cookies.get('rememberedUser'); if (raw) roleCookie = JSON.parse(raw).ROLE; } catch { }

    /* state */
    const [role, setRole] = useState(roleCookie);
    const [rows, setRows] = useState([]);
    const [batch, setBatch] = useState(INITIAL_BATCH);
    const [page, setPage] = useState(0);                 // only for STOCK_UPDATER
    const [selDate, setDate] = useState(todayStr);

    const [qbUploaded, setUp] = useState(false);
    const [qbEditable, setEdit] = useState(false);
    const [audit, setAudit] = useState({});
    const [dirty, setDirty] = useState({});
    const [adminPage, setAdminPage] = useState(0);      // ← new

    const dateKeys = React.useMemo(
        () => Object.keys(audit).sort((a, b) => new Date(b) - new Date(a)),   // newest first
        [audit]
    );
    const currentDate = dateKeys[adminPage] || null;

    const sortAuditRows = list => {
        const score = r => {
            if (r.real_stock != null && r.qb_stock != null) return 0;   // both
            if (r.real_stock != null) return 1;                         // only real
            if (r.qb_stock != null) return 2;                         // only qb
            return 3;                                                   // neither
        };
        return [...list].sort((a, b) => score(a) - score(b));
    };


    /* helpers */
    const setField = (id, f, v) =>
        setRows(p => p.map(r => (r.id === id ? { ...r, [f]: v } : r)));

    const sortMissingFirst = list =>
        [...list].sort((a, b) => {
            const aEmpty = a.real_stock === null || a.real_stock === undefined;
            const bEmpty = b.real_stock === null || b.real_stock === undefined;
            return aEmpty === bEmpty ? 0 : aEmpty ? -1 : 1;
        });

    const fetchDay = async (limit = batch, d = selDate) => {
        if (role === 'OFFICE') {
            const { data } = await axios.get(`https://api.ddengineers.com/api/today-items?onlyReal=1&date=${d}`);
            setRows(data);
        } else {
            const { data } = await axios.get(`https://api.ddengineers.com/api/today-items?limit=${limit}&date=${d}`);
            setRows(role === 'STOCK_UPDATER' ? sortMissingFirst(data) : data);
        }
        setPage(0);
    };


    const refreshStatus = async (d = selDate) => {
        const { data } = await axios.get(`https://api.ddengineers.com/api/qb-upload-status?date=${d}`);
        setUp(data.uploaded); setEdit(data.editable);
    };

    /* initial / deps */
    useEffect(() => {
        if (role === 'ADMIN') {
            axios.get('https://api.ddengineers.com/api/audit').then(res => setAudit(res.data));
        } else {
            fetchDay();
            refreshStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, batch, selDate]);

    /* STOCK_UPDATER save helper (returns promise) */
    const saveReal = () =>
        axios.post('https://api.ddengineers.com/api/update-real-stocks',
            rows.map(({ id, real_stock }) => ({ id, real_stock }))
        ).then(() => {
            message.success('Saved');
            setRows(sortMissingFirst(rows));   // resort so blanks move to front
            setPage(0);
        });

    /* Load‑more now awaits save first */
    const loadMore = async () => {
        try {
            await saveReal();                               // 1) persist current values
            await axios.get(`https://api.ddengineers.com/api/load-more-items?date=${todayStr}`); // 2) ask backend
            setBatch(b => b + BATCH_STEP);                  // triggers effect to refetch
        } catch {
            message.error('Could not load more');
        }
    };

    /* QB upload & lock (OFFICE) */
    const uploadProps = {
        name: 'file', showUploadList: false,
        customRequest: async ({ file, onSuccess, onError }) => {
            const fd = new FormData(); fd.append('file', file); fd.append('date', selDate);
            try {
                await axios.post('https://api.ddengineers.com/api/upload-qb', fd);
                await refreshStatus();          // update uploaded / editable flags
                await fetchDay();               // ⬅️  reload table so QB stocks appear
                message.success('QB uploaded');
                onSuccess('ok');
            } catch (e) {
                message.error('Upload error');
                onError(e);
            }

        }
    };

    const lockQB = () =>
        axios.post('https://api.ddengineers.com/api/submit-qb-stocks',
            rows.map(({ id, qb_stock }) => ({ id, qb_stock, date: selDate }))
        )
            .then(() => refreshStatus())
            .then(() => fetchDay())          // ⬅️  refresh table after lock
            .then(() => message.success('Locked'))
            .catch(() => message.error('Error'));


    /* save single remark */
    const saveRemark = id => {
        const remark = dirty[id]; if (remark === undefined) return;
        axios.post('https://api.ddengineers.com/api/save-remarks', [{ id, remark }])
            .then(() => {
                setDirty(d => { const n = { ...d }; delete n[id]; return n; });
                message.success('Remark saved');
            })
            .catch(() => message.error('Error'));
    };

    /* columns */
    const adminCols = [
        { title: 'Item', dataIndex: 'NAME', width: 180 },
        { title: 'Code', dataIndex: 'CODE', width: 110 },
        { title: 'Real', dataIndex: 'real_stock', width: 70 },
        { title: 'QB', dataIndex: 'qb_stock', width: 70 },
        {
            title: '∆', width: 60,
            render: (_, r) => {
                const d = (r.real_stock || 0) - (r.qb_stock || 0);
                return <Tag color={Math.abs(d) > 0 ? 'red' : 'blue'}>{d}</Tag>;
            }
        },
        // { title:'Miss', width:70,
        //     render:(_,r)=>!r.real_stock&&r.qb_stock!==null?<Tag color="orange">Missed</Tag>:null},
        {
            title: 'Remark',
            render: (_, r) => (
                <Space>
                    <Input size="small" style={{ width: 150 }} defaultValue={r.remark}
                        allowClear
                        onChange={e => {
                            setDirty(d => ({ ...d, [r.id]: e.target.value }));
                            setField(r.id, 'remark', e.target.value);
                        }} />
                    {dirty[r.id] !== undefined &&
                        <SaveOutlined onClick={() => saveRemark(r.id)} style={{ color: '#1890ff' }} />}
                </Space>)
        }
    ];

    const officeCols = [
        { title: 'Item', dataIndex: 'NAME' },
        { title: 'Code', dataIndex: 'CODE', width: 110 },
        {
            title: 'QB', width: 110,
            render: (_, r) => <InputNumber min={0} value={r.qb_stock} style={{ width: '100%' }}
                disabled={!qbEditable && r.qb_stock !== null}
                onChange={v => setField(r.id, 'qb_stock', v)} />
        },
        qbUploaded && !qbEditable && { title: 'Real', dataIndex: 'real_stock', width: 80 }
    ].filter(Boolean);

    /* pager helpers */
    const start = page * ITEMS_PER_PAGE;
    const visible = rows.slice(start, start + ITEMS_PER_PAGE);

    /* render */
    return (
        <div style={{ padding: 12 }}>
            {/* role & date selector */}
            <Row gutter={8} style={{ marginBottom: 12 }}>
                {/*<Col flex="none" style={{ fontWeight: 'bold' }}>Role:</Col>*/}
                {/*<Col flex="none">*/}
                {/*    <Select value={role} onChange={setRole} style={{ width: 180 }}>*/}
                {/*        <Option value="STOCK_UPDATER">STOCK_UPDATER</Option>*/}
                {/*        <Option value="OFFICE">OFFICE</Option>*/}
                {/*        <Option value="ADMIN">ADMIN</Option>*/}
                {/*    </Select>*/}
                {/*</Col>*/}
                {role === 'OFFICE' &&
                    <Col flex="none">
                        <DatePicker value={dayjs(selDate)} format="YYYY-MM-DD"
                            disabledDate={disableOld}
                            onChange={(_, str) => { setDate(str); setBatch(INITIAL_BATCH); }}
                        />
                    </Col>}
            </Row>

            {/* STOCK_UPDATER */}
            {role === 'STOCK_UPDATER' && (
                <>
                    <Form layout="vertical">
                        <Row gutter={[8, 8]}>
                            {visible.map(r => (
                                <Col xs={24} sm={24} md={24} lg={24} key={r.id}>
                                    <Form.Item
                                        label={
                                            <span>
                                                {r.CODE} – {r.NAME}
                                                {r.STORED_PLACE && (
                                                    <> | <span style={{ color: 'red' }}>{r.STORED_PLACE}</span></>
                                                )}
                                            </span>
                                        }
                                    >

                                        <InputNumber min={0} value={r.real_stock} style={{ width: '100%' }}
                                            onChange={v => setField(r.id, 'real_stock', v)} />
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    </Form>

                    <Row justify="center" gutter={8} style={{ marginTop: 12 }}>
                        <Col>
                            <Button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>Prev</Button>
                        </Col>
                        <Col>
                            <Button onClick={() => setPage(p => (p + 1) * ITEMS_PER_PAGE < rows.length ? p + 1 : p)}
                                disabled={(page + 1) * ITEMS_PER_PAGE >= rows.length}>Next</Button>
                        </Col>
                        {filled(rows) && rows.length >= batch &&
                            <Col>
                                <Button icon={<PlusCircleOutlined />} onClick={loadMore}>
                                    Save & Load 5 More
                                </Button>
                            </Col>}
                    </Row>
                    <Row justify="center" gutter={8} style={{ marginTop: 12 }}>
                        <Col>
                            <Button type="primary" onClick={saveReal}>Save</Button>
                        </Col>
                    </Row>
                </>
            )}

            {/* OFFICE */}
            {role === 'OFFICE' && (
                <>
                    <Row align="middle" gutter={8} style={{ marginBottom: 8 }}>
                        <Col>
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />}>Upload QB CSV</Button>
                            </Upload>
                        </Col>
                        <Col>
                            <Tag color={qbUploaded ? 'green' : 'red'}>
                                {qbUploaded ? 'Uploaded' : 'Not uploaded'}
                            </Tag>
                        </Col>
                        {qbUploaded && qbEditable &&
                            <Col><Button type="primary" onClick={lockQB}>Submit Final QB</Button></Col>}
                    </Row>

                    {rows.length
                        ? <Table columns={officeCols} dataSource={rows.map(r => ({ ...r, key: r.id }))}
                            pagination={false} scroll={{ x: true }} />
                        : <Tag color="orange">No rotation items for this date</Tag>}
                </>
            )}

            {/* ADMIN */}
            {/* -------------------- ADMIN view (paged) -------------------- */}
            {role === 'ADMIN' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                        <Button
                            type="primary"
                            onClick={async () => {
                                try {
                                    const { data } = await axios.get(
                                        'https://api.ddengineers.com/api/audit-export',
                                        { responseType: 'blob' }
                                    );
                                    saveAs(new Blob([data]), 'audit.xlsx');
                                } catch {
                                    message.error('Download failed');
                                }
                            }}
                        >
                            Download Excel
                        </Button>
                    </div>

                    {currentDate ? (
                        <>
                            <div style={{ marginBottom: 12, textAlign: 'center' }}>
                                <Button
                                    onClick={() => setAdminPage(p => Math.max(p - 1, 0))}
                                    disabled={adminPage === 0}
                                    style={{ marginRight: 8 }}
                                >
                                    Prev Day
                                </Button>
                                <Button
                                    onClick={() =>
                                        setAdminPage(p => (p + 1 < dateKeys.length ? p + 1 : p))
                                    }
                                    disabled={adminPage + 1 >= dateKeys.length}
                                >
                                    Next Day
                                </Button>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <Title level={4}>{new Date(currentDate).toDateString()}</Title>
                                <style>{`
        .row-mismatch {
            background-color: #fbd0d3 !important;
        }
    `}</style>

                                <Table
                                    columns={adminCols}
                                    dataSource={sortAuditRows(audit[currentDate])
                                        .filter(r => r.real_stock !== null && r.qb_stock !== null)
                                        .map(r => ({ ...r, key: r.id }))
                                    }
                                    pagination={false}
                                    scroll={{ x: true }}
                                    rowClassName={(record) =>
                                        record.real_stock !== null &&
                                            record.qb_stock !== null &&
                                            record.real_stock !== record.qb_stock
                                            ? 'row-mismatch'
                                            : ''
                                    }
                                />

                            </div>
                        </>
                    ) : (
                        <Tag color="orange">No audit data</Tag>
                    )}
                </>
            )}


        </div>
    );
}
