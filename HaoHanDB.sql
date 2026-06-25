-- 1. Bảng players
CREATE TABLE players (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(16) NOT NULL UNIQUE,
    email VARCHAR(255) NULL UNIQUE,
    uuid VARCHAR(36) UNIQUE, -- Khóa vạn năng (Offline UUID)
    password_hash VARCHAR(255) NOT NULL, -- 'UNREGISTERED_GHOST' nếu nạp trước khi tạo web
    discord_id VARCHAR(20) NULL UNIQUE, -- Lưu ID Discord (Snowflake ID) để đồng bộ cộng đồng
    avatar_url VARCHAR(255) NULL, -- Lưu cache URL ảnh đại diện nhân vật lấy từ Mojang/PlayerDB
    total_donated DECIMAL(15, 2) DEFAULT 0.00,
    role VARCHAR(50) DEFAULT 'default', -- Chức vụ đồng bộ từ LuckPerms/Discord
    is_linked BIT DEFAULT 0, -- 0 = Tài khoản tạm, 1 = Đã xác thực chính chủ
    play_time INT DEFAULT 0, -- Thời gian chơi (giây)
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 2. Bảng donations
CREATE TABLE donations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    player_id INT NOT NULL,
    method VARCHAR(20) NOT NULL, -- 'PAYOS' hoặc 'CARD'
    amount DECIMAL(15, 2) NOT NULL,
    tx_ref VARCHAR(100) NOT NULL UNIQUE, -- orderCode hoặc request_id
    message NVARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED'
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_Donations_Players FOREIGN KEY (player_id) 
        REFERENCES players(id) ON DELETE CASCADE
);
GO

-- 3. Bảng card_details
CREATE TABLE card_details (
    donation_id INT PRIMARY KEY, -- Quan hệ 1-1 với bảng donations
    card_type VARCHAR(20) NOT NULL, -- 'VIETTEL', 'MOBIFONE', v.v.
    serial VARCHAR(50) NOT NULL,
    pin VARCHAR(50) NOT NULL,
    declared_value DECIMAL(15, 2) NOT NULL,
    
    CONSTRAINT FK_CardDetails_Donations FOREIGN KEY (donation_id) 
        REFERENCES donations(id) ON DELETE CASCADE
);
GO

-- 4. Bảng bans
CREATE TABLE bans (
    id INT IDENTITY(1,1) PRIMARY KEY,
    player_uuid VARCHAR(36) NOT NULL,
    admin_identifier VARCHAR(36) NOT NULL,
    reason NVARCHAR(255) NOT NULL,
    banned_at DATETIME DEFAULT GETDATE(),
    expires_at DATETIME NULL, -- NULL tương đương với cấm vĩnh viễn
    status VARCHAR(20) DEFAULT 'ACTIVE' -- 'ACTIVE', 'LIFTED'
);
GO

-- 5. Bảng server_status_logs (Lưu lịch sử Server Status API phục vụ Analytics)
-- Bảng này dùng để vẽ biểu đồ lượng người chơi online theo thời gian trên trang Admin
CREATE TABLE server_status_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    online_players INT NOT NULL DEFAULT 0,
    max_players INT NOT NULL DEFAULT 20,
    tps DECIMAL(4,2) DEFAULT 20.00,
    recorded_at DATETIME DEFAULT GETDATE()
);
GO

CREATE NONCLUSTERED INDEX IX_Players_Username ON players(username);
CREATE NONCLUSTERED INDEX IX_Players_Email ON players(email);
CREATE NONCLUSTERED INDEX IX_Players_UUID ON players(uuid);
CREATE NONCLUSTERED INDEX IX_Players_Discord ON players(discord_id);
CREATE NONCLUSTERED INDEX IX_Donations_TxRef ON donations(tx_ref);
CREATE NONCLUSTERED INDEX IX_Bans_PlayerUUID_Status ON bans(player_uuid, status);
CREATE NONCLUSTERED INDEX IX_StatusLogs_Time ON server_status_logs(recorded_at);
GO


CREATE TRIGGER TRG_Update_Donations
ON donations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
    BEGIN
        UPDATE d
        SET updated_at = GETDATE()
        FROM donations d
        INNER JOIN inserted i ON d.id = i.id;
    END
END;
GO