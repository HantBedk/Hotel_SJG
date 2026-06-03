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
  .footer { margin-top: 30px; text-align: center; color: #aaa; font-size: 9px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 10px; }
  .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 999px; font-weight: bold; font-size: 12px; }
  .signature { margin-top: 40px; display: flex; justify-content: space-around; }
  .signature div { width: 200px; text-align: center; border-top: 1px solid #333; padding-top: 4px; font-size: 10px; color: #666; }
</style>
</head>
<body>
  <div style="text-align:center; margin-bottom:16px;">
    <h1>{{ $hotelName }}</h1>
    @if($hotelAddr)<div class="sub">{{ $hotelAddr }}</div>@endif
    @if($hotelPhone)<div class="sub">Tel: {{ $hotelPhone }}</div>@endif
    <div style="margin-top:8px;"><span class="badge">COMPROBANTE DE CHECK-IN</span></div>
    <div class="sub" style="margin-top:4px;">Emitido: {{ now()->format('d/m/Y H:i') }}</div>
  </div>

  <hr>

  <div class="info-grid">
    <div><strong>Huésped:</strong> {{ $stay->guest->full_name ?? '—' }}</div>
    <div><strong>Doc:</strong> {{ strtoupper($stay->guest?->document_type ?? '') }} {{ $stay->guest?->document_number ?? '—' }}</div>
    @if($stay->guest?->phone)
    <div><strong>Teléfono:</strong> {{ $stay->guest->phone }}</div>
    @endif
    @if($stay->guest?->email)
    <div><strong>Email:</strong> {{ $stay->guest->email }}</div>
    @endif
    @if($stay->company)
    <div><strong>Empresa:</strong> {{ $stay->company->name }}</div>
    <div><strong>NIT:</strong> {{ $stay->company->nit }}</div>
    @endif
    <div><strong>Check-in:</strong> {{ \Carbon\Carbon::parse($stay->check_in_datetime)->format('d/m/Y H:i') }}</div>
    <div><strong>Check-out previsto:</strong> {{ \Carbon\Carbon::parse($stay->check_out_datetime)->format('d/m/Y H:i') }}</div>
  </div>

  <hr>

  @if($stay->stayRooms->count())
  <div class="section">Habitaciones asignadas</div>
  <table>
    <thead>
      <tr><th>Hab.</th><th>Tipo</th><th class="right">$/noche</th><th class="right">Noches</th><th class="right">Subtotal</th></tr>
    </thead>
    <tbody>
      @php $previewTotal = 0; @endphp
      @foreach($stay->stayRooms as $r)
      @php $previewTotal += $r->subtotal; @endphp
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
  <div class="right" style="font-size:12px; font-weight:bold; margin-top:4px;">
    Estimado habitaciones: ${{ number_format($previewTotal, 0, ',', '.') }}
  </div>
  <div class="sub right">El total final se calculará al check-out (puede incluir servicios extra, minibar, IVA y cargos por late check-out).</div>
  @endif

  @if($stay->stayGuests && $stay->stayGuests->count() > 0)
  <div class="section">Acompañantes registrados</div>
  <table>
    <thead><tr><th>Nombre</th><th>Documento</th></tr></thead>
    <tbody>
      @foreach($stay->stayGuests as $sg)
      @continue($sg->is_primary)
      <tr>
        <td>{{ $sg->guest?->full_name ?? '—' }}</td>
        <td>{{ strtoupper($sg->guest?->document_type ?? '') }} {{ $sg->guest?->document_number ?? '—' }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  @if($stay->notes)
  <div class="section">Observaciones</div>
  <div style="padding:6px; background:#f9fafb; border:1px solid #eee; border-radius:4px; font-size:10px;">{{ $stay->notes }}</div>
  @endif

  <div class="signature">
    <div>Firma huésped</div>
    <div>Firma recepción</div>
  </div>

  <div class="footer">
    Este documento certifica el ingreso del huésped. No constituye factura.<br>
    Hotel SJG · Sistema desarrollado por Hant.
  </div>
</body>
</html>
