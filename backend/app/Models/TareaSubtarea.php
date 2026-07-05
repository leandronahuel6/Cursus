<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TareaSubtarea extends Model
{
    protected $fillable = [
        'tarea_id',
        'descripcion',
        'completado',
    ];

    protected $casts = [
        'completado' => 'boolean',
    ];

    public function tarea()
    {
        return $this->belongsTo(Tarea::class);
    }
}
