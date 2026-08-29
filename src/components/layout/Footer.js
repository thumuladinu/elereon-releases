
import { Layout, Row, Col } from "antd";

function Footer() {
  const { Footer: AntFooter } = Layout;

  return (
      <AntFooter style={{ background: "#fafafa" }}>
        <Row className="just">
          <Col xs={24} md={24} lg={24}>
            <div className="copyright">
              © 2025 by D&D Engineers. Developed by Thumula Rajakaruna. All rights reserved.
            </div>
          </Col>
        </Row>
      </AntFooter>


  );
}

export default Footer;
