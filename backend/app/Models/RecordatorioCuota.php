<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecordatorioCuota extends Model
{
    protected $table = 'recordatorios_cuota';

    protected $fillable = [
        'usuario_id',
        'monto',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
