// ========================================================
// SỔ TAY CÔNG THỨC TMĐT & BÀI TẬP TÍNH TOÁN TOÀN DIỆN
// ========================================================
const FORMULA_CATEGORIES = [
  { id: 'all', label: 'Tất cả', shortLabel: 'Tất cả' },
  { id: 'slide', label: '🎯 Bài tập trên Slide', shortLabel: '🎯 Bài tập Slide' },
  { id: 'ads', label: '📊 Quảng cáo số (Buổi 6)', shortLabel: '📊 Quảng cáo' },
  { id: 'ltv', label: '👥 Khách hàng LTV & CAC (Buổi 5, 13)', shortLabel: '👥 LTV & CAC' },
  { id: 'funnel', label: '🔄 Phễu chuyển đổi TMĐT (Buổi 13)', shortLabel: '🔄 Phễu TMĐT' },
  { id: 'ops', label: '📦 Vận hành & Phí cổng (Buổi 4, 10)', shortLabel: '📦 Vận hành & Phí' },
  { id: 'security', label: '🛡️ An ninh thông tin (Buổi 7)', shortLabel: '🛡️ An ninh TT' }
];

let activeFormulaCategory = 'all';
let formulaSearchTerm = '';

// Live Ad Simulator State
let simState = {
  impressions: 200000,
  clicks: 4000,
  cost: 20000000,
  orders: 100,
  revenue: 80000000,
  margin: 30
};

function resetAdSimulator() {
  simState = {
    impressions: 200000,
    clicks: 4000,
    cost: 20000000,
    orders: 100,
    revenue: 80000000,
    margin: 30
  };
  $('#simImp').value = simState.impressions;
  $('#simClk').value = simState.clicks;
  $('#simCost').value = simState.cost;
  $('#simOrd').value = simState.orders;
  $('#simRev').value = simState.revenue;
  $('#simMargin').value = simState.margin;
  updateAdSimulator();
  showToast('✓ Đã khôi phục thông số bài tập gốc trên Slide');
}

function updateAdSimulator() {
  const imp = Math.max(1, parseFloat($('#simImp')?.value) || 0);
  const clk = Math.max(0, parseFloat($('#simClk')?.value) || 0);
  const cost = Math.max(0, parseFloat($('#simCost')?.value) || 0);
  const ord = Math.max(0, parseFloat($('#simOrd')?.value) || 0);
  const rev = Math.max(0, parseFloat($('#simRev')?.value) || 0);
  const margin = Math.max(0.1, parseFloat($('#simMargin')?.value) || 0);

  const ctr = (clk / imp) * 100;
  const cpc = clk > 0 ? (cost / clk) : 0;
  const cpm = imp > 0 ? (cost / imp) * 1000 : 0;
  const cvr = clk > 0 ? (ord / clk) * 100 : 0;
  const cpa = ord > 0 ? (cost / ord) : 0;
  const aov = ord > 0 ? (rev / ord) : 0;
  const roas = cost > 0 ? (rev / cost) : 0;
  const roasBreakeven = 100 / margin;
  const grossProfit = rev * (margin / 100);
  const netProfit = grossProfit - cost;
  const reqCvr = (aov > 0 && margin > 0) ? (cpc / (aov * (margin / 100))) * 100 : 0;

  if ($('#resCtr')) $('#resCtr').textContent = ctr.toFixed(2) + '%';
  if ($('#resCpc')) $('#resCpc').textContent = Math.round(cpc).toLocaleString('vi-VN') + ' đ';
  if ($('#resCpm')) $('#resCpm').textContent = Math.round(cpm).toLocaleString('vi-VN') + ' đ';
  if ($('#resCvr')) $('#resCvr').textContent = cvr.toFixed(2) + '%';
  if ($('#resCpa')) $('#resCpa').textContent = Math.round(cpa).toLocaleString('vi-VN') + ' đ';
  if ($('#resAov')) $('#resAov').textContent = Math.round(aov).toLocaleString('vi-VN') + ' đ';
  if ($('#resRoas')) $('#resRoas').textContent = roas.toFixed(2) + 'x';
  if ($('#resRoasBe')) $('#resRoasBe').textContent = roasBreakeven.toFixed(2) + 'x';
  if ($('#resGross')) $('#resGross').textContent = Math.round(grossProfit).toLocaleString('vi-VN') + ' đ';
  if ($('#resNet')) $('#resNet').textContent = (netProfit >= 0 ? '+' : '') + Math.round(netProfit).toLocaleString('vi-VN') + ' đ';

  const vBox = $('#simVerdictBox');
  if (vBox) {
    if (netProfit > 500) {
      vBox.className = 'calc-verdict-box profit';
      vBox.innerHTML = '<div>🎉 <strong>KẾT LUẬN: CHIẾN DỊCH CÓ LÃI</strong><div style="font-size:12.5px;font-weight:500;margin-top:2px;">ROAS thực tế (' + roas.toFixed(2) + 'x) > ROAS hòa vốn (' + roasBreakeven.toFixed(2) + 'x) · Lãi ròng: +' + Math.round(netProfit).toLocaleString('vi-VN') + ' đ</div></div>' +
        '<div style="font-size:13px;font-weight:800;">Lợi nhuận gộp đủ bù chi phí QC</div>';
    } else if (Math.abs(netProfit) <= 500) {
      vBox.className = 'calc-verdict-box breakeven';
      vBox.innerHTML = '<div>⚖️ <strong>KẾT LUẬN: CHIẾN DỊCH HÒA VỐN</strong><div style="font-size:12.5px;font-weight:500;margin-top:2px;">ROAS xấp xỉ ngưỡng hòa vốn (' + roasBreakeven.toFixed(2) + 'x)</div></div>';
    } else {
      vBox.className = 'calc-verdict-box loss';
      vBox.innerHTML = '<div>⚠️ <strong>KẾT LUẬN: CHIẾN DỊCH ĐANG BỊ LỖ</strong><div style="font-size:12.5px;font-weight:500;margin-top:2px;">ROAS thực tế (' + roas.toFixed(2) + 'x) < ROAS hòa vốn (' + roasBreakeven.toFixed(2) + 'x) · Lỗ: ' + Math.round(netProfit).toLocaleString('vi-VN') + ' đ</div></div>' +
        '<div style="font-size:12px;font-weight:600;">Cần tăng CVR lên ≥ ' + reqCvr.toFixed(2) + '% hoặc tăng AOV</div>';
    }
  }
}

