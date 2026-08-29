import Cookies from 'js-cookie';
export const getUserRole = () => {
    let role = 'USER';
    try {
        const raw = Cookies.get('rememberedUser');
        if (raw) role = JSON.parse(raw).ROLE;
    } catch {}
    return role;
};
