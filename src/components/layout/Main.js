import { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { Layout, Drawer, Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Sidenav from "./Sidenav";
import Header from "./Header";
import Footer from "./Footer";

const { Header: AntHeader, Content, Sider } = Layout;

function Main({ children }) {
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState("right");
  const [sidenavColor, setSidenavColor] = useState("#1890ff");
  const [sidenavType, setSidenavType] = useState("transparent");
  const [fixed, setFixed] = useState(false);

  const history = useHistory();

  const openDrawer = () => setVisible(!visible);
  const handleSidenavType = (type) => setSidenavType(type);
  const handleSidenavColor = (color) => setSidenavColor(color);
  const handleFixedNavbar = (type) => setFixed(type);

  let { pathname } = useLocation();
  pathname = pathname.replace("/", "");

  const closeDrawer = () => setVisible(false);

  useEffect(() => {
    if (pathname === "rtl") {
      setPlacement("left");
    } else {
      setPlacement("right");
    }

    // Close the drawer when the URL changes
    closeDrawer();
  }, [pathname]);

  return (
      <Layout
          className={`layout-dashboard ${
              pathname === "profile" ? "layout-profile" : ""
          } ${pathname === "rtl" ? "layout-dashboard-rtl" : ""}`}
      >
        <Drawer
            title={false}
            placement={placement === "right" ? "left" : "right"}
            closable={false}
            onClose={() => setVisible(false)}
            visible={visible}
            key={placement === "right" ? "left" : "right"}
            width={250}
            className={`drawer-sidebar ${
                pathname === "rtl" ? "drawer-sidebar-rtl" : ""
            } `}
        >
          <Layout
              className={`layout-dashboard ${
                  pathname === "rtl" ? "layout-dashboard-rtl" : ""
              }`} >
            <Sider
                trigger={null}
                width={250}
                theme="light"
                className={`sider-primary ant-layout-sider-primary ${
                    sidenavType === "#fff" ? "active-route" : ""
                }`}
                style={{ background: sidenavType }}
            >
              <Sidenav color={sidenavColor} />
            </Sider>
          </Layout>
        </Drawer>
        <Sider
            breakpoint="lg"
            collapsedWidth="0"
            onCollapse={(collapsed, type) => {
              ////console.log(collapsed, type);
            }}
            trigger={null}
            width={250}
            theme="light"
            className={`sider-primary ant-layout-sider-primary ${
                sidenavType === "#fff" ? "active-route" : ""
            }`}
            style={{ background: sidenavType }}
        >
          <Sidenav color={sidenavColor} />
        </Sider>
        <Layout>
          {fixed ? (
              <div style={{ position: 'sticky', top: 0, zIndex: 999 }}>
                <AntHeader className={`${fixed ? "ant-header-fixed" : ""}`}>
                  <Header
                      onPress={openDrawer}
                      name={pathname}
                      subName={pathname}
                      handleSidenavColor={handleSidenavColor}
                      handleSidenavType={handleSidenavType}
                      handleFixedNavbar={handleFixedNavbar}
                  />
                </AntHeader>
              </div>
          ) : (
              <AntHeader className={`${fixed ? "ant-header-fixed" : ""}`}>
                <Header
                    onPress={openDrawer}
                    name={pathname}
                    subName={pathname}
                    handleSidenavColor={handleSidenavColor}
                    handleSidenavType={handleSidenavType}
                    handleFixedNavbar={handleFixedNavbar}
                />
              </AntHeader>
          )}
          <Content className="content-ant">{children}</Content>
          <Footer />
          <div style={{ position: "fixed", bottom: 20, right: 10, zIndex: 99 }}>
            <Button
                type="text"
                icon={<HomeOutlined style={{ fontSize: "20px", color: "#fff", marginLeft: "5px" }} />}
                onClick={() => history.push("/items")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  background: "#5E192B",
                  border: "none",
                  boxShadow: "none",
                }}
            />
          </div>
        </Layout>
      </Layout>
  );
}

export default Main;