// Full Library of Formulas
const FORMULA_LIBRARY = [
  // ADS
  {
    category: 'ads',
    title: 'CTR (Click-Through Rate) · Tỷ lệ nhấp chuột',
    equation: 'CTR = (Clicks ÷ Impressions) × 100%',
    vars: [
      '<b>Clicks</b>: Tổng số lần người dùng bấm vào quảng cáo',
      '<b>Impressions</b>: Tổng số lần quảng cáo được hiển thị trên màn hình'
    ],
    tip: '💡 <b>Ý nghĩa & Mẹo thi:</b> Đo lường mức độ hấp dẫn của mẫu quảng cáo (tiêu đề, hình ảnh, lời kêu gọi). Chuẩn ngành TMĐT thường từ 1,0% – 2,5%. CTR cao giúp tăng Điểm chất lượng (Quality Score) trong cơ chế đấu giá.',
    example: '<b>Bài tập Slide:</b> 4.000 clicks ÷ 200.000 impressions = <b>2,0%</b> (Chuẩn tốt).'
  },
  {
    category: 'ads',
    title: 'CPC (Cost Per Click) · Chi phí mỗi lượt nhấp',
    equation: 'CPC = Ad Cost ÷ Clicks',
    vars: [
      '<b>Ad Cost</b>: Tổng ngân sách / chi phí đã chi cho quảng cáo (VNĐ)',
      '<b>Clicks</b>: Tổng số lượt nhấp chuột thu được'
    ],
    tip: '💡 <b>Ý nghĩa:</b> Chi phí thực tế trả cho mỗi khách tiềm năng truy cập vào trang đích (Landing Page). Phụ thuộc vào mức độ cạnh tranh từ khóa và Điểm chất lượng.',
    example: '<b>Bài tập Slide:</b> 20.000.000 đ ÷ 4.000 clicks = <b>5.000 đ/click</b>.'
  },
  {
    category: 'ads',
    title: 'CPM (Cost Per Mille) · Chi phí 1.000 lượt hiển thị',
    equation: 'CPM = (Ad Cost ÷ Impressions) × 1.000',
    vars: [
      '<b>Ad Cost</b>: Chi phí quảng cáo đã chi',
      '<b>Impressions</b>: Tổng số lượt hiển thị',
      '<b>1.000</b>: Đơn vị tính trên mỗi ngàn (Mille) hiển thị'
    ],
    tip: '💡 <b>Ý nghĩa:</b> Thước đo chuẩn quốc tế cho chiến dịch giai đoạn Nhận thức / Thương hiệu (Brand Awareness) để tiếp cận độ phủ rộng.',
    example: '<b>Bài tập Slide:</b> (20.000.000 đ ÷ 200.000) × 1.000 = <b>100.000 đ</b>.<br><b>Câu trắc nghiệm 123:</b> Chi 6tr, 2 triệu hiển thị → CPM = (6tr ÷ 2tr) × 1.000 = <b>3.000 đ</b>.'
  },
  {
    category: 'ads',
    title: 'CVR (Conversion Rate) · Tỷ lệ chuyển đổi',
    equation: 'CVR = (Orders ÷ Clicks) × 100%',
    vars: [
      '<b>Orders</b>: Số đơn hàng hoặc mục tiêu chuyển đổi hoàn tất',
      '<b>Clicks</b>: Tổng số lượt truy cập từ quảng cáo'
    ],
    tip: '💡 <b>Ý nghĩa cốt lõi:</b> Thước đo năng lực thuyết phục của Trang đích (Landing Page: giá bán, ảnh sản phẩm, tốc độ tải, lòng tin, quy trình thanh toán). CVR không phụ thuộc nền tảng quảng cáo mà thuộc về website của doanh nghiệp.',
    example: '<b>Bài tập Slide:</b> 100 đơn ÷ 4.000 clicks = <b>2,5%</b> (Mức chuẩn TMĐT).'
  },
  {
    category: 'ads',
    title: 'CPA (Cost Per Acquisition) · Chi phí mỗi đơn hàng',
    equation: 'CPA = Ad Cost ÷ Orders = CPC ÷ CVR',
    vars: [
      '<b>Ad Cost</b>: Chi phí quảng cáo',
      '<b>Orders</b>: Số đơn hàng thành công',
      '<b>Mối quan hệ vàng</b>: CPA = CPC ÷ CVR'
    ],
    tip: '⭐ <b>CÂU HỎI TRỌNG TÂM ĐỀ THI (Câu 127):</b> Vì sao con đường tăng CVR bền vững hơn giảm CPC?<br>→ Vì tăng CVR hạ CPA mà giữ nguyên hoặc tăng lưu lượng đơn hàng; còn giảm giá thầu (hạ CPC) sẽ làm giảm hiển thị và sụt giảm số đơn. Dư địa tối ưu trang đích luôn lớn hơn đấu thầu giá!',
    example: '<b>Bài tập Slide:</b> 20.000.000 đ ÷ 100 = <b>200.000 đ/đơn</b> (hoặc 5.000 đ ÷ 0,025 = 200.000 đ).<br><b>Câu 124:</b> CPC 5.000 đ, CVR 2,5% → CPA = 5.000 ÷ 0,025 = <b>200.000 đ</b>.'
  },
  {
    category: 'ads',
    title: 'AOV (Average Order Value) · Giá trị đơn trung bình',
    equation: 'AOV = Revenue ÷ Orders',
    vars: [
      '<b>Revenue</b>: Tổng doanh thu tạo ra (VNĐ)',
      '<b>Orders</b>: Tổng số đơn hàng'
    ],
    tip: '💡 <b>Ý nghĩa:</b> Tăng AOV (bằng combo, freeship từ ngưỡng, gợi ý chéo) là một trong 3 trụ cột mở rộng doanh thu mà không cần tốn thêm tiền quảng cáo.',
    example: '<b>Bài tập Slide:</b> 80.000.000 đ ÷ 100 đơn = <b>800.000 đ/đơn</b>.'
  },
  {
    category: 'ads',
    title: 'ROAS (Return On Ad Spend) · Doanh thu trên chi phí QC',
    equation: 'ROAS = Revenue ÷ Ad Cost = AOV ÷ CPA',
    vars: [
      '<b>Revenue</b>: Tổng doanh thu mang lại từ quảng cáo',
      '<b>Ad Cost</b>: Tổng ngân sách quảng cáo đã chi'
    ],
    tip: '⚠️ <b>LƯU Ý CỐT LÕI:</b> ROAS chỉ đo doanh thu, hoàn toàn KHÔNG ĐO LỢI NHUẬN. Doanh nghiệp có thể có ROAS = 4x nhưng vẫn lỗ nếu biên lợi nhuận gộp mỏng.',
    example: '<b>Bài tập Slide:</b> 80.000.000 đ ÷ 20.000.000 đ = <b>4,0x</b> (hay 400%).'
  },
  {
    category: 'ads',
    title: 'Ngưỡng ROAS hòa vốn (Break-even ROAS)',
    equation: 'ROAS hòa vốn = 1 ÷ Biên lợi nhuận gộp (Gross Margin)',
    vars: [
      '<b>Gross Margin</b>: Tỷ lệ lợi nhuận gộp của sản phẩm (ví dụ 30% = 0,3)',
      '<b>Công thức mở rộng</b>: Nếu có chi phí vận hành (OPEX %): ROAS hòa vốn = 1 ÷ (Gross Margin − OPEX)'
    ],
    tip: '⭐ <b>CÂU HỎI ĐỀ CƯƠNG (Câu 125, Essay 21, Essay 44):</b><br>• Gross Margin = 40% (0,4) → ROAS hòa vốn = 1 ÷ 0,4 = <b>2,5x</b><br>• Gross Margin = 30% (0,3) → ROAS hòa vốn = 1 ÷ 0,3 ≈ <b>3,33x</b><br>• Gross Margin = 25% (0,25) → ROAS hòa vốn = 1 ÷ 0,25 = <b>4,0x</b><br>• Gross Margin = 28% (0,28) → ROAS hòa vốn = 1 ÷ 0,28 ≈ <b>3,57x</b>',
    example: '<b>Bài tập Slide:</b> Biên gộp 30% → Ngưỡng hòa vốn = 1 ÷ 0,3 ≈ <b>3,33x</b>. Vì ROAS thực tế (4x) > 3,33x nên chiến dịch có lãi (+4 triệu).'
  },
  {
    category: 'ads',
    title: 'CVR cần đạt để hòa vốn (Break-even CVR)',
    equation: 'CVR hòa vốn = CPC ÷ (AOV × Gross Margin)',
    vars: [
      '<b>CPC</b>: Chi phí mỗi lượt nhấp',
      '<b>AOV × Gross Margin</b>: Lợi nhuận gộp tạo ra trên 1 đơn hàng (CPA tối đa cho phép)'
    ],
    tip: '💡 <b>Ý nghĩa (Essay 21):</b> Nếu không thể giảm giá thầu CPC và giá bán cố định, website buộc phải nâng CVR lên mức này để không bị lỗ.',
    example: '<b>Essay 21:</b> CPC = 4.000 đ, AOV = 700.000 đ, Biên gộp = 25% → CPA tối đa = 700k × 25% = 175.000 đ → CVR cần đạt = 4.000 ÷ 175.000 ≈ <b>2,29%</b> để hòa vốn.'
  },
  {
    category: 'ads',
    title: 'Ad Rank · Cơ chế Xếp hạng Đấu giá quảng cáo (Essay 22)',
    equation: 'Thứ hạng quảng cáo = Giá thầu (Bid) × Điểm chất lượng (Quality Score)',
    vars: [
      '<b>Giá thầu (Bid)</b>: Mức giá tối đa nhà quảng cáo sẵn sàng trả cho 1 click',
      '<b>Điểm chất lượng</b>: Đánh giá của nền tảng dựa trên CTR kỳ vọng, độ liên quan mẫu quảng cáo và trải nghiệm Trang đích'
    ],
    tip: '⭐ <b>Tác động kép của trang đích (Landing Page):</b> Cải thiện trang đích vừa làm tăng CVR (giúp hạ CPA), vừa là yếu tố cốt lõi tăng Quality Score (giúp hạ giá thầu thực tế CPC). Hai tác động nhân với nhau tạo lợi thế cạnh tranh áp đảo.',
    example: 'Một nhà quảng cáo thầu 6.000 đ nhưng điểm chất lượng 10/10 sẽ vượt qua nhà quảng cáo thầu 10.000 đ nhưng điểm chất lượng 5/10, và chỉ phải trả CPC thực tế thấp hơn!'
  },

  // LTV & CAC
  {
    category: 'ltv',
    title: 'LTV (Customer Lifetime Value) · Giá trị vòng đời khách hàng',
    equation: 'LTV (Lợi nhuận gộp) = AOV × f × t × Gross Margin',
    vars: [
      '<b>AOV</b>: Giá trị đơn hàng trung bình',
      '<b>f (Frequency)</b>: Tần suất mua hàng bình quân (số đơn / năm)',
      '<b>t (Lifespan)</b>: Thời gian gắn bó trung bình của khách hàng (số năm)',
      '<b>Gross Margin</b>: Tỷ lệ lợi nhuận gộp bình quân'
    ],
    tip: '⭐ <b>CÂU HỎI ĐỀ CƯƠNG (Buổi 5 & Buổi 13):</b> LTV là "trần ngân sách" bảo vệ doanh nghiệp không bị vung tay quá trán khi chạy quảng cáo.',
    example: '<b>Essay 20:</b> AOV = 450.000 đ, f = 3 đơn/năm, t = 2 năm, Biên gộp 30%<br>→ LTV = 450.000 × 3 × 2 × 30% = <b>810.000 đ</b>.<br><b>Essay 43:</b> AOV = 250.000 đ, f = 2,5 đơn/năm, t = 2 năm, Biên gộp 32%<br>→ LTV = 250.000 × 2,5 × 2 × 32% = <b>400.000 đ</b>.'
  },
  {
    category: 'ltv',
    title: 'CAC (Customer Acquisition Cost) · Chi phí thu hút khách hàng',
    equation: 'CAC = Tổng chi phí Marketing & Sales ÷ Số khách hàng mới',
    vars: [
      '<b>Chi phí Marketing & Sales</b>: Toàn bộ ngân sách quảng cáo, nhân sự, công cụ trong kỳ',
      '<b>Số khách hàng mới</b>: Lượng khách hàng lần đầu phát sinh đơn hàng'
    ],
    tip: '⭐ <b>Quy tắc vàng tỷ số LTV / CAC:</b><br>• <b>LTV / CAC ≥ 3</b>: Ngưỡng chuẩn vàng của một mô hình TMĐT bền vững.<br>• <b>LTV / CAC < 1</b>: Đang lỗ trên từng khách hàng thu hút (chảy máu tiền tệ).<br>• <b>CAC tối đa cho phép</b> = LTV ÷ 3.',
    example: '• Từ Essay 20: LTV = 810.000 đ → CAC tối đa = 810.000 ÷ 3 = <b>270.000 đ</b>.<br>• Từ Essay 43: LTV = 400.000 đ → CAC tối đa = 400.000 ÷ 3 ≈ <b>133.000 đ</b>.'
  },
  {
    category: 'ltv',
    title: 'CPC tối đa cho phép theo LTV & CAC (Essay 43)',
    equation: 'Max CPC = CAC tối đa × CVR (khách mới)',
    vars: [
      '<b>CAC tối đa</b>: Ngưỡng chi tối đa để có 1 khách mới (= LTV ÷ 3)',
      '<b>CVR</b>: Tỷ lệ chuyển đổi từ lượt nhấp sang khách hàng mới'
    ],
    tip: '💡 <b>Ứng dụng quản trị:</b> Giúp thiết lập giá thầu trần trên Google/Facebook Ads để không bao giờ chạy quảng cáo bị lỗ về lâu dài.',
    example: '<b>Essay 43:</b> CAC tối đa = 133.000 đ, CVR = 2,7% → Max CPC = 133.000 × 0,027 ≈ <b>3.600 đ/click</b>.'
  },

  // FUNNEL
  {
    category: 'funnel',
    title: 'Phễu chuyển đổi TMĐT 4 bước chuẩn (Buổi 5 & Buổi 13)',
    equation: 'Phiên (Sessions) → Xem SP → Thêm giỏ (Cart) → Thanh toán (Checkout) → Hoàn tất (Success)',
    vars: [
      '1. <b>Tỷ lệ xem SP</b> = (Lượt xem SP ÷ Tổng phiên) × 100%',
      '2. <b>Tỷ lệ thêm giỏ</b> = (Lượt thêm giỏ ÷ Lượt xem SP) × 100%',
      '3. <b>Tỷ lệ thanh toán</b> = (Lượt bắt đầu thanh toán ÷ Lượt thêm giỏ) × 100%',
      '4. <b>Tỷ lệ hoàn tất</b> = (Lượt hoàn tất đơn ÷ Lượt thanh toán) × 100%',
      '<b>Tỷ lệ CVR toàn phễu</b> = (Lượt hoàn tất đơn ÷ Tổng phiên) × 100%'
    ],
    tip: '⭐ <b>NGUYÊN TẮC QUẢN TRỊ (Essay 18 & Essay 43):</b><br>Giá trị của cải thiện tỷ lệ thuận với số người đi vào bước đó (ưu tiên theo <i>số tuyệt đối</i>, không theo tỷ lệ %). Bước giữa có số lượng người vào lớn gấp nhiều lần nên một cải thiện nhỏ cũng tạo ra mức tăng đơn hàng vượt bậc.',
    example: '<b>Essay 18:</b> 10.000 phiên → 4.200 xem SP (42%) → 1.100 thêm giỏ (26%) → 620 thanh toán (56%) → 280 hoàn tất (45%). CVR toàn phễu = 2,8%.'
  },
  {
    category: 'funnel',
    title: 'Tỷ lệ bỏ giỏ hàng (Cart Abandonment Rate)',
    equation: 'Cart Abandonment Rate = [1 − (Lượt thanh toán ÷ Lượt thêm giỏ)] × 100%',
    vars: [
      'Đo lường tỷ lệ người dùng đã đưa sản phẩm vào giỏ nhưng không tiến hành mua hàng'
    ],
    tip: '💡 <b>6 nguyên nhân bỏ giỏ hàng hàng đầu (Buổi 9 & 15):</b> (1) Phí vận chuyển bất ngờ phát sinh ở bước cuối, (2) Bắt buộc tạo tài khoản rườm rà, (3) Quy trình thanh toán quá nhiều bước, (4) Thiếu phương thức thanh toán mong muốn, (5) Lo ngại an toàn bảo mật, (6) Chính sách đổi trả không rõ ràng.',
    example: 'Trung bình ngành TMĐT thế giới bỏ giỏ hàng từ 65% – 75%. Giảm được 5% bỏ giỏ hàng giúp tăng 20% lợi nhuận.'
  },

  // OPS & PAYMENT
  {
    category: 'ops',
    title: 'Chi phí Cổng thanh toán & Tỷ trọng trên Lợi nhuận (Essay 15)',
    equation: 'Phí = Phí cố định + (% phí × Giá trị đơn); Tỷ trọng = Phí ÷ Lợi nhuận gộp',
    vars: [
      '<b>Phí cố định</b>: Ví dụ 2.000 đ/giao dịch',
      '<b>Tỷ lệ %</b>: Ví dụ 1,5% giá trị đơn hàng',
      '<b>Tỷ trọng phí trên lãi gộp</b>: Thước đo mức độ "ăn sâu" của phí thanh toán vào lợi nhuận'
    ],
    tip: '⭐ <b>KẾT LUẬN QUẢN TRỊ:</b> Phần phí cố định chiếm tỷ trọng rất lớn ở đơn hàng giá trị nhỏ, do đó ăn sâu vào lợi nhuận gộp (đơn 150k phí chiếm 11,3% lãi gộp, đơn 1.500k chỉ chiếm 6,5%). Vì vậy, với đơn nhỏ ưu tiên khuyến khích thanh toán phí thấp (chuyển khoản VietQR).',
    example: '<b>Đơn 150.000 đ (biên gộp 25% = 37.500 đ):</b><br>Phí = 2.000 + (1,5% × 150.000) = 4.250 đ → Tỷ trọng phí = 4.250 ÷ 37.500 ≈ <b>11,3%</b>!'
  },
  {
    category: 'ops',
    title: 'Hệ chỉ số Logistics & Điểm hòa vốn vận hành (Buổi 10 & Essay 39)',
    equation: 'Tỷ lệ hoàn hàng = (Số đơn hoàn hủy ÷ Tổng số đơn xuất) × 100%',
    vars: [
      '<b>Ngưỡng an toàn</b>: Chi phí Logistics mỗi đơn ≤ Lợi nhuận gộp mỗi đơn',
      '<b>Fulfillment Cycle Time</b>: Thời gian từ lúc đặt hàng đến khi khách nhận (chuẩn TMĐT 2–3 ngày, 5 ngày là điểm nghẽn)'
    ],
    tip: '💡 <b>Chẩn đoán:</b> Nếu tỷ lệ hoàn hàng cao (ví dụ 18% ở thời trang), chi phí logistics hai chiều (giao + hoàn) sẽ triệt tiêu toàn bộ lợi nhuận gộp của các đơn hàng thành công.',
    example: 'Nếu lợi nhuận gộp mỗi đơn là 50.000 đ, chi phí giao 25.000 đ, phí hoàn 15.000 đ. Cứ 1 đơn hoàn làm mất 40.000 đ, cần 1 đơn thành công khác gánh còng lưng!'
  },

  // SECURITY
  {
    category: 'security',
    title: 'Công thức Rủi ro An ninh thông tin (Buổi 7, Câu 145 & Essay 58)',
    equation: 'Rủi ro (Risk) = Mối đe dọa (Threat) × Lỗ hổng (Vulnerability) × Tác động (Impact)',
    vars: [
      '<b>Mối đe dọa (Threat - T)</b>: Kẻ tấn công, tin tặc, mã độc, lừa đảo AI (yếu tố ngoại cảnh)',
      '<b>Lỗ hổng (Vulnerability - V)</b>: Điểm yếu bảo mật trong mã nguồn, máy chủ, cấu hình, nhận thức con người',
      '<b>Tác động (Impact - I)</b>: Mức độ thiệt hại về tài chính, uy tín, gián đoạn kinh doanh, pháp lý'
    ],
    tip: '⭐ <b>CÂU HỎI TRỌNG TÂM ĐỀ CƯƠNG:</b> Doanh nghiệp có thể tác động vào thành phần nào?<br>→ Doanh nghiệp <b>KHÔNG THỂ</b> triệt tiêu mối đe dọa (không thể loại bỏ tin tặc trên Internet). Doanh nghiệp chỉ có thể <b>GIẢM LỖ HỔNG (V)</b> bằng các biện pháp kỹ thuật phòng ngừa (vá lỗi, HTTPS, phân quyền) và <b>GIẢM TÁC ĐỘNG (I)</b> bằng kế hoạch ứng phó sự cố, sao lưu dự phòng độc lập và quy trình pháp lý.',
    example: '<b>Công thức: R = T × V × I.</b> Khi một trong hai yếu tố V hoặc I tiến về 0, rủi ro tổng thể sẽ được khống chế an toàn.'
  }
];

