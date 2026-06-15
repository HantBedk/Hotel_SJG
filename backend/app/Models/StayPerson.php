<?php

namespace App\Models;

use App\Models\Concerns\HasPersonGuestRelation;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StayPerson extends Model
{
    use HasUuids, HasPersonGuestRelation;

    protected $table = 'stay_persons';

    protected $fillable = ['stay_id', 'person_id', 'is_primary'];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(Stay::class);
    }
}
