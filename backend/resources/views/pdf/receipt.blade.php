<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; margin: 20px 30px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 10px; }
  hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th { background: #f0f0f0; padding: 5px 7px; text-align: left; border: 1px solid #ddd; font-size: 10px; }
  td { padding: 4px 7px; border: 1px solid #ddd; }
  .right { text-align: right; }
  .section { font-weight: bold; font-size: 11px; margin: 12px 0 4px; color: #444; }
  .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .grand { font-weight: bold; font-size: 13px; border-top: 1px solid #333; padding-top: 5px; margin-top: 5px; }
  .footer { margin-top: 30px; text-align: center; color: #aaa; font-size: 9px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 10px; }
  .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-weight: bold; font-size: 12px; }
</style>
</head>
<body>
  <!-- Header -->
  <div style="text-align:center; margin-bottom:16px;">
    <h1>{{ $hotelName }}</h1>
    @if($hotelAddr)<div class="sub">{{ $hotelAddr }}</div>@endif
    @if($hotelPhone)<div class="sub">Tel: {{ $hotelPhone }}</div>@endif
    <div style="margin-top:8px;"><span class="badge">{{ $compNumber }}</span></div>
    <div class="sub" style="margin-top:4px;">Emitido: {{ now()->format('d/m/Y H:i') }}</div>
  </div>

  <hr>

  <!-- Stay info -->
  <div class="info-grid">
    <div><strong>Huésped:</strong> {{ $stay->guest->full_name ?? '—' }}</div>
    <div><strong>Doc:</strong> {{ strtoupper($stay->guest?->document_type ?? '') }} {{ $stay->guest?->document_number ?? '—' }}</div>
    @if($stay->company)
    <div><strong>Empresa:</strong> {{ $stay->company->name }}</div>
    <div><strong>NIT:</strong> {{ $stay->company->nit }}</div>
    @endif
    <div><strong>Check-in:</strong> {{ \Carbon\Carbon::parse($stay->check_in_datetime)->format('d/m/Y H:i') }}</div>
    <div><strong>Check-out:</strong> {{ \Carbon\Carbon::parse($stay->actual_check_out_datetime ?? $stay->check_out_datetime)->format('d/m/Y H:i') }}</div>
  </div>

  <hr>

  <!-- Rooms -->
  @if($roomLines->count())
  <div class="section">Habitaciones</div>
  <table>
    <thead>
      <tr><th>Hab.</th><th>Tipo</th><th class="right">$/noche</th><th class="right">Noches</th><th class="right">Subtotal</th></tr>
    </thead>
    <tbody>
      @foreach($roomLines as $r)
      <tr>
        <td>{{ $r->room->number ?? '—' }}</td>
        <td>{{ $r->room->roomType->name ?? '—' }}</td>
        <td class="right">${{ number_format($r->price_per_night, 0, ',', '.') }}</td>
        <td class="right">{{ $r->nights }}</td>
        <td class="right">${{ number_format($r->subtotal, 0, ',', '.') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <!-- Services -->
  @if($serviceLines->count())
  <div class="section">Servicios extra</div>
  <table>
    <thead>
      <tr><th>Servicio</th><th class="right">Cant.</th><th class="right">P. unit.</th><th class="right">Total</th></tr>
    </thead>
    <tbody>
      @foreach($serviceLines as $s)
      <tr>
        <td>{{ $s->extraService->name ?? 'Servicio' }}</td>
        <td class="right">{{ $s->quantity }}</td>
        <td class="right">${{ number_format($s->unit_price, 0, ',', '.') }}</td>
        <td class="right">${{ number_format($s->total, 0, ',', '.') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <!-- Minibar -->
  @if($minibarLines->count())
  <div class="section">Minibar</div>
  <table>
    <thead>
      <tr><th>Producto</th><th>Tipo</th><th class="right">Cant.</th><th class="right">P. unit.</th><th class="right">Total</th></tr>
    </thead>
    <tbody>
      @foreach($minibarLines as $m)
      <tr>
        <td>{{ $m->product_name }}</td>
        <td>{{ ['consumed'=>'Consumido','damaged'=>'Dañado','missing'=>'Faltante'][$m->type] ?? $m->type }}</td>
        <td class="right">{{ $m->quantity }}</td>
        <td class="right">${{ number_format($m->unit_price, 0, ',', '.') }}</td>
        <td class="right">${{ number_format($m->total, 0, ',', '.') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <hr>

  <!-- Totals -->
  <div style="max-width:260px; margin-left:auto;">
    <div class="totals-row"><span>Habitaciones:</span><span>${{ number_format($roomsTotal, 0, ',', '.') }}</span></div>
    @if($servicesTotal > 0)
    <div class="totals-row"><span>Servicios extra:</span><span>${{ number_format($servicesTotal, 0, ',', '.') }}</span></div>
    @endif
    @if($minibarTotal > 0)
    <div class="totals-row"><span>Minibar:</span><span>${{ number_format($minibarTotal, 0, ',', '.') }}</span></div>
    @endif
    @if($lateFee > 0)
    <div class="totals-row"><span>Late checkout:</span><span>${{ number_format($lateFee, 0, ',', '.') }}</span></div>
    @endif
    @if($ivaPct > 0)
    <div class="totals-row"><span>IVA ({{ $ivaPct }}%):</span><span>${{ number_format($ivaAmount, 0, ',', '.') }}</span></div>
    @endif
    <div class="totals-row grand"><strong>TOTAL:</strong><strong>${{ number_format($total, 0, ',', '.') }}</strong></div>
    <div class="totals-row" style="color:#16a34a;"><span>Pagado:</span><span>${{ number_format($stay->paid_amount, 0, ',', '.') }}</span></div>
    @php $balance = max(0, $total - (float) $stay->paid_amount); @endphp
    <div class="totals-row" style="{{ $balance > 0 ? 'color:#dc2626;' : '' }}"><span>Saldo:</span><span>${{ number_format($balance, 0, ',', '.') }}</span></div>
  </div>

  <div class="footer">Generado por Hotel Management System · {{ $compNumber }}</div>
</body>
</html>
