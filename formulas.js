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
    id: 'f_ctr',
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
    id: 'f_cpc',
    category: 'ads',
    title: 'CPC (Cost Per Click) · Chi phí mỗi lượt nhấp',
    equation: 'CPC = Ad Cost ÷ Clicks',
    vars: [
      '<b>Ad Cost</b>: Tổng ngân sách / chi phí đã chi cho quảng cáo (VNĐ)',
      '<b>Clicks</b>: Tổng số lượt nhấp chuột thu được vào trang đích'
    ],
    tip: '💡 <b>Ý nghĩa & Đấu giá:</b> Chi phí thực tế trả cho mỗi khách tiềm năng truy cập vào trang đích (Landing Page). Phụ thuộc vào mức độ cạnh tranh từ khóa và Điểm chất lượng (Quality Score) của mẫu quảng cáo.',
    example: '<b>Bài tập Slide:</b> 20.000.000 đ ÷ 4.000 clicks = <b>5.000 đ/click</b>.<br><b>Câu 124 Đề cương:</b> CPC = 5.000 đ, CVR = 2,5% → CPA = <b>200.000 đ</b>.'
  },
  {
    id: 'f_cpm',
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
    id: 'f_cvr',
    category: 'ads',
    title: 'CVR (Conversion Rate) · Tỷ lệ chuyển đổi',
    equation: 'CVR = (Orders ÷ Clicks) × 100%',
    vars: [
      '<b>Orders</b>: Số đơn hàng hoặc mục tiêu chuyển đổi hoàn tất',
      '<b>Clicks</b>: Tổng số lượt truy cập từ quảng cáo vào website',
      '<b>Chuẩn ngành TMĐT</b>: Thường đạt từ 1,5% – 3,0% tùy ngành hàng'
    ],
    tip: '💡 <b>Ý nghĩa cốt lõi:</b> Thước đo năng lực thuyết phục của Trang đích (Landing Page: giá bán, ảnh sản phẩm, tốc độ tải, lòng tin, quy trình thanh toán). CVR thuộc về nội lực website của doanh nghiệp.',
    example: '<b>Bài tập Slide:</b> 100 đơn ÷ 4.000 clicks = <b>2,5%</b> (Mức chuẩn TMĐT).<br><b>Hệ quả:</b> Tăng gấp đôi CVR giúp giảm một nửa chi phí CPA trên mỗi đơn.'
  },
  {
    id: 'f_cpa',
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
    id: 'f_aov',
    category: 'ads',
    title: 'AOV (Average Order Value) · Giá trị đơn trung bình',
    equation: 'AOV = Revenue ÷ Orders',
    vars: [
      '<b>Revenue</b>: Tổng doanh thu tạo ra từ chiến dịch (VNĐ)',
      '<b>Orders</b>: Tổng số đơn hàng hoàn tất thanh toán',
      '<b>Liên hệ với ROAS & CPA</b>: Revenue = Orders × AOV ⇒ ROAS = AOV ÷ CPA'
    ],
    tip: '💡 <b>Ý nghĩa quản trị (Buổi 5 & 6):</b> Tăng AOV (bằng bán chéo Cross-sell, bán nâng cấp Upsell, gói Combo, miễn phí vận chuyển từ ngưỡng giá trị đơn) là đòn bẩy mở rộng doanh thu và nâng ROAS ngay lập tức mà không tốn thêm chi phí quảng cáo.',
    example: '<b>Bài tập Slide:</b> 80.000.000 đ ÷ 100 đơn = <b>800.000 đ/đơn</b>.<br><b>Kiểm chứng:</b> Với CPA = 200.000 đ (chiếm 25% AOV) → ROAS = 800k ÷ 200k = <b>4,0x</b>.'
  },
  {
    id: 'f_roas',
    category: 'ads',
    title: 'ROAS (Return On Ad Spend) · Doanh thu trên chi phí QC',
    equation: 'ROAS = Revenue ÷ Ad Cost = AOV ÷ CPA',
    vars: [
      '<b>Revenue</b>: Tổng doanh thu mang lại từ quảng cáo (VNĐ)',
      '<b>Ad Cost</b>: Tổng ngân sách quảng cáo đã chi (VNĐ)',
      '<b>Điều kiện có lãi</b>: ROAS thực tế > Ngưỡng ROAS hòa vốn (1 ÷ Gross Margin)'
    ],
    tip: '⚠️ <b>LƯU Ý CỐT LÕI (Slide Buổi 6):</b><br>• ROAS chỉ đo lường <b>Doanh thu / Chi phí QC</b>, hoàn toàn <b>KHÔNG ĐO LỢI NHUẬN</b> vì chưa trừ Giá vốn hàng bán (COGS) và chi phí vận hành.<br>• Doanh nghiệp đạt ROAS = 4x vẫn bị lỗ nếu biên lợi nhuận gộp < 25% (ROAS hòa vốn > 4x).',
    example: '<b>Bài tập Slide:</b> 80.000.000 đ ÷ 20.000.000 đ = <b>4,0x</b> (400%). Biên gộp 30% → Lãi gộp 24tr > Chi phí QC 20tr → <b>Lãi ròng +4 triệu</b>.'
  },
  {
    id: 'f_roas_be',
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
    id: 'f_cvr_be',
    category: 'ads',
    title: 'CVR cần đạt để hòa vốn (Break-even CVR)',
    equation: 'CVR hòa vốn = CPC ÷ (AOV × Gross Margin)',
    vars: [
      '<b>CPC</b>: Chi phí trung bình cho mỗi lượt nhấp chuột',
      '<b>AOV × Gross Margin</b>: Lợi nhuận gộp trên 1 đơn hàng (= CPA tối đa cho phép)',
      '<b>Nguyên lý</b>: Hòa vốn khi CPA = CPC ÷ CVR = AOV × Gross Margin'
    ],
    tip: '💡 <b>Ý nghĩa quản trị (Essay 21):</b> Khi thị trường cạnh tranh khiến không thể giảm giá thầu CPC và giá bán AOV đã cố định, doanh nghiệp bắt buộc phải tối ưu Trang đích (Landing Page) để nâng CVR vượt ngưỡng hòa vốn này.',
    example: '<b>Essay 21:</b> CPC = 4.000 đ, AOV = 700.000 đ, Biên gộp = 25% → CPA tối đa = 700k × 25% = 175.000 đ → CVR cần đạt = 4.000 ÷ 175.000 ≈ <b>2,29%</b> để hòa vốn.'
  },
  {
    id: 'f_adrank',
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
    id: 'f_ltv',
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
    id: 'f_cac',
    category: 'ltv',
    title: 'CAC (Customer Acquisition Cost) · Chi phí thu hút khách hàng',
    equation: 'CAC = Tổng chi phí Marketing & Sales ÷ Số khách hàng mới',
    vars: [
      '<b>Chi phí Marketing & Sales</b>: Toàn bộ ngân sách quảng cáo, nhân sự, công cụ trong kỳ',
      '<b>Số khách hàng mới</b>: Lượng khách hàng lần đầu phát sinh đơn hàng',
      '<b>Phân biệt với CPA</b>: CPA tính trên mỗi đơn hàng; CAC tính trên mỗi khách hàng mới'
    ],
    tip: '⭐ <b>Ý nghĩa quản trị (Buổi 5 & Buổi 13):</b> Nếu chỉ nhìn CAC đơn lẻ sẽ không biết đắt hay rẻ; bắt buộc phải đặt CAC cạnh LTV để đánh giá hiệu quả thu hút khách mới và khả năng sinh lời dài hạn.',
    example: '• Chi 30.000.000 đ thu hút 200 khách mới → CAC = <b>150.000 đ/khách</b>.<br>• Nếu LTV = 450.000 đ → Mỗi khách mới mang lại thặng dư 300.000 đ trong vòng đời.'
  },
  {
    id: 'f_ltv_cac_ratio',
    category: 'ltv',
    title: 'Tỷ số chuẩn vàng LTV / CAC & Ngưỡng CAC tối đa (Buổi 5, 13)',
    equation: 'Tỷ số chuẩn vàng: LTV ÷ CAC ≥ 3  ⇒  CAC tối đa = LTV ÷ 3',
    vars: [
      '<b>LTV ÷ CAC ≥ 3</b>: Chuẩn vàng tài chính của mô hình TMĐT tăng trưởng bền vững',
      '<b>LTV ÷ CAC < 1</b>: Doanh nghiệp đang lỗ trực tiếp trên từng khách hàng mới thu hút',
      '<b>CAC tối đa cho phép</b> = LTV ÷ 3 (1/3 bù Marketing, 1/3 bù Vận hành, 1/3 Lãi ròng)'
    ],
    tip: '⭐ <b>Nguyên tắc phân bổ (Essay 20 & Essay 43):</b> Khi LTV / CAC < 3, doanh nghiệp cần đồng thời nâng LTV (tăng tần suất mua lại f, tăng AOV bằng chương trình khách hàng thân thiết CRM) và hạ CAC (tối ưu CVR, tăng tỷ trọng traffic tự nhiên SEO).',
    example: '• <b>Essay 20:</b> LTV = 810.000 đ → CAC tối đa = 810.000 ÷ 3 = <b>270.000 đ</b>.<br>• <b>Essay 43:</b> LTV = 400.000 đ → CAC tối đa = 400.000 ÷ 3 ≈ <b>133.000 đ</b>.'
  },
  {
    id: 'f_max_cpc',
    category: 'ltv',
    title: 'CPC tối đa cho phép theo LTV & CAC (Essay 43)',
    equation: 'Max CPC = CAC tối đa × CVR (khách mới) = (LTV ÷ 3) × CVR',
    vars: [
      '<b>CAC tối đa</b>: Ngưỡng chi tối đa để có 1 khách mới (= LTV ÷ 3)',
      '<b>CVR (khách mới)</b>: Tỷ lệ chuyển đổi từ lượt nhấp sang khách hàng mới',
      '<b>Cơ sở công thức</b>: Vì CAC = CPC ÷ CVR nên suy ra Max CPC = CAC tối đa × CVR'
    ],
    tip: '💡 <b>Ứng dụng quản trị (Essay 43):</b> Giúp nhà quản trị thiết lập giá thầu trần (Max Bid) trên Google Ads / Facebook Ads dựa trên giá trị vòng đời khách hàng để không bao giờ chạy quảng cáo vượt ngưỡng an toàn tài chính.',
    example: '• <b>Essay 43:</b> CAC tối đa = 133.000 đ, CVR = 2,7% → Max CPC = 133.000 × 0,027 ≈ <b>3.600 đ/click</b>.<br>• <b>Essay 20:</b> CAC tối đa = 270.000 đ, CVR = 2,0% → Max CPC = <b>5.400 đ/click</b>.'
  },

  // FUNNEL
  {
    id: 'f_full_cvr',
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
    id: 'f_cart_abandon',
    category: 'funnel',
    title: 'Tỷ lệ bỏ giỏ hàng (Cart Abandonment Rate)',
    equation: 'Cart Abandonment Rate = [1 − (Lượt thanh toán ÷ Lượt thêm giỏ)] × 100%',
    vars: [
      '1. <b>Lượt thêm giỏ (Add to Cart)</b>: Tổng số lượt khách đưa sản phẩm vào giỏ hàng',
      '2. <b>Lượt thanh toán (Completed)</b>: Số lượt khách tiến hành thanh toán / đặt đơn',
      '3. <b>Tỷ lệ hoàn tất giỏ</b> = [100% − Tỷ lệ bỏ giỏ] = (Lượt thanh toán ÷ Lượt thêm giỏ) × 100%',
      '4. <b>Số giỏ hàng bị bỏ lỡ</b> = Lượt thêm giỏ − Lượt hoàn tất thanh toán',
      '<b>Doanh thu bị bỏ lỡ</b> = Số giỏ hàng bị bỏ lỡ × Giá trị đơn trung bình (AOV)'
    ],
    tip: '💡 <b>6 nguyên nhân bỏ giỏ hàng hàng đầu (Buổi 9 & 15):</b> (1) Phí vận chuyển bất ngờ phát sinh ở bước cuối, (2) Bắt buộc tạo tài khoản rườm rà, (3) Quy trình thanh toán quá nhiều bước, (4) Thiếu phương thức thanh toán mong muốn, (5) Lo ngại an toàn bảo mật, (6) Chính sách đổi trả không rõ ràng.',
    example: '<b>Trung bình ngành TMĐT:</b> Bỏ giỏ hàng từ 65% – 75%. Trong Essay 18: 1.100 thêm giỏ → 280 hoàn tất đơn (bỏ giỏ 74,5%). Giảm 5% bỏ giỏ giúp tăng ~20% lợi nhuận.'
  },

  // OPS & PAYMENT
  {
    id: 'f_payment_fee',
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
    id: 'f_logistics',
    category: 'ops',
    title: 'Hệ chỉ số Logistics & Điểm hòa vốn vận hành (Buổi 10 & Essay 39)',
    equation: 'Tỷ lệ hoàn hàng = (Số đơn hoàn hủy ÷ Tổng số đơn xuất) × 100%',
    vars: [
      '<b>Ngưỡng an toàn tài chính</b>: Chi phí Logistics mỗi đơn ≤ Lợi nhuận gộp mỗi đơn',
      '<b>Thiệt hại đơn hoàn 2 chiều</b>: Phí giao đi + Phí hoàn về + Chi phí đóng gói & kiểm đếm kho',
      '<b>Fulfillment Cycle Time</b>: Thời gian xử lý & giao đơn (chuẩn TMĐT 2–3 ngày, ≥ 5 ngày là điểm nghẽn)'
    ],
    tip: '💡 <b>Chẩn đoán vận hành (Buổi 10 & Essay 39):</b> Nếu tỷ lệ hoàn hàng cao (ví dụ 18% ở ngành thời trang COD), chi phí logistics hai chiều (giao đi + thu hồi hoàn về) sẽ bào mòn và triệt tiêu toàn bộ lợi nhuận gộp của các đơn hàng thành công.',
    example: '<b>Bài toán thực tế:</b> Lãi gộp mỗi đơn = 50.000 đ, phí giao = 25.000 đ, phí hoàn = 15.000 đ.<br>→ Cứ 1 đơn hoàn làm lỗ <b>40.000 đ</b>, cần 4 đơn thành công mới bù lại được!'
  },

  // SECURITY
  {
    id: 'f_security_risk',
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
  },
  {
    id: 'f_security_control',
    category: 'security',
    title: 'Phương trình Giảm thiểu Rủi ro & Quy tắc Sao lưu 3-2-1 (Buổi 7 & Essay 58)',
    equation: 'Rủi ro còn lại = T × (V − ΔV) × (I − ΔI)  ·  Chuẩn Backup: 3 Bản – 2 Phương tiện – 1 Offsite',
    vars: [
      '<b>Giảm Lỗ hổng (V − ΔV)</b>: Tường lửa WAF, mã hóa TLS/HTTPS, xác thực đa yếu tố MFA, phân quyền tối thiểu (Least Privilege)',
      '<b>Giảm Tác động (I − ΔI)</b>: Kế hoạch ứng phó sự cố (Incident Response), cô lập phân vùng mạng, bảo hiểm an ninh mạng',
      '<b>Quy tắc Sao lưu 3-2-1</b>: 3 bản dữ liệu, lưu trên 2 loại thiết bị khác nhau, ít nhất 1 bản tách biệt ngoại tuyến (Offsite/Cloud)'
    ],
    tip: '⭐ <b>ỨNG PHÓ TẤN CÔNG RANSOMWARE / DDoS (Essay 58):</b><br>Khi bị mã hóa tống tiền (Ransomware) hoặc tấn công từ chối dịch vụ (DDoS), việc có bản sao lưu độc lập theo chuẩn <b>3-2-1</b> và hệ thống CDN/WAF giúp doanh nghiệp khôi phục vận hành nhanh chóng, đưa mức độ thiệt hại <b>(I)</b> về mức tối thiểu mà không bị tê liệt kinh doanh.',
    example: '<b>Nguyên tắc phòng thủ chiều sâu (Defense in Depth):</b> Kết hợp kiểm soát kỹ thuật (hạ V) + đào tạo nhận thức chống Phishing + sao lưu 3-2-1 (hạ I).'
  }
];