// Full Flashcard Question Bank for Formula Practice (ABCD Multiple Choice)
const FORMULA_FLASHCARDS = [
  {
    id: 'f_ctr',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức chuẩn xác tính <b>CTR (Click-Through Rate · Tỷ lệ nhấp chuột)</b> là gì?',
    options: [
      'CTR = (Clicks ÷ Impressions) × 100%',
      'CTR = (Impressions ÷ Clicks) × 100%',
      'CTR = (Orders ÷ Clicks) × 100%',
      'CTR = (Clicks ÷ Orders) × 100%'
    ],
    answer: 'A',
    explanation: '<b>CTR = (Clicks ÷ Impressions) × 100%</b>.<br>Đo lường tỷ lệ người nhìn thấy quảng cáo bấm vào xem. Chuẩn ngành TMĐT từ 1,0% – 2,5%. CTR cao giúp tăng Điểm chất lượng (Quality Score).'
  },
  {
    id: 'f_cpc',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức chuẩn xác tính <b>CPC (Cost Per Click · Chi phí mỗi lượt nhấp)</b> là gì?',
    options: [
      'CPC = Clicks ÷ Ad Cost',
      'CPC = Ad Cost ÷ Clicks',
      'CPC = (Ad Cost ÷ Impressions) × 1.000',
      'CPC = Ad Cost ÷ Orders'
    ],
    answer: 'B',
    explanation: '<b>CPC = Ad Cost ÷ Clicks</b>.<br>Chi phí thực tế nhà quảng cáo phải trả cho mỗi lượt người dùng nhấp chuột vào quảng cáo dẫn về trang đích (Landing Page).'
  },
  {
    id: 'f_cpm',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức chuẩn xác tính <b>CPM (Cost Per Mille · Chi phí 1.000 lượt hiển thị)</b> là gì?',
    options: [
      'CPM = (Impressions ÷ Ad Cost) × 1.000',
      'CPM = (Ad Cost ÷ Clicks) × 1.000',
      'CPM = (Ad Cost ÷ Impressions) × 1.000',
      'CPM = Ad Cost ÷ 1.000'
    ],
    answer: 'C',
    explanation: '<b>CPM = (Ad Cost ÷ Impressions) × 1.000</b>.<br>Thước đo chuẩn quốc tế cho chiến dịch giai đoạn Nhận thức / Thương hiệu (Brand Awareness) để tiếp cận độ phủ rộng.'
  },
  {
    id: 'f_cvr',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức chuẩn xác tính <b>CVR (Conversion Rate · Tỷ lệ chuyển đổi từ click sang đơn)</b> là gì?',
    options: [
      'CVR = (Clicks ÷ Orders) × 100%',
      'CVR = (Orders ÷ Impressions) × 100%',
      'CVR = (Revenue ÷ Clicks) × 100%',
      'CVR = (Orders ÷ Clicks) × 100%'
    ],
    answer: 'D',
    explanation: '<b>CVR = (Orders ÷ Clicks) × 100%</b>.<br>Thước đo năng lực thuyết phục của Trang đích (Landing Page). CVR cao giúp hạ CPA mà không cần giảm giá thầu.'
  },
  {
    id: 'f_cpa',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức tính <b>CPA (Cost Per Acquisition · Chi phí mỗi đơn hàng)</b> và mối quan hệ với CPC & CVR là gì?',
    options: [
      'CPA = Ad Cost × Orders = CPC × CVR',
      'CPA = Ad Cost ÷ Orders = CPC ÷ CVR',
      'CPA = Orders ÷ Ad Cost = CVR ÷ CPC',
      'CPA = Revenue ÷ Orders = AOV ÷ CVR'
    ],
    answer: 'B',
    explanation: '<b>CPA = Ad Cost ÷ Orders = CPC ÷ CVR</b>.<br>⭐ <i>Trọng tâm đề thi:</i> Tăng CVR sẽ kéo CPA giảm xuống mà lưu lượng đơn hàng vẫn giữ nguyên hoặc tăng lên.'
  },
  {
    id: 'f_aov',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức tính <b>AOV (Average Order Value · Giá trị đơn hàng trung bình)</b> là gì?',
    options: [
      'AOV = Revenue ÷ Orders',
      'AOV = Orders ÷ Revenue',
      'AOV = Revenue ÷ Clicks',
      'AOV = (Revenue − Ad Cost) ÷ Orders'
    ],
    answer: 'A',
    explanation: '<b>AOV = Revenue ÷ Orders</b>.<br>Tăng AOV bằng bán kèm (cross-sell), combo, chính sách freeship theo ngưỡng là cách tăng trưởng doanh thu không tốn tiền quảng cáo.'
  },
  {
    id: 'f_roas',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức tính <b>ROAS (Return On Ad Spend)</b> và mối liên hệ với AOV & CPA là gì?',
    options: [
      'ROAS = Ad Cost ÷ Revenue = CPA ÷ AOV',
      'ROAS = Lợi nhuận ròng ÷ Ad Cost',
      'ROAS = Revenue ÷ Ad Cost = AOV ÷ CPA',
      'ROAS = (Revenue − Ad Cost) ÷ Revenue'
    ],
    answer: 'C',
    explanation: '<b>ROAS = Revenue ÷ Ad Cost = AOV ÷ CPA</b>.<br>⚠️ <i>Lưu ý:</i> ROAS chỉ đo doanh thu trên chi phí quảng cáo, không đo lợi nhuận vì chưa trừ giá vốn hàng bán.'
  },
  {
    id: 'f_roas_be',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức tính <b>Ngưỡng ROAS hòa vốn (Break-even ROAS)</b> của một chiến dịch là gì?',
    options: [
      'ROAS hòa vốn = 1 × Biên lợi nhuận gộp (Gross Margin)',
      'ROAS hòa vốn = 1 ÷ Biên lợi nhuận gộp (Gross Margin)',
      'ROAS hòa vốn = Doanh thu ÷ Lợi nhuận gộp',
      'ROAS hòa vốn = 1 ÷ (1 − Biên lợi nhuận gộp)'
    ],
    answer: 'B',
    explanation: '<b>ROAS hòa vốn = 1 ÷ Gross Margin</b>.<br>Ví dụ: Biên gộp 40% (0,4) → ROAS hòa vốn = 2,5x. Biên gộp 30% (0,3) → ROAS hòa vốn = 3,33x.'
  },
  {
    id: 'f_cvr_be',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Công thức tính <b>CVR cần đạt để hòa vốn (Break-even CVR)</b> khi biết CPC, AOV và Biên gộp là gì?',
    options: [
      'CVR hòa vốn = (AOV × Gross Margin) ÷ CPC',
      'CVR hòa vốn = CPC × AOV × Gross Margin',
      'CVR hòa vốn = CAC ÷ (AOV × Gross Margin)',
      'CVR hòa vốn = CPC ÷ (AOV × Gross Margin)'
    ],
    answer: 'D',
    explanation: '<b>CVR hòa vốn = CPC ÷ (AOV × Gross Margin)</b>.<br>Trong đó (AOV × Gross Margin) chính là lợi nhuận gộp mỗi đơn (CPA tối đa cho phép).'
  },
  {
    id: 'f_adrank',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: 'Thứ hạng quảng cáo (<b>Ad Rank</b>) trong cơ chế đấu giá được xác định theo công thức nào?',
    options: [
      'Thứ hạng QC = Giá thầu (Bid) × Điểm chất lượng (Quality Score)',
      'Thứ hạng QC = Giá thầu (Bid) + Điểm chất lượng (Quality Score)',
      'Thứ hạng QC = Tổng ngân sách ngày × CTR',
      'Thứ hạng QC = Giá thầu (Bid) ÷ Điểm chất lượng (Quality Score)'
    ],
    answer: 'A',
    explanation: '<b>Ad Rank = Bid × Quality Score</b>.<br>Trang đích tốt giúp tăng Quality Score, từ đó vượt qua đối thủ trả giá thầu cao hơn và trả CPC thực tế thấp hơn.'
  },
  {
    id: 'f_ltv',
    category: 'ltv',
    categoryLabel: '👥 Khách hàng LTV & CAC',
    prompt: 'Công thức tính <b>LTV (Customer Lifetime Value · Giá trị vòng đời khách hàng)</b> theo lợi nhuận gộp là gì?',
    options: [
      'LTV = AOV ÷ (f × t × Gross Margin)',
      'LTV = CAC × f × t × Gross Margin',
      'LTV = AOV × f × t × Gross Margin',
      'LTV = (AOV × Gross Margin) ÷ (f × t)'
    ],
    answer: 'C',
    explanation: '<b>LTV = AOV × f × t × Gross Margin</b>.<br>Với f là tần suất mua hàng (đơn/năm), t là thời gian gắn bó (năm), Gross Margin là tỷ lệ lợi nhuận gộp.'
  },
  {
    id: 'f_cac',
    category: 'ltv',
    categoryLabel: '👥 Khách hàng LTV & CAC',
    prompt: 'Công thức xác định <b>CAC (Customer Acquisition Cost · Chi phí thu hút 1 khách hàng mới)</b> là gì?',
    options: [
      'CAC = Số khách hàng mới ÷ Tổng chi phí Marketing & Sales',
      'CAC = Tổng chi phí Marketing & Sales ÷ Số khách hàng mới',
      'CAC = Tổng chi phí Marketing ÷ Tổng số đơn hàng (Orders)',
      'CAC = LTV ÷ Biên lợi nhuận gộp'
    ],
    answer: 'B',
    explanation: '<b>CAC = Tổng chi phí Marketing & Sales ÷ Số khách hàng mới</b>.<br>Mẫu số bắt buộc là số khách hàng mới, không phải tổng số đơn hàng.'
  },
  {
    id: 'f_ltv_cac_ratio',
    category: 'ltv',
    categoryLabel: '👥 Khách hàng LTV & CAC',
    prompt: 'Theo chuẩn tài chính TMĐT bền vững, tỷ số <b>LTV / CAC</b> nên đạt ngưỡng tối thiểu nào?',
    options: [
      'LTV / CAC ≥ 3 (CAC tối đa = LTV ÷ 3)',
      'LTV / CAC ≥ 1 (Hòa vốn là đủ)',
      'LTV / CAC ≥ 10',
      'LTV / CAC ≤ 2'
    ],
    answer: 'A',
    explanation: '<b>LTV / CAC ≥ 3</b> là chuẩn vàng của mô hình TMĐT bền vững. Nếu LTV / CAC < 1, doanh nghiệp đang chảy máu tiền tệ trên từng khách mới.'
  },
  {
    id: 'f_max_cpc',
    category: 'ltv',
    categoryLabel: '👥 Khách hàng LTV & CAC',
    prompt: 'Công thức xác định <b>CPC tối đa cho phép (Max CPC)</b> theo LTV và CAC là gì?',
    options: [
      'Max CPC = CAC tối đa ÷ CVR (khách mới)',
      'Max CPC = LTV × CVR (khách mới)',
      'Max CPC = CAC tối đa × AOV',
      'Max CPC = CAC tối đa × CVR (khách mới)'
    ],
    answer: 'D',
    explanation: '<b>Max CPC = CAC tối đa × CVR (khách mới)</b>.<br>Với CAC tối đa = LTV ÷ 3. Giúp đặt giá thầu trần trên Google/Facebook Ads để không bao giờ bị lỗ dài hạn.'
  },
  {
    id: 'f_cart_abandon',
    category: 'funnel',
    categoryLabel: '🔄 Phễu chuyển đổi TMĐT',
    prompt: 'Công thức tính <b>Tỷ lệ bỏ giỏ hàng (Cart Abandonment Rate)</b> trong phễu TMĐT là gì?',
    options: [
      'Tỷ lệ bỏ giỏ = (Lượt thêm giỏ ÷ Lượt xem SP) × 100%',
      'Tỷ lệ bỏ giỏ = [1 − (Lượt xem SP ÷ Tổng phiên)] × 100%',
      'Tỷ lệ bỏ giỏ = [1 − (Lượt thanh toán ÷ Lượt thêm giỏ)] × 100%',
      'Tỷ lệ bỏ giỏ = (Lượt thanh toán ÷ Lượt thêm giỏ) × 100%'
    ],
    answer: 'C',
    explanation: '<b>Tỷ lệ bỏ giỏ = [1 − (Lượt thanh toán ÷ Lượt thêm giỏ)] × 100%</b>.<br>6 nguyên nhân hàng đầu: phí ship bất ngờ, bắt tạo tài khoản, thiếu cổng thanh toán quen thuộc, bảo mật kém.'
  },
  {
    id: 'f_full_cvr',
    category: 'funnel',
    categoryLabel: '🔄 Phễu chuyển đổi TMĐT',
    prompt: 'Trong phễu TMĐT 4 bước (Phiên → Xem SP → Thêm giỏ → Thanh toán → Hoàn tất), <b>CVR toàn phễu</b> tính bằng:',
    options: [
      'CVR toàn phễu = (Lượt thanh toán ÷ Tổng phiên) × 100%',
      'CVR toàn phễu = (Lượt hoàn tất đơn ÷ Tổng phiên) × 100%',
      'CVR toàn phễu = (Lượt thêm giỏ ÷ Lượt xem SP) × 100%',
      'CVR toàn phễu = (Lượt hoàn tất đơn ÷ Lượt thanh toán) × 100%'
    ],
    answer: 'B',
    explanation: '<b>CVR toàn phễu = (Lượt hoàn tất đơn ÷ Tổng phiên) × 100%</b>.<br>Đo lường năng lực chuyển hóa tổng thể từ lượt truy cập ban đầu thành doanh thu cuối cùng.'
  },
  {
    id: 'f_payment_fee',
    category: 'ops',
    categoryLabel: '📦 Vận hành & Phí cổng',
    prompt: 'Công thức tính <b>Tổng chi phí cổng thanh toán</b> cho một đơn hàng là gì?',
    options: [
      'Phí = Phí cố định + (% phí × Giá trị đơn hàng)',
      'Phí = Phí cố định × (% phí × Giá trị đơn hàng)',
      'Phí = % phí × Giá trị đơn hàng − Phí cố định',
      'Phí = (Giá trị đơn hàng ÷ % phí) + Phí cố định'
    ],
    answer: 'A',
    explanation: '<b>Phí = Phí cố định + (% phí × Giá trị đơn hàng)</b>.<br>Phần phí cố định chiếm tỷ trọng rất lớn ở đơn hàng nhỏ, ăn sâu vào lãi gộp (đơn 150k phí chiếm 11,3% lãi gộp).'
  },
  {
    id: 'f_logistics',
    category: 'ops',
    categoryLabel: '📦 Vận hành & Phí cổng',
    prompt: 'Công thức tính <b>Tỷ lệ hoàn hàng (Return Rate)</b> trong Logistics TMĐT là gì?',
    options: [
      'Tỷ lệ hoàn hàng = (Tổng số đơn xuất ÷ Số đơn hoàn hủy) × 100%',
      'Tỷ lệ hoàn hàng = (Số đơn hoàn hủy ÷ Số đơn giao thành công) × 100%',
      'Tỷ lệ hoàn hàng = (Chi phí hoàn ÷ Tổng chi phí vận chuyển) × 100%',
      'Tỷ lệ hoàn hàng = (Số đơn hoàn hủy ÷ Tổng số đơn xuất) × 100%'
    ],
    answer: 'D',
    explanation: '<b>Tỷ lệ hoàn hàng = (Số đơn hoàn hủy ÷ Tổng số đơn xuất) × 100%</b>.<br>Ngưỡng an toàn tài chính: Chi phí logistics mỗi đơn ≤ Lợi nhuận gộp mỗi đơn.'
  },
  {
    id: 'f_security_risk',
    category: 'security',
    categoryLabel: '🛡️ An ninh thông tin',
    prompt: 'Công thức định lượng <b>Rủi ro an ninh thông tin (Information Security Risk)</b> trong TMĐT là:',
    options: [
      'Rủi ro (R) = Mối đe dọa (T) + Lỗ hổng (V) + Tác động (I)',
      'Rủi ro (R) = Mối đe dọa (T) × Lỗ hổng (V) × Tác động (I)',
      'Rủi ro (R) = (Mối đe dọa + Lỗ hổng) ÷ Tác động',
      'Rủi ro (R) = Lỗ hổng (V) × Tác động (I) − Mối đe dọa (T)'
    ],
    answer: 'B',
    explanation: '<b>R = T × V × I (Threat × Vulnerability × Impact)</b>.<br>Doanh nghiệp không thể triệt tiêu mối đe dọa (T), chỉ có thể giảm lỗ hổng (V) và giảm tác động (I).'
  },
  {
    id: 'f_slide_ctr',
    category: 'slide',
    categoryLabel: '🎯 Bài tập trên Slide',
    prompt: '[Bài tập Slide] Chiến dịch có <b>200.000 lượt hiển thị (Impressions)</b> và thu được <b>4.000 lượt nhấp (Clicks)</b>. Tỷ lệ CTR là:',
    options: [
      '0,2%',
      '5,0%',
      '2,0%',
      '1,0%'
    ],
    answer: 'C',
    explanation: '<b>CTR = (4.000 ÷ 200.000) × 100% = 2,0%</b>.<br>Chuẩn ngành TMĐT thường từ 1,0% – 2,5%, do đó 2,0% là mức hiệu quả tốt.'
  },
  {
    id: 'f_slide_cpa',
    category: 'slide',
    categoryLabel: '🎯 Bài tập trên Slide',
    prompt: '[Bài tập Slide] Chi phí QC <b>20.000.000 đ</b>, thu được <b>4.000 clicks</b> và <b>100 đơn hàng</b>. Giá CPC và CPA lần lượt là:',
    options: [
      'CPC = 5.000 đ · CPA = 200.000 đ',
      'CPC = 4.000 đ · CPA = 150.000 đ',
      'CPC = 5.000 đ · CPA = 800.000 đ',
      'CPC = 2.000 đ · CPA = 200.000 đ'
    ],
    answer: 'A',
    explanation: '<b>CPC = 20.000.000 ÷ 4.000 = 5.000 đ</b>.<br><b>CPA = 20.000.000 ÷ 100 = 200.000 đ</b> (hoặc CPC ÷ CVR = 5.000 ÷ 0,025 = 200.000 đ).'
  },
  {
    id: 'f_slide_roas',
    category: 'slide',
    categoryLabel: '🎯 Bài tập trên Slide',
    prompt: '[Bài tập Slide] Sản phẩm có <b>Biên lợi nhuận gộp là 30%</b>. Ngưỡng ROAS hòa vốn của chiến dịch là:',
    options: [
      '2,50x',
      '3,33x',
      '4,00x',
      '3,00x'
    ],
    answer: 'B',
    explanation: '<b>ROAS hòa vốn = 1 ÷ 0,3 ≈ 3,33x</b>.<br>Vì ROAS thực tế trên slide đạt 4,0x (80tr / 20tr) > 3,33x nên chiến dịch CÓ LÃI (+4 triệu).'
  },
  {
    id: 'f_exam_123',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: '[Đề cương · Câu 123] Chiến dịch chi <b>6 triệu đồng</b>, đạt <b>2 triệu lượt hiển thị</b>. Chi phí CPM là:',
    options: [
      '300 đ',
      '30.000 đ',
      '6.000 đ',
      '3.000 đ'
    ],
    answer: 'D',
    explanation: '<b>CPM = (Ad Cost ÷ Impressions) × 1.000</b> = (6.000.000 ÷ 2.000.000) × 1.000 = <b>3.000 đ</b>.'
  },
  {
    id: 'f_exam_125',
    category: 'ads',
    categoryLabel: '📊 Quảng cáo số',
    prompt: '[Đề cương · Câu 125] Doanh nghiệp có <b>Biên lợi nhuận gộp 40%</b>. Ngưỡng ROAS hòa vốn là:',
    options: [
      '2,5x',
      '3,33x',
      '4,0x',
      '2,0x'
    ],
    answer: 'A',
    explanation: '<b>ROAS hòa vốn = 1 ÷ Gross Margin</b> = 1 ÷ 0,4 = <b>2,5x</b> (tương đương 250%).'
  }
];

