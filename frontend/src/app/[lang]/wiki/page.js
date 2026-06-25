import { getDictionary } from "../../../dictionaries/get-dictionary";

export default async function WikiPage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const isVi = lang === 'vi';

  return (
    <div style={{
      backgroundColor: '#101115',
      color: '#f4f4f5',
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '35px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          textAlign: 'center',
          color: '#ff952e',
          marginBottom: '30px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {isVi ? "Tài Liệu Hướng Dẫn - Wiki" : "Server Guide - Wiki"}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {isVi ? "1. Cách tham gia server" : "1. How to join the server"}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {isVi ? (
                "Server hỗ trợ cả Java Edition và Bedrock Edition. Bạn có thể kết nối bằng địa chỉ IP: haohansmp.hopto.org (Port Java mặc định: 25565, Port Bedrock: 19132)."
              ) : (
                "The server supports both Java Edition and Bedrock Edition. You can connect using IP: haohansmp.hopto.org (Java default port: 25565, Bedrock port: 19132)."
              )}
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {isVi ? "2. Đăng ký tài khoản trong game" : "2. In-game account registration"}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {isVi ? (
                "Khi vào game lần đầu, bạn cần gõ lệnh /register <mật khẩu> <xác nhận mật khẩu> để tạo tài khoản game. Những lần chơi tiếp theo, sử dụng lệnh /login <mật khẩu> để đăng nhập."
              ) : (
                "When entering the server for the first time, type /register <password> <confirm_password> to create your game account. For subsequent plays, use /login <password>."
              )}
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {isVi ? "3. Liên kết tài khoản web" : "3. Web account linking"}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {isVi ? (
                "Đăng ký tài khoản trên web với cùng tên nhân vật trong game để quản lý hồ sơ, donate và đồng bộ hóa chức vụ từ LuckPerms."
              ) : (
                "Register an account on the web with the exact same in-game name to manage your profile, donate, and sync roles from LuckPerms."
              )}
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              {isVi ? "4. Hỗ trợ & Quyên góp" : "4. Support & Donations"}
            </h2>
            <p style={{ lineHeight: '1.6', color: '#c7c8ce', fontSize: '1rem' }}>
              {isVi ? (
                "Quyên góp thông qua hệ thống tự động của chúng tôi giúp duy trì server. Mọi đóng góp đều nhận được phần quà và quyền lợi tương ứng."
              ) : (
                "Donating through our automated system helps maintain the server. All contributions receive custom benefits and rewards."
              )}
            </p>
          </section>
        </div>

        <div style={{
          marginTop: '45px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px'
        }}>
          <a href={`/${lang}`} style={{
            color: '#ff952e',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '600'
          }}
          >
            {dict.signup.back}
          </a>
        </div>
      </div>
    </div>
  );
}