// Full Flashcard Question Bank for Formula Practice (ABCD Multiple Choice)
// Each card embeds its own exact equation, vars, tip, and example so 3D flip is 100% accurate.
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
    explanation: '<b>CTR = (Clicks ÷ Impressions) × 100%</b>.<br>Đo lường tỷ lệ người nhìn thấy quảng cáo bấm vào xem. Chuẩn ngành TMĐT từ 1,0% – 2,5%. CTR cao giúp tăng Điểm chất lượng (Quality Score).',
    equation: 'CTR = (Clicks ÷ Impressions) × 100%',
    vars: [
      '<b>Clicks</b>: Tổng số lần người dùng bấm (nhấp chuột) vào quảng cáo',
      '<b>Impressions</b>: Tổng số lần quảng cáo được hiển thị trên màn hình'
    ],
    tip: '💡 <b>Ý nghĩa & Mẹo thi:</b> Đo lường mức độ hấp dẫn của mẫu quảng cáo (tiêu đề, hình ảnh, lời kêu gọi hành động CTA) và mức độ nhắm đúng tệp khách hàng. Chuẩn ngành TMĐT thường từ 1,0% – 2,5%. CTR cao giúp tăng Điểm chất lượng (Quality Score) trong cơ chế đấu giá.',
    example: '<b>Bài tập Slide:</b> 4.000 clicks ÷ 200.000 impressions × 100% = <b>2,0%</b> (Chuẩn tốt).'
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
    explanation: '<b>CPC = Ad Cost ÷ Clicks</b>.<br>Chi phí thực tế nhà quảng cáo phải trả cho mỗi lượt người dùng nhấp chuột vào quảng cáo dẫn về trang đích (Landing Page).',
    equation: 'CPC = Ad Cost ÷ Clicks',
    vars: [
      '<b>Ad Cost</b>: Tổng ngân sách / chi phí đã chi cho quảng cáo (VNĐ)',
      '<b>Clicks</b>: Tổng số lượt nhấp chuột thu được'
    ],
    tip: '💡 <b>Ý nghĩa & Mẹo thi:</b> Chi phí thực tế trả cho mỗi khách tiềm năng truy cập vào trang đích (Landing Page). Phụ thuộc vào mức độ cạnh tranh từ khóa và Điểm chất lượng (Quality Score).',
    example: '<b>Bài tập Slide:</b> 20.000.000 đ ÷ 4.000 clicks = <b>5.000 đ/click</b>.'
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
    explanation: '<b>CPM = (Ad Cost ÷ Impressions) × 1.000</b>.<br>Thước đo chuẩn quốc tế cho chiến dịch giai đoạn Nhận thức / Thương hiệu (Brand Awareness) để tiếp cận độ phủ rộng.',
    equation: 'CPM = (Ad Cost ÷ Impressions) × 1.000',
    vars: [
      '<b>Ad Cost</b>: Tổng chi phí quảng cáo đã chi (VNĐ)',
      '<b>Impressions</b>: Tổng số lượt quảng cáo được hiển thị',
      '<b>1.000</b>: Đơn vị tính trên mỗi 1.000 lượt hiển thị (Mille = 1.000)'
    ],
    tip: '💡 <b>Ý nghĩa & Mẹo thi:</b> Thước đo chuẩn quốc tế cho chiến dịch giai đoạn Nhận thức / Thương hiệu (Brand Awareness) nhằm tối ưu độ phủ (Reach).',
    example: '<b>Bài tập Slide:</b> (20.000.000 đ ÷ 200.000) × 1.000 = <b>100.000 đ</b>.<br><b>Câu trắc nghiệm 123:</b> Chi 6tr, 2 triệu hiển thị → CPM = (6tr ÷ 2tr) × 1.000 = <b>3.000 đ</b>.'
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
    explanation: '<b>CVR = (Orders ÷ Clicks) × 100%</b>.<br>Thước đo năng lực thuyết phục của Trang đích (Landing Page). CVR cao giúp hạ CPA mà không cần giảm giá thầu.',
    equation: 'CVR = (Orders ÷ Clicks) × 100%',
    vars: [
      '<b>Orders</b>: Số đơn hàng hoặc mục tiêu chuyển đổi hoàn tất',
      '<b>Clicks</b>: Tổng số lượt truy cập vào trang đích từ quảng cáo'
    ],
    tip: '💡 <b>Ý nghĩa cốt lõi:</b> Thước đo năng lực thuyết phục của Trang đích (Landing Page: giá bán, ảnh sản phẩm, tốc độ tải, đánh giá khách hàng, quy trình thanh toán). CVR thuộc về nội lực website của doanh nghiệp.',
    example: '<b>Bài tập Slide:</b> (100 đơn ÷ 4.000 clicks) × 100% = <b>2,5%</b> (Mức chuẩn tốt của ngành TMĐT).'
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
    explanation: '<b>CPA = Ad Cost ÷ Orders = CPC ÷ CVR</b>.<br>⭐ <i>Trọng tâm đề thi:</i> Tăng CVR sẽ kéo CPA giảm xuống mà lưu lượng đơn hàng vẫn giữ nguyên hoặc tăng lên.',
    equation: 'CPA = Ad Cost ÷ Orders = CPC ÷ CVR',
    vars: [
      '<b>Ad Cost</b>: Tổng chi phí quảng cáo đã chi (VNĐ)',
      '<b>Orders</b>: Tổng số đơn hàng thành công',
      '<b>Mối quan hệ vàng</b>: CPA = CPC ÷ CVR'
    ],
    tip: '⭐ <b>CÂU HỎI TRỌNG TÂM ĐỀ THI (Câu 127):</b> Vì sao con đường tăng CVR bền vững hơn giảm CPC?<br>→ Vì tăng CVR hạ CPA mà giữ nguyên hoặc tăng lưu lượng đơn hàng; còn giảm giá thầu (hạ CPC) sẽ làm giảm hiển thị và sụt giảm số đơn. Dư địa tối ưu trang đích luôn lớn hơn đấu thầu giá!',
    example: '<b>Bài tập Slide:</b> 20.000.000 đ ÷ 100 đơn = <b>200.000 đ/đơn</b> (hoặc 5.000 đ ÷ 2,5% = <b>200.000 đ/đơn</b>).<br><b>Câu 124:</b> CPC 5.000 đ, CVR 2,5% → CPA = 5.000 ÷ 0,025 = <b>200.000 đ</b>.'
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
    explanation: '<b>AOV = Revenue ÷ Orders</b>.<br>Tăng AOV bằng bán kèm (cross-sell), combo, chính sách freeship theo ngưỡng là cách tăng trưởng doanh thu không tốn tiền quảng cáo.',
    equation: 'AOV = Revenue ÷ Orders',
    vars: [
      '<b>Revenue</b>: Tổng doanh thu tạo ra từ các đơn hàng (VNĐ)',
      '<b>Orders</b>: Tổng số đơn hàng thành công'
    ],
    tip: '💡 <b>Ý nghĩa & Chiến lược:</b> Tăng AOV (bằng combo, freeship từ ngưỡng giá trị đơn, gợi ý bán chéo cross-sell / up-sell) là một trong 3 trụ cột mở rộng doanh thu mà không cần tốn thêm tiền quảng cáo.',
    example: '<b>Bài tập Slide:</b> 80.000.000 đ ÷ 100 đơn = <b>800.000 đ/đơn</b>.'
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
    explanation: '<b>ROAS = Revenue ÷ Ad Cost = AOV ÷ CPA</b>.<br>⚠️ <i>Lưu ý:</i> ROAS chỉ đo doanh thu trên chi phí quảng cáo, không đo lợi nhuận vì chưa trừ giá vốn hàng bán.',
    equation: 'ROAS = Revenue ÷ Ad Cost = AOV ÷ CPA',
    vars: [
      '<b>Revenue</b>: Tổng doanh thu mang lại từ quảng cáo',
      '<b>Ad Cost</b>: Tổng ngân sách quảng cáo đã chi',
      '<b>AOV ÷ CPA</b>: Giá trị đơn trung bình chia cho chi phí mỗi đơn hàng'
    ],
    tip: '⚠️ <b>LƯU Ý CỐT LÕI:</b> ROAS chỉ đo doanh thu, hoàn toàn KHÔNG ĐO LỢI NHUẬN (vì chưa trừ giá vốn COGS và chi phí vận hành). Doanh nghiệp có thể đạt ROAS = 4x nhưng vẫn lỗ nếu biên lợi nhuận gộp mỏng (< 25%).',
    example: '<b>Bài tập Slide:</b> 80.000.000 đ ÷ 20.000.000 đ = <b>4,0x</b> (hay 800.000 đ ÷ 200.000 đ = <b>4,0x</b> / 400%).'
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
    explanation: '<b>ROAS hòa vốn = 1 ÷ Gross Margin</b>.<br>Ví dụ: Biên gộp 40% (0,4) → ROAS hòa vốn = 2,5x. Biên gộp 30% (0,3) → ROAS hòa vốn = 3,33x.',
    equation: 'ROAS hòa vốn = 1 ÷ Biên lợi nhuận gộp (Gross Margin)',
    vars: [
      '<b>Gross Margin (Biên lợi nhuận gộp)</b>: Tỷ lệ lợi nhuận gộp của sản phẩm (ví dụ 30% = 0,3)',
      '<b>Điều kiện có lãi</b>: ROAS thực tế > ROAS hòa vốn'
    ],
    tip: '⭐ <b>CÂU HỎI ĐỀ CƯƠNG (Câu 125, Essay 21, Essay 44):</b><br>• Gross Margin = 40% (0,4) → ROAS hòa vốn = 1 ÷ 0,4 = <b>2,5x</b><br>• Gross Margin = 30% (0,3) → ROAS hòa vốn = 1 ÷ 0,3 ≈ <b>3,33x</b><br>• Gross Margin = 25% (0,25) → ROAS hòa vốn = 1 ÷ 0,25 = <b>4,0x</b><br>• Gross Margin = 28% (0,28) → ROAS hòa vốn = 1 ÷ 0,28 ≈ <b>3,57x</b>',
    example: '<b>Bài tập Slide:</b> Biên gộp 30% → Ngưỡng hòa vốn = 1 ÷ 0,3 ≈ <b>3,33x</b>. Vì ROAS thực tế (4,0x) > 3,33x nên chiến dịch có lãi (+4 triệu).'
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
    explanation: '<b>CVR hòa vốn = CPC ÷ (AOV × Gross Margin)</b>.<br>Trong đó (AOV × Gross Margin) chính là lợi nhuận gộp mỗi đơn (CPA tối đa cho phép).',
    equation: 'CVR hòa vốn = CPC ÷ (AOV × Gross Margin)',
    vars: [
      '<b>CPC</b>: Chi phí trung bình cho mỗi lượt nhấp chuột',
      '<b>AOV × Gross Margin</b>: Lợi nhuận gộp tạo ra trên 1 đơn hàng (CPA tối đa cho phép để hòa vốn)'
    ],
    tip: '💡 <b>Ý nghĩa (Essay 21):</b> Để hòa vốn thì <code>CPA = Lợi nhuận gộp 1 đơn = AOV × Gross Margin</code>. Vì <code>CPA = CPC ÷ CVR</code> nên suy ra <code>CVR hòa vốn = CPC ÷ (AOV × Gross Margin)</code>.',
    example: '<b>Essay 21:</b> CPC = 4.000 đ, AOV = 700.000 đ, Biên gộp = 25% → CPA tối đa = 700k × 25% = 175.000 đ → CVR cần đạt = 4.000 ÷ 175.000 ≈ <b>2,29%</b> để hòa vốn.'
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
    explanation: '<b>Ad Rank = Bid × Quality Score</b>.<br>Trang đích tốt giúp tăng Quality Score, từ đó vượt qua đối thủ trả giá thầu cao hơn và trả CPC thực tế thấp hơn.',
    equation: 'Thứ hạng quảng cáo (Ad Rank) = Giá thầu (Bid) × Điểm chất lượng (Quality Score)',
    vars: [
      '<b>Giá thầu (Bid)</b>: Mức giá tối đa nhà quảng cáo sẵn sàng trả cho 1 click',
      '<b>Điểm chất lượng (Quality Score)</b>: Đánh giá của nền tảng dựa trên CTR kỳ vọng, độ liên quan mẫu quảng cáo và trải nghiệm Trang đích'
    ],
    tip: '⭐ <b>Tác động kép của trang đích (Essay 22):</b> Cải thiện trang đích vừa làm tăng CVR (giúp hạ CPA), vừa là yếu tố cốt lõi tăng Quality Score (giúp hạ giá thầu thực tế CPC). Hai tác động nhân với nhau tạo lợi thế cạnh tranh áp đảo.',
    example: 'Một nhà quảng cáo thầu 6.000 đ nhưng điểm chất lượng 10/10 (Ad Rank = 60) sẽ vượt qua đối thủ thầu 10.000 đ nhưng điểm chất lượng 5/10 (Ad Rank = 50), và chỉ phải trả CPC thực tế thấp hơn!'
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
    explanation: '<b>LTV = AOV × f × t × Gross Margin</b>.<br>Với f là tần suất mua hàng (đơn/năm), t là thời gian gắn bó (năm), Gross Margin là tỷ lệ lợi nhuận gộp.',
    equation: 'LTV (Lợi nhuận gộp) = AOV × f × t × Gross Margin',
    vars: [
      '<b>AOV</b>: Giá trị đơn hàng trung bình (VNĐ/đơn)',
      '<b>f (Frequency)</b>: Tần suất mua hàng bình quân (số đơn / năm)',
      '<b>t (Lifespan)</b>: Thời gian gắn bó trung bình của khách hàng (số năm)',
      '<b>Gross Margin</b>: Tỷ lệ biên lợi nhuận gộp bình quân (%)'
    ],
    tip: '⭐ <b>CÂU HỎI ĐỀ CƯƠNG (Buổi 5 & Buổi 13):</b> LTV tính theo lợi nhuận gộp là "trần ngân sách" bảo vệ doanh nghiệp không bị vung tay quá trán khi chi tiền chạy quảng cáo thu hút khách mới.',
    example: '<b>Essay 20:</b> AOV = 450.000 đ, f = 3 đơn/năm, t = 2 năm, Biên gộp 30% → LTV = 450.000 × 3 × 2 × 30% = <b>810.000 đ</b>.<br><b>Essay 43:</b> AOV = 250.000 đ, f = 2,5 đơn/năm, t = 2 năm, Biên gộp 32% → LTV = 250.000 × 2,5 × 2 × 32% = <b>400.000 đ</b>.'
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
    explanation: '<b>CAC = Tổng chi phí Marketing & Sales ÷ Số khách hàng mới</b>.<br>Mẫu số bắt buộc là số khách hàng mới, không phải tổng số đơn hàng.',
    equation: 'CAC = Tổng chi phí Marketing & Sales ÷ Số khách hàng mới',
    vars: [
      '<b>Tổng chi phí Marketing & Sales</b>: Toàn bộ ngân sách quảng cáo, khuyến mãi khách mới, nhân sự, công cụ trong kỳ',
      '<b>Số khách hàng mới</b>: Lượng khách hàng lần đầu phát sinh đơn hàng (không tính khách cũ mua lại)'
    ],
    tip: '💡 <b>Phân biệt CAC và CPA:</b> CPA là chi phí quảng cáo trên mỗi <i>đơn hàng</i>, còn CAC là tổng chi phí tiếp thị & bán hàng để thu hút được 1 <i>khách hàng mới</i>.',
    example: 'Chi 30.000.000 đ cho Marketing & Sales thu được 200 khách hàng mới → CAC = 30.000.000 ÷ 200 = <b>150.000 đ/khách mới</b>.'
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
    explanation: '<b>LTV / CAC ≥ 3</b> là chuẩn vàng của mô hình TMĐT bền vững. Nếu LTV / CAC < 1, doanh nghiệp đang chảy máu tiền tệ trên từng khách mới.',
    equation: 'Tỷ số chuẩn vàng: LTV ÷ CAC ≥ 3  ⇒  CAC tối đa = LTV ÷ 3',
    vars: [
      '<b>LTV</b>: Giá trị lợi nhuận gộp trọn đời của khách hàng',
      '<b>CAC</b>: Chi phí thu hút 1 khách hàng mới',
      '<b>CAC tối đa cho phép</b>: LTV ÷ 3 (đảm bảo 1/3 bù chi phí Marketing, 1/3 bù vận hành, 1/3 là lợi nhuận ròng)'
    ],
    tip: '⭐ <b>Quy tắc vàng tỷ số LTV / CAC (Buổi 5 & 13):</b><br>• <b>LTV / CAC ≥ 3</b>: Ngưỡng chuẩn vàng của một mô hình TMĐT bền vững.<br>• <b>LTV / CAC ≈ 1 – 2</b>: Biên mỏng, chưa đủ bù chi phí cố định.<br>• <b>LTV / CAC < 1</b>: Đang lỗ trên từng khách hàng thu hút (chảy máu tiền tệ).',
    example: '• <b>Essay 20:</b> LTV = 810.000 đ → CAC tối đa = 810.000 ÷ 3 = <b>270.000 đ</b>.<br>• <b>Essay 43:</b> LTV = 400.000 đ → CAC tối đa = 400.000 ÷ 3 ≈ <b>133.000 đ</b>.'
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
    explanation: '<b>Max CPC = CAC tối đa × CVR (khách mới)</b>.<br>Với CAC tối đa = LTV ÷ 3. Giúp đặt giá thầu trần trên Google/Facebook Ads để không bao giờ bị lỗ dài hạn.',
    equation: 'Max CPC = CAC tối đa × CVR (khách mới) = (LTV ÷ 3) × CVR',
    vars: [
      '<b>CAC tối đa</b>: Ngưỡng chi tối đa để có 1 khách mới (= LTV ÷ 3)',
      '<b>CVR (khách mới)</b>: Tỷ lệ chuyển đổi từ lượt nhấp sang khách hàng mới'
    ],
    tip: '💡 <b>Ứng dụng quản trị (Essay 43):</b> Vì <code>CAC = CPC ÷ CVR</code> nên <code>Max CPC = CAC tối đa × CVR</code>. Công thức này giúp thiết lập giá thầu trần trên Google/Facebook Ads để không bao giờ chạy quảng cáo bị lỗ về lâu dài.',
    example: '<b>Essay 43:</b> CAC tối đa = 133.000 đ, CVR = 2,7% (0,027) → Max CPC = 133.000 × 0,027 ≈ <b>3.600 đ/click</b>.'
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
    explanation: '<b>Tỷ lệ bỏ giỏ = [1 − (Lượt thanh toán ÷ Lượt thêm giỏ)] × 100%</b>.<br>6 nguyên nhân hàng đầu: phí ship bất ngờ, bắt tạo tài khoản, thiếu cổng thanh toán quen thuộc, bảo mật kém.',
    equation: 'Cart Abandonment Rate = [1 − (Lượt thanh toán ÷ Lượt thêm giỏ)] × 100%',
    vars: [
      '<b>Lượt thêm giỏ (Add to Cart)</b>: Số lượt người dùng đã đưa sản phẩm vào giỏ hàng',
      '<b>Lượt thanh toán (Checkout / Orders)</b>: Số lượt người dùng tiến hành thanh toán / đặt hàng'
    ],
    tip: '💡 <b>6 nguyên nhân bỏ giỏ hàng hàng đầu (Buổi 9 & 15):</b> (1) Phí vận chuyển bất ngờ phát sinh ở bước cuối, (2) Bắt buộc tạo tài khoản rườm rà, (3) Quy trình thanh toán quá nhiều bước, (4) Thiếu phương thức thanh toán mong muốn, (5) Lo ngại an toàn bảo mật, (6) Chính sách đổi trả không rõ ràng.',
    example: 'Có 1.000 lượt thêm vào giỏ nhưng chỉ 300 lượt thanh toán → Tỷ lệ bỏ giỏ = [1 − (300 ÷ 1.000)] × 100% = <b>70%</b> (Trung bình ngành TMĐT từ 65% – 75%).'
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
    explanation: '<b>CVR toàn phễu = (Lượt hoàn tất đơn ÷ Tổng phiên) × 100%</b>.<br>Đo lường năng lực chuyển hóa tổng thể từ lượt truy cập ban đầu thành doanh thu cuối cùng.',
    equation: 'CVR toàn phễu = (Lượt hoàn tất đơn ÷ Tổng phiên) × 100%',
    vars: [
      '<b>Lượt hoàn tất đơn (Completed Orders)</b>: Số đơn hàng thành công ở bước cuối cùng của phễu',
      '<b>Tổng phiên (Total Sessions)</b>: Tổng số phiên truy cập vào website ở đỉnh phễu',
      '<b>Các bước trung gian</b>: Phiên → Xem SP → Thêm giỏ → Thanh toán → Hoàn tất'
    ],
    tip: '⭐ <b>NGUYÊN TẮC QUẢN TRỊ (Essay 18 & Essay 43):</b> Giá trị của cải thiện tỷ lệ thuận với <b>số người tuyệt đối</b> đi vào bước đó. Bước giữa có số lượng người vào lớn gấp nhiều lần nên một cải thiện nhỏ cũng tạo ra mức tăng đơn hàng vượt bậc.',
    example: '<b>Essay 18:</b> 10.000 phiên → 4.200 xem SP (42%) → 1.100 thêm giỏ (26%) → 620 thanh toán (56%) → 280 hoàn tất (45%).<br>→ <b>CVR toàn phễu</b> = (280 ÷ 10.000) × 100% = <b>2,8%</b>.'
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
    explanation: '<b>Phí = Phí cố định + (% phí × Giá trị đơn hàng)</b>.<br>Phần phí cố định chiếm tỷ trọng rất lớn ở đơn hàng nhỏ, ăn sâu vào lãi gộp (đơn 150k phí chiếm 11,3% lãi gộp).',
    equation: 'Phí = Phí cố định + (% phí × Giá trị đơn hàng);  Tỷ trọng = Phí ÷ Lợi nhuận gộp',
    vars: [
      '<b>Phí cố định</b>: Mức phí thu cứng trên mỗi giao dịch (ví dụ 2.000 đ/giao dịch)',
      '<b>% phí × Giá trị đơn hàng</b>: Phí biến đổi theo giá trị đơn (ví dụ 1,5% × Giá trị đơn)',
      '<b>Tỷ trọng phí trên lãi gộp</b>: Thước đo mức độ "ăn sâu" của phí thanh toán vào lợi nhuận'
    ],
    tip: '⭐ <b>KẾT LUẬN QUẢN TRỊ (Essay 15):</b> Phần phí cố định chiếm tỷ trọng rất lớn ở đơn hàng giá trị nhỏ, do đó ăn sâu vào lợi nhuận gộp (đơn 150k phí chiếm 11,3% lãi gộp, đơn 1.500k chỉ chiếm 6,5%). Vì vậy, với đơn nhỏ ưu tiên khuyến khích thanh toán phí thấp (chuyển khoản VietQR).',
    example: '<b>Đơn 150.000 đ (biên gộp 25% = 37.500 đ):</b><br>Phí = 2.000 + (1,5% × 150.000) = 4.250 đ → Tỷ trọng phí = 4.250 ÷ 37.500 ≈ <b>11,3%</b>!'
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
    explanation: '<b>Tỷ lệ hoàn hàng = (Số đơn hoàn hủy ÷ Tổng số đơn xuất) × 100%</b>.<br>Ngưỡng an toàn tài chính: Chi phí logistics mỗi đơn ≤ Lợi nhuận gộp mỗi đơn.',
    equation: 'Tỷ lệ hoàn hàng = (Số đơn hoàn hủy ÷ Tổng số đơn xuất) × 100%',
    vars: [
      '<b>Số đơn hoàn hủy</b>: Tổng số đơn giao thất bại / khách trả lại hàng',
      '<b>Tổng số đơn xuất</b>: Tổng số đơn hàng đã xuất kho bàn giao vận chuyển',
      '<b>Ngưỡng an toàn</b>: Chi phí Logistics mỗi đơn ≤ Lợi nhuận gộp mỗi đơn'
    ],
    tip: '💡 <b>Chẩn đoán (Buổi 10 & Essay 39):</b> Nếu tỷ lệ hoàn hàng cao (ví dụ 18% ở thời trang), chi phí logistics hai chiều (giao đi + hoàn về) cùng chi phí đóng gói sẽ triệt tiêu toàn bộ lợi nhuận gộp của các đơn hàng thành công.',
    example: 'Nếu lợi nhuận gộp mỗi đơn là 50.000 đ, chi phí giao 25.000 đ, phí hoàn 15.000 đ. Cứ 1 đơn hoàn làm mất 40.000 đ, cần 1 đơn thành công khác gánh bù!'
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
    explanation: '<b>R = T × V × I (Threat × Vulnerability × Impact)</b>.<br>Doanh nghiệp không thể triệt tiêu mối đe dọa (T), chỉ có thể giảm lỗ hổng (V) và giảm tác động (I).',
    equation: 'Rủi ro (Risk) = Mối đe dọa (Threat) × Lỗ hổng (Vulnerability) × Tác động (Impact)',
    vars: [
      '<b>Mối đe dọa (Threat - T)</b>: Kẻ tấn công, tin tặc, mã độc, lừa đảo AI (yếu tố ngoại cảnh)',
      '<b>Lỗ hổng (Vulnerability - V)</b>: Điểm yếu bảo mật trong mã nguồn, máy chủ, cấu hình, nhận thức con người',
      '<b>Tác động (Impact - I)</b>: Mức độ thiệt hại về tài chính, uy tín, gián đoạn kinh doanh, pháp lý'
    ],
    tip: '⭐ <b>CÂU HỎI TRỌNG TÂM ĐỀ CƯƠNG (Buổi 7, Câu 145 & Essay 58):</b> Doanh nghiệp <b>KHÔNG THỂ</b> triệt tiêu mối đe dọa (T). Doanh nghiệp chỉ có thể <b>GIẢM LỖ HỔNG (V)</b> bằng biện pháp kỹ thuật phòng ngừa (vá lỗi, HTTPS, phân quyền) và <b>GIẢM TÁC ĐỘNG (I)</b> bằng kế hoạch ứng phó sự cố và sao lưu dự phòng.',
    example: '<b>Công thức: R = T × V × I.</b> Khi một trong hai yếu tố V hoặc I tiến về 0, rủi ro tổng thể sẽ được khống chế an toàn.'
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
    explanation: '<b>CTR = (4.000 ÷ 200.000) × 100% = 2,0%</b>.<br>Chuẩn ngành TMĐT thường từ 1,0% – 2,5%, do đó 2,0% là mức hiệu quả tốt.',
    equation: 'CTR = (Clicks ÷ Impressions) × 100% = (4.000 ÷ 200.000) × 100% = 2,0%',
    vars: [
      '<b>Clicks (Lượt nhấp)</b>: 4.000 clicks',
      '<b>Impressions (Lượt hiển thị)</b>: 200.000 impressions',
      '<b>Tỷ lệ CTR đạt được</b>: 2,0%'
    ],
    tip: '💡 <b>Nhận xét bài tập trên Slide (Buổi 6):</b> CTR = 2,0% vượt mức trung bình ngành TMĐT (thường 1,0% – 1,5%), chứng tỏ mẫu quảng cáo hấp dẫn và nhắm chọn đúng đối tượng mục tiêu.',
    example: '<b>Thay số trực tiếp:</b> (4.000 ÷ 200.000) × 100% = 0,02 × 100% = <b>2,0%</b> (Đáp án C).'
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
    explanation: '<b>CPC = 20.000.000 ÷ 4.000 = 5.000 đ</b>.<br><b>CPA = 20.000.000 ÷ 100 = 200.000 đ</b> (hoặc CPC ÷ CVR = 5.000 ÷ 0,025 = 200.000 đ).',
    equation: 'CPC = Ad Cost ÷ Clicks = 5.000 đ  |  CPA = Ad Cost ÷ Orders = 200.000 đ',
    vars: [
      '<b>Ad Cost (Chi phí quảng cáo)</b>: 20.000.000 đ',
      '<b>Clicks = 4.000</b> ⇒ CPC = 20.000.000 ÷ 4.000 = <b>5.000 đ/click</b>',
      '<b>Orders = 100</b> ⇒ CPA = 20.000.000 ÷ 100 = <b>200.000 đ/đơn</b>'
    ],
    tip: '💡 <b>Kiểm chứng bằng công thức liên hệ:</b> Với CVR = 100 ÷ 4.000 = 2,5% (0,025), ta cũng có <code>CPA = CPC ÷ CVR = 5.000 ÷ 0,025 = 200.000 đ/đơn</code>.',
    example: '<b>Đánh giá trên Slide:</b> Với AOV = 800.000 đ và biên lợi nhuận gộp 30% (lãi gộp 240.000 đ/đơn), mức CPA = 200.000 đ/đơn nằm trong ngưỡng an toàn và mang lại lãi ròng 40.000 đ/đơn.'
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
    explanation: '<b>ROAS hòa vốn = 1 ÷ 0,3 ≈ 3,33x</b>.<br>Vì ROAS thực tế trên slide đạt 4,0x (80tr / 20tr) > 3,33x nên chiến dịch CÓ LÃI (+4 triệu).',
    equation: 'ROAS hòa vốn = 1 ÷ Biên lợi nhuận gộp = 1 ÷ 0,30 ≈ 3,33x',
    vars: [
      '<b>Gross Margin (Biên lợi nhuận gộp)</b>: 30% = 0,30',
      '<b>ROAS hòa vốn</b>: 1 ÷ 0,30 ≈ 3,33x (333%)',
      '<b>ROAS thực tế trên Slide</b>: 80.000.000 ÷ 20.000.000 = 4,00x'
    ],
    tip: '⭐ <b>Giải đáp câu hỏi thảo luận trên Slide:</b> Chỉ nhìn vào ROAS = 4x thì <b>chưa đủ</b> kết luận có lãi nếu chưa biết biên lợi nhuận gộp. Khi tính được ROAS hòa vốn = 3,33x và so sánh 4,00x > 3,33x, ta mới kết luận chính xác chiến dịch có lãi (+4.000.000 đ).',
    example: '<b>Thay số trực tiếp:</b> Lợi nhuận gộp = 80tr × 30% = 24tr > Chi phí QC 20tr → Lãi ròng = <b>+4.000.000 đ</b>.'
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
    explanation: '<b>CPM = (Ad Cost ÷ Impressions) × 1.000</b> = (6.000.000 ÷ 2.000.000) × 1.000 = <b>3.000 đ</b>.',
    equation: 'CPM = (Ad Cost ÷ Impressions) × 1.000 = (6.000.000 ÷ 2.000.000) × 1.000 = 3.000 đ',
    vars: [
      '<b>Ad Cost (Chi phí quảng cáo)</b>: 6.000.000 đ',
      '<b>Impressions (Số lượt hiển thị)</b>: 2.000.000 lượt',
      '<b>1.000</b>: Đơn vị tính trên mỗi 1.000 lượt hiển thị (Mille)'
    ],
    tip: '💡 <b>Mẹo tính nhẩm nhanh Câu 123:</b> Rút gọn 6 triệu ÷ 2 triệu = 3 đ/lượt hiển thị. Nhân với 1.000 lượt hiển thị = <b>3.000 đ</b> (Tránh nhầm số 0 thành 300 đ hoặc 30.000 đ!).',
    example: '<b>Câu 123 Đề cương (Trang 92):</b> CPM = (6.000.000 ÷ 2.000.000) × 1.000 = <b>3.000 đ</b> (Đáp án D).'
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
    explanation: '<b>ROAS hòa vốn = 1 ÷ Gross Margin</b> = 1 ÷ 0,4 = <b>2,5x</b> (tương đương 250%).',
    equation: 'ROAS hòa vốn = 1 ÷ Biên lợi nhuận gộp = 1 ÷ 40% = 1 ÷ 0,4 = 2,5x',
    vars: [
      '<b>Biên lợi nhuận gộp (Gross Margin)</b>: 40% = 0,4',
      '<b>ROAS hòa vốn</b>: 1 ÷ 0,4 = 2,5x (tức 250%)'
    ],
    tip: '💡 <b>Ý nghĩa Câu 125:</b> Với biên lợi nhuận gộp 40%, cứ 2,5 đồng doanh thu tạo ra được 1 đồng lợi nhuận gộp (2,5 × 40% = 1), vừa đủ hòa vốn 1 đồng chi phí quảng cáo bỏ ra.',
    example: '<b>Câu 125 Đề cương (Trang 92):</b> Biên lợi nhuận gộp = 40% → ROAS hòa vốn = 1 ÷ 0,4 = <b>2,5x</b> (Đáp án A).'
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
  // 1. Direct embedded details on the flashcard object (100% exact match)
  if (q.equation) {
    return {
      id: q.id,
      category: q.category,
      title: q.formulaTitle || q.categoryLabel || '',
      equation: q.equation,
      vars: q.vars || [],
      tip: q.tip || '',
      example: q.example || ''
    };
  }
  // 2. Exact ID match in FORMULA_LIBRARY
  const exactMatch = FORMULA_LIBRARY.find(f => f.id === (q.formulaId || q.id));
  if (exactMatch) return exactMatch;
  return null;
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

let lastFormulaFlipTime = 0;
function flipFormulaCard() {
  const now = Date.now();
  if (now - lastFormulaFlipTime < 280) return;
  lastFormulaFlipTime = now;

  const card = $('#formula3DCard');
  if (!card) return;
  formulaCardFlipped = !formulaCardFlipped;
  card.classList.toggle('is-flipped', formulaCardFlipped);
  if (typeof playFlipSound === 'function') playFlipSound();

  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }

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
          '🔄 Lật xem công thức 3D & biến số<span class="hide-mobile"> chi tiết (Space)</span> ➔' +
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
                '<span>🔄 Lật xem công thức<span class="hide-mobile"> (Space)</span></span>' +
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
                '↩ Quay lại câu hỏi trắc nghiệm<span class="hide-mobile"> (Space)</span>' +
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
  const slideFormulaIds = ['f_ctr', 'f_cpc', 'f_cpm', 'f_cvr', 'f_cpa', 'f_aov', 'f_roas', 'f_roas_be'];
  const filteredList = FORMULA_LIBRARY.filter(f => {
    const matchCat = activeFormulaCategory === 'all' ||
      f.category === activeFormulaCategory ||
      (activeFormulaCategory === 'slide' && slideFormulaIds.includes(f.id));
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