let formulaQuizIndex = 0;
let formulaQuizShuffled = false;
let formulaQuizActiveList = [];
let formulaQuizState = (typeof state !== 'undefined' && state.formula) ? state.formula : {};
let formulaQuizStreak = 0;
let formulaCardFlipped = false;

function setupFormulaQuizList() {
  let list = FORMULA_FLASHCARDS.filter(q => {
    if (activeFormulaCategory === 'all') return true;
    if (activeFormulaCategory === 'slide') return q.category === 'slide';
    return q.category === activeFormulaCategory;
  });
  if (!list.length) list = [...FORMULA_FLASHCARDS];
  if (formulaQuizShuffled) {
    list = [...list].sort(() => Math.random() - 0.5);
  }
  formulaQuizActiveList = list;
  if (formulaQuizIndex >= formulaQuizActiveList.length) {
    formulaQuizIndex = 0;
  }
}
setupFormulaQuizList();

function findFormulaDetails(q) {
  if (!q) return null;
  const qPromptLower = (q.prompt || '').toLowerCase();
  const qIdLower = (q.id || '').toLowerCase();
  let match = FORMULA_LIBRARY.find(f => {
    if (f.category !== q.category) return false;
    const titleWords = f.title.toLowerCase().split(/[\s·,()]+/);
    return titleWords.some(w => w.length > 2 && (qPromptLower.includes(w) || qIdLower.includes(w)));
  });
  if (!match) {
    match = FORMULA_LIBRARY.find(f => f.category === q.category);
  }
  return match;
}

