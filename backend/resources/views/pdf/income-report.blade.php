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
  $minibarTypeLabels = [
    'consumed' => 'Consumido',
    'damaged'  => 'Dañado',
    'missing'  => 'Faltante',
  ];
  $methodClass = function ($m) {
    return in_array($m, ['cash','transfer','card','credito']) ? 'b-' . $m : 'b-default';
  };
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
    font-size: 11px;
    color: #1f2937;
    margin: 0;
    padding: 20px;
    background: #f3f4f6;
  }
  .page {
    max-width: 900px;
    margin: 0 auto 16px;
    background: #fff;
    padding: 28px 36px;
    box-shadow: 0 1px 3px rgba(0,0,0,.1);
    border-radius: 8px;
  }
  h1 { font-size: 18px; margin: 0 0 2px; }
  h2 {
    font-size: 13px;
    margin: 16px 0 6px;
    color: #111827;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 3px;
  }
  h3 {
    font-size: 11px;
    margin: 14px 0 4px;
    color: #4b5563;
    text-transform: uppercase;
    letter-spacing: .4px;
    font-weight: 700;
  }
  .sub { color: #6b7280; font-size: 10px; }
  .muted { color: #6b7280; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th {
    background: #f3f4f6;
    padding: 5px 7px;
    text-align: left;
    border-bottom: 1px solid #d1d5db;
    font-size: 9px;
    color: #374151;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .3px;
  }
  td {
    padding: 4px 7px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
    font-size: 10.5px;
  }
  .right { text-align: right; }
  .nowrap { white-space: nowrap; }
  .badge {
    display: inline-block;
    padding: 1px 7px;
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
  .header-right { text-align: right; }
  .header-title { font-size: 14px; font-weight: bold; color: #111827; }

  .kpis {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 14px;
  }
  .kpi-box {
    flex: 1 1 140px;
    padding: 10px 12px;
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

  /* Bloque de día — cada día su propia "página" */
  .day-page {
    max-width: 900px;
    margin: 0 auto 16px;
    background: #fff;
    padding: 28px 36px;
    box-shadow: 0 1px 3px rgba(0,0,0,.1);
    border-radius: 8px;
    page-break-before: always;
  }
  .day-page:first-of-type { /* primer día no necesita salto extra */ }

  .day-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    border-bottom: 2px solid #111827;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .day-title {
    font-size: 18px;
    font-weight: bold;
    color: #111827;
    text-transform: capitalize;
  }
  .day-iso { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .day-summary { font-size: 10px; color: #4b5563; text-align: right; }
  .day-summary strong { color: #111827; font-size: 12px; }

  .section-totals {
    background: #f9fafb;
    border-left: 3px solid #6366f1;
    padding: 6px 10px;
    font-size: 10.5px;
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    margin-bottom: 4px;
  }

  .empty-day {
    text-align: center;
    padding: 30px;
    color: #9ca3af;
    font-style: italic;
    font-size: 11px;
    background: #f9fafb;
    border-radius: 6px;
  }

  .cancelled-row td { color: #6b7280; }
  .cancelled-row .amount { color: #b91c1c; text-decoration: line-through; }

  .footer {
    margin-top: 20px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #9ca3af;
    font-size: 9px;
  }

  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .page, .day-page {
      box-shadow: none;
      border-radius: 0;
      padding: 12mm 14mm;
      max-width: 100%;
      margin: 0;
    }
    .day-page { page-break-before: always; }
    @page { margin: 8mm; size: A4; }
    table, tr, td, th { page-break-inside: avoid; }
  }
</style>
</head>
<body>

  {{-- ════════════════ Portada / resumen general ════════════════ --}}
  <div class="page">
    <div class="header-grid">
      <div>
        <h1>{{ $hotelName }}</h1>
        @if($hotelAddr)<div class="sub">{{ $hotelAddr }}</div>@endif
        @if($hotelPhone)<div class="sub">Tel: {{ $hotelPhone }}</div>@endif
      </div>
      <div class="header-right">
        <div class="header-title">Reporte de movimientos</div>
        <div class="sub">{{ $presetLabel }}</div>
        <div class="sub" style="font-weight: 600; color: #374151; margin-top: 2px;">{{ $rangeLabel }}</div>
        <div class="sub" style="margin-top: 6px;">Generado: {{ now()->format('d/m/Y H:i') }}</div>
        <div class="sub">Por: {{ $generatedBy }}</div>
      </div>
    </div>

    <hr>

    <h2>Resumen del periodo</h2>
    <div class="kpis">
      <div class="kpi-box">
        <div class="kpi-label">Pagos recibidos</div>
        <div class="kpi-value">${{ number_format($grand['paymentsTotal'], 0, ',', '.') }}</div>
        <div class="sub">{{ $grand['paymentsCount'] }} {{ $grand['paymentsCount'] === 1 ? 'pago' : 'pagos' }}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Minibar</div>
        <div class="kpi-value">${{ number_format($grand['minibarTotal'], 0, ',', '.') }}</div>
        <div class="sub">{{ $grand['minibarCount'] }} {{ $grand['minibarCount'] === 1 ? 'consumo' : 'consumos' }}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Servicios extra</div>
        <div class="kpi-value">${{ number_format($grand['servicesTotal'], 0, ',', '.') }}</div>
        <div class="sub">{{ $grand['servicesCount'] }} {{ $grand['servicesCount'] === 1 ? 'servicio' : 'servicios' }}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Anulaciones</div>
        <div class="kpi-value" style="color: {{ ($grand['cancelledCount'] + $grand['minibarCancelledCount']) > 0 ? '#b91c1c' : '#111827' }};">
          ${{ number_format($grand['cancelledTotal'], 0, ',', '.') }}
        </div>
        <div class="sub">{{ $grand['cancelledCount'] }} pago(s), {{ $grand['minibarCancelledCount'] }} consumo(s)</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Check-ins</div>
        <div class="kpi-value">{{ $grand['checkInsCount'] }}</div>
        <div class="sub">estadías abiertas</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Check-outs</div>
        <div class="kpi-value">{{ $grand['checkOutsCount'] }}</div>
        <div class="sub">estadías cerradas</div>
      </div>
    </div>

    @if($byMethod->count() > 0)
      <h2>Pagos por método (rango completo)</h2>
      <table>
        <thead>
          <tr>
            <th>Método</th>
            <th class="right" style="width: 100px;">Cantidad</th>
            <th class="right" style="width: 140px;">Total</th>
          </tr>
        </thead>
        <tbody>
          @foreach($byMethod as $m)
            <tr>
              <td><span class="badge {{ $methodClass($m['method']) }}">{{ $methodLabels[$m['method']] ?? $m['method'] }}</span></td>
              <td class="right">{{ $m['count'] }}</td>
              <td class="right nowrap"><strong>${{ number_format($m['total'], 0, ',', '.') }}</strong></td>
            </tr>
          @endforeach
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td>TOTAL</td>
            <td class="right">{{ $grand['paymentsCount'] }}</td>
            <td class="right nowrap">${{ number_format($grand['paymentsTotal'], 0, ',', '.') }}</td>
          </tr>
        </tbody>
      </table>
    @endif
  </div>

  {{-- ════════════════ Un bloque por día ════════════════ --}}
  @foreach($days as $i => $day)
    <div class="day-page">

      <div class="day-header">
        <div>
          <div class="day-title">{{ $day['carbon']->translatedFormat('l, d \d\e F \d\e Y') }}</div>
          <div class="day-iso">{{ $day['date'] }}</div>
        </div>
        <div class="day-summary">
          @if($day['totalMovements'] === 0)
            <span style="color: #9ca3af;">Sin movimientos</span>
          @else
            <strong>{{ $day['totalMovements'] }}</strong> movimiento(s)<br>
            Ingreso: <strong>${{ number_format($day['paymentsTotal'], 0, ',', '.') }}</strong>
            @if($day['cancelledTotal'] > 0)
              <span style="color: #b91c1c;"> · Anulado: ${{ number_format($day['cancelledTotal'], 0, ',', '.') }}</span>
            @endif
          @endif
        </div>
      </div>

      @if($day['totalMovements'] === 0)
        <div class="empty-day">No se registraron movimientos este día.</div>
      @else

        {{-- ── Pagos recibidos ────────────────────────────────────────────── --}}
        @if($day['payments']->count() > 0)
          <h3>💰 Pagos recibidos ({{ $day['payments']->count() }})</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Hora</th>
                <th>Huésped / Empresa</th>
                <th style="width: 80px;">Método</th>
                <th style="width: 80px;">Tipo</th>
                <th style="width: 90px;">Pagado por</th>
                <th style="width: 90px;">Recepcionista</th>
                <th class="right" style="width: 95px;">Monto</th>
              </tr>
            </thead>
            <tbody>
              @foreach($day['payments'] as $p)
                <tr>
                  <td class="nowrap">{{ \Carbon\Carbon::parse($p->payment_date)->format('H:i') }}</td>
                  <td>
                    <strong>{{ $p->stay?->guest?->full_name ?? '—' }}</strong>
                    @if($p->stay?->company?->name)<div class="sub">{{ $p->stay->company->name }}</div>@endif
                    @if($p->notes)<div class="sub">Nota: {{ $p->notes }}</div>@endif
                  </td>
                  <td><span class="badge {{ $methodClass($p->payment_method) }}">{{ $methodLabels[$p->payment_method] ?? $p->payment_method }}</span></td>
                  <td class="muted">{{ $typeLabels[$p->payment_type] ?? $p->payment_type }}</td>
                  <td class="muted">{{ $p->paid_by ?? '—' }}</td>
                  <td class="muted">{{ $p->receptionist?->name ?? '—' }}</td>
                  <td class="right nowrap"><strong>${{ number_format($p->amount, 0, ',', '.') }}</strong></td>
                </tr>
              @endforeach
            </tbody>
          </table>
          <div class="section-totals">
            <span>Subtotal pagos del día</span>
            <strong>${{ number_format($day['paymentsTotal'], 0, ',', '.') }}</strong>
          </div>
        @endif

        {{-- ── Consumos de minibar ────────────────────────────────────────── --}}
        @if($day['minibar']->count() > 0)
          <h3>🥤 Consumos de minibar ({{ $day['minibar']->count() }})</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Hora</th>
                <th style="width: 50px;">Hab.</th>
                <th>Huésped</th>
                <th>Producto</th>
                <th style="width: 70px;">Tipo</th>
                <th class="right" style="width: 50px;">Cant.</th>
                <th class="right" style="width: 80px;">P.unit</th>
                <th class="right" style="width: 90px;">Total</th>
                <th style="width: 90px;">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              @foreach($day['minibar'] as $m)
                <tr>
                  <td class="nowrap">{{ \Carbon\Carbon::parse($m->registered_at)->format('H:i') }}</td>
                  <td>{{ $m->room?->number ?? '—' }}</td>
                  <td>{{ $m->stay?->guest?->full_name ?? '—' }}</td>
                  <td>{{ $m->product_name }}</td>
                  <td class="muted">{{ $minibarTypeLabels[$m->type] ?? $m->type }}</td>
                  <td class="right">{{ $m->quantity }}</td>
                  <td class="right nowrap">${{ number_format($m->unit_price, 0, ',', '.') }}</td>
                  <td class="right nowrap"><strong>${{ number_format($m->total, 0, ',', '.') }}</strong></td>
                  <td class="muted">{{ $m->registeredBy?->name ?? '—' }}</td>
                </tr>
              @endforeach
            </tbody>
          </table>
          <div class="section-totals">
            <span>Subtotal minibar del día</span>
            <strong>${{ number_format($day['minibarTotal'], 0, ',', '.') }}</strong>
          </div>
        @endif

        {{-- ── Servicios extra ────────────────────────────────────────────── --}}
        @if($day['services']->count() > 0)
          <h3>✨ Servicios extra ({{ $day['services']->count() }})</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Hora</th>
                <th>Huésped</th>
                <th>Servicio</th>
                <th class="right" style="width: 50px;">Cant.</th>
                <th class="right" style="width: 80px;">P.unit</th>
                <th class="right" style="width: 90px;">Total</th>
                <th style="width: 110px;">Aplicado por</th>
              </tr>
            </thead>
            <tbody>
              @foreach($day['services'] as $s)
                <tr>
                  <td class="nowrap">{{ \Carbon\Carbon::parse($s->applied_at)->format('H:i') }}</td>
                  <td>
                    {{ $s->stay?->guest?->full_name ?? '—' }}
                    @if($s->stay?->company?->name)<div class="sub">{{ $s->stay->company->name }}</div>@endif
                  </td>
                  <td>{{ $s->extraService?->name ?? '—' }}</td>
                  <td class="right">{{ $s->quantity }}</td>
                  <td class="right nowrap">${{ number_format($s->unit_price, 0, ',', '.') }}</td>
                  <td class="right nowrap"><strong>${{ number_format($s->total, 0, ',', '.') }}</strong></td>
                  <td class="muted">{{ $s->appliedBy?->name ?? '—' }}</td>
                </tr>
              @endforeach
            </tbody>
          </table>
          <div class="section-totals">
            <span>Subtotal servicios del día</span>
            <strong>${{ number_format($day['servicesTotal'], 0, ',', '.') }}</strong>
          </div>
        @endif

        {{-- ── Check-ins ──────────────────────────────────────────────────── --}}
        @if($day['checkIns']->count() > 0)
          <h3>🔑 Check-ins ({{ $day['checkIns']->count() }})</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Hora</th>
                <th>Huésped / Empresa</th>
                <th>Habitaciones</th>
                <th style="width: 90px;">Salida prevista</th>
                <th style="width: 110px;">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              @foreach($day['checkIns'] as $s)
                <tr>
                  <td class="nowrap">{{ \Carbon\Carbon::parse($s->check_in_datetime)->format('H:i') }}</td>
                  <td>
                    <strong>{{ $s->guest?->full_name ?? '—' }}</strong>
                    @if($s->company?->name)<div class="sub">{{ $s->company->name }}</div>@endif
                  </td>
                  <td>
                    @foreach($s->stayRooms as $sr)
                      <span class="badge b-default">{{ $sr->room?->number ?? '—' }}</span>
                    @endforeach
                  </td>
                  <td class="muted nowrap">{{ \Carbon\Carbon::parse($s->check_out_datetime)->format('d/m H:i') }}</td>
                  <td class="muted">{{ $s->createdBy?->name ?? '—' }}</td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif

        {{-- ── Check-outs ─────────────────────────────────────────────────── --}}
        @if($day['checkOuts']->count() > 0)
          <h3>🚪 Check-outs ({{ $day['checkOuts']->count() }})</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Hora</th>
                <th>Huésped / Empresa</th>
                <th>Habitaciones</th>
                <th class="right" style="width: 110px;">Total facturado</th>
                <th class="right" style="width: 110px;">Pagado</th>
              </tr>
            </thead>
            <tbody>
              @foreach($day['checkOuts'] as $s)
                <tr>
                  <td class="nowrap">{{ \Carbon\Carbon::parse($s->actual_check_out_datetime)->format('H:i') }}</td>
                  <td>
                    <strong>{{ $s->guest?->full_name ?? '—' }}</strong>
                    @if($s->company?->name)<div class="sub">{{ $s->company->name }}</div>@endif
                  </td>
                  <td>
                    @foreach($s->stayRooms as $sr)
                      <span class="badge b-default">{{ $sr->room?->number ?? '—' }}</span>
                    @endforeach
                  </td>
                  <td class="right nowrap">${{ number_format($s->total_amount, 0, ',', '.') }}</td>
                  <td class="right nowrap" style="color: #047857;"><strong>${{ number_format($s->paid_amount, 0, ',', '.') }}</strong></td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif

        {{-- ── Transferencias de habitación ───────────────────────────────── --}}
        @if($day['transfers']->count() > 0)
          <h3>🔄 Transferencias de habitación ({{ $day['transfers']->count() }})</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Hora</th>
                <th>Huésped</th>
                <th style="width: 60px;">De</th>
                <th style="width: 60px;">A</th>
                <th>Motivo</th>
                <th style="width: 100px;">Por</th>
              </tr>
            </thead>
            <tbody>
              @foreach($day['transfers'] as $t)
                <tr>
                  <td class="nowrap">{{ \Carbon\Carbon::parse($t->transferred_at)->format('H:i') }}</td>
                  <td>{{ $t->stay?->guest?->full_name ?? '—' }}</td>
                  <td><span class="badge b-default">{{ $t->fromRoom?->number ?? '—' }}</span></td>
                  <td><span class="badge b-default">{{ $t->toRoom?->number ?? '—' }}</span></td>
                  <td class="muted">{{ $t->reason ?: '—' }}</td>
                  <td class="muted">{{ $t->transferredBy?->name ?? '—' }}</td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif

        {{-- ── Anulaciones (pagos + minibar) ──────────────────────────────── --}}
        @if($day['cancelledPayments']->count() > 0 || $day['minibarCancelled']->count() > 0)
          <h3 style="color: #b91c1c;">⚠️ Anulaciones ({{ $day['cancelledPayments']->count() + $day['minibarCancelled']->count() }})</h3>

          @if($day['cancelledPayments']->count() > 0)
            <p class="sub" style="margin: 4px 0;">Pagos anulados — no cuentan en los totales de arriba.</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">Hora</th>
                  <th>Huésped</th>
                  <th style="width: 80px;">Método</th>
                  <th style="width: 100px;">Anulado por</th>
                  <th>Motivo</th>
                  <th class="right" style="width: 95px;">Monto</th>
                </tr>
              </thead>
              <tbody>
                @foreach($day['cancelledPayments'] as $p)
                  <tr class="cancelled-row">
                    <td class="nowrap">{{ \Carbon\Carbon::parse($p->cancelled_at)->format('H:i') }}</td>
                    <td>
                      {{ $p->stay?->guest?->full_name ?? '—' }}
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
          @endif

          @if($day['minibarCancelled']->count() > 0)
            <p class="sub" style="margin: 8px 0 4px;">Consumos de minibar anulados — el stock fue devuelto.</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">Hora</th>
                  <th>Producto</th>
                  <th class="right" style="width: 50px;">Cant.</th>
                  <th style="width: 100px;">Anulado por</th>
                  <th>Motivo</th>
                  <th class="right" style="width: 95px;">Monto</th>
                </tr>
              </thead>
              <tbody>
                @foreach($day['minibarCancelled'] as $log)
                  @php $pl = $log->payload ?? []; @endphp
                  <tr class="cancelled-row">
                    <td class="nowrap">{{ \Carbon\Carbon::parse($log->created_at)->format('H:i') }}</td>
                    <td>{{ $pl['product_name'] ?? '—' }}</td>
                    <td class="right">{{ $pl['quantity'] ?? '—' }}</td>
                    <td>{{ $log->user?->name ?? '—' }}</td>
                    <td>{{ $pl['reason'] ?? '—' }}</td>
                    <td class="right nowrap amount">${{ number_format($pl['amount'] ?? 0, 0, ',', '.') }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @endif
        @endif

      @endif

      <div class="footer">
        {{ $hotelName }} · {{ $day['carbon']->translatedFormat('l, d \d\e F \d\e Y') }}
      </div>
    </div>
  @endforeach

</body>
</html>
