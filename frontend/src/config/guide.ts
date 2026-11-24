import { ScreenId } from './navigation';

export interface GuideSection {
  id: string;
  title: string;
  summary: string;
  screenIds: ScreenId[];
  targetScreen: ScreenId;
  adminOnly?: boolean;
  steps: string[];
  tip?: string;
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'farm-zone',
    title: '1. Tạo Nông trại & Phân khu Canh tác',
    summary: 'Khởi tạo trang trại mới và chia các phân khu chuyên canh (1 Crop / Zone).',
    screenIds: ['SCR-09'],
    targetScreen: 'SCR-09',
    adminOnly: true,
    steps: [
      'Mở mục Nông trại & Phân khu ở thanh điều hướng bên trái.',
      'Bấm Thêm Nông trại để tạo trang trại mới (tên, địa điểm, tổng diện tích m²).',
      'Chọn trang trại vừa tạo rồi điền biểu mẫu Thêm Phân khu (tên khu, cây trồng, diện tích).',
      'Bấm Giám sát hoặc Thiết bị ngay trên thẻ phân khu để mở nhanh màn thao tác.',
    ],
    tip: 'Mỗi phân khu nên trồng 1 loại cây duy nhất để bộ ngưỡng cảnh báo và tưới tự động chính xác.',
  },
  {
    id: 'hardware-device',
    title: '2. Kết nối Phần cứng & Khai báo Thiết bị',
    summary: 'Đấu nối bộ kit Yolo:Bit + Gateway qua MQTT Broker và khai báo đúng Hardware UID.',
    screenIds: ['SCR-10'],
    targetScreen: 'SCR-10',
    adminOnly: true,
    steps: [
      'Cấp nguồn Gateway / mạch Yolo:Bit và cấu hình kết nối Wi-Fi, MQTT Broker theo tài liệu bàn giao.',
      'Chọn đúng Nông trại và Phân khu cần gắn thiết bị ở thanh chọn ngữ cảnh phía trên.',
      'Tại Danh mục Thiết bị, nhập Mã UID Phần cứng khớp 100% với mã cấu hình trên mạch (ví dụ: DHT20-Z1-01).',
      'Chọn phân loại Cảm biến (SENSOR) hoặc Chấp hành (ACTUATOR), nhập Metrics (TEMP, HUMI, SOIL, LIGHT hoặc PUMP) và nguồn Kit PoC / Simulator.',
      'Bấm vào thẻ thiết bị vừa tạo để kiểm tra biểu đồ số đo hoặc bật/tắt kiểm thử trực tiếp.',
    ],
    tip: 'Nếu nhập sai Hardware UID, dữ liệu gửi lên từ Gateway sẽ không khớp được vào phân khu.',
  },
  {
    id: 'live-monitoring',
    title: '3. Giám sát Thời gian thực ngoài trời',
    summary: 'Theo dõi 3 tầng Tổng thể → Phân khu → Chi tiết lô với chế độ Nắng gắt.',
    screenIds: ['SCR-02'],
    targetScreen: 'SCR-02',
    steps: [
      'Ở màn Tổng quan, trang trại và phân khu đang có sự cố luôn được ưu tiên xếp ở góc trên-trái.',
      'Bấm nút Ngôi sao (Ghim mặc định) để lần đăng nhập sau mở thẳng trang trại thường xuyên theo dõi.',
      'Chuyển nhanh giữa chế độ Danh sách và Sơ đồ lô để định vị tức thì khu vực cần kiểm tra.',
      'Dùng nút Nắng gắt / Tối ở góc trên-phải để đổi độ tương phản khi mang máy ra ngoài đồng.',
    ],
    tip: 'Dải nền xanh nhạt trên biểu đồ biểu thị vùng ngưỡng tối ưu cho cây trồng.',
  },
  {
    id: 'device-control',
    title: '4. Điều khiển Thiết bị & Chế độ AUTO / MANUAL',
    summary: 'Bật/tắt máy bơm, quạt, đèn thủ công và trả về chế độ tự động khi xong việc.',
    screenIds: ['SCR-03'],
    targetScreen: 'SCR-03',
    steps: [
      'Chọn đúng Nông trại và Phân khu ở thanh chọn ngữ cảnh phía trên.',
      'Bấm nút BẬT hoặc TẮT trên thẻ thiết bị chấp hành cần can thiệp trực tiếp.',
      'Khi điều khiển tay, thiết bị tự chuyển sang MANUAL để kịch bản tự động không ghi đè ngay lệnh vừa bấm.',
      'Chuyển thiết bị về AUTO sau khi hoàn tất xử lý tại hiện trường để hệ thống tự chạy theo ngưỡng và lịch.',
    ],
    tip: 'Mọi lệnh Bật/Tắt đều được lưu vào Nhật ký hoạt động để truy vết trách nhiệm.',
  },
  {
    id: 'threshold-schedule',
    title: '5. Cấu hình Ngưỡng, Tự động hóa & Lịch trình',
    summary: 'Đặt ngưỡng 4 cấp, gán thiết bị bật tự động và hẹn giờ lặp theo thứ trong tuần.',
    screenIds: ['SCR-04'],
    targetScreen: 'SCR-04',
    adminOnly: true,
    steps: [
      'Chọn phân khu cần cài đặt ở thanh ngữ cảnh phía trên.',
      'Nhập đủ 4 mốc theo thứ tự tăng dần: Nguy hiểm Min < Cảnh báo Min < Cảnh báo Max < Nguy hiểm Max.',
      'Chọn Hành động tự động (< Nguy hiểm Min → Bật hoặc > Nguy hiểm Max → Bật) và thiết bị chấp hành đi kèm.',
      'Bấm ÁP DỤNG CẤU HÌNH (APPLY) để đồng bộ ngay xuống thiết bị.',
      'Ở mục Lịch trình bên dưới, chọn thiết bị từ danh sách, giờ chạy, thời lượng và các thứ T2–CN rồi bấm Thêm Lịch.',
    ],
    tip: 'Hành động tự động theo ngưỡng chỉ chạy khi thiết bị chấp hành đang ở chế độ AUTO.',
  },
  {
    id: 'alerts-reports-rbac',
    title: '6. Cảnh báo, Báo cáo HTTT, Nhật ký & Phân quyền',
    summary: 'Xác nhận xử lý sự cố (ACK), xem báo cáo, tra cứu Audit Log và quản lý tài khoản.',
    screenIds: ['SCR-05', 'SCR-06', 'SCR-07', 'SCR-08'],
    targetScreen: 'SCR-05',
    steps: [
      'Vào Trung tâm cảnh báo (hoặc bấm biểu tượng Chuông), lọc Chưa xử lý / Nguy hiểm, bấm Xem khu vực hoặc Xác nhận Xử lý (ACK) kèm ghi chú.',
      'Vào Báo cáo HTTT để xem thống kê Min/Max/Avg, tỷ lệ môi trường đạt chuẩn và tải file CSV.',
      'Quản trị viên dùng Nhật ký hoạt động để tìm kiếm lịch sử thao tác theo tên người dùng, thiết bị hoặc sự kiện.',
      'Quản trị viên mở Người dùng & Phân quyền để tạo tài khoản Operator (vận hành) hoặc Admin mới.',
    ],
    tip: 'Operator không thấy và không truy cập được các màn cấu hình ngưỡng, thiết bị và phân quyền.',
  },
];