function openFormulaModal() {
  const modal = $('#formulaModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  formulaCardFlipped = false;
  setupFormulaQuizList();
  renderFormulaModalContent();
  if (typeof playFlipSound === 'function') playFlipSound();
}

function closeFormulaModal() {
  const modal = $('#formulaModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  updateFormulaHeroStats();
}

function handleFormulaOverlayClick(event) {
  if (event.target && event.target.id === 'formulaModal') {
    closeFormulaModal();
  }
}

function flipFormulaCard() {
  const card = $('#formula3DCard');
  if (!card) return;
  formulaCardFlipped = !formulaCardFlipped;
  card.classList.toggle('is-flipped', formulaCardFlipped);
  if (typeof playFlipSound === 'function') playFlipSound();

  const flipBtns = document.querySelectorAll('.flip-toggle-btn');
  flipBtns.forEach(btn => {
    btn.innerHTML = formulaCardFlipped
      ? '<span>↩</span> <span class="hide-mobile">Lật lại câu hỏi (Space)</span><span class="show-mobile">Câu hỏi</span>'
      : '<span>🔄</span> <span class="hide-mobile">Lật thẻ 3D (Space)</span><span class="show-mobile">Lật 3D</span>';
  });
}

function updateFormulaHeroStats() {
  const correctEl = $('#fpCorrectCount');
  const streakEl = $('#fpStreakRecord');
  const total = FORMULA_FLASHCARDS.length;
  const correctCount = FORMULA_FLASHCARDS.filter(item => formulaQuizState[item.id] && formulaQuizState[item.id].correct).length;
  if (correctEl) correctEl.textContent = correctCount + '/' + total;
  if (streakEl) streakEl.textContent = (state.maxStreak || formulaQuizStreak || 0) + ' 🔥';
}

function renderFormulaPracticeHero() {
  const total = FORMULA_FLASHCARDS.length;
  const correctCount = FORMULA_FLASHCARDS.filter(item => formulaQuizState[item.id] && formulaQuizState[item.id].correct).length;
  const streak = (typeof state !== 'undefined' && state.maxStreak) ? state.maxStreak : formulaQuizStreak;

  return '<div class="formula-practice-card">' +
    '<div class="formula-practice-info">' +
      '<div class="formula-practice-badge">⚡ ĐẤU TRƯỜNG CÔNG THỨC 3D · QUIZIZZ / WAYGROUND STYLE</div>' +
      '<h3 class="formula-practice-title">Ôn tập Flashcard 3D & Trắc nghiệm ABCD</h3>' +
      '<p class="formula-practice-desc">' +
        'Luyện phản xạ ghi nhớ toàn bộ <b>' + total + ' thẻ công thức</b> trọng tâm trên Slide & Đề cương 121 trang. Chế độ lật thẻ 3D trực quan với phân tích biến số chi tiết, giải thích chuyên sâu, tính điểm và đếm chuỗi streak!' +
      '</p>' +
      '<div class="formula-practice-stats-preview">' +
        '<span class="fp-stat-tag">📚 <b>' + total + '</b> Thẻ công thức</span>' +
        '<span class="fp-stat-tag">🎯 Đã đúng: <b id="fpCorrectCount">' + correctCount + '/' + total + '</b></span>' +
        '<span class="fp-stat-tag">🔥 Kỷ lục chuỗi: <b id="fpStreakRecord">' + streak + ' 🔥</b></span>' +
        '<span class="fp-stat-tag hide-mobile">⌨ Phím tắt A-D, Space, Enter</span>' +
      '</div>' +
    '</div>' +
    '<div class="formula-practice-cta">' +
      '<button class="btn-launch-flashcard" onclick="openFormulaModal()" title="Mở phòng ôn tập Flashcard 3D">' +
        '<span class="launch-icon">🚀</span>' +
        '<div class="launch-text">' +
          '<span class="launch-title">Bắt đầu ôn tập Flashcard 3D</span>' +
          '<span class="launch-sub">' + total + ' thẻ trắc nghiệm & công thức</span>' +
        '</div>' +
        '<span class="launch-arrow">➔</span>' +
      '</button>' +
    '</div>' +
  '</div>';
}

function renderFormulaModalContent() {
  const container = $('#formulaModalContent');
  if (!container) return;

  const list = formulaQuizActiveList && formulaQuizActiveList.length ? formulaQuizActiveList : FORMULA_FLASHCARDS;
  if (formulaQuizIndex >= list.length) formulaQuizIndex = 0;
  if (formulaQuizIndex < 0) formulaQuizIndex = list.length - 1;

  const q = list[formulaQuizIndex];
  const r = formulaQuizState[q.id];
  const total = list.length;
  const current = formulaQuizIndex + 1;
  const answeredCount = list.filter(item => formulaQuizState[item.id] && formulaQuizState[item.id].correct).length;
  const matchedFormula = findFormulaDetails(q);
  const correctOptionText = q.options[['A', 'B', 'C', 'D'].indexOf(q.answer)];

  // Dots progress bar
  const dotsHtml = '<div class="f3d-dots-bar">' +
    list.map((item, idx) => {
      const stateItem = formulaQuizState[item.id];
      let dotCls = 'f3d-dot';
      if (idx === formulaQuizIndex) dotCls += ' current';
      else if (stateItem) dotCls += stateItem.correct ? ' correct' : ' wrong';
      return '<span class="' + dotCls + '" onclick="jumpFormulaQuiz(' + idx + ')" title="Thẻ ' + (idx + 1) + '"></span>';
    }).join('') +
  '</div>';

  // Options Grid
  let optionsHtml = '<div class="f3d-options-grid">';
  ['A', 'B', 'C', 'D'].forEach((letter, i) => {
    const optText = q.options[i];
    let btnCls = 'f3d-opt-btn';
    let statusBadge = '';
    if (r) {
      if (letter === q.answer) {
        btnCls += ' correct';
        statusBadge = '<span class="f3d-opt-status-tag" style="color:#059669;">✓ Đúng</span>';
      } else if (letter === r.choice) {
        btnCls += ' wrong';
        statusBadge = '<span class="f3d-opt-status-tag" style="color:#dc2626;">✕ Đã chọn</span>';
      } else {
        btnCls += ' dimmed';
      }
    }
    optionsHtml += '<button class="' + btnCls + '" data-opt="' + letter + '" onclick="answerFormulaQuiz(\'' + letter + '\')" ' + (r ? 'disabled' : '') + '>' +
      '<span class="f3d-opt-letter">' + letter + '</span>' +
      '<span class="f3d-opt-text">' + optText + '</span>' +
      statusBadge +
    '</button>';
  });
  optionsHtml += '</div>';

  // Feedback Box (Front Face)
  let feedbackHtml = '';
  if (r) {
    feedbackHtml = '<div class="f3d-feedback ' + (r.correct ? 'good' : 'bad') + '">' +
      '<div class="f3d-fb-title">' +
        '<span>' + (r.correct ? '🎉 Xuất sắc! Bạn đã chọn đáp án chính xác!' : '💡 Chưa chính xác! Đáp án chuẩn là: <b>' + q.answer + '</b>') + '</span>' +
      '</div>' +
      '<div class="f3d-fb-body">' + q.explanation + '</div>' +
      '<div class="f3d-fb-action">' +
        '<button class="btn btn-sm" onclick="flipFormulaCard()" style="font-size:12px;padding:6px 12px;background:rgba(99,102,241,0.12);color:#6366f1;border:1px solid rgba(99,102,241,0.3);border-radius:8px;font-weight:700;cursor:pointer;">' +
          '🔄 Lật xem công thức 3D & biến số chi tiết (Space) ➔' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  // Back Face: Formula Equation + Variables + Tip + Example
  let varsHtml = '';
  if (matchedFormula && matchedFormula.vars && matchedFormula.vars.length) {
    varsHtml = '<div class="f3d-section-block">' +
      '<div class="f3d-section-title">🔍 Ý nghĩa các biến số trong công thức:</div>' +
      '<ul class="f3d-vars-list">' +
        matchedFormula.vars.map(v => '<li>' + v + '</li>').join('') +
      '</ul>' +
    '</div>';
  }

  let tipHtml = '';
  if (matchedFormula && matchedFormula.tip) {
    tipHtml = '<div class="f3d-tip-callout">' + matchedFormula.tip + '</div>';
  }

  let exampleHtml = '';
  if (matchedFormula && matchedFormula.example) {
    exampleHtml = '<div class="f3d-example-callout">' +
      '<div style="font-weight:750;margin-bottom:4px;color:#4f46e5;">📝 Ví dụ bài tập áp dụng thực tế:</div>' +
      matchedFormula.example +
    '</div>';
  }

  const isFirst = formulaQuizIndex === 0;
  const isLast = formulaQuizIndex === total - 1;

  const modalHtml = 
    // MODAL HEADER
    '<div class="f3d-modal-header">' +
      '<div class="f3d-header-left">' +
        '<span class="f3d-brand-badge">⚡ FLASHCARD 3D</span>' +
        '<span class="f3d-counter-pill" id="formulaModalTitle">Thẻ ' + current + ' / ' + total + '</span>' +
      '</div>' +
      '<div class="f3d-header-stats">' +
        '<span class="f3d-stat-pill score" title="Số câu đúng">🎯 ' + answeredCount + '/' + total + '</span>' +
        '<span class="f3d-stat-pill streak" title="Chuỗi đúng liên tiếp">🔥 ' + formulaQuizStreak + '</span>' +
      '</div>' +
      '<div class="f3d-header-actions">' +
        '<button class="f3d-btn-icon ' + (formulaQuizShuffled ? 'active' : '') + '" onclick="toggleFormulaQuizShuffle()" title="Trộn ngẫu nhiên">' +
          '<span>⇄</span> <span class="hide-mobile">Trộn</span>' +
        '</button>' +
        '<button class="f3d-btn-icon" onclick="resetFormulaQuiz()" title="Đặt lại toàn bộ tiến độ">' +
          '<span>🔄</span> <span class="hide-mobile">Đặt lại</span>' +
        '</button>' +
        '<button class="f3d-close-btn" onclick="closeFormulaModal()" title="Đóng phòng ôn tập (Esc)">✕</button>' +
      '</div>' +
    '</div>' +

    // DOTS PROGRESS STRIP
    dotsHtml +

    // STAGE / 3D CARD
    '<div class="f3d-stage">' +
      '<div class="f3d-card-wrap">' +
        '<div id="formula3DCard" class="f3d-card ' + (formulaCardFlipped ? 'is-flipped' : '') + '">' +
          
          // FRONT FACE
          '<div class="f3d-face f3d-front">' +
            '<div class="f3d-top-meta">' +
              '<span class="f3d-cat-pill">' + q.categoryLabel + '</span>' +
              '<button class="f3d-flip-hint-pill" onclick="flipFormulaCard()" title="Bấm phím Space để lật thẻ">' +
                '<span>🔄 Lật xem công thức (Space)</span>' +
              '</button>' +
            '</div>' +
            '<div class="f3d-prompt">' + q.prompt + '</div>' +
            optionsHtml +
            feedbackHtml +
          '</div>' +

          // BACK FACE (3D FLIPPED)
          '<div class="f3d-face f3d-back">' +
            '<div class="f3d-back-header">' +
              '<span class="f3d-back-title">📐 CHI TIẾT CÔNG THỨC & BIẾN SỐ</span>' +
              '<span class="f3d-cat-pill">' + q.categoryLabel + '</span>' +
            '</div>' +
            '<div class="f3d-eq-box">' +
              '<div class="f3d-eq-label">Công thức chuẩn:</div>' +
              '<div class="f3d-eq-math">' + (matchedFormula ? matchedFormula.equation : correctOptionText) + '</div>' +
            '</div>' +
            '<div class="f3d-section-block">' +
              '<div class="f3d-section-title">💡 Giải thích chi tiết & logic ghi nhớ:</div>' +
              '<div>' + q.explanation + '</div>' +
            '</div>' +
            varsHtml +
            tipHtml +
            exampleHtml +
            '<div class="f3d-back-action-row">' +
              '<button class="btn primary" onclick="flipFormulaCard()" style="font-size:13px;padding:8px 18px;">' +
                '↩ Quay lại câu hỏi trắc nghiệm (Space)' +
              '</button>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +
    '</div>' +

    // MODAL FOOTER
    '<div class="f3d-modal-footer">' +
      '<div class="f3d-footer-nav">' +
        '<button class="btn" onclick="navFormulaQuiz(-1)" ' + (isFirst ? 'disabled style="opacity:0.4;"' : '') + '>' +
          '← <span class="hide-mobile">Thẻ trước (←)</span><span class="show-mobile">Trước</span>' +
        '</button>' +
        '<div class="f3d-footer-center">' +
          (r ? '<button class="btn" onclick="retryFormulaQuiz()" style="font-size:12px;padding:7px 11px;">🔄 <span class="hide-mobile">Làm lại (R)</span><span class="show-mobile">Lại</span></button>' : '') +
          '<button class="btn flip-toggle-btn" onclick="flipFormulaCard()" style="font-size:12px;padding:7px 12px;border-color:#6366f1;color:#6366f1;">' +
            '<span>🔄</span> <span class="hide-mobile">Lật thẻ 3D (Space)</span><span class="show-mobile">Lật 3D</span>' +
          '</button>' +
        '</div>' +
        '<button class="btn primary" onclick="navFormulaQuiz(1)">' +
          (isLast && r ? '🎉 Hoàn thành' : '<span class="hide-mobile">Thẻ tiếp theo (Enter)</span><span class="show-mobile">Tiếp</span> →') +
        '</button>' +
      '</div>' +
      '<div class="f3d-footer-hint hide-mobile">' +
        'Phím tắt: <b>1-4 / A-D</b> chọn đáp án • <b>Space</b> lật thẻ 3D • <b>Enter / →</b> câu tiếp • <b>←</b> câu trước • <b>R</b> làm lại • <b>Esc</b> đóng' +
      '</div>' +
    '</div>';

  container.innerHTML = modalHtml;
}

function answerFormulaQuiz(choice) {
  const list = formulaQuizActiveList && formulaQuizActiveList.length ? formulaQuizActiveList : FORMULA_FLASHCARDS;
  if (!list || !list.length) return;
  const q = list[formulaQuizIndex];
  if (!q) return;

  if (formulaQuizState[q.id]) return;

  const isCorrect = choice === q.answer;
  formulaQuizState[q.id] = { choice: choice, correct: isCorrect };

  if (isCorrect) {
    formulaQuizStreak++;
    if (typeof state !== 'undefined' && formulaQuizStreak > (state.maxStreak || 0)) {
      state.maxStreak = formulaQuizStreak;
    }
    if (typeof playCorrectSound === 'function') playCorrectSound();
    if (formulaQuizStreak >= 5 && formulaQuizStreak % 5 === 0) {
      if (typeof playStreakCelebration === 'function') playStreakCelebration();
      if (typeof triggerConfetti === 'function') triggerConfetti();
      if (typeof showToast === 'function') showToast('🔥 Chuỗi ' + formulaQuizStreak + ' câu đúng liên tiếp! Quá đỉnh!');
    }
  } else {
    formulaQuizStreak = 0;
    if (typeof playWrongSound === 'function') playWrongSound();
  }

  if (typeof state !== 'undefined' && state.formula) {
    state.formula[q.id] = { choice: choice, correct: isCorrect };
  }
  if (typeof persist === 'function') persist();
  if (typeof stats === 'function') stats();
  updateFormulaHeroStats();
  if ($('#formulaModal')?.classList.contains('open')) {
    renderFormulaModalContent();
  }
}

function navFormulaQuiz(dir) {
  const list = formulaQuizActiveList && formulaQuizActiveList.length ? formulaQuizActiveList : FORMULA_FLASHCARDS;
  if (!list || !list.length) return;
  formulaCardFlipped = false;
  const nextIdx = formulaQuizIndex + dir;
  if (nextIdx >= 0 && nextIdx < list.length) {
    formulaQuizIndex = nextIdx;
    if ($('#formulaModal')?.classList.contains('open')) {
      renderFormulaModalContent();
    }
    if (typeof playFlipSound === 'function') playFlipSound();
  } else if (nextIdx >= list.length) {
    if (typeof triggerConfetti === 'function') triggerConfetti();
    if (typeof showToast === 'function') showToast('🎉 Bạn đã hoàn thành toàn bộ thẻ ôn tập công thức!');
  }
}

function jumpFormulaQuiz(idx) {
  formulaCardFlipped = false;
  formulaQuizIndex = idx;
  if ($('#formulaModal')?.classList.contains('open')) {
    renderFormulaModalContent();
  }
  if (typeof playFlipSound === 'function') playFlipSound();
}

function retryFormulaQuiz() {
  const list = formulaQuizActiveList && formulaQuizActiveList.length ? formulaQuizActiveList : FORMULA_FLASHCARDS;
  const q = list[formulaQuizIndex];
  formulaCardFlipped = false;
  if (q && formulaQuizState[q.id]) {
    delete formulaQuizState[q.id];
    if (typeof state !== 'undefined' && state.formula) {
      delete state.formula[q.id];
    }
    if (typeof persist === 'function') persist();
    if (typeof stats === 'function') stats();
    updateFormulaHeroStats();
    if ($('#formulaModal')?.classList.contains('open')) {
      renderFormulaModalContent();
    }
  }
}

function resetFormulaQuiz() {
  formulaCardFlipped = false;
  formulaQuizIndex = 0;
  formulaQuizStreak = 0;
  FORMULA_FLASHCARDS.forEach(q => {
    delete formulaQuizState[q.id];
    if (typeof state !== 'undefined' && state.formula) {
      delete state.formula[q.id];
    }
  });
  if (typeof persist === 'function') persist();
  if (typeof stats === 'function') stats();
  if (typeof showToast === 'function') showToast('🔄 Đã đặt lại toàn bộ tiến độ ôn tập công thức');
  updateFormulaHeroStats();
  if ($('#formulaModal')?.classList.contains('open')) {
    renderFormulaModalContent();
  }
}

function toggleFormulaQuizShuffle() {
  formulaCardFlipped = false;
  formulaQuizShuffled = !formulaQuizShuffled;
  formulaQuizIndex = 0;
  setupFormulaQuizList();
  if (typeof showToast === 'function') {
    showToast(formulaQuizShuffled ? '⇄ Đang trộn thứ tự thẻ ôn tập' : '↩ Thứ tự chuẩn theo đề cương');
  }
  if ($('#formulaModal')?.classList.contains('open')) {
    renderFormulaModalContent();
  }
}

function renderFormulas() {
  const filteredList = FORMULA_LIBRARY.filter(f => {
    const matchCat = activeFormulaCategory === 'all' || f.category === activeFormulaCategory;
    const term = formulaSearchTerm.toLowerCase();
    const matchSearch = !term || f.title.toLowerCase().includes(term) || f.equation.toLowerCase().includes(term) || f.tip.toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  const html = '<div class="formula-hub-container">' +
    // HERO CARD
    '<div class="formula-hero-card">' +
      '<div class="formula-hero-badge">📐 SỔ TAY CÔNG THỨC & BÀI TẬP CHUẨN</div>' +
      '<h2 class="formula-hero-title">Tổng hợp toàn bộ công thức trên Slide & Đề cương 121 trang</h2>' +
      '<p class="formula-hero-desc">' +
        'Bao gồm bài tập quảng cáo số, LTV & CAC, phễu chuyển đổi, chi phí cổng thanh toán, logistics và công thức rủi ro an toàn thông tin kèm máy tính mô phỏng trực tiếp.' +
      '</p>' +
      // CATEGORY CHIPS
      '<div class="formula-filter-row">' +
        FORMULA_CATEGORIES.map(c => 
          '<button class="formula-chip ' + (activeFormulaCategory === c.id ? 'active' : '') + '" data-cat="' + c.id + '">' +
            '<span class="hide-mobile">' + c.label + '</span>' +
            '<span class="show-mobile">' + (c.shortLabel || c.label) + '</span>' +
          '</button>'
        ).join('') +
      '</div>' +
    '</div>' +

    // SECTION 0: HERO ACTION CARD FOR 3D FLASHCARD MODAL (WAYGROUND / QUIZIZZ STYLE)
    renderFormulaPracticeHero() +

    // SECTION 1: SLIDE EXERCISE SHOWCASE
    (activeFormulaCategory === 'all' || activeFormulaCategory === 'slide' ? 
      '<div class="slide-showcase-card">' +
        '<div class="slide-showcase-header">' +
          '<h3 class="slide-showcase-title">🎯 BÀI TẬP THỰC HÀNH TRÊN SLIDE BÀI GIẢNG (BUỔI 6)</h3>' +
          '<span class="badge-pill" style="background:#8b5cf6;color:#fff;">CÓ TRONG ĐỀ THI</span>' +
        '</div>' +
        
        '<div>' +
          '<div style="font-size:13.5px;font-weight:700;color:var(--muted);margin-bottom:8px;">THÔNG SỐ ĐỀ BÀI CHO:</div>' +
          '<div class="slide-params-grid">' +
            '<div class="slide-param-box"><span class="slide-param-label">Impressions</span><span class="slide-param-val">200.000</span></div>' +
            '<div class="slide-param-box"><span class="slide-param-label">Clicks</span><span class="slide-param-val">4.000</span></div>' +
            '<div class="slide-param-box"><span class="slide-param-label">Ad Cost</span><span class="slide-param-val">20.000.000 đ</span></div>' +
            '<div class="slide-param-box"><span class="slide-param-label">Orders</span><span class="slide-param-val">100 đơn</span></div>' +
            '<div class="slide-param-box"><span class="slide-param-label">Revenue</span><span class="slide-param-val">80.000.000 đ</span></div>' +
            '<div class="slide-param-box"><span class="slide-param-label">Gross Margin</span><span class="slide-param-val">30%</span></div>' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<div style="font-size:13.5px;font-weight:700;color:var(--muted);margin-bottom:8px;">LỜI GIẢI CHI TIẾT TỪNG CHỈ SỐ:</div>' +
          '<div class="solutions-grid">' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">CTR</span><span class="solution-res-badge">2,0%</span></div>' +
              '<div class="solution-math">CTR = (4.000 ÷ 200.000) × 100%</div>' +
              '<div class="solution-desc">Tỷ lệ nhấp chuột tốt (chuẩn TMĐT 1–2%)</div>' +
            '</div>' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">CPC</span><span class="solution-res-badge">5.000 đ</span></div>' +
              '<div class="solution-math">CPC = 20.000.000 ÷ 4.000</div>' +
              '<div class="solution-desc">Chi phí trả cho mỗi lượt truy cập</div>' +
            '</div>' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">CPM</span><span class="solution-res-badge">100.000 đ</span></div>' +
              '<div class="solution-math">CPM = (20.000.000 ÷ 200.000) × 1.000</div>' +
              '<div class="solution-desc">Chi phí cho 1.000 lượt hiển thị</div>' +
            '</div>' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">CVR</span><span class="solution-res-badge">2,5%</span></div>' +
              '<div class="solution-math">CVR = (100 ÷ 4.000) × 100%</div>' +
              '<div class="solution-desc">Tỷ lệ chuyển đổi từ click sang đơn</div>' +
            '</div>' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">CPA</span><span class="solution-res-badge">200.000 đ</span></div>' +
              '<div class="solution-math">CPA = 20.000.000 ÷ 100 = 5.000 ÷ 0,025</div>' +
              '<div class="solution-desc">Chi phí quảng cáo để có 1 đơn hàng</div>' +
            '</div>' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">AOV</span><span class="solution-res-badge">800.000 đ</span></div>' +
              '<div class="solution-math">AOV = 80.000.000 ÷ 100</div>' +
              '<div class="solution-desc">Giá trị trung bình mỗi đơn hàng</div>' +
            '</div>' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">ROAS</span><span class="solution-res-badge">4,0x (400%)</span></div>' +
              '<div class="solution-math">ROAS = 80.000.000 ÷ 20.000.000</div>' +
              '<div class="solution-desc">1 đồng chi phí mang về 4 đồng doanh thu</div>' +
            '</div>' +
            '<div class="solution-item-card">' +
              '<div class="solution-top-row"><span class="solution-code">ROAS hòa vốn</span><span class="solution-res-badge">3,33x</span></div>' +
              '<div class="solution-math">ROAS hoà vốn = 1 ÷ 0,3 ≈ 3,33x</div>' +
              '<div class="solution-desc">Ngưỡng tối thiểu để không bị lỗ</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<div style="font-size:13.5px;font-weight:700;color:var(--muted);margin-bottom:8px;">TRẢ LỜI 2 CÂU HỎI QUẢN TRỊ TRÊN SLIDE:</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            '<div class="qa-card">' +
              '<div class="qa-q">❓ Câu 1: Campaign có hiệu quả về mặt quảng cáo không?</div>' +
              '<div class="qa-ans">' +
                '<strong>KẾT LUẬN: CÓ HIỆU QUẢ CAO.</strong><br>' +
                '• <strong>CTR = 2,0%</strong>: Mẫu quảng cáo hấp dẫn, vượt mức trung bình ngành TMĐT (thường 1–1,5%).<br>' +
                '• <strong>CPC = 5.000 đ</strong>: Chi phí thu hút lượt truy cập ở mức rất cạnh tranh và hợp lý.<br>' +
                '• <strong>CVR = 2,5%</strong>: Trang đích (Landing Page) thuyết phục tốt, đạt chuẩn vàng của web TMĐT.<br>' +
                '• <strong>CPA = 200.000 đ</strong>: Chi phí mỗi đơn chỉ chiếm 25% giá trị đơn hàng (AOV = 800.000 đ), nằm trong biên độ an toàn.' +
              '</div>' +
            '</div>' +

            '<div class="qa-card" style="border-left-color:var(--red);">' +
              '<div class="qa-q">❓ Câu 2: ROAS = 4x có đủ để kết luận campaign có lãi không? Vì sao?</div>' +
              '<div class="qa-ans">' +
                '<strong>KẾT LUẬN: CHƯA ĐỦ ĐỂ KẾT LUẬN!</strong><br>' +
                '• <strong>Bản chất:</strong> ROAS (Return On Ad Spend) chỉ đo lường <em>Doanh thu / Chi phí quảng cáo</em>, <strong>hoàn toàn chưa tính đến Giá vốn hàng bán (COGS)</strong> và các chi phí vận hành (đóng gói, giao hàng, nhân sự).<br>' +
                '• <strong>Muốn kết luận có lãi:</strong> Bắt buộc phải so sánh với <strong>Ngưỡng ROAS hòa vốn = 1 ÷ Biên lợi nhuận gộp</strong>.<br>' +
                '• <strong>Trong bài toán cụ thể này:</strong> Vì đề bài cho Biên lợi nhuận gộp = 30%, ta tính được ROAS hòa vốn = 1 ÷ 0,3 ≈ <strong>3,33x</strong>. Vì ROAS thực tế (4,0x) > 3,33x nên chiến dịch này <strong>CÓ LÃI</strong> (+4.000.000 đ lãi ròng).<br>' +
                '• <strong>Ví dụ phản chứng:</strong> Nếu một sản phẩm công nghệ có biên gộp chỉ 20% → ROAS hòa vốn = 1 ÷ 0,2 = 5,0x. Khi đó dù đạt ROAS = 4x thì doanh nghiệp <strong>VẪN BỊ LỖ 4 TRIỆU ĐỒNG</strong> (Lãi gộp 16tr < Chi phí QC 20tr).' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' : ''
    ) +

    // SECTION 2: INTERACTIVE SIMULATOR
    (activeFormulaCategory === 'all' || activeFormulaCategory === 'slide' || activeFormulaCategory === 'ads' ? 
      '<div class="calc-card">' +
        '<div class="calc-header">' +
          '<div>' +
            '<h3 style="font-size:18px;font-weight:800;color:var(--primary);margin:0;">⚡ MÁY TÍNH MÔ PHỎNG CHIẾN DỊCH QUẢNG CÁO & LÃI/LỖ</h3>' +
            '<p style="font-size:12.5px;color:var(--muted);margin:3px 0 0;">Thay đổi các số liệu bên dưới để xem hệ số chỉ số và tự động đánh giá lãi/lỗ theo thời gian thực:</p>' +
          '</div>' +
          '<button class="btn" onclick="resetAdSimulator()" style="font-size:12px;padding:6px 12px;">🔄 <span class="hide-mobile">Giá trị mặc định Slide</span><span class="show-mobile">Mặc định Slide</span></button>' +
        '</div>' +

        '<div class="calc-inputs-grid">' +
          '<div class="calc-field">' +
            '<label>Impressions (Lượt hiển thị)</label>' +
            '<input id="simImp" type="number" value="' + simState.impressions + '" oninput="updateAdSimulator()">' +
          '</div>' +
          '<div class="calc-field">' +
            '<label>Clicks (Lượt nhấp)</label>' +
            '<input id="simClk" type="number" value="' + simState.clicks + '" oninput="updateAdSimulator()">' +
          '</div>' +
          '<div class="calc-field">' +
            '<label>Ad Cost (Ngân sách QC - đ)</label>' +
            '<input id="simCost" type="number" step="500000" value="' + simState.cost + '" oninput="updateAdSimulator()">' +
          '</div>' +
          '<div class="calc-field">' +
            '<label>Orders (Số đơn hàng)</label>' +
            '<input id="simOrd" type="number" value="' + simState.orders + '" oninput="updateAdSimulator()">' +
          '</div>' +
          '<div class="calc-field">' +
            '<label>Revenue (Doanh thu - đ)</label>' +
            '<input id="simRev" type="number" step="1000000" value="' + simState.revenue + '" oninput="updateAdSimulator()">' +
          '</div>' +
          '<div class="calc-field">' +
            '<label>Gross Margin (Biên gộp %)</label>' +
            '<input id="simMargin" type="number" step="1" min="1" max="100" value="' + simState.margin + '" oninput="updateAdSimulator()">' +
          '</div>' +
        '</div>' +

        '<div id="simVerdictBox" class="calc-verdict-box profit">' +
          '<div>🎉 <strong>KẾT LUẬN: CHIẾN DỊCH CÓ LÃI</strong><div style="font-size:12.5px;font-weight:500;margin-top:2px;">ROAS thực tế (4.00x) > ROAS hòa vốn (3.33x) · Lãi ròng: +4.000.000 đ</div></div>' +
          '<div style="font-size:13px;font-weight:800;">Lợi nhuận gộp đủ bù chi phí QC</div>' +
        '</div>' +

        '<div class="solutions-grid">' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">CTR</span><span id="resCtr" class="solution-res-badge">2.00%</span></div>' +
            '<div class="solution-desc">Tỷ lệ nhấp chuột</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">CPC</span><span id="resCpc" class="solution-res-badge">5.000 đ</span></div>' +
            '<div class="solution-desc">Giá mỗi click</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">CPM</span><span id="resCpm" class="solution-res-badge">100.000 đ</span></div>' +
            '<div class="solution-desc">Giá 1.000 lượt xem</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">CVR</span><span id="resCvr" class="solution-res-badge">2.50%</span></div>' +
            '<div class="solution-desc">Tỷ lệ chuyển đổi</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">CPA</span><span id="resCpa" class="solution-res-badge">200.000 đ</span></div>' +
            '<div class="solution-desc">Chi phí cho mỗi đơn</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">AOV</span><span id="resAov" class="solution-res-badge">800.000 đ</span></div>' +
            '<div class="solution-desc">Giá trị trung bình đơn</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">ROAS</span><span id="resRoas" class="solution-res-badge">4.00x</span></div>' +
            '<div class="solution-desc">Doanh thu / Chi phí QC</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">ROAS hòa vốn</span><span id="resRoasBe" class="solution-res-badge">3.33x</span></div>' +
            '<div class="solution-desc">Ngưỡng tối thiểu có lãi</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">Lợi nhuận gộp</span><span id="resGross" class="solution-res-badge">24.000.000 đ</span></div>' +
            '<div class="solution-desc">Doanh thu × Biên gộp</div>' +
          '</div>' +
          '<div class="solution-item-card">' +
            '<div class="solution-top-row"><span class="solution-code">Lãi ròng (Net)</span><span id="resNet" class="solution-res-badge">+4.000.000 đ</span></div>' +
            '<div class="solution-desc">Lợi nhuận gộp − Ad Cost</div>' +
          '</div>' +
        '</div>' +
      '</div>' : ''
    ) +

    // SECTION 3: FORMULAS CARDS LIBRARY
    '<div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
        '<h3 style="font-size:18px;font-weight:800;color:var(--text);margin:0;">📚 THƯ VIỆN CÔNG THỨC TRỌNG TÂM TRONG ĐỀ CƯƠNG (' + filteredList.length + ' công thức)</h3>' +
      '</div>' +

      '<div class="formula-cards-grid">' +
        filteredList.map(item => 
          '<div class="formula-item-card">' +
            '<div class="formula-card-top">' +
              '<h4 class="formula-card-title">' + item.title + '</h4>' +
              '<span class="formula-category-tag">' + (FORMULA_CATEGORIES.find(c => c.id === item.category)?.label || item.category) + '</span>' +
            '</div>' +
            '<div class="formula-equation-box">' + item.equation + '</div>' +
            '<div>' +
              '<ul class="formula-vars-list">' +
                item.vars.map(v => '<li>' + v + '</li>').join('') +
              '</ul>' +
            '</div>' +
            '<div class="formula-tip-box">' + item.tip + '</div>' +
            (item.example ? '<div class="formula-example-box">' + item.example + '</div>' : '') +
          '</div>'
        ).join('') +
      '</div>' +
    '</div>' +

  '</div>';

  $('#card').innerHTML = html;

  // Render flashcard quiz box inside formula hub
  updateFormulaHeroStats();

  // Bind category chips
  $$('[data-cat]').forEach(chip => {
    chip.onclick = () => {
      activeFormulaCategory = chip.dataset.cat;
      setupFormulaQuizList();
      renderFormulas();
      setTimeout(scrollToCard, 10);
    };
  });
}

// Expose formula functions globally to window
if (typeof window !== 'undefined') {
  window.FORMULA_FLASHCARDS = FORMULA_FLASHCARDS;
  window.FORMULA_LIBRARY = FORMULA_LIBRARY;
  window.FORMULA_CATEGORIES = FORMULA_CATEGORIES;
  window.openFormulaModal = openFormulaModal;
  window.closeFormulaModal = closeFormulaModal;
  window.handleFormulaOverlayClick = handleFormulaOverlayClick;
  window.flipFormulaCard = flipFormulaCard;
  window.answerFormulaQuiz = answerFormulaQuiz;
  window.navFormulaQuiz = navFormulaQuiz;
  window.jumpFormulaQuiz = jumpFormulaQuiz;
  window.retryFormulaQuiz = retryFormulaQuiz;
  window.resetFormulaQuiz = resetFormulaQuiz;
  window.toggleFormulaQuizShuffle = toggleFormulaQuizShuffle;
  window.renderFormulas = renderFormulas;
  window.updateFormulaHeroStats = updateFormulaHeroStats;
}
