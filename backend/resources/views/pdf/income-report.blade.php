@php
  $methodLabels = [
    'cash'     => 'Efectivo',
    'transfer' => 'Transferencia',
    'card'     => 'Tarjeta',
    'credito'  => 'Crédito',
  ];
  $typeLabels = [
    'full'    => 'Pago total',
    'partial' => 'Pago parcial',
    'advance' => 'Adelanto',
    'deposit' => 'Depósito',
    'refund'  => 'Reembolso',
  ];
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte de ingresos · {{ $rangeLabel }}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    font-size: 12px;
    color: #1f2937;
    margin: 0;
    padding: 24px;
    background: #f3f4f6;
  }
  .page {
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    padding: 32px 40px;
    box-shadow: 0 1px 3px rgba(0,0,0,.1);
    border-radius: 8px;
  }
  h1 { font-size: 18px; margin: 0 0 2px; }
  h2 {
    font-size: 13px;
    margin: 18px 0 8px;
    color: #111827;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
  }
  .sub { color: #6b7280; font-size: 10px; }
  .muted { color: #6b7280; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th {
    background: #f3f4f6;
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid #d1d5db;
    font-size: 10px;
    color: #374151;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }
  .right { text-align: right; }
  .nowrap { white-space: nowrap; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: bold;
  }
  .b-cash     { background: #ecfdf5; color: #047857; }
  .b-transfer { background: #eff6ff; color: #1d4ed8; }
  .b-card     { background: #f5f3ff; color: #6d28d9; }
  .b-credito  { background: #fff7ed; color: #c2410c; }
  .b-default  { background: #f1f5f9; color: #475569; }
  .header-grid {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 8px;
  }
  .header-right {
    text-align: right;
  }
  .header-title {
    font-size: 14px;
    font-weight: bold;
    color: #111827;
  }
  .kpis {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 18px;
  }
  .kpi-box {
    flex: 1 1 140px;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f9fafb;
  }
  .kpi-label {
    font-size: 9px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .kpi-value {
    font-size: 15px;
    font-weight: bold;
    color: #111827;
    margin-top: 3px;
  }
  .method-header {
    background: #f9fafb;
    padding: 7px 10px;
    margin-top: 12px;
    border-left: 3px solid #6366f1;
    font-weight: bold;
    font-size: 12px;
    color: #1f2937;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .method-header .totals {
    font-weight: normal;
    color: #4b5563;
    font-size: 11px;
  }
  .grand-total-row { background: #f3f4f6; font-weight: bold; }
  .footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #9ca3af;
    font-size: 9px;
  }
  .cancelled-section h2 { color: #b91c1c; border-color: #fecaca; }
  .cancelled-row td { color: #6b7280; }
  .cancelled-row .amount { color: #b91c1c; text-decoration: line-through; }
  .empty {
    text-align: center;
    padding: 24px;
    color: #9ca3af;
    font-style: italic;
    font-size: 11px;
  }

  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .page { box-shadow: none; border-radius: 0; padding: 12mm 14mm; max-width: 100%; }
    @page { margin: 8mm; size: A4; }
  }
</style>
</head>
<body>

  <div class="page">

    {{-- ── Header ────────────────────────────────────────────────────────── --}}
    <div class="header-grid">
      <div>
        <h1>{{ $hotelName }}</h1>
        @if($hotelAddr)<div class="sub">{{ $hotelAddr }}</div>@endif
        @if($hotelPhone)<div class="sub">Tel: {{ $hotelPhone }}</div>@endif
      </div>
      <div class="header-right">
        <div class="header-title">Reporte de ingresos</div>
        <div class="sub">{{ $rangeLabel }}</div>
        <div class="sub" style="margin-top: 4px;">Generado: {{ now()->format('d/m/Y H:i') }}</div>
        <div class="sub">Por: {{ $generatedBy }}</div>
      </div>
    </div>

    <hr>

    {{-- ── KPIs ──────────────────────────────────────────────────────────── --}}
    <div class="kpis">
      <div class="kpi-box">
        <div class="kpi-label">Pagos recibidos</div>
        <div class="kpi-value">${{ number_format($totalActive, 0, ',', '.') }}</div>
        <div class="sub">{{ $activeCount }} {{ $activeCount === 1 ? 'pago' : 'pagos' }}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Anulaciones</div>
        <div class="kpi-value" style="color: {{ $cancelledCount > 0 ? '#b91c1c' : '#111827' }};">
          ${{ number_format($totalCancelled, 0, ',', '.') }}
        </div>
        <div class="sub">{{ $cancelledCount }} {{ $cancelledCount === 1 ? 'pago anulado' : 'pagos anulados' }}</div>
      </div>
      @foreach($byMethod as $g)
        @php
          $cls = 'b-' . ($g['method']);
          if (!in_array($g['method'], ['cash','transfer','card','credito'])) $cls = 'b-default';
        @endphp
        <div class="kpi-box">
          <div class="kpi-label">
            <span class="badge {{ $cls }}">{{ $methodLabels[$g['method']] ?? $g['method'] }}</span>
          </div>
          <div class="kpi-value">${{ number_format($g['total'], 0, ',', '.') }}</div>
          <div class="sub">{{ $g['count'] }} {{ $g['count'] === 1 ? 'pago' : 'pagos' }}</div>
        </div>
      @endforeach
    </div>

    {{-- ── Detalle de pagos por método ──────────────────────────────────── --}}
    <h2>Detalle de pagos recibidos</h2>

    @if($byMethod->count() === 0)
      <div class="empty">No se registraron pagos en este periodo.</div>
    @else
      @foreach($byMethod as $g)
        @php
          $cls = 'b-' . ($g['method']);
          if (!in_array($g['method'], ['cash','transfer','card','credito'])) $cls = 'b-default';
        @endphp
        <div class="method-header">
          <div>
            <span class="badge {{ $cls }}">{{ $methodLabels[$g['method']] ?? $g['method'] }}</span>
            &nbsp; {{ $g['count'] }} {{ $g['count'] === 1 ? 'pago' : 'pagos' }}
          </div>
          <div class="totals">Subtotal: <strong>${{ number_format($g['total'], 0, ',', '.') }}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 70px;">Hora</th>
              <th>Huésped / Empresa</th>
              <th style="width: 90px;">Tipo</th>
              <th style="width: 100px;">Pagado por</th>
              <th style="width: 90px;">Recepcionista</th>
              <th class="right" style="width: 90px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            @foreach($g['items'] as $p)
              <tr>
                <td class="nowrap">{{ \Carbon\Carbon::parse($p->payment_date)->format('d/m H:i') }}</td>
                <td>
                  <strong>{{ $p->stay?->guest?->full_name ?? '—' }}</strong>
                  @if($p->stay?->company?->name)
                    <div class="sub">{{ $p->stay->company->name }}</div>
                  @endif
                  @if($p->notes)
                    <div class="sub" style="margin-top:2px;">Nota: {{ $p->notes }}</div>
                  @endif
                </td>
                <td class="muted">{{ $typeLabels[$p->payment_type] ?? $p->payment_type }}</td>
                <td class="muted">{{ $p->paid_by ?? '—' }}</td>
                <td class="muted">{{ $p->receptionist?->name ?? '—' }}</td>
                <td class="right nowrap"><strong>${{ number_format($p->amount, 0, ',', '.') }}</strong></td>
              </tr>
            @endforeach
          </tbody>
        </table>
      @endforeach

      {{-- Total general --}}
      <table style="margin-top: 10px;">
        <tr class="grand-total-row">
          <td style="border-bottom: 2px solid #111827;">TOTAL GENERAL · {{ $activeCount }} {{ $activeCount === 1 ? 'pago' : 'pagos' }}</td>
          <td class="right nowrap" style="border-bottom: 2px solid #111827;">
            <span style="font-size: 14px;">${{ number_format($totalActive, 0, ',', '.') }}</span>
          </td>
        </tr>
      </table>
    @endif

    {{-- ── Anulaciones ──────────────────────────────────────────────────── --}}
    @if($cancelledCount > 0)
      <div class="cancelled-section">
        <h2>Pagos anulados en el periodo</h2>
        <p class="sub" style="margin: 0 0 6px;">
          Estos pagos fueron anulados entre {{ $from->translatedFormat('d/m/Y') }} y {{ $to->translatedFormat('d/m/Y') }}.
          El monto original se muestra tachado y <strong>no</strong> está incluido en los totales de arriba.
        </p>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Anulado</th>
              <th>Huésped / Empresa</th>
              <th style="width: 80px;">Método</th>
              <th style="width: 100px;">Anulado por</th>
              <th>Motivo</th>
              <th class="right" style="width: 90px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            @foreach($cancelledPayments as $p)
              <tr class="cancelled-row">
                <td class="nowrap">{{ \Carbon\Carbon::parse($p->cancelled_at)->format('d/m H:i') }}</td>
                <td>
                  {{ $p->stay?->guest?->full_name ?? '—' }}
                  @if($p->stay?->company?->name)
                    <div class="sub">{{ $p->stay->company->name }}</div>
                  @endif
                  <div class="sub">Pago original: {{ \Carbon\Carbon::parse($p->payment_date)->format('d/m H:i') }}</div>
                </td>
                <td>{{ $methodLabels[$p->payment_method] ?? $p->payment_method }}</td>
                <td>{{ $p->cancelledBy?->name ?? '—' }}</td>
                <td>{{ $p->cancellation_reason ?: '—' }}</td>
                <td class="right nowrap amount">${{ number_format($p->amount, 0, ',', '.') }}</td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    @endif

    {{-- ── Footer ───────────────────────────────────────────────────────── --}}
    <div class="footer">
      {{ $hotelName }} · Reporte generado por Hotel Management System
    </div>

  </div>

</body>
</html>
