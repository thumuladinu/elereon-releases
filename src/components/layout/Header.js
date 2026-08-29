/* eslint-disable */
import { useState, useEffect } from "react";
import { useMediaQuery } from "@react-hook/media-query"; // Import media query hook
import {
  Row,
  Col,
  Breadcrumb,
  Dropdown,
  Button,
  Menu,
} from "antd";
import { NavLink, useHistory } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons"; // Import Home icon
import Cookies from "js-cookie";

function Header({ name, subName, onPress }) {
  const history = useHistory();
  const isMobile = useMediaQuery("(max-width: 768px)"); // Detects mobile screens

  let rememberedUser = Cookies.get("rememberedUser");
  let NAME1 = "NO User";
  let PHOTO1 = "https://i.ibb.co/YySdxGJ/user-1.png";

  if (rememberedUser) {
    rememberedUser = JSON.parse(rememberedUser);
    NAME1 = rememberedUser.NAME;
    PHOTO1 = rememberedUser.PHOTO;
  } else {
    Cookies.remove("rememberedUser");
    window.location.href = "/";
  }

  useEffect(() => { window.scrollTo(0, 0); });

  const handleLogout = () => {
    Cookies.remove("rememberedUser");
    window.location.href = "/";
  };

  const signInMenu = (
      <Menu className="header-notifications-dropdown" style={{ minWidth: "100%" }}>
        <Menu.Item key="1">
          <NavLink to="/profile">
            <Button type="primary" style={{ marginRight: "10px" }}>Profile</Button>
          </NavLink>
          <Button type="primary" danger onClick={handleLogout}>Logout</Button>
        </Menu.Item>
      </Menu>
  );

  return (
      <>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col span={6} md={6}>
            {/*<Breadcrumb>*/}
            {/*  <Breadcrumb.Item>*/}
            {/*    <NavLink to="/">Pages</NavLink>*/}
            {/*  </Breadcrumb.Item>*/}
            {/*  <Breadcrumb.Item style={{ textTransform: "capitalize" }}>*/}
            {/*    {name.replace("/", "")}*/}
            {/*  </Breadcrumb.Item>*/}
            {/*</Breadcrumb>*/}
            <div className="ant-page-header-heading">
            <span className="ant-page-header-heading-title" style={{ textTransform: "capitalize" }}>
              {subName.replace("/", "")}
            </span>
            </div>
          </Col>

          <Col span={18} md={18} className="header-control">
            {/* Sidebar Toggler */}
            <Button type="link" className="sidebar-toggler" onClick={() => onPress()}>
              <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
              </svg>
            </Button>

            {/* Home Button (Only for Mobile) */}
            {/*{isMobile && (*/}
            {/*    <Button*/}
            {/*        type="text"*/}
            {/*        icon={<HomeOutlined style={{ fontSize: "20px", color: "#000" }} />} // Adjust size and color if needed*/}
            {/*        onClick={() => history.push("/items")}*/}
            {/*        style={{*/}
            {/*          display: "flex",*/}
            {/*          alignItems: "center",*/}
            {/*          justifyContent: "center",*/}
            {/*          width: "40px",*/}
            {/*          height: "40px",*/}
            {/*          background: "transparent", // Removes background*/}
            {/*          border: "none", // Removes border*/}
            {/*          boxShadow: "none", // Ensures no shadow effect*/}
            {/*          marginRight: "10px"*/}
            {/*        }}*/}
            {/*    />*/}
            {/*)}*/}



            {/* Profile & Logout */}
            <Dropdown overlay={signInMenu} trigger={["click"]}>
              <Button type="link" className="btn-sign-in" style={{ fontSize: "15px", display: "flex", alignItems: "center" }}>
                <img src={PHOTO1} alt="Profile" style={{ width: "30px", height: "30px", marginRight: "5px", borderRadius: "50%" }} />
                <span>{NAME1}</span>
              </Button>
            </Dropdown>
          </Col>
        </Row>
      </>
  );
}

export default Header;
