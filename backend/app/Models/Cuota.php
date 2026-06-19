<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cuota extends Model
{
    protected $fillable = [
        'carrera_id',
        'valor_mensual',
        'vigente_desde',
    ];

    public function carrera()
    {
        return $this->belongsTo(Carrera::class);
    }
}
