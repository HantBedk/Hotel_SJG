<?php

namespace App\Models;

use App\Models\Concerns\BelongsToHotel;
use App\Models\Concerns\HasGuestPersonAlias;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stay extends Model
{
    use HasUuids, BelongsToHotel, HasGuestPersonAlias;

    public const STATUS_ACTIVE      = 'active';
    public const STATUS_EXTENDED    = 'extended';
    public const STATUS_CHECKED_OUT = 'checked_out';

    /** Estadías en curso (operaciones permitidas). */
    public const OPEN_STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_EXTENDED,
    ];

    /** Estados que generan devengo de ingreso por noche. */
    public const REVENUE_STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_EXTENDED,
        self::STATUS_CHECKED_OUT,
    ];

    protected $fillable = [
        'hotel_id',
        'person_id',
        'company_id',
        'reservation_id',
        'status',
        'check_in_datetime',
        'check_out_datetime',
        'actual_check_out_datetime',
        'late_checkout_fee',
        'total_amount',
        'paid_amount',
        'created_by',
        'notes',
        'receipt_number',
    ];

    protected function casts(): array
    {
        return [
            'check_in_datetime'          => 'datetime',
            'check_out_datetime'         => 'datetime',
            'actual_check_out_datetime'  => 'datetime',
            'late_checkout_fee'          => 'decimal:2',
            'total_amount'               => 'decimal:2',
            'paid_amount'                => 'decimal:2',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stayRooms(): HasMany
    {
        return $this->hasMany(StayRoom::class);
    }

    public function activeStayRooms(): HasMany
    {
        return $this->hasMany(StayRoom::class)->where('is_active', true);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(RoomTransfer::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(StayService::class);
    }

    public function minibarConsumptions(): HasMany
    {
        return $this->hasMany(MinibarConsumption::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', self::OPEN_STATUSES);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeForCompany(Builder $query, string $companyId): Builder
    {
        return $query->where('company_id', $companyId);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, self::OPEN_STATUSES, true);
    }

    public function isCheckedOut(): bool
    {
        return $this->status === self::STATUS_CHECKED_OUT;
    }

    public function pendingBalance(): float
    {
        return (float) $this->total_amount - (float) $this->paid_amount;
    }
}
